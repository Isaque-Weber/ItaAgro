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
        // Tenta obter o token do localStorage (se tiver sido salvo no login)
        const token = localStorage.getItem('auth_token')

        // Prepara os headers para a requisição
        const headers: HeadersInit = {}
        if (token) {
            headers['Authorization'] = `Bearer ${token}`
            console.log('Token encontrado no localStorage, incluindo no header')
        }

        fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/me`, {
            credentials: 'include',
            headers
        })
            .then(async res => {
                console.log('🌐 API URL:', import.meta.env.VITE_API_BASE_URL)
                const API_URL = import.meta.env.VITE_API_BASE_URL
                console.log(API_URL)
                if (!API_URL) {
                    console.error('⚠️ VITE_API_BASE_URL não definida!')
                }

                console.log('Status da resposta /auth/me:', res.status)

                if(res.ok) {
                    try {
                        const data = await res.json()
                        console.log('Dados recebidos de /auth/me:', data)

                        if (data && data.role) {
                            setIsAuth(true)
                            setUserRole(data.role)
                        } else {
                            setIsAuth(false)
                            setUserRole(null)
                        }

                    } catch (e) {
                        console.error('Erro ao fazer parse do JSON', e)
                        setIsAuth(false)
                        setUserRole(null)
                    }
                } else {
                    console.error('Erro na requisição /auth/me:', res.status)
                    setIsAuth(false)
                    setUserRole(null)
                }

                // if (!res.ok) {
                //     console.error('Erro ao fazer o parse do JSON',Error)
                //     setIsAuth(false)
                //     setUserRole(null)
                //     return
                // }
                //
                // const data = await res.json()
                // if (!data?.role) {
                //     setIsAuth(false)
                //     setUserRole(null)
                //     return
                // }
                //
                // setIsAuth(true)
                // setUserRole(data.role)
            })
            .catch(err => {
                console.error('Erro na requisição /auth/me:', err);
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
                userRole={userRole === 'admin' || userRole === 'user' ? userRole : null}
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
