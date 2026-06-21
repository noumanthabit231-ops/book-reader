import { type Book } from './supabase'

export type SummaryMode = 'short' | 'detailed'

/** Извлекает весь текст из PDF */
async function extractPdfText(url: string): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist')
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.4.296/pdf.worker.min.mjs'
  const doc = await pdfjsLib.getDocument({ url }).promise
  const parts: string[] = []
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i)
    const content = await page.getTextContent()
    parts.push(content.items.map((item: any) => item.str).join(' '))
  }
  return parts.join('\n\n')
}

/** Извлекает весь текст из TXT */
async function extractTxtText(url: string): Promise<string> {
  const res = await fetch(url)
  return await res.text()
}

/** Извлекает весь текст из FB2 */
async function extractFb2Text(url: string): Promise<string> {
  const res = await fetch(url)
  const xml = await res.text()
  const body = xml.match(/<body>[\s\S]*?<\/body>/i)?.[0] || xml
  return body.replace(/<[^>]+>/g, '').trim()
}

export async function generateSummary(book: Book, mode: SummaryMode = 'short', onStatus?: (msg: string) => void): Promise<string> {
  const apiKey = import.meta.env.VITE_AI_API_KEY
  const apiUrl = import.meta.env.VITE_AI_API_URL || 'https://api.deepseek.com/v1/chat/completions'
  const model = import.meta.env.VITE_AI_MODEL || 'deepseek-chat'

  if (!apiKey) {
    const label = mode === 'short' ? 'Краткий' : 'Подробный'
    return `**${label} пересказ**\n\nНастрой AI-ключ в Vercel → Settings → Environment Variables:\nVITE_AI_API_KEY=ваш_ключ\nПосле Redeploy пересказ заработает.`
  }

  // Извлекаем текст из файла
  onStatus?.('Читаю книгу...')
  let bookText = ''
  try {
    if (book.file_type === 'pdf') {
      bookText = await extractPdfText(book.file_url)
    } else if (book.file_type === 'txt') {
      bookText = await extractTxtText(book.file_url)
    } else if (book.file_type === 'fb2') {
      bookText = await extractFb2Text(book.file_url)
    }
  } catch (e: any) {
    throw new Error(`Не удалось прочитать книгу: ${e.message || 'ошибка извлечения текста'}`)
  }

  if (!bookText || bookText.trim().length < 50) {
    throw new Error(
      'Не удалось извлечь текст из файла. Возможно, это сканированная книга (изображения, а не текст). ' +
      'Попробуй другой формат (TXT, EPUB).'
    )
  }

  onStatus?.('Отправляю AI...')

  const systemPrompt = mode === 'short'
    ? 'Ты — литературный критик. Напиши КРАТКИЙ пересказ книги на русском языке: 2-3 абзаца. Сюжет, персонажи, главная идея. НЕ выдумывай — опирайся ТОЛЬКО на текст книги, который я даю ниже.'
    : 'Ты — литературный критик. Напиши ПОДРОБНЫЙ пересказ книги на русском языке: 5-7 абзацев. Сюжет по частям, персонажи, их мотивация, ключевые сцены. НЕ выдумывай — используй ТОЛЬКО текст книги.'

  const userMessage = `ВОТ ПОЛНЫЙ ТЕКСТ КНИГИ "${book.title}"${book.author ? ` (${book.author})` : ''}:\n\n"""\n${bookText}\n"""\n\nНапиши пересказ на основе ЭТОГО текста. Не выдумывай ничего, чего нет в тексте.`

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
      temperature: 0.1, // минимум творчества — строго по тексту
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`AI API error: ${response.status} — ${err}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content || 'Не удалось получить пересказ'
}
