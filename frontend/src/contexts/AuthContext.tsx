// src/contexts/AuthContext.tsx
import React, { createContext, useState, useEffect, useContext } from 'react'

interface User {
    sub: string
    email: string
    role: 'user' | 'admin'
}

interface AuthContextType {
    user: User | null
    loading: boolean
    onLogin: () => void
    setUserRole: (role: 'user' | 'admin') => void
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    onLogin: () => {},
    setUserRole: () => {}
})

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoad] = useState(true)

    const loadUser = () => {
        const token = localStorage.getItem('auth_token')
        const headers: HeadersInit = {}

        if (token) {
            headers['Authorization'] = `Bearer ${token}`
        }

        fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/me`, {
            credentials: 'include',
            headers
        })
            .then(res => {
                if (!res.ok) throw new Error('Não autenticado')
                return res.json()
            })
            .then((data: User) => setUser(data))
            .catch(() => {
                setUser(null)
                localStorage.removeItem('auth_token')
            })
            .finally(() => setLoad(false))
    }

    useEffect(() => {
        loadUser()
    }, [])

    const onLogin = () => {
        loadUser()
    }

    const setUserRole = (role: 'user' | 'admin') => {
        if (user) {
            setUser({ ...user, role })
        }
    }

    return (
        <AuthContext.Provider value={{ user, loading, onLogin, setUserRole }}>
            {children}
        </AuthContext.Provider>
    )
}

// Mantendo useUser para retrocompatibilidade
export function useUser() {
    return useContext(AuthContext)
}

// Adicionando useAuth para o GoogleCallback
export function useAuth() {
    return useContext(AuthContext)
}
