import { useState } from 'react'
import { supabase } from '../lib/supabase'

type AuthMode = 'signin' | 'signup' | 'recovery'

export default function Auth() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<AuthMode>('signin')
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('error')

  const showMsg = (text: string, type: 'success' | 'error' = 'error') => {
    setMessage(text)
    setMessageType(type)
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    if (mode === 'recovery') {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      })
      if (error) {
        showMsg(error.message)
      } else {
        showMsg('Ссылка для восстановления отправлена на ваш email', 'success')
      }
      setLoading(false)
      return
    }

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        if (error.message.toLowerCase().includes('already registered') || error.message.toLowerCase().includes('already exists')) {
          showMsg('Такой аккаунт уже существует. Войдите в систему.')
        } else {
          showMsg(error.message)
        }
      } else {
        showMsg('Письмо отправлено на ваш email. Подтвердите регистрацию.', 'success')
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        if (error.message.toLowerCase().includes('invalid login credentials')) {
          showMsg('Неверный email или пароль')
        } else {
          showMsg(error.message)
        }
      }
    }

    setLoading(false)
  }

  const handleGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) showMsg('Ошибка входа через Google')
  }

  const isSignIn = mode === 'signin'
  const isSignUp = mode === 'signup'
  const isRecovery = mode === 'recovery'

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--color-bg)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <svg className="mx-auto mb-4" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
          </svg>
          <h1 className="text-2xl font-semibold" style={{ color: 'var(--color-text)' }}>Читай AI</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {isRecovery ? 'Восстановление пароля' : 'Ваша личная библиотека'}
          </p>
        </div>

        <div className="rounded-2xl p-6 space-y-4" style={{ background: 'var(--color-card)', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          {/* Google button — только для входа и регистрации */}
          {!isRecovery && (
            <>
              <button onClick={handleGoogle}
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
            </>
          )}

          <form onSubmit={handleEmailAuth} className="space-y-3">
            <input type="email" placeholder="Email" value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full rounded-xl px-4 py-3 text-sm border focus:outline-none focus:ring-2 transition"
              style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
              required />

            {!isRecovery && (
              <input type="password" placeholder="Пароль" value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full rounded-xl px-4 py-3 text-sm border focus:outline-none focus:ring-2 transition"
                style={{ background: 'var(--color-bg)', borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                minLength={6} required />
            )}

            <button type="submit" disabled={loading}
              className="w-full text-white py-3 rounded-xl text-sm font-semibold transition disabled:opacity-60"
              style={{ background: 'var(--color-button)' }}
              onMouseEnter={e => !loading && (e.currentTarget.style.background = 'var(--color-button-hover)')}
              onMouseLeave={e => !loading && (e.currentTarget.style.background = 'var(--color-button)')}
            >
              {loading ? '...' : isRecovery ? 'Отправить ссылку' : isSignUp ? 'Зарегистрироваться' : 'Войти'}
            </button>
          </form>

          {/* Ссылки внизу */}
          <div className="flex flex-col items-center gap-2">
            {isRecovery ? (
              <button onClick={() => setMode('signin')} className="text-sm transition hover:underline" style={{ color: 'var(--color-link)' }}>
                Вернуться ко входу
              </button>
            ) : (
              <button onClick={() => setMode('recovery')} className="text-sm transition hover:underline" style={{ color: 'var(--color-link)' }}>
                Забыли пароль?
              </button>
            )}

            <button onClick={() => setMode(isSignIn ? 'signup' : 'signin')} className="text-sm transition hover:underline" style={{ color: 'var(--color-link)' }}>
              {isSignIn ? 'Нет аккаунта? Создать' : 'Уже есть аккаунт? Войти'}
            </button>
          </div>

          {/* Сообщение */}
          {message && (
            <p className="text-sm text-center p-3 rounded-lg leading-relaxed"
              style={{
                color: messageType === 'success' ? 'var(--color-success)' : 'var(--color-danger)',
                background: messageType === 'success' ? '#f0fdf4' : '#fef2f2',
              }}
            >{message}</p>
          )}
        </div>
      </div>
    </div>
  )
}
