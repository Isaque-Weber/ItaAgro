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
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true })

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
    const [user, setUser]     = useState<User | null>(null)
    const [loading, setLoad]  = useState(true)

    useEffect(() => {
        fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/me`, {
            credentials: 'include'
        })
            .then(res => {
                if (!res.ok) throw new Error('Não autenticado')
                return res.json()
            })
            .then((data: User) => setUser(data))
            .catch(() => setUser(null))
            .finally(() => setLoad(false))
    }, [])

    return (
        <AuthContext.Provider value={{ user, loading }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useUser() {
    return useContext(AuthContext)
}
