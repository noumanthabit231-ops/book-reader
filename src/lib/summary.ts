import { type Book } from './supabase'

export type SummaryMode = 'short' | 'detailed'

// Локальный воркер — надёжнее CDN
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

async function getPdfjsLib() {
  const pdfjsLib = await import('pdfjs-dist')
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl
  return pdfjsLib
}

/** Извлекает весь текст из PDF — все страницы */
async function extractPdfText(url: string): Promise<string> {
  const pdfjsLib = await getPdfjsLib()
  const doc = await pdfjsLib.getDocument({ url }).promise
  const parts: string[] = []
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i)
    const content = await page.getTextContent()
    const text = content.items.map((item: any) => item.str).join(' ')
    if (text.trim()) parts.push(text)
  }
  const fullText = parts.join('\n\n')
  if (!fullText.trim()) throw new Error('PDF не содержит текстового слоя (возможно, сканированная книга)')
  return fullText
}

/** Извлекает весь текст из TXT */
async function extractTxtText(url: string): Promise<string> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Ошибка загрузки TXT: ${res.status}`)
  const text = await res.text()
  if (!text.trim()) throw new Error('TXT файл пуст')
  return text
}

/** Извлекает весь текст из FB2 */
async function extractFb2Text(url: string): Promise<string> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Ошибка загрузки FB2: ${res.status}`)
  const xml = await res.text()
  const body = xml.match(/<body>[\s\S]*?<\/body>/i)?.[0] || xml
  const text = body.replace(/<[^>]+>/g, '').trim()
  if (!text) throw new Error('FB2 файл пуст или не содержит текста в <body>')
  return text
}

/** Извлекает текст из EPUB (простой разбор без epub.js) */
async function extractEpubText(url: string): Promise<string> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Ошибка загрузки EPUB: ${res.status}`)
  const blob = await res.blob()
  const text = await blob.text()
  // EPUB содержит XHTML внутри бинарного ZIP. Ищем текстовые блоки.
  const cleaned = text
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&[a-z]+;/g, '')
    .replace(/\s{2,}/g, '\n')
    .trim()
  if (!cleaned || cleaned.length < 100) throw new Error('EPUB не содержит читаемого текста')
  return cleaned
}

export async function generateSummary(
  book: Book,
  mode: SummaryMode = 'short',
  onStatus?: (msg: string) => void,
  signal?: AbortSignal,
): Promise<string> {
  const apiKey = import.meta.env.VITE_AI_API_KEY
  const apiUrl = import.meta.env.VITE_AI_API_URL || 'https://api.deepseek.com/v1/chat/completions'
  const model = import.meta.env.VITE_AI_MODEL || 'deepseek-chat'

  if (!apiKey) {
    const label = mode === 'short' ? 'Краткий' : 'Подробный'
    return `**${label} пересказ**\n\nНастрой AI-ключ в Vercel → Settings → Environment Variables:\nVITE_AI_API_KEY=***\nПосле Redeploy пересказ заработает.\n\nМожешь использовать DeepSeek (https://platform.deepseek.com) — бесплатно.`
  }

  // Шаг 1: извлечение текста
  const extractors: Record<string, (url: string) => Promise<string>> = {
    pdf: extractPdfText,
    txt: extractTxtText,
    fb2: extractFb2Text,
    epub: extractEpubText,
  }

  const extractor = extractors[book.file_type]
  if (!extractor) {
    throw new Error(`Формат ${book.file_type.toUpperCase()} не поддерживает извлечение текста. Загрузите PDF, TXT, FB2 или EPUB.`)
  }

  onStatus?.(`Извлекаю текст из ${book.file_type.toUpperCase()}...`)
  const bookText = await extractor(book.file_url)

  if (!bookText || bookText.trim().length < 100) {
    throw new Error(
      `Извлечено всего ${bookText?.length || 0} символов. ` +
      'Возможно, файл повреждён или это сканированная книга (изображения без текстового слоя). ' +
      'Попробуйте загрузить книгу в TXT или EPUB.'
    )
  }

  onStatus?.(`Текст извлечён (${bookText.length} символов). Отправляю AI...`)

  // Шаг 2: отправка AI
  const systemPrompt = mode === 'short'
    ? 'Ты — литературный критик. Напиши КРАТКИЙ пересказ книги на русском языке: 2-3 абзаца. Только сюжет, ключевые персонажи, главная идея. КРАТКО. НЕ выдумывай — опирайся ТОЛЬКО на предоставленный текст.'
    : 'Ты — литературный критик. Напиши ПОДРОБНЫЙ пересказ книги на русском языке: 5-7 абзацев. Сюжет по частям, персонажи и их мотивация, ключевые сцены, идея. НЕ выдумывай — опирайся ТОЛЬКО на предоставленный текст.'

  const userMessage = `Вот полный текст книги "${book.title}"${book.author ? `, автор: ${book.author}` : ''}:\n\n"""\n${bookText}\n"""\n\nНапиши ${mode === 'short' ? 'краткий' : 'подробный'} пересказ на основе этого текста. Если текст обрывается на середине — напиши что доступно.`

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 120000) // 2 минуты максимум
  if (signal) signal.addEventListener('abort', () => controller.abort())

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        max_tokens: mode === 'short' ? 2000 : 4000,
        temperature: 0.1,
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`Ошибка AI API (${response.status}): ${err.slice(0, 200)}`)
    }

    const data = await response.json()
    const result = data.choices?.[0]?.message?.content

    if (!result || result.trim().length < 30) {
      throw new Error('AI вернул пустой или слишком короткий ответ. Попробуйте ещё раз.')
    }

    onStatus?.('Готово')
    return result
  } finally {
    clearTimeout(timeout)
  }
}
