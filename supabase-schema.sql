-- ============================================
-- BookReader — Supabase Schema
-- Запусти этот SQL в Supabase SQL Editor
-- ============================================

-- 1. Таблица книг
CREATE TABLE books (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  author TEXT DEFAULT '',
  cover_url TEXT,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('pdf', 'epub')),
  summary TEXT,
  summary_detailed TEXT,
  page_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Индекс для быстрой загрузки книг пользователя
CREATE INDEX books_user_id_idx ON books(user_id);
CREATE INDEX books_created_at_idx ON books(created_at DESC);

-- Row Level Security
ALTER TABLE books ENABLE ROW LEVEL SECURITY;

-- Пользователь видит только свои книги
CREATE POLICY "Users can view their own books"
  ON books FOR SELECT
  USING (auth.uid() = user_id);

-- Пользователь может вставлять только свои книги
CREATE POLICY "Users can insert their own books"
  ON books FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Пользователь может обновлять только свои книги
CREATE POLICY "Users can update their own books"
  ON books FOR UPDATE
  USING (auth.uid() = user_id);

-- Пользователь может удалять только свои книги
CREATE POLICY "Users can delete their own books"
  ON books FOR DELETE
  USING (auth.uid() = user_id);

-- 2. Storage bucket для книг
-- Выполни вручную через Supabase Dashboard:
-- Storage → New bucket → имя: books → Public bucket ✅

-- Policy для storage (тоже через SQL):
CREATE POLICY "Users can view their own files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'books' AND auth.role() = 'authenticated');

CREATE POLICY "Users can upload files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'books' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'books' AND auth.uid()::text = (storage.foldername(name))[1]);
