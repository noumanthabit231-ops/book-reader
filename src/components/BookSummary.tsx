import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase, type Book } from '../lib/supabase'
import { generateSummary } from '../lib/summary'

export default function BookSummary() {
  const { id } = useParams<{ id: string }>()
  const [book, setBook] = useState<Book | null>(null)
  const [summary, setSummary] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    loadBook()
  }, [id])

  const loadBook = async () => {
    const { data } = await supabase.from('books').select('*').eq('id', id).single()
    if (data) {
      setBook(data)
      if (data.summary) setSummary(data.summary)
    }
    setLoading(false)
  }

  const handleGenerate = async () => {
    if (!book) return
    setGenerating(true)
    try {
      const text = await generateSummary(book)
      setSummary(text)
      await supabase.from('books').update({ summary: text }).eq('id', book.id)
    } catch (e) {
      console.error(e)
    }
    setGenerating(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-zinc-500">Загрузка...</p>
      </div>
    )
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-zinc-400">Книга не найдена</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <div className="max-w-2xl mx-auto">
        <Link to={`/reader/${book.id}`} className="text-zinc-400 text-sm hover:text-white transition mb-6 block">
          ← К чтению
        </Link>

        <div className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
          <div className="flex items-start gap-4 mb-6">
            <div className="text-4xl">📖</div>
            <div>
              <h1 className="text-xl font-bold text-white">{book.title}</h1>
              {book.author && <p className="text-zinc-400">{book.author}</p>}
            </div>
          </div>

          {summary ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-white font-medium">🤖 Краткий пересказ</h2>
                <button
                  onClick={handleGenerate}
                  disabled={generating}
                  className="text-xs text-zinc-400 hover:text-white transition"
                >
                  {generating ? 'Генерирую...' : 'Сгенерировать заново'}
                </button>
              </div>
              <div className="text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">
                {summary}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-zinc-400 mb-4">AI-пересказ пока не сгенерирован</p>
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition disabled:opacity-50"
              >
                {generating ? 'Генерирую пересказ...' : '🤖 Сгенерировать пересказ'}
              </button>
              <p className="text-zinc-600 text-xs mt-3">
                Пересказ генерируется один раз и сохраняется
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
