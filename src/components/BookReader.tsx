import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase, type Book } from '../lib/supabase'

type BgMode = 'white' | 'sepia' | 'warm'
type FontSize = 'sm' | 'md' | 'lg'

async function loadPdfJs() {
  const pdfjsLib = await import('pdfjs-dist')
  const workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).href
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc
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
  const [showSettings, setShowSettings] = useState(false)
  const [bgMode, setBgMode] = useState<BgMode>('white')
  const [fontSize, setFontSize] = useState<FontSize>('md')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => { if (id) loadBook() }, [id])

  const loadBook = async () => {
    const { data } = await supabase.from('books').select('*').eq('id', id).single()
    if (data) setBook(data)
    setLoading(false)
  }

  const loadPdfDocument = async () => {
    if (!book || book.file_type !== 'pdf') return
    try {
      const pdfjsLib = await loadPdfJs()
      const doc = await pdfjsLib.getDocument({ url: book.file_url }).promise
      setPdfDoc(doc)
      setTotalPages(doc.numPages)
      setPageNum(1)
    } catch (e) { console.error('PDF error:', e) }
  }

  const renderPage = useCallback(async (num: number) => {
    if (!pdfDoc || !canvasRef.current) return
    setPageLoading(true)
    try {
      const page = await pdfDoc.getPage(num)
      const canvas = canvasRef.current
      const container = canvasContainerRef.current
      const maxWidth = container ? container.clientWidth - 32 : 700
      const vp = page.getViewport({ scale: 1 })
      const s = Math.min((maxWidth / vp.width) * window.devicePixelRatio * 1.5, 2.5)
      setScale(s / window.devicePixelRatio)
      const viewport = page.getViewport({ scale: s / window.devicePixelRatio })
      canvas.width = viewport.width * window.devicePixelRatio
      canvas.height = viewport.height * window.devicePixelRatio
      canvas.style.width = viewport.width + 'px'
      canvas.style.height = viewport.height + 'px'
      const ctx = canvas.getContext('2d')!
      ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0)
      await page.render({ canvasContext: ctx, viewport }).promise
    } catch (e) { console.error('Render error:', e) }
    setPageLoading(false)
  }, [pdfDoc])

  useEffect(() => {
    if (pdfDoc && pageNum) renderPage(pageNum)
  }, [pdfDoc, pageNum, renderPage])

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') changePage(1)
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') changePage(-1)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [pageNum, totalPages])

  const changePage = (delta: number) => {
    const next = pageNum + delta
    if (next >= 1 && next <= totalPages) setPageNum(next)
  }

  const bgClass = `reader-bg-${bgMode}`

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}><p style={{ color: 'var(--color-text-secondary)' }}>Загрузка...</p></div>
  if (!book) return <div className="min-h-screen flex items-center justify-center flex-col gap-4" style={{ background: 'var(--color-bg)' }}><p style={{ color: 'var(--color-text-secondary)' }}>Книга не найдена</p><Link to="/" style={{ color: 'var(--color-link)' }}>← В библиотеку</Link></div>

  return (
    <div className={`min-h-screen flex flex-col ${bgClass}`}>
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-2 border-b shrink-0" style={{ background: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
        <Link to="/" className="text-sm font-medium transition" style={{ color: 'var(--color-link)' }}>← Назад</Link>
        <div className="text-center flex-1 mx-4 min-w-0">
          <h1 className="text-sm font-medium truncate" style={{ color: 'var(--color-text)' }}>{book.title}</h1>
          {book.author && <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{book.author}</p>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-lg transition text-sm" style={{ color: 'var(--color-text-secondary)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 013.61 1.41 2 2 0 01-.78 1.42l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
          </button>
          <Link to={`/summary/${book.id}`}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition"
            style={{ background: 'var(--color-button)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--color-button-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--color-button)'}
          >Пересказ</Link>
        </div>
      </header>

      {/* Settings panel */}
      {showSettings && (
        <div className="border-b px-4 py-3 space-y-3 shrink-0" style={{ background: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>Фон:</span>
            {(['white', 'sepia', 'warm'] as BgMode[]).map(m => (
              <button key={m} onClick={() => setBgMode(m)}
                className={`px-3 py-1 rounded-lg text-xs border transition ${bgMode === m ? 'font-semibold' : ''}`}
                style={{
                  background: m === 'white' ? '#fffef9' : m === 'sepia' ? '#f4ecd8' : '#faf3e8',
                  borderColor: bgMode === m ? 'var(--color-accent)' : 'var(--color-border)',
                  color: 'var(--color-text)',
                }}
              >
                {m === 'white' ? 'Белый' : m === 'sepia' ? 'Сепия' : 'Тёплый'}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>Шрифт:</span>
            {(['sm', 'md', 'lg'] as FontSize[]).map(s => (
              <button key={s} onClick={() => setFontSize(s)}
                className={`px-3 py-1 rounded-lg text-xs border transition ${fontSize === s ? 'font-semibold' : ''}`}
                style={{
                  background: 'var(--color-card)',
                  borderColor: fontSize === s ? 'var(--color-accent)' : 'var(--color-border)',
                  color: 'var(--color-text)',
                }}
              >
                {s === 'sm' ? 'A-' : s === 'md' ? 'A' : 'A+'}
              </button>
            ))}
          </div>
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            Стрелки вправо/влево — листать. Масштаб: {Math.round(scale * 100)}%
          </p>
        </div>
      )}

      {/* Reading area */}
      {pdfDoc ? (
        <div ref={canvasContainerRef} className="flex-1 overflow-auto flex flex-col items-center py-6 px-2">
          <div className="relative">
            {pageLoading && (
              <div className="absolute inset-0 flex items-center justify-center z-10 rounded-lg" style={{ background: 'rgba(255,255,255,0.6)' }}>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Загрузка...</p>
              </div>
            )}
            <canvas ref={canvasRef} className="rounded-lg shadow-lg max-w-full" />
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <button onClick={loadPdfDocument}
            className="px-6 py-3 rounded-xl text-sm font-semibold text-white transition"
            style={{ background: 'var(--color-button)' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--color-button-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--color-button)'}
          >Открыть книгу</button>
        </div>
      )}

      {/* Bottom navigation */}
      {pdfDoc && (
        <footer className="flex items-center justify-center gap-4 px-4 py-3 border-t shrink-0" style={{ background: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
          <button onClick={() => changePage(-1)} disabled={pageNum <= 1}
            className="p-2 rounded-lg disabled:opacity-30 transition" style={{ color: 'var(--color-text)' }}
            onMouseEnter={e => !(pageNum <= 1) && (e.currentTarget.style.background = 'var(--color-bg)')}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <span className="text-sm font-medium min-w-16 text-center" style={{ color: 'var(--color-text)' }}>
            {pageNum} / {totalPages}
          </span>
          <button onClick={() => changePage(1)} disabled={pageNum >= totalPages}
            className="p-2 rounded-lg disabled:opacity-30 transition" style={{ color: 'var(--color-text)' }}
            onMouseEnter={e => !(pageNum >= totalPages) && (e.currentTarget.style.background = 'var(--color-bg)')}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </footer>
      )}
    </div>
  )
}
