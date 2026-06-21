import { useState, useEffect } from 'react'
import { supabase, type Book } from '../lib/supabase'
import { Link } from 'react-router-dom'

export default function Library() {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBooks()
  }, [])

  const loadBooks = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('books')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (data) setBooks(data)
    setLoading(false)
  }

  const handleLogout = () => supabase.auth.signOut()

  const handleDelete = async (id: string, fileUrl: string) => {
    const fileName = fileUrl.split('/').pop()
    if (fileName) await supabase.storage.from('books').remove([fileName])
    await supabase.from('books').delete().eq('id', id)
    setBooks(books.filter(b => b.id !== id))
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <header className="border-b border-zinc-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white">BookReader</h1>
            <p className="text-zinc-500 text-sm">Ваша библиотека</p>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/upload"
              className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition"
            >
              + Добавить книгу
            </Link>
            <button
              onClick={handleLogout}
              className="text-zinc-400 text-sm hover:text-white transition"
            >
              Выйти
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6">
        {loading ? (
          <div className="text-center text-zinc-500 py-20">Загрузка...</div>
        ) : books.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📚</div>
            <h2 className="text-xl font-medium text-white mb-2">Библиотека пуста</h2>
            <p className="text-zinc-400 mb-6">Добавьте свою первую книгу</p>
            <Link
              to="/upload"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition"
            >
              Загрузить книгу
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {books.map(book => (
              <div
                key={book.id}
                className="bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 group"
              >
                <Link to={`/reader/${book.id}`}>
                  <div className="aspect-[3/4] bg-zinc-800 flex items-center justify-center">
                    {book.cover_url ? (
                      <img
                        src={book.cover_url}
                        alt={book.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-4xl">📖</span>
                    )}
                  </div>
                </Link>
                <div className="p-3">
                  <Link to={`/reader/${book.id}`}>
                    <h3 className="text-white text-sm font-medium truncate">{book.title}</h3>
                    {book.author && (
                      <p className="text-zinc-500 text-xs truncate">{book.author}</p>
                    )}
                  </Link>
                  <div className="flex flex-col gap-1.5 mt-2">
                    <Link
                      to={`/reader/${book.id}`}
                      className="text-xs text-blue-400 hover:text-blue-300 transition"
                    >
                      📖 Читать
                    </Link>
                    <Link
                      to={`/summary/${book.id}`}
                      className="text-xs bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition px-2 py-1 rounded-lg text-center"
                    >
                      🤖 Пересказ
                    </Link>
                    <button
                      onClick={() => handleDelete(book.id, book.file_url)}
                      className="text-xs text-red-400 hover:text-red-300 transition"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
