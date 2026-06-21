import { type Book } from './supabase'

/**
 * Генерирует краткий пересказ книги через DeepSeek API.
 *
 * DeepSeek совместим с OpenAI API.
 * Ключ: VITE_AI_API_KEY
 * URL (по умолч.): https://api.deepseek.com/v1/chat/completions
 * Модель (по умолч.): deepseek-chat
 *
 * Чтобы переключиться на другой API — измени VITE_AI_API_URL и VITE_AI_MODEL.
 */

export async function generateSummary(book: Book): Promise<string> {
  const apiKey = import.meta.env.VITE_AI_API_KEY
  const apiUrl = import.meta.env.VITE_AI_API_URL || 'https://api.deepseek.com/v1/chat/completions'
  const model = import.meta.env.VITE_AI_MODEL || 'deepseek-chat'

  if (!apiKey) {
    await new Promise(r => setTimeout(r, 1500))
    return (
      `**Подключи AI, чтобы получить пересказ**\n\n` +
      `Добавь API-ключ в Vercel → Settings → Environment Variables:\n` +
      `\`VITE_AI_API_KEY=твой_ключ\`\n\n` +
      `После этого сделай Redeploy.`
    )
  }

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: 'Ты — литературный критик. Напиши краткий пересказ книги на русском языке: 2-3 абзаца. Опиши основной сюжет, ключевых персонажей и главную идею. Пиши увлекательно, но ёмко.',
        },
        {
          role: 'user',
          content: `Напиши краткий пересказ книги "${book.title}"${book.author ? `, автор: ${book.author}` : ''}.`,
        },
      ],
      max_tokens: 800,
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
