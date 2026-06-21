import { type Book } from './supabase'

/**
 * Генерирует краткий пересказ книги через OpenRouter (или OpenAI).
 *
 * Как подключить:
 * 1. Получи API-ключ на https://openrouter.ai/keys (бесплатно $1)
 * 2. Добавь в .env или Vercel Environment Variables:
 *    VITE_AI_API_KEY=sk-or-v1-...
 *    VITE_AI_API_URL=https://openrouter.ai/api/v1/chat/completions  (по желанию)
 *    VITE_AI_MODEL=openai/gpt-4o-mini  (по желанию, по умолч. openai/gpt-4o-mini)
 *
 * Если VITE_AI_API_KEY не указан — показывает заглушку с инструкцией.
 */

export async function generateSummary(book: Book): Promise<string> {
  const apiKey = import.meta.env.VITE_AI_API_KEY
  const apiUrl = import.meta.env.VITE_AI_API_URL || 'https://openrouter.ai/api/v1/chat/completions'
  const model = import.meta.env.VITE_AI_MODEL || 'openai/gpt-4o-mini'

  // Если нет API ключа — заглушка
  if (!apiKey) {
    await new Promise(r => setTimeout(r, 1500))
    return (
      `**Подключи AI, чтобы получить пересказ**\n\n` +
      `1. Зарегистрируйся на https://openrouter.ai/keys\n` +
      `2. Создай API-ключ (бесплатно $1, хватит надолго)\n` +
      `3. Добавь в Vercel → Settings → Environment Variables:\n` +
      `   \`VITE_AI_API_KEY=sk-or-v1-твой-ключ\`\n` +
      `4. Сделай Redeploy\n\n` +
      `После этого AI будет генерировать краткий пересказ любой книги за пару секунд.`
    )
  }

  // Реальный запрос к API
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': window.location.origin,
      'X-Title': 'BookReader',
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
