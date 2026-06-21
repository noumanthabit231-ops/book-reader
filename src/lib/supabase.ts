import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Book = {
  id: string
  user_id: string
  title: string
  author: string
  cover_url: string | null
  file_url: string
  file_type: 'pdf' | 'epub'
  summary: string | null
  summary_detailed: string | null
  page_count: number | null
  created_at: string
}
