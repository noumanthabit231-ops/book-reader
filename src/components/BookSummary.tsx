import { useState, useEffect } from 'react'
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
  const [loading, setLoading] = useState(true)

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
    try {
      const text = await generateSummary(book, mode)
      if (mode === 'short') {
        setSummary(text)
        await supabase.from('books').update({ summary: text }).eq('id', book.id)
      } else {
        setDetailedSummary(text)
        await supabase.from('books').update({ summary_detailed: text }).eq('id', book.id)
      }
    } catch (e: any) {
      setError(e.message || 'Ошибка генерации')
    }
    setGenerating(null)
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}><p style={{ color: 'var(--color-text-secondary)' }}>Загрузка...</p></div>
  if (!book) return <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}><p style={{ color: 'var(--color-text-secondary)' }}>Книга не найдена</p></div>

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
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b" style={{ borderColor: 'var(--color-border)' }}>
            <button
              onClick={() => setActiveTab('short')}
              className="flex-1 py-3 text-sm font-medium transition text-center"
              style={{
                color: activeTab === 'short' ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                borderBottom: activeTab === 'short' ? '2px solid var(--color-accent)' : '2px solid transparent',
              }}
            >
              Краткий
            </button>
            <button
              onClick={() => setActiveTab('detailed')}
              className="flex-1 py-3 text-sm font-medium transition text-center"
              style={{
                color: activeTab === 'detailed' ? 'var(--color-accent)' : 'var(--color-text-secondary)',
                borderBottom: activeTab === 'detailed' ? '2px solid var(--color-accent)' : '2px solid transparent',
              }}
            >
              Подробный
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {activeTab === 'short' ? (
              summary ? (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>Краткий пересказ</h2>
                    <button onClick={() => handleGenerate('short')} disabled={generating === 'short'}
                      className="text-xs transition" style={{ color: 'var(--color-link)' }}>
                      {generating === 'short' ? 'Генерация...' : 'Обновить'}
                    </button>
                  </div>
                  <div className="text-sm leading-relaxed whitespace-pre-wrap font-serif" style={{ color: 'var(--color-text)' }}>
                    {summary}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>Краткий пересказ ещё не готов</p>
                  <GenerateButton mode="short" generating={generating} onGenerate={handleGenerate} />
                </div>
              )
            ) : (
              detailedSummary ? (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>Подробный пересказ</h2>
                    <button onClick={() => handleGenerate('detailed')} disabled={generating === 'detailed'}
                      className="text-xs transition" style={{ color: 'var(--color-link)' }}>
                      {generating === 'detailed' ? 'Генерация...' : 'Обновить'}
                    </button>
                  </div>
                  <div className="text-sm leading-relaxed whitespace-pre-wrap font-serif" style={{ color: 'var(--color-text)' }}>
                    {detailedSummary}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>Подробный пересказ ещё не готов</p>
                  <GenerateButton mode="detailed" generating={generating} onGenerate={handleGenerate} />
                </div>
              )
            )}

            {error && (
              <p className="text-sm mt-3 p-2 rounded-lg" style={{ color: 'var(--color-danger)', background: '#fef2f2' }}>{error}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function GenerateButton({ mode, generating, onGenerate }: {
  mode: SummaryMode
  generating: 'short' | 'detailed' | null
  onGenerate: (mode: SummaryMode) => void
}) {
  return (
    <button
      onClick={() => onGenerate(mode)}
      disabled={generating !== null}
      className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition disabled:opacity-50"
      style={{ background: 'var(--color-button)' }}
      onMouseEnter={e => !generating && (e.currentTarget.style.background = 'var(--color-button-hover)')}
      onMouseLeave={e => !generating && (e.currentTarget.style.background = 'var(--color-button)')}
    >
      {generating === mode ? 'Генерация...' : (
        mode === 'short' ? 'Сгенерировать краткий' : 'Сгенерировать подробный'
      )}
    </button>
  )
}
