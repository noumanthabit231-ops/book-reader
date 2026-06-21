import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase, type Book } from '../lib/supabase'
import { generateSummary } from '../lib/summary'

export default function BookSummary() {
  const { id } = useParams<{ id: string }>()
  const [book, setBook] = useState<Book | null>(null)
  const [summary, setSummary] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (id) loadBook() }, [id])

  const loadBook = async () => {
    const { data } = await supabase.from('books').select('*').eq('id', id).single()
    if (data) { setBook(data); if (data.summary) setSummary(data.summary) }
    setLoading(false)
  }

  const handleGenerate = async () => {
    if (!book) return
    setGenerating(true)
    setError('')
    try {
      const text = await generateSummary(book)
      setSummary(text)
      await supabase.from('books').update({ summary: text }).eq('id', book.id)
    } catch (e: any) {
      setError(e.message || 'Ошибка генерации')
    }
    setGenerating(false)
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}><p style={{ color: 'var(--color-text-secondary)' }}>Загрузка...</p></div>
  if (!book) return <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}><p style={{ color: 'var(--color-text-secondary)' }}>Книга не найдена</p></div>

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Link to={`/reader/${book.id}`} className="text-sm font-medium transition mb-6 block" style={{ color: 'var(--color-link)' }}>← К чтению</Link>

        <div className="rounded-2xl p-6" style={{ background: 'var(--color-card)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          {/* Book info */}
          <div className="flex items-start gap-4 mb-6">
            <div className="w-12 h-16 rounded flex items-center justify-center shrink-0" style={{ background: '#f0ede6' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c4beb6" strokeWidth="1.5" strokeLinecap="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>{book.title}</h1>
              {book.author && <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{book.author}</p>}
            </div>
          </div>

          {/* Summary */}
          {summary ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold" style={{ color: 'var(--color-text)' }}>Краткий пересказ</h2>
                <button onClick={handleGenerate} disabled={generating}
                  className="text-xs transition" style={{ color: 'var(--color-link)' }}
                >{generating ? 'Генерирую...' : 'Обновить'}</button>
              </div>
              <div className="text-sm leading-relaxed whitespace-pre-wrap font-serif" style={{ color: 'var(--color-text)' }}>
                {summary}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>Пересказ ещё не сгенерирован</p>
              <button onClick={handleGenerate} disabled={generating}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition disabled:opacity-50"
                style={{ background: 'var(--color-button)' }}
                onMouseEnter={e => !generating && (e.currentTarget.style.background = 'var(--color-button-hover)')}
                onMouseLeave={e => !generating && (e.currentTarget.style.background = 'var(--color-button)')}
              >
                {generating ? 'Генерация...' : 'Сгенерировать пересказ'}
              </button>
              {error && (
                <p className="text-sm mt-3 p-2 rounded-lg" style={{ color: 'var(--color-danger)', background: '#fef2f2' }}>{error}</p>
              )}
              <p className="text-xs mt-3" style={{ color: 'var(--color-text-secondary)' }}>Пересказ сохраняется и доступен в любой момент</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
