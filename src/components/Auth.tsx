import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [message, setMessage] = useState('')

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    const { error } = isSignUp
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password })
    if (error) setMessage(isSignUp ? 'Ошибка регистрации. Проверьте email.' : 'Неверный email или пароль.')
    setLoading(false)
  }

  const handleGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) setMessage('Ошибка входа через Google')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--color-bg)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <svg className="mx-auto mb-4" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            <line x1="12" y1="6" x2="12" y2="10"/>
            <line x1="12" y1="13" x2="12.01" y2="13"/>
          </svg>
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--color-text)' }}>Читай AI</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>Ваша личная библиотека</p>
        </div>

        <div className="rounded-2xl p-6 space-y-4" style={{ background: 'var(--color-card)', boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)' }}>
          <button
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-3 border rounded-xl py-3 transition text-sm font-medium"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)', background: '#fff' }}
            onMouseEnter={e => e.currentTarget.style.background = '#f9f7f4'}
            onMouseLeave={e => e.currentTarget.style.background = '#fff'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Войти через Google
          </button>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1" style={{ background: 'var(--color-border)' }} />
            <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>или</span>
            <div className="h-px flex-1" style={{ background: 'var(--color-border)' }} />
          </div>

          <form onSubmit={handleEmailAuth} className="space-y-3">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-sm border focus:outline-none focus:ring-2 transition"
              style={{
                background: 'var(--color-bg)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text)',
              }}
              required
            />
            <input
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-sm border focus:outline-none focus:ring-2 transition"
              style={{
                background: 'var(--color-bg)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text)',
              }}
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full text-white py-3 rounded-xl text-sm font-semibold transition disabled:opacity-60"
              style={{ background: 'var(--color-button)' }}
              onMouseEnter={e => !loading && (e.currentTarget.style.background = 'var(--color-button-hover)')}
              onMouseLeave={e => !loading && (e.currentTarget.style.background = 'var(--color-button)')}
            >
              {loading ? '...' : isSignUp ? 'Зарегистрироваться' : 'Войти'}
            </button>
          </form>

          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="w-full text-sm transition hover:underline"
            style={{ color: 'var(--color-link)' }}
          >
            {isSignUp ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Создать'}
          </button>

          {message && (
            <p className="text-sm text-center p-2 rounded-lg" style={{ color: 'var(--color-danger)', background: '#fef2f2' }}>{message}</p>
          )}
        </div>
      </div>
    </div>
  )
}
