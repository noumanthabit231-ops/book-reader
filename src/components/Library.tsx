import { useState, useEffect } from 'react'
import { supabase, type Book } from '../lib/supabase'
import { Link } from 'react-router-dom'

export default function Library() {
  const [books, setBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  useEffect(() => { loadBooks() }, [])

  const loadBooks = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from('books').select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (data) setBooks(data)
    setLoading(false)
  }

  const handleDelete = async (id: string, fileUrl: string) => {
    const fileName = fileUrl.split('/').pop()
    if (fileName) await supabase.storage.from('books').remove([fileName])
    await supabase.from('books').delete().eq('id', id)
    setBooks(books.filter(b => b.id !== id))
  }

  const filtered = books.filter(b =>
    b.title.toLowerCase().includes(search.toLowerCase()) ||
    (b.author && b.author.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold" style={{ color: 'var(--color-text)' }}>Читай AI</h1>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>Моя библиотека</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border overflow-hidden" style={{ borderColor: 'var(--color-border)' }}>
              <button
                onClick={() => setViewMode('grid')}
                className="px-3 py-1.5 text-xs transition"
                style={{
                  background: viewMode === 'grid' ? 'var(--color-button)' : 'transparent',
                  color: viewMode === 'grid' ? '#fff' : 'var(--color-text-secondary)',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="1" width="6" height="6" rx="1"/><rect x="9" y="1" width="6" height="6" rx="1"/><rect x="1" y="9" width="6" height="6" rx="1"/><rect x="9" y="9" width="6" height="6" rx="1"/></svg>
              </button>
              <button
                onClick={() => setViewMode('list')}
                className="px-3 py-1.5 text-xs transition"
                style={{
                  background: viewMode === 'list' ? 'var(--color-button)' : 'transparent',
                  color: viewMode === 'list' ? '#fff' : 'var(--color-text-secondary)',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor"><rect x="1" y="2" width="14" height="2" rx="1"/><rect x="1" y="7" width="14" height="2" rx="1"/><rect x="1" y="12" width="14" height="2" rx="1"/></svg>
              </button>
            </div>
            <Link
              to="/upload"
              className="px-4 py-1.5 rounded-lg text-sm font-medium text-white transition"
              style={{ background: 'var(--color-button)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--color-button-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--color-button)'}
            >
              + Добавить
            </Link>
            <button
              onClick={() => supabase.auth.signOut()}
              className="text-sm transition"
              style={{ color: 'var(--color-text-secondary)' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--color-text)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-secondary)'}
            >
              Выйти
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-secondary)" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            placeholder="Поиск книг..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 transition"
            style={{
              background: 'var(--color-card)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text)',
            }}
          />
        </div>

        {/* Books */}
        {loading ? (
          <p className="text-center py-20" style={{ color: 'var(--color-text-secondary)' }}>Загрузка...</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <svg className="mx-auto mb-4 opacity-20" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="1" strokeLinecap="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>
            <h2 className="text-lg font-medium mb-2" style={{ color: 'var(--color-text)' }}>
              {search ? 'Ничего не найдено' : 'Библиотека пуста'}
            </h2>
            <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>
              {search ? 'Попробуйте другой запрос' : 'Добавьте свою первую книгу'}
            </p>
            {!search && (
              <Link
                to="/upload"
                className="inline-block px-6 py-2.5 rounded-xl text-sm font-medium text-white transition"
                style={{ background: 'var(--color-button)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--color-button-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--color-button)'}
              >
                Загрузить книгу
              </Link>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filtered.map(book => (
              <BookCard key={book.id} book={book} onDelete={handleDelete} />
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {filtered.map(book => (
              <BookRow key={book.id} book={book} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function BookCard({ book, onDelete }: { book: Book; onDelete: (id: string, url: string) => void }) {
  return (
    <div
      className="rounded-xl overflow-hidden group transition"
      style={{ background: 'var(--color-card)', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}
    >
      <div className="relative">
        <Link to={`/reader/${book.id}`}>
          <div className="aspect-[3/4]" style={{ background: '#f0ede6' }}>
            {book.cover_url ? (
              <img src={book.cover_url} alt={book.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#c4beb6" strokeWidth="1.5" strokeLinecap="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>
              </div>
            )}
          </div>
        </Link>
        <span className="absolute bottom-1.5 left-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded"
          style={{ background: 'rgba(0,0,0,0.5)', color: '#fff' }}>
          {book.file_type.toUpperCase()}
        </span>
        <button
          onClick={() => onDelete(book.id, book.file_url)}
          className="absolute top-1.5 right-1.5 p-1.5 rounded-lg transition hover:opacity-80"
          style={{ background: 'rgba(0,0,0,0.5)', color: '#fff' }}
          title="Удалить"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
          </svg>
        </button>
      </div>
      <div className="p-3">
        <Link to={`/reader/${book.id}`}>
          <h3 className="text-sm font-medium truncate" style={{ color: 'var(--color-text)' }}>{book.title}</h3>
          {book.author && <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--color-text-secondary)' }}>{book.author}</p>}
        </Link>
        <div className="flex items-center gap-1.5 mt-2">
          <Link to={`/reader/${book.id}`}
            className="text-xs font-medium px-2 py-1 rounded-lg transition"
            style={{ color: 'var(--color-link)', background: '#f0ede6' }}>
            Читать
          </Link>
          <Link to={`/summary/${book.id}`}
            className="text-xs font-medium px-2 py-1 rounded-lg transition"
            style={{ color: 'var(--color-accent)', background: '#f0ede6' }}>
            Пересказ
          </Link>
        </div>
      </div>
    </div>
  )
}

function BookRow({ book, onDelete }: { book: Book; onDelete: (id: string, url: string) => void }) {
  return (
    <div
      className="flex items-center gap-3 p-3 rounded-xl transition"
      style={{ background: 'var(--color-card)' }}
    >
      <Link to={`/reader/${book.id}`} className="shrink-0">
        <div className="w-10 h-14 rounded flex items-center justify-center" style={{ background: '#f0ede6' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c4beb6" strokeWidth="1.5" strokeLinecap="round"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>
        </div>
      </Link>
      <div className="flex-1 min-w-0">
        <Link to={`/reader/${book.id}`}>
          <h3 className="text-sm font-medium truncate" style={{ color: 'var(--color-text)' }}>{book.title}</h3>
          {book.author && <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--color-text-secondary)' }}>{book.author}</p>}
        </Link>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Link to={`/summary/${book.id}`}
          className="text-xs font-medium px-2.5 py-1.5 rounded-lg transition"
          style={{ color: 'var(--color-accent)', background: '#f0ede6' }}>
          Пересказ
        </Link>
        <button
          onClick={() => onDelete(book.id, book.file_url)}
          className="p-1.5 rounded-lg transition hover:opacity-60"
          style={{ color: 'var(--color-danger)' }}
          title="Удалить"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
