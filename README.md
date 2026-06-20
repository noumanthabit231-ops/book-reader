# BookReader

Веб-приложение для чтения книг с AI-пересказом.

## Стек

- **Frontend:** React + Vite + TypeScript + Tailwind CSS
- **Backend:** Supabase (Auth, DB, Storage)
- **Deploy:** Vercel
- **Host:** GitHub

## Как запустить

```bash
npm install
npm run dev
```

## Настройка Supabase

1. Создай проект на [supabase.com](https://supabase.com)
2. Скопируй `URL проекта` и `anon public key`
3. Создай `.env` файл:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

4. Запусти SQL из `supabase-schema.sql` в Supabase SQL Editor
5. Включи Email Auth и Google OAuth в Supabase Authentication → Providers
6. Создай bucket `books` в Supabase Storage (Public)

## Как подключить AI-пересказ

1. Получи API-ключ (OpenAI, Claude и т.д.)
2. Добавь в `.env`:

```env
VITE_AI_API_KEY=...
VITE_AI_API_URL=https://api.openai.com/v1/chat/completions
```

3. Раскомментируй реальный код в `src/lib/summary.ts` и удали заглушку

## Деплой на Vercel

```bash
npm run build
# или подключи GitHub репозиторий к Vercel
```
