import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase, type Book } from '../lib/supabase'
import { Document, Page, pdfjs } from 'react-pdf'

// Важно: воркер должен совпадать с версией, которую использует react-pdf
pdfjs.GlobalWorkerOptions.workerSrc =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.4.296/pdf.worker.min.mjs'

type BgMode = 'white' | 'sepia' | 'warm'

export default function BookReader() {
  const { id } = useParams<{ id: string }>()
  const [book, setBook] = useState<Book | null>(null)
  const [loading, setLoading] = useState(true)
  const [numPages, setNumPages] = useState(0)
  const [pageNum, setPageNum] = useState(1)
  const [bgMode, setBgMode] = useState<BgMode>('white')
  const [pdfError, setPdfError] = useState('')
  const [touchStartX, setTouchStartX] = useState(0)

  useEffect(() => { if (id) loadBook() }, [id])

  const loadBook = async () => {
    const { data } = await supabase.from('books').select('*').eq('id', id).single()
    if (data) setBook(data)
    setLoading(false)
  }

  const changePage = (delta: number) => {
    const next = pageNum + delta
    if (next >= 1 && next <= numPages) setPageNum(next)
  }

  const bgClass = bgMode === 'sepia' ? '#f4ecd8' : bgMode === 'warm' ? '#faf3e8' : '#fffef9'

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages)
    setPdfError('')
  }

  function onDocumentLoadError(error: Error) {
    setPdfError('Ошибка загрузки PDF: ' + error.message)
  }

  // Touch swipe
  const onTouchStart = (e: React.TouchEvent) => setTouchStartX(e.touches[0].clientX)
  const onTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchStartX
    if (Math.abs(dx) > 50) changePage(dx < 0 ? 1 : -1)
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}><p style={{ color: 'var(--color-text-secondary)' }}>Загрузка...</p></div>
  if (!book) return <div className="min-h-screen flex items-center justify-center flex-col gap-3 p-4" style={{ background: 'var(--color-bg)' }}><p style={{ color: 'var(--color-text-secondary)' }}>Книга не найдена</p><Link to="/" style={{ color: 'var(--color-link)' }}>Библиотека</Link></div>

  const isPdf = book.file_type === 'pdf'

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
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 013.61 1.41 2 2 0 01-.78 1.42l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
        </button>
        <Link to={`/summary/${book.id}`}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white shrink-0"
          style={{ background: 'var(--color-button)' }}>Пересказ</Link>
      </header>

      {/* Reading area */}
      <div className="flex-1 overflow-auto flex flex-col items-center py-4 px-2 select-none"
        onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
      >
        {isPdf ? (
          pdfError ? (
            <div className="text-center py-10 px-4">
              <p className="text-sm mb-3" style={{ color: 'var(--color-danger)' }}>{pdfError}</p>
              <a href={book.file_url} className="text-sm font-medium" style={{ color: 'var(--color-link)' }}>Скачать PDF напрямую</a>
            </div>
          ) : (
            <Document
              file={book.file_url}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={<p className="text-sm py-10" style={{ color: 'var(--color-text-secondary)' }}>Загрузка книги...</p>}
            >
              <Page
                pageNumber={pageNum}
                width={Math.min(window.innerWidth - 32, 600)}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                className="rounded-lg shadow-lg"
              />
            </Document>
          )
        ) : (
          <div className="flex items-center justify-center h-64">
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>EPUB читалка в разработке.</p>
          </div>
        )}

        {!pdfError && numPages > 1 && (
          <div className="mt-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            {pageNum} / {numPages}
          </div>
        )}
      </div>

      {/* Bottom nav */}
      {numPages > 0 && (
        <footer className="flex items-center justify-center gap-3 px-3 py-2 border-t shrink-0"
          style={{ background: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
          <button onClick={() => changePage(-1)} disabled={pageNum <= 1}
            className="px-4 py-1.5 rounded-lg text-sm font-medium disabled:opacity-30"
            style={{ color: 'var(--color-text)' }}>Назад</button>
          <span className="text-sm font-medium min-w-16 text-center" style={{ color: 'var(--color-text)' }}>
            {pageNum} / {numPages}
          </span>
          <button onClick={() => changePage(1)} disabled={pageNum >= numPages}
            className="px-4 py-1.5 rounded-lg text-sm font-medium disabled:opacity-30"
            style={{ color: 'var(--color-text)' }}>Вперёд</button>
        </footer>
      )}
    </div>
  )
}
