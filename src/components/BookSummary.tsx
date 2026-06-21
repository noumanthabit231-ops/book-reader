import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase, type Book } from '../lib/supabase'
import { generateSummary, type SummaryMode } from '../lib/summary'

export default function BookSummary() {
  const { id } = useParams<{ id: string }>()
  const [book, setBook] = useState<Book | null>(null)
  const [summary, setSummary] = useState<string | null>(null)
  const [detailedSummary, setDetailedSummary] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'short' | 'detailed'>('short')
  const [generating, setGenerating] = useState<'short' | 'detailed' | null>(null)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => { if (id) loadBook() }, [id])

  const loadBook = async () => {
    const { data } = await supabase.from('books').select('*').eq('id', id).single()
    if (data) {
      setBook(data)
      if (data.summary) setSummary(data.summary)
      if ((data as any).summary_detailed) setDetailedSummary((data as any).summary_detailed)
    }
    setLoading(false)
  }

  const handleGenerate = async (mode: SummaryMode) => {
    if (!book) return
    setGenerating(mode)
    setError('')
    setStatus('')

    // Создаём AbortController
    abortRef.current?.abort()
    const ac = new AbortController()
    abortRef.current = ac

    // Таймаут 3 минуты
    const timeoutId = setTimeout(() => ac.abort(), 180000)

    try {
      const text = await generateSummary(book, mode, setStatus, ac.signal)
      setStatus('')

      if (mode === 'short') {
        setSummary(text)
        await supabase.from('books').update({ summary: text }).eq('id', book.id)
      } else {
        setDetailedSummary(text)
        await supabase.from('books').update({ summary_detailed: text }).eq('id', book.id)
      }
    } catch (e: any) {
      if (e.name === 'AbortError') {
        setError('Таймаут. Книга слишком большая для обработки. Попробуйте TXT-версию.')
      } else {
        setError(e.message || 'Ошибка генерации')
      }
    } finally {
      clearTimeout(timeoutId)
      setGenerating(null)
    }
  }

  const handleCancel = () => {
    abortRef.current?.abort()
    setGenerating(null)
    setStatus('')
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}><p style={{ color: 'var(--color-text-secondary)' }}>Загрузка...</p></div>
  if (!book) return <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}><p style={{ color: 'var(--color-text-secondary)' }}>Книга не найдена</p></div>

  const currentSummary = activeTab === 'short' ? summary : detailedSummary

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Link to={`/reader/${book.id}`} className="text-sm font-medium transition mb-6 block" style={{ color: 'var(--color-link)' }}>← К чтению</Link>

        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--color-card)', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
          {/* Book header */}
          <div className="p-6 pb-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
            <div className="flex items-start gap-4">
              <div className="w-12 h-16 rounded flex items-center justify-center shrink-0" style={{ background: '#f0ede6' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#c4beb6" strokeWidth="1.5" strokeLinecap="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>
              </div>
              <div>
                <h1 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>{book.title}</h1>
                {book.author && <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{book.author}</p>}
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>Формат: {book.file_type.toUpperCase()}</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b" style={{ borderColor: 'var(--color-border)' }}>
            {(['short', 'detailed'] as SummaryMode[]).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className="flex-1 py-3 text-sm font-medium transition text-center"
                style={{
                  color: activeTab === tab ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                  borderBottom: activeTab === tab ? '2px solid var(--color-accent)' : '2px solid transparent',
                }}
              >{tab === 'short' ? 'Краткий' : 'Подробный'}</button>
            ))}
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Generating state */}
            {generating && (
              <div className="text-center py-6 space-y-3">
                <div className="animate-pulse">
                  <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-3"
                    style={{ borderColor: 'var(--color-border)', borderTopColor: 'var(--color-accent)' }} />
                </div>
                <p className="text-sm font-medium" style={{ color: 'var(--color-accent)' }}>
                  {status || 'Генерация...'}
                </p>
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  {activeTab === 'short' ? 'Краткий пересказ' : 'Подробный пересказ'} — это займёт до 2 минут
                </p>
                <button onClick={handleCancel}
                  className="px-4 py-1.5 rounded-lg text-xs transition"
                  style={{ color: 'var(--color-text-secondary)', background: '#f0ede6' }}>
                  Отмена
                </button>
              </div>
            )}

            {/* Result or empty state */}
            {!generating && currentSummary ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>
                    {activeTab === 'short' ? 'Краткий пересказ' : 'Подробный пересказ'}
                  </h2>
                  <button onClick={() => handleGenerate(activeTab)}
                    className="text-xs transition" style={{ color: 'var(--color-link)' }}>
                    Сгенерировать заново
                  </button>
                </div>
                <div className="text-sm leading-relaxed whitespace-pre-wrap font-serif" style={{ color: 'var(--color-text)' }}>
                  {currentSummary}
                </div>
              </div>
            ) : !generating ? (
              <div className="text-center py-6">
                <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                  {activeTab === 'short' ? 'Краткий пересказ ещё не готов' : 'Подробный пересказ ещё не готов'}
                </p>
                <button
                  onClick={() => handleGenerate(activeTab)}
                  className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition"
                  style={{ background: 'var(--color-button)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--color-button-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--color-button)'}
                >
                  {activeTab === 'short' ? 'Сгенерировать краткий' : 'Сгенерировать подробный'}
                </button>
              </div>
            ) : null}

            {/* Error */}
            {error && (
              <p className="text-sm mt-3 p-3 rounded-lg" style={{ color: 'var(--color-danger)', background: '#fef2f2' }}>{error}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
