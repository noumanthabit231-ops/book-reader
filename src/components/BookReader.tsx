import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase, type Book } from '../lib/supabase'

type BgMode = 'white' | 'sepia' | 'warm'

async function loadPdfJs() {
  const pdfjsLib = await import('pdfjs-dist')
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url
  ).href
  return pdfjsLib
}

export default function BookReader() {
  const { id } = useParams<{ id: string }>()
  const [book, setBook] = useState<Book | null>(null)
  const [loading, setLoading] = useState(true)
  const [pdfDoc, setPdfDoc] = useState<any>(null)
  const [pageNum, setPageNum] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [pageLoading, setPageLoading] = useState(false)
  const [bgMode, setBgMode] = useState<BgMode>('white')
  const [showSettings, setShowSettings] = useState(false)
  const [pdfError, setPdfError] = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Touch swipe
  const touchStartX = useRef(0)

  useEffect(() => { if (id) loadBook() }, [id])

  const loadBook = async () => {
    const { data } = await supabase.from('books').select('*').eq('id', id).single()
    if (data) setBook(data)
    setLoading(false)
  }

  const loadPdfDocument = async () => {
    if (!book || book.file_type !== 'pdf') return
    setPdfError('')
    try {
      const pdfjsLib = await loadPdfJs()
      const doc = await pdfjsLib.getDocument({ url: book.file_url }).promise
      setPdfDoc(doc)
      setTotalPages(doc.numPages)
      setPageNum(1)
    } catch (e: any) {
      console.error(e)
      setPdfError('Не удалось загрузить PDF: ' + (e.message || 'неизвестная ошибка'))
    }
  }

  const renderPage = useCallback(async (num: number) => {
    if (!pdfDoc || !canvasRef.current) return
    setPageLoading(true)
    try {
      const page = await pdfDoc.getPage(num)
      const canvas = canvasRef.current
      const container = containerRef.current

      // Простой расчёт: ширина контейнера минус отступы
      const maxW = container ? container.clientWidth - 16 : window.innerWidth - 16
      const vp = page.getViewport({ scale: 1 })
      const scale = Math.min(maxW / vp.width, 2.0)

      const viewport = page.getViewport({ scale })
      canvas.width = viewport.width
      canvas.height = viewport.height
      canvas.style.width = viewport.width + 'px'
      canvas.style.height = viewport.height + 'px'

      const ctx = canvas.getContext('2d')!
      await page.render({ canvasContext: ctx, viewport }).promise
    } catch (e) { console.error('Render error:', e) }
    setPageLoading(false)
  }, [pdfDoc])

  useEffect(() => {
    if (pdfDoc && pageNum) renderPage(pageNum)
  }, [pdfDoc, pageNum, renderPage])

  const changePage = (delta: number) => {
    const next = pageNum + delta
    if (next >= 1 && next <= totalPages) setPageNum(next)
  }

  const bgClass = `reader-bg-${bgMode}`

  // Touch handlers
  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX }
  const onTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX.current
    if (Math.abs(dx) > 50) changePage(dx < 0 ? 1 : -1)
  }

  // Keyboard
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') changePage(1)
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') changePage(-1)
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [pageNum, totalPages])

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}><p style={{ color: 'var(--color-text-secondary)' }}>Загрузка...</p></div>
  if (!book) return <div className="min-h-screen flex items-center justify-center flex-col gap-3 p-4" style={{ background: 'var(--color-bg)' }}><p style={{ color: 'var(--color-text-secondary)' }}>Книга не найдена</p><Link to="/" style={{ color: 'var(--color-link)' }}>Библиотека</Link></div>

  return (
    <div className={`min-h-screen flex flex-col ${bgClass}`}>
      {/* Top bar */}
      <header className="flex items-center gap-2 px-3 py-2 border-b shrink-0" style={{ background: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
        <Link to="/" className="text-sm font-medium shrink-0" style={{ color: 'var(--color-link)' }}>Назад</Link>
        <div className="flex-1 min-w-0 text-center">
          <div className="text-sm font-medium truncate" style={{ color: 'var(--color-text)' }}>{book.title}</div>
          {book.author && <div className="text-xs truncate" style={{ color: 'var(--color-text-secondary)' }}>{book.author}</div>}
        </div>
        <button onClick={() => setShowSettings(!showSettings)} className="p-1.5 rounded-lg shrink-0"
          style={{ color: 'var(--color-text-secondary)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 013.61 1.41 2 2 0 01-.78 1.42l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
        </button>
        <Link to={`/summary/${book.id}`}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white shrink-0"
          style={{ background: 'var(--color-button)' }}>
          Пересказ
        </Link>
      </header>

      {/* Settings */}
      {showSettings && (
        <div className="border-b px-3 py-2 space-y-2 text-xs shrink-0" style={{ background: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span style={{ color: 'var(--color-text-secondary)' }}>Фон:</span>
            {(['white', 'sepia', 'warm'] as BgMode[]).map(m => (
              <button key={m} onClick={() => setBgMode(m)}
                className={`px-2 py-1 rounded border ${bgMode === m ? 'font-semibold' : ''}`}
                style={{
                  background: m === 'white' ? '#fffef9' : m === 'sepia' ? '#f4ecd8' : '#faf3e8',
                  borderColor: bgMode === m ? 'var(--color-accent)' : 'var(--color-border)',
                  color: 'var(--color-text)',
                }}
              >{m === 'white' ? 'Белый' : m === 'sepia' ? 'Сепия' : 'Тёплый'}</button>
            ))}
          </div>
        </div>
      )}

      {/* Reading area */}
      {pdfDoc ? (
        <div ref={containerRef}
          className="flex-1 overflow-auto flex flex-col items-center py-4 px-2 select-none"
          onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
        >
          {pageLoading && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>...</p>
            </div>
          )}
          <canvas ref={canvasRef} className="rounded shadow-lg max-w-full" style={{ touchAction: 'none' }} />

          {/* Page indicator */}
          <div className="mt-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{pageNum} / {totalPages}</div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center">
            {pdfError ? (
              <div>
                <p className="text-sm mb-3" style={{ color: 'var(--color-danger)' }}>{pdfError}</p>
                <button onClick={loadPdfDocument}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white" style={{ background: 'var(--color-button)' }}>
                  Попробовать снова
                </button>
              </div>
            ) : (
              <button onClick={loadPdfDocument}
                className="px-6 py-3 rounded-xl text-sm font-semibold text-white" style={{ background: 'var(--color-button)' }}>
                Открыть книгу
              </button>
            )}
          </div>
        </div>
      )}

      {/* Bottom nav */}
      {pdfDoc && (
        <footer className="flex items-center justify-center gap-3 px-3 py-2 border-t shrink-0" style={{ background: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
          <button onClick={() => changePage(-1)} disabled={pageNum <= 1}
            className="px-4 py-1.5 rounded-lg text-sm font-medium disabled:opacity-30"
            style={{ color: 'var(--color-text)' }}>
            Назад
          </button>
          <span className="text-sm font-medium min-w-16 text-center" style={{ color: 'var(--color-text)' }}>{pageNum} / {totalPages}</span>
          <button onClick={() => changePage(1)} disabled={pageNum >= totalPages}
            className="px-4 py-1.5 rounded-lg text-sm font-medium disabled:opacity-30"
            style={{ color: 'var(--color-text)' }}>
            Вперёд
          </button>
        </footer>
      )}
    </div>
  )
}
