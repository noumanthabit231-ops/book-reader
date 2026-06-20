import { type Book } from './supabase'

/**
 * Генерирует краткий пересказ книги через API.
 *
 * Как подключить свой AI:
 * 1. Поставь VITE_AI_API_KEY в .env
 * 2. Поставь VITE_AI_API_URL — эндпоинт API
 * 3. Функция ниже отправляет текст книги + промпт, получает пересказ
 *
 * Сейчас это заглушка, которая показывает формат.
 * Раскомментируй реальный код и убери заглушку, когда подключишь API.
 */

export async function generateSummary(book: Book): Promise<string> {
  // --- ЗАГЛУШКА: пока просто возвращаем пример ---
  // Убери этот блок, когда подключишь API
  await new Promise(r => setTimeout(r, 2000))
  return (
    `**Краткое содержание: ${book.title}**\n\n` +
    `Это заглушка AI-пересказа. Чтобы заработало:\n\n` +
    `1. Получи API-ключ (OpenAI, Claude или любой другой)\n` +
    `2. Добавь его в .env:\n` +
    `   VITE_AI_API_KEY=sk-...\n` +
    `   VITE_AI_API_URL=https://api.openai.com/v1/chat/completions\n` +
    `3. Раскомментируй реальный код в src/lib/summary.ts\n` +
    `4. Загрузи книгу заново и нажми "Сгенерировать пересказ"\n\n` +
    `Формат ответа: 1-2 абзаца с основным сюжетом, ключевыми персонажами и главной идеей.`
  )
  // --- КОНЕЦ ЗАГЛУШКИ ---

  // Реальный код (раскомментируй, когда будет API):
  /*
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Ты — литературный критик. Напиши краткий пересказ книги на русском языке: 1-2 абзаца, основные события, ключевые персонажи, главная идея.',
        },
        {
          role: 'user',
          content: `Сделай краткий пересказ книги "${book.title}" ${book.author ? `автора ${book.author}` : ''}.`,
        },
      ],
      max_tokens: 500,
    }),
  })

  const data = await response.json()
  return data.choices[0].message.content
  */
}
