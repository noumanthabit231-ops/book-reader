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

    // 1. Upload file to Supabase Storage
    const fileExt = file.name.split('.').pop()?.toLowerCase()
    const fileName = `${user.id}/${Date.now()}.${fileExt}`
    const { error: uploadError } = await supabase.storage
      .from('books')
      .upload(fileName, file)

    if (uploadError) {
      setMessage('Ошибка загрузки файла: ' + uploadError.message)
      setUploading(false)
      return
    }

    const { data: { publicUrl } } = supabase.storage
      .from('books')
      .getPublicUrl(fileName)

    // 2. Save book metadata to DB
    const { error: dbError } = await supabase.from('books').insert({
      user_id: user.id,
      title,
      author,
      file_url: publicUrl,
      file_type: fileExt === 'epub' ? 'epub' : 'pdf',
    })

    if (dbError) {
      setMessage('Ошибка сохранения: ' + dbError.message)
      setUploading(false)
      return
    }

    setUploading(false)
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <div className="max-w-lg mx-auto">
        <button
          onClick={() => navigate('/')}
          className="text-zinc-400 text-sm hover:text-white transition mb-6"
        >
          ← Назад в библиотеку
        </button>

        <h1 className="text-2xl font-bold text-white mb-6">Добавить книгу</h1>

        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-zinc-400 text-sm mb-1">Название *</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-zinc-900 text-white rounded-xl px-4 py-3 border border-zinc-800 focus:border-blue-500 focus:outline-none"
              required
              placeholder="Война и мир"
            />
          </div>

          <div>
            <label className="block text-zinc-400 text-sm mb-1">Автор</label>
            <input
              type="text"
              value={author}
              onChange={e => setAuthor(e.target.value)}
              className="w-full bg-zinc-900 text-white rounded-xl px-4 py-3 border border-zinc-800 focus:border-blue-500 focus:outline-none"
              placeholder="Лев Толстой"
            />
          </div>

          <div>
            <label className="block text-zinc-400 text-sm mb-1">Файл (PDF или EPUB) *</label>
            <label className="flex flex-col items-center justify-center w-full h-32 bg-zinc-900 rounded-xl border-2 border-dashed border-zinc-800 cursor-pointer hover:border-blue-500 transition">
              {file ? (
                <div className="text-center">
                  <p className="text-white text-sm">{file.name}</p>
                  <p className="text-zinc-500 text-xs mt-1">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                </div>
              ) : (
                <div className="text-center text-zinc-500">
                  <span className="text-2xl">📄</span>
                  <p className="text-sm mt-1">Нажмите, чтобы выбрать файл</p>
                  <p className="text-xs mt-1">PDF или EPUB</p>
                </div>
              )}
              <input
                type="file"
                accept=".pdf,.epub"
                onChange={e => setFile(e.target.files?.[0] || null)}
                className="hidden"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={uploading || !file || !title}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition disabled:opacity-50"
          >
            {uploading ? 'Загрузка...' : 'Загрузить книгу'}
          </button>

          {message && <p className="text-red-400 text-sm text-center">{message}</p>}
        </form>
      </div>
    </div>
  )
}
