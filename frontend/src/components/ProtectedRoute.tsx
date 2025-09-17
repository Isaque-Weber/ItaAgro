// src/components/ProtectedRoute.tsx
import React, { JSX } from 'react';
import { Navigate } from 'react-router-dom';
import { useSubscription } from '../hooks/useSubscription';
import { useUser } from '../contexts/AuthContext';

export function ProtectedRoute({ children, requireSubscription = true }: { children: JSX.Element, requireSubscription?: boolean }) {
    const { checking, subscribed } = useSubscription();
    const { user, loading: authLoading } = useUser();
    const isSeedUser = user?.email === 'admin@itaagroia.com.br' || user?.email === 'user@itaagroia.com.br' || user?.email === 'elianebueno@itaagroia.com.br' || user?.email === 'tatu@itaagroia.com.br' || user?.email === 'luiz@itaagroia.com.br' || user?.email === 'ivo@itaagroia.com.br' || user?.email === 'vinicius@itaagroia.com.br';

    if (authLoading || checking) {
        console.log('loading')
        return <div>Carregando…</div>;
    }

    // ✅ Bypass para seed users e admin
    if (isSeedUser || user?.role === 'admin') {
        return children;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (!user.emailVerified && !window.location.pathname.startsWith('/verify-email')) {
        return <Navigate to="/verify-email" replace />;
    }

    if (requireSubscription && !subscribed) {
        return <Navigate to="/subscribe" replace />;
    }

    return children;
}
