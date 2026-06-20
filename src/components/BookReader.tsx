import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase, type Book } from '../lib/supabase'

export default function BookReader() {
  const { id } = useParams<{ id: string }>()
  const [book, setBook] = useState<Book | null>(null)
  const [loading, setLoading] = useState(true)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    loadBook()
  }, [id])

  const loadBook = async () => {
    const { data } = await supabase.from('books').select('*').eq('id', id).single()
    if (data) {
      setBook(data)
      if (data.file_type === 'pdf') {
        setPdfUrl(data.file_url)
      }
    }
    setLoading(false)
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

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <header className="border-b border-zinc-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-zinc-400 hover:text-white transition text-sm">←</Link>
          <div>
            <h1 className="text-white font-medium text-sm">{book.title}</h1>
            {book.author && <p className="text-zinc-500 text-xs">{book.author}</p>}
          </div>
        </div>
        <Link
          to={`/summary/${book.id}`}
          className="bg-zinc-800 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-zinc-700 transition"
        >
          🤖 Пересказ
        </Link>
      </header>

      {pdfUrl ? (
        <iframe
          src={`${pdfUrl}#view=FitH`}
          className="flex-1 w-full"
          title={book.title}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-zinc-500">
            EPUB читалка в разработке. Скачайте файл для чтения в приложении.
          </p>
        </div>
      )}
    </div>
  )
}
