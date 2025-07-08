// src/components/ProtectedRoute.tsx
import React, { JSX } from 'react';
import { Navigate } from 'react-router-dom';
import { useSubscription } from '../hooks/useSubscription';
import { useUser } from '../contexts/AuthContext';

export function ProtectedRoute({ children }: { children: JSX.Element }) {
    const { checking, subscribed } = useSubscription();
    const { user, loading: authLoading } = useUser();
    const isSeedUser = user?.email === 'admin@itaagro.com' || user?.email === 'user@itaagro.com';

    if (authLoading || checking) {
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

    if (!subscribed) {
        return <Navigate to="/subscribe" replace />;
    }

    return children;
}
