import { type Book } from './supabase'

export type SummaryMode = 'short' | 'detailed'

export async function generateSummary(book: Book, mode: SummaryMode = 'short'): Promise<string> {
  const apiKey = import.meta.env.VITE_AI_API_KEY
  const apiUrl = import.meta.env.VITE_AI_API_URL || 'https://api.deepseek.com/v1/chat/completions'
  const model = import.meta.env.VITE_AI_MODEL || 'deepseek-chat'

  if (!apiKey) {
    await new Promise(r => setTimeout(r, 1000))
    if (mode === 'short') {
      return (
        `**Краткий пересказ**\n\n` +
        `Настрой AI-ключ в Vercel → Settings → Environment Variables:\n` +
        `\`VITE_AI_API_KEY=твой_к...\n` +
        `После Redeploy пересказ заработает.`
      )
    }
    return (
      `**Подробный пересказ**\n\n` +
      `Настрой AI-ключ в Vercel → Settings → Environment Variables:\n` +
      `\`VITE_AI_API_KEY=твой_к...\n` +
      `После Redeploy пересказ заработает.`
    )
  }

  const systemPrompt = mode === 'short'
    ? 'Ты — литературный критик. Напиши КРАТКИЙ пересказ книги на русском языке: 2-3 абзаца. Только самое главное: основной сюжет, ключевые персонажи, главная идея. Пиши ёмко, без воды.'
    : 'Ты — литературный критик. Напиши ПОДРОБНЫЙ пересказ книги на русском языке: 5-7 абзацев. Опиши сюжет по главам/частям, раскрой персонажей, их мотивацию, ключевые сцены, главную идею и значение книги. Пиши содержательно и интересно.'

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
        {
          role: 'user',
          content: `Напиши пересказ книги "${book.title}"${book.author ? `, автор: ${book.author}` : ''}.`,
        },
      ],
      max_tokens: mode === 'short' ? 800 : 1500,
      temperature: 0.7,
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`AI API error: ${response.status} — ${err}`)
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content || 'Не удалось получить пересказ'
}
