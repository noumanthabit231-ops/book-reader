import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase, type Book } from '../lib/supabase'
import { Document, Page, pdfjs } from 'react-pdf'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl

type BgMode = 'white' | 'sepia' | 'warm'

export default function BookReader() {
  const { id } = useParams<{ id: string }>()
  const [book, setBook] = useState<Book | null>(null)
  const [loading, setLoading] = useState(true)
  const [bgMode, setBgMode] = useState<BgMode>('white')

  // PDF state
  const [numPages, setNumPages] = useState(0)
  const [pageNum, setPageNum] = useState(1)
  const [pdfError, setPdfError] = useState('')
  const [touchStartX, setTouchStartX] = useState(0)

  // TXT/FB2 state
  const [textContent, setTextContent] = useState('')
  const [textLoading, setTextLoading] = useState(false)

  const changePage = (delta: number) => {
    const next = pageNum + delta
    if (next >= 1 && next <= numPages) setPageNum(next)
  }

  const bgClass = bgMode === 'sepia' ? '#f4ecd8' : bgMode === 'warm' ? '#faf3e8' : '#fffef9'

  useEffect(() => { if (id) loadBook() }, [id])

  const loadBook = async () => {
    const { data } = await supabase.from('books').select('*').eq('id', id).single()
    if (data) setBook(data)
    setLoading(false)
  }

  // Touch swipe for PDF
  const onTouchStart = (e: React.TouchEvent) => setTouchStartX(e.touches[0].clientX)
  const onTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX
    if (Math.abs(dx) > 50 && numPages > 0) changePage(dx < 0 ? 1 : -1)
  }

  function onPdfLoadSuccess({ numPages }: { numPages: number }) { setNumPages(numPages); setPdfError('') }
  function onPdfLoadError(e: Error) { setPdfError('Ошибка загрузки PDF: ' + e.message) }

  // Load text content for TXT/FB2
  const loadText = async (url: string, type: string) => {
    setTextLoading(true)
    try {
      const res = await fetch(url)
      const text = await res.text()
      if (type === 'fb2') {
        // Simple FB2 XML parsing
        const body = text.match(/<body>[\s\S]*?<\/body>/i)?.[0] || text
        const cleaned = body
          .replace(/<[^>]+>/g, '')
          .replace(/\n{3,}/g, '\n\n')
          .trim()
        setTextContent(cleaned)
      } else {
        setTextContent(text)
      }
    } catch {
      setTextContent('Не удалось загрузить текст книги.')
    }
    setTextLoading(false)
  }

  useEffect(() => {
    if (book && (book.file_type === 'txt' || book.file_type === 'fb2')) {
      loadText(book.file_url, book.file_type)
    }
  }, [book])

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}><p style={{ color: 'var(--color-text-secondary)' }}>Загрузка...</p></div>
  if (!book) return <div className="min-h-screen flex items-center justify-center flex-col gap-3 p-4" style={{ background: 'var(--color-bg)' }}><p style={{ color: 'var(--color-text-secondary)' }}>Книга не найдена</p><Link to="/" style={{ color: 'var(--color-link)' }}>Библиотека</Link></div>

  const fmt = book.file_type

  return (
    <div className="min-h-screen flex flex-col" style={{ background: bgClass }}>
      {/* Top bar */}
      <header className="flex items-center gap-2 px-3 py-2 border-b shrink-0" style={{ background: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
        <Link to="/" className="text-sm font-medium shrink-0" style={{ color: 'var(--color-link)' }}>Назад</Link>
        <div className="flex-1 min-w-0 text-center">
          <div className="text-sm font-medium truncate" style={{ color: 'var(--color-text)' }}>{book.title}</div>
          {book.author && <div className="text-xs truncate" style={{ color: 'var(--color-text-secondary)' }}>{book.author}</div>}
        </div>
        <button onClick={() => setBgMode(b => b === 'white' ? 'sepia' : b === 'sepia' ? 'warm' : 'white')}
          className="p-1.5 rounded-lg shrink-0" style={{ color: 'var(--color-text-secondary)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 013.61 1.41 2 2 0 01-.78 1.42l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
        </button>
        <Link to={`/summary/${book.id}`} className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white shrink-0"
          style={{ background: 'var(--color-button)' }}>Пересказ</Link>
      </header>

      {/* Reading area */}
      <div className="flex-1 overflow-auto flex flex-col items-center py-4 px-4 select-none"
        onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
      >
        {/* PDF */}
        {fmt === 'pdf' && (
          pdfError ? (
            <div className="text-center py-10"><p className="text-sm mb-3" style={{ color: 'var(--color-danger)' }}>{pdfError}</p>
              <a href={book.file_url} className="text-sm font-medium" style={{ color: 'var(--color-link)' }}>Скачать PDF</a></div>
          ) : (
            <Document file={book.file_url} onLoadSuccess={onPdfLoadSuccess} onLoadError={onPdfLoadError}
              loading={<p className="text-sm py-10" style={{ color: 'var(--color-text-secondary)' }}>Загрузка книги...</p>}>
              <Page pageNumber={pageNum} width={Math.min(window.innerWidth - 32, 600)}
                renderTextLayer={false} renderAnnotationLayer={false} className="rounded-lg shadow-lg" />
            </Document>
          )
        )}

        {/* TXT / FB2 */}
        {(fmt === 'txt' || fmt === 'fb2') && (
          textLoading ? (
            <p className="text-sm py-10" style={{ color: 'var(--color-text-secondary)' }}>Загрузка текста...</p>
          ) : (
            <div className="w-full max-w-2xl mx-auto leading-relaxed whitespace-pre-wrap font-serif"
              style={{ color: 'var(--color-text)', fontSize: '15px', lineHeight: '1.7' }}>
              {textContent || 'Пустой файл'}
            </div>
          )
        )}

        {/* EPUB — обработает epub.js */}
        {fmt === 'epub' && <EpubReader url={book.file_url} />}

        {/* MOBI / DJVU — download link */}
        {(fmt === 'mobi' || fmt === 'djvu') && (
          <div className="flex items-center justify-center h-64 flex-col gap-4">
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Формат {fmt.toUpperCase()} требует отдельного приложения.</p>
            <a href={book.file_url} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'var(--color-button)' }}>Скачать файл</a>
          </div>
        )}

        {/* PDF page indicator */}
        {fmt === 'pdf' && numPages > 0 && (
          <div className="mt-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>{pageNum} / {numPages}</div>
        )}
      </div>

      {/* Bottom nav (PDF only) */}
      {fmt === 'pdf' && numPages > 0 && (
        <footer className="flex items-center justify-center gap-3 px-3 py-2 border-t shrink-0"
          style={{ background: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
          <button onClick={() => changePage(-1)} disabled={pageNum <= 1}
            className="px-4 py-1.5 rounded-lg text-sm font-medium disabled:opacity-30" style={{ color: 'var(--color-text)' }}>Назад</button>
          <span className="text-sm font-medium min-w-16 text-center" style={{ color: 'var(--color-text)' }}>{pageNum} / {numPages}</span>
          <button onClick={() => changePage(1)} disabled={pageNum >= numPages}
            className="px-4 py-1.5 rounded-lg text-sm font-medium disabled:opacity-30" style={{ color: 'var(--color-text)' }}>Вперёд</button>
        </footer>
      )}
    </div>
  )
}

// EPUB reader using epub.js
function EpubReader({ url }: { url: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const renditionRef = useRef<any>(null)

  useEffect(() => {
    let rendition: any
    let book: any

    const init = async () => {
      if (!containerRef.current) return
      const ePub = (await import('epubjs')).default
      book = ePub(url)
      rendition = book.renderTo(containerRef.current, {
        width: '100%',
        height: Math.min(window.innerHeight - 160, 700),
        spread: 'none',
        flow: 'paginated',
      })
      renditionRef.current = rendition
      rendition.display()
    }

    init()

    return () => {
      if (rendition) rendition.destroy()
      if (book) book.destroy()
    }
  }, [url])

  const prev = () => renditionRef.current?.prev()
  const next = () => renditionRef.current?.next()

  // Keyboard nav
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') next()
      if (e.key === 'ArrowLeft') prev()
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [])

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col items-center">
      <div ref={containerRef} className="w-full" />
      <div className="flex items-center gap-4 mt-3">
        <button onClick={prev} className="px-3 py-1 rounded text-xs font-medium" style={{ background: 'var(--color-card)', color: 'var(--color-text)' }}>Назад</button>
        <button onClick={next} className="px-3 py-1 rounded text-xs font-medium" style={{ background: 'var(--color-card)', color: 'var(--color-text)' }}>Вперёд</button>
      </div>
    </div>
  )
}
