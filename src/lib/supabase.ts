import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type BookFormat = 'pdf' | 'epub' | 'txt' | 'fb2' | 'mobi' | 'djvu'

export type Book = {
  id: string
  user_id: string
  title: string
  author: string
  cover_url: string | null
  file_url: string
  file_type: BookFormat
  summary: string | null
  summary_detailed: string | null
  page_count: number | null
  created_at: string
}

export const SUPPORTED_FORMATS: BookFormat[] = ['pdf', 'epub', 'txt', 'fb2', 'mobi', 'djvu']
export const FORMAT_LABELS: Record<BookFormat, string> = {
  pdf: 'PDF', epub: 'EPUB', txt: 'TXT', fb2: 'FB2', mobi: 'MOBI', djvu: 'DJVU',
}
