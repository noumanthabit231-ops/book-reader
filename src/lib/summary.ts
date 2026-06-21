import { type Book } from './supabase'

export type SummaryMode = 'short' | 'detailed'

/** Извлекает текст из PDF (первые 5 страниц) */
async function extractPdfText(url: string): Promise<string> {
  try {
    const pdfjsLib = await import('pdfjs-dist')
    const workerUrl = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).href
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

    const doc = await pdfjsLib.getDocument({ url }).promise
    const maxPages = Math.min(doc.numPages, 5)
    const parts: string[] = []

    for (let i = 1; i <= maxPages; i++) {
      const page = await doc.getPage(i)
      const content = await page.getTextContent()
      const text = content.items.map((item: any) => item.str).join(' ')
      parts.push(text)
    }
    return parts.join('\n\n').slice(0, 3000)
  } catch {
    return ''
  }
}

/** Извлекает текст из TXT */
async function extractTxtText(url: string): Promise<string> {
  try {
    const res = await fetch(url)
    return (await res.text()).slice(0, 3000)
  } catch {
    return ''
  }
}

/** Извлекает текст из FB2 (простой XML парсинг) */
async function extractFb2Text(url: string): Promise<string> {
  try {
    const res = await fetch(url)
    const xml = await res.text()
    const body = xml.match(/<body>[\s\S]*?<\/body>/i)?.[0] || xml
    return body.replace(/<[^>]+>/g, '').trim().slice(0, 3000)
  } catch {
    return ''
  }
}

export async function generateSummary(book: Book, mode: SummaryMode = 'short'): Promise<string> {
  const apiKey = import.meta.env.VITE_AI_API_KEY
  const apiUrl = import.meta.env.VITE_AI_API_URL || 'https://api.deepseek.com/v1/chat/completions'
  const model = import.meta.env.VITE_AI_MODEL || 'deepseek-chat'

  if (!apiKey) {
    await new Promise(r => setTimeout(r, 1000))
    const label = mode === 'short' ? 'Краткий' : 'Подробный'
    return `**${label} пересказ**\n\nНастрой AI-ключ в Vercel → Settings → Environment Variables:\nVITE_AI_API_KEY=ваш_ключ\nПосле Redeploy пересказ заработает.`
  }

  // Извлекаем текст из файла, чтобы AI не выдумывал
  let bookText = ''
  if (book.file_type === 'pdf') {
    bookText = await extractPdfText(book.file_url)
  } else if (book.file_type === 'txt') {
    bookText = await extractTxtText(book.file_url)
  } else if (book.file_type === 'fb2') {
    bookText = await extractFb2Text(book.file_url)
  }

  const systemPrompt = mode === 'short'
    ? 'Ты — литературный критик. Напиши КРАТКИЙ пересказ книги на русском языке: 2-3 абзаца. Только самое главное: сюжет, персонажи, идея. Пиши ёмко, без воды. НЕ выдумывай — опирайся ТОЛЬКО на предоставленный текст книги.'
    : 'Ты — литературный критик. Напиши ПОДРОБНЫЙ пересказ книги на русском языке: 5-7 абзацев. Сюжет по частям, персонажи, их мотивация, ключевые сцены, идея. НЕ выдумывай — опирайся ТОЛЬКО на предоставленный текст книги.'

  const userMessage = `Книга: "${book.title}"${book.author ? `, автор: ${book.author}` : ''}.\n\n${
    bookText ? `Вот начало текста книги:\n"""\n${bookText}\n"""\n\nНапиши пересказ на основе этого текста. Если текста мало для полного пересказа, напиши что удалось понять из доступных страниц.` : 'Напиши пересказ по названию.'
  }`

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      max_tokens: mode === 'short' ? 1000 : 2000,
      temperature: 0.3, // низкая температура — меньше выдумок
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`AI API error: ${response.status} — ${err}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content || 'Не удалось получить пересказ'
}
