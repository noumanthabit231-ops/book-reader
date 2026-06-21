import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

export default function UploadBook() {
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const navigate = useNavigate()

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUploading(true)
    setMessage('')

    const fileExt = file.name.split('.').pop()?.toLowerCase()
    const fileName = `${user.id}/${Date.now()}.${fileExt}`
    const { error: uploadError } = await supabase.storage.from('books').upload(fileName, file)
    if (uploadError) { setMessage('Ошибка загрузки: ' + uploadError.message); setUploading(false); return }

    const { data: { publicUrl } } = supabase.storage.from('books').getPublicUrl(fileName)
    const { error: dbError } = await supabase.from('books').insert({
      user_id: user.id, title, author, file_url: publicUrl, file_type: fileExt === 'epub' ? 'epub' : 'pdf',
    })
    if (dbError) { setMessage('Ошибка сохранения: ' + dbError.message); setUploading(false); return }

    setUploading(false)
    navigate('/')
  }

  return (
    <div className="min-h-screen p-4" style={{ background: 'var(--color-bg)' }}>
      <div className="max-w-lg mx-auto">
        <button onClick={() => navigate('/')} className="text-sm transition mb-6" style={{ color: 'var(--color-link)' }}>← Назад</button>
        <h1 className="text-2xl font-semibold mb-6" style={{ color: 'var(--color-text)' }}>Добавить книгу</h1>

        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>Название</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Война и мир" required
              className="w-full rounded-xl px-4 py-3 text-sm border focus:outline-none focus:ring-2 transition"
              style={{ background: 'var(--color-card)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>Автор</label>
            <input type="text" value={author} onChange={e => setAuthor(e.target.value)} placeholder="Лев Толстой"
              className="w-full rounded-xl px-4 py-3 text-sm border focus:outline-none focus:ring-2 transition"
              style={{ background: 'var(--color-card)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--color-text)' }}>Файл (PDF или EPUB)</label>
            <label className="flex flex-col items-center justify-center w-full h-28 rounded-xl border-2 border-dashed cursor-pointer transition"
              style={{ borderColor: file ? 'var(--color-accent)' : 'var(--color-border)', background: 'var(--color-card)' }}>
              {file ? (
                <div className="text-center">
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>{file.name}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                </div>
              ) : (
                <div className="text-center" style={{ color: 'var(--color-text-secondary)' }}>
                  <svg className="mx-auto mb-2" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
                  <p className="text-sm">Выберите файл</p>
                  <p className="text-xs mt-1">PDF или EPUB</p>
                </div>
              )}
              <input type="file" accept=".pdf,.epub" onChange={e => setFile(e.target.files?.[0] || null)} className="hidden" />
            </label>
          </div>
          <button type="submit" disabled={uploading || !file || !title}
            className="w-full text-white py-3 rounded-xl text-sm font-semibold transition disabled:opacity-50"
            style={{ background: 'var(--color-button)' }}
            onMouseEnter={e => !uploading && (e.currentTarget.style.background = 'var(--color-button-hover)')}
            onMouseLeave={e => !uploading && (e.currentTarget.style.background = 'var(--color-button)')}
          >
            {uploading ? 'Загрузка...' : 'Загрузить книгу'}
          </button>
          {message && <p className="text-sm text-center p-2 rounded-lg" style={{ color: 'var(--color-danger)', background: '#fef2f2' }}>{message}</p>}
        </form>
      </div>
    </div>
  )
}
