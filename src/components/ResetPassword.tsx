import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    // Парсим токен из URL (приходит от Supabase после клика по ссылке)
    const hash = window.location.hash
    if (hash && hash.includes('type=recovery')) {
      const params = new URLSearchParams(hash.replace('#', ''))
      const accessToken = params.get('access_token')
      if (accessToken) {
        supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: params.get('refresh_token') || '',
        })
      }
    }
  }, [])

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) {
      setMessage('Пароли не совпадают')
      return
    }
    if (password.length < 6) {
      setMessage('Пароль должен быть минимум 6 символов')
      return
    }
    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setMessage(error.message)
    } else {
      setDone(true)
      setMessage('Пароль успешно изменён!')
    }
    setLoading(false)
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--color-bg)' }}>
        <div className="w-full max-w-sm text-center">
          <div className="rounded-2xl p-6 space-y-4" style={{ background: 'var(--color-card)' }}>
            <svg className="mx-auto" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2" strokeLinecap="round">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>Пароль изменён</h2>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Теперь войдите с новым паролем</p>
            <a href="/" className="inline-block px-6 py-2.5 rounded-xl text-sm font-semibold text-white"
              style={{ background: 'var(--color-button)' }}>На главную</a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--color-bg)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <svg className="mx-auto mb-4" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
          </svg>
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--color-text)' }}>Читай AI</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>Введите новый пароль</p>
        </div>

        <form onSubmit={handleReset} className="space-y-4 rounded-2xl p-6" style={{ background: 'var(--color-card)' }}>
          <input type="password" placeholder="Новый пароль" value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full rounded-xl px-4 py-3 text-sm border focus:outline-none focus:ring-2"
            style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
            minLength={6} required />

          <input type="password" placeholder="Подтвердите пароль" value={confirm}
            onChange={e => setConfirm(e.target.value)}
            className="w-full rounded-xl px-4 py-3 text-sm border focus:outline-none focus:ring-2"
            style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
            minLength={6} required />

          <button type="submit" disabled={loading}
            className="w-full text-white py-3 rounded-xl text-sm font-semibold transition disabled:opacity-60"
            style={{ background: 'var(--color-button)' }}
            onMouseEnter={e => !loading && (e.currentTarget.style.background = 'var(--color-button-hover)')}
            onMouseLeave={e => !loading && (e.currentTarget.style.background = 'var(--color-button)')}
          >
            {loading ? '...' : 'Сохранить пароль'}
          </button>

          {message && (
            <p className="text-sm text-center p-2 rounded-lg" style={{
              color: done ? 'var(--color-success)' : 'var(--color-danger)',
              background: done ? '#f0fdf4' : '#fef2f2',
            }}>{message}</p>
          )}
        </form>
      </div>
    </div>
  )
}
