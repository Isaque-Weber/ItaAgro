// src/components/ProtectedRoute.tsx
import React, {JSX} from 'react'
import { Navigate } from 'react-router-dom'
import { useSubscription } from '../hooks/useSubscription'
import { useUser }         from '../contexts/AuthContext'

export function ProtectedRoute({
                                   children,
                               }: {
    children: JSX.Element
}) {
    const { checking, subscribed } = useSubscription()
    const { user, loading: authLoading } = useUser()

    if (authLoading || checking) {
        return <div>Carregando…</div>
    }

    // Admins sempre passam
    if (user?.role === 'admin') {
        return children
    }

    // Usuários sem assinatura são redirecionados
    if (!subscribed) {
        return <Navigate to="/subscribe" replace />
    }

    return children
}
