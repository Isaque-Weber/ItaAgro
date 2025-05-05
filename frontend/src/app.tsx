// frontend/src/App.tsx
import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Login } from './pages/Login'
import { Dashboard } from './pages/Dashboard'
import { RecoverPassword } from './pages/RecoverPassword'
import { Signup } from './pages/Signup'
import { Chat } from './pages/Chat'

export function App() {
  // null = ainda carregando, true/false = estado de auth
  const [isAuth, setIsAuth] = useState<boolean | null>(null)

  // Na montagem, verifica a sessão no backend
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/me`, {
      credentials: 'include',
    })
      .then(res => { setIsAuth(res.ok) })
      .catch(() => setIsAuth(false))
  }, [])

  // Enquanto verifica, mostra algo (pode ser skeleton ou spinner)
  if (isAuth === null) {
    return (
      <div className="flex items-center justify-center h-screen">
        Carregando...
      </div>
    )
  }

  return (

    <Routes>
      <Route
        path="/"
        element={
          isAuth
            ? <Dashboard onLogout={() => setIsAuth(false)} />
            : <Navigate to="/login" replace />
        }
      />
      <Route
        path="/login"
        element={
          isAuth
            ? <Navigate to="/chat" replace />
            : <Login onLogin={() => setIsAuth(true)} />
        }
      />
      <Route
        path="/recover"
        element={
          isAuth
            ? <Navigate to="/chat" replace />
            : <RecoverPassword />
        }
      />
      <Route
        path="/signup"
        element={
          isAuth
            ? <Navigate to="/chat" replace />
            : <Signup />
        }
      />
      <Route
        path="/chat"
        element={
          isAuth
            ? <Chat onLogout={() => setIsAuth(false)} />
            : <Navigate to="/login" replace />
        }
      />
      <Route
        path="*"
        element={
          <Navigate to={isAuth ? '/chat' : '/login'} replace />
        }
      />
    </Routes>

  )
}
