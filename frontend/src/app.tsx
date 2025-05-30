// frontend/src/App.tsx
import React, { useState, useEffect } from 'react'
import {AppRoutes} from "./routes";
import { DarkModeToggle } from './components/DarkModeToggle'

export function App() {
  // null = ainda carregando, true/false = estado de auth
    const [isAuth, setIsAuth] = useState<boolean | null>(null)
    const [userRole, setUserRole] = useState<string | null>(null)

  // Na montagem, verifica a sessão no backend
    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/me`, {
            credentials: 'include',
        })
            .then(async res => {
                if (res.ok) {
                    const data = await res.json()     // { email, role }
                    setIsAuth(true)
                    setUserRole(data.role)
                } else {
                    setIsAuth(false)
                    setUserRole(null)
                }
            })
            .catch(() => {
                setIsAuth(false)
                setUserRole(null)
            })
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
        <>
            <AppRoutes
                isAuth={isAuth}
                userRole={userRole}
                onLogin={() => setIsAuth(true)}
                setUserRole={setUserRole}
                onLogout={() => {
                    setIsAuth(false)
                    setUserRole(null)
                }}
            />

            {/* Botão flutuante de DarkMode em todas as páginas */}
            <DarkModeToggle />
        </>
    )
}
