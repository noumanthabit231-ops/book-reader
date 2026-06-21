import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase, type Book } from '../lib/supabase'

// Загружаем pdf.js динамически (только в браузере)
async function loadPdfJs() {
  const pdfjsLib = await import('pdfjs-dist')
  const workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).href
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
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!id) return
    loadBook()
  }, [id])

  useEffect(() => {
    if (pdfDoc && pageNum) renderPage(pageNum)
  }, [pdfDoc, pageNum])

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
    } catch (e) {
      console.error('PDF load error:', e)
    }
  }

  const renderPage = async (num: number) => {
    if (!pdfDoc || !canvasRef.current) return
    setPageLoading(true)
    const page = await pdfDoc.getPage(num)
    const viewport = page.getViewport({ scale: 1.2 })
    const canvas = canvasRef.current
    canvas.width = viewport.width
    canvas.height = viewport.height
    const ctx = canvas.getContext('2d')!
    await page.render({ canvasContext: ctx, viewport }).promise
    setPageLoading(false)
  }

  const changePage = (delta: number) => {
    const next = pageNum + delta
    if (next >= 1 && next <= totalPages) {
      setPageNum(next)
    }
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
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center flex-col gap-4">
        <p className="text-zinc-400">Книга не найдена</p>
        <Link to="/" className="text-blue-400 hover:text-blue-300 transition">← В библиотеку</Link>
      </div>
    )
  }

  // Если не PDF — показываем простую ссылку
  if (book.file_type !== 'pdf') {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col">
        <header className="border-b border-zinc-800 px-6 py-3 flex items-center justify-between">
          <Link to="/" className="text-zinc-400 hover:text-white transition text-sm">←</Link>
          <div className="text-center">
            <h1 className="text-white font-medium text-sm">{book.title}</h1>
            {book.author && <p className="text-zinc-500 text-xs">{book.author}</p>}
          </div>
          <Link to={`/summary/${book.id}`} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition">
            🤖 Пересказ
          </Link>
        </header>
        <div className="flex-1 flex items-center justify-center flex-col gap-4">
          <span className="text-6xl">📖</span>
          <p className="text-zinc-400">EPUB читалка в разработке</p>
          <p className="text-zinc-500 text-sm">Скачайте файл для чтения в приложении</p>
          <Link to={`/summary/${book.id}`} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition">
            🤖 Получить пересказ
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Верхняя панель */}
      <header className="border-b border-zinc-800 px-4 py-2 flex items-center justify-between bg-zinc-900/50">
        <Link to="/" className="text-zinc-400 hover:text-white transition text-lg">←</Link>
        <div className="text-center flex-1 mx-4">
          <h1 className="text-white font-medium text-sm truncate">{book.title}</h1>
          {book.author && <p className="text-zinc-500 text-xs">{book.author}</p>}
        </div>
        <div className="flex items-center gap-2">
          {!pdfDoc && (
            <button
              onClick={loadPdfDocument}
              className="bg-zinc-800 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-zinc-700 transition"
            >
              📖 Открыть книгу
            </button>
          )}
          <Link
            to={`/summary/${book.id}`}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition whitespace-nowrap"
          >
            🤖 Пересказ
          </Link>
        </div>
      </header>

      {/* Читалка */}
      {pdfDoc ? (
        <div className="flex-1 flex flex-col items-center overflow-auto bg-zinc-900/30 p-4">
          {/* Панель навигации */}
          <div className="flex items-center gap-4 mb-4 bg-zinc-900 rounded-xl px-4 py-2 border border-zinc-800">
            <button
              onClick={() => changePage(-1)}
              disabled={pageNum <= 1}
              className="text-white hover:text-blue-400 disabled:text-zinc-600 disabled:cursor-not-allowed transition text-lg"
            >
              ◀
            </button>
            <span className="text-zinc-300 text-sm min-w-20 text-center">
              {pageNum} / {totalPages}
            </span>
            <button
              onClick={() => changePage(1)}
              disabled={pageNum >= totalPages}
              className="text-white hover:text-blue-400 disabled:text-zinc-600 disabled:cursor-not-allowed transition text-lg"
            >
              ▶
            </button>
          </div>

          {/* Страница */}
          <div className="relative">
            {pageLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/50 z-10 rounded-lg">
                <p className="text-zinc-400 text-sm">Загрузка...</p>
              </div>
            )}
            <canvas
              ref={canvasRef}
              className="rounded-lg shadow-2xl max-w-full"
            />
          </div>

          {/* Нижняя навигация */}
          <div className="flex items-center gap-4 mt-4 bg-zinc-900 rounded-xl px-4 py-2 border border-zinc-800">
            <button
              onClick={() => changePage(-1)}
              disabled={pageNum <= 1}
              className="bg-zinc-800 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-zinc-700 disabled:opacity-30 transition"
            >
              ← Назад
            </button>
            <span className="text-zinc-300 text-sm">
              Стр. {pageNum} из {totalPages}
            </span>
            <button
              onClick={() => changePage(1)}
              disabled={pageNum >= totalPages}
              className="bg-zinc-800 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-zinc-700 disabled:opacity-30 transition"
            >
              Вперед →
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <span className="text-6xl block mb-4">📖</span>
            <p className="text-zinc-400 mb-4">Нажмите «Открыть книгу», чтобы начать чтение</p>
            <button
              onClick={loadPdfDocument}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition"
            >
              📖 Открыть книгу
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
