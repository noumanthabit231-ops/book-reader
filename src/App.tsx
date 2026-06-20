import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import Auth from './components/Auth'
import Library from './components/Library'
import UploadBook from './components/UploadBook'
import BookReader from './components/BookReader'
import BookSummary from './components/BookSummary'

function App() {
  const [session, setSession] = useState<boolean | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(!!session)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(!!session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (session === null) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-zinc-500">Загрузка...</p>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={session ? <Navigate to="/" /> : <Auth />} />
        <Route path="/" element={session ? <Library /> : <Navigate to="/auth" />} />
        <Route path="/upload" element={session ? <UploadBook /> : <Navigate to="/auth" />} />
        <Route path="/reader/:id" element={session ? <BookReader /> : <Navigate to="/auth" />} />
        <Route path="/summary/:id" element={session ? <BookSummary /> : <Navigate to="/auth" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
