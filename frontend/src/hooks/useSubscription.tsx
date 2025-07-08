// src/hooks/useSubscription.tsx
import { useEffect, useState } from 'react'
import { useUser } from '../contexts/AuthContext'

interface SubscriptionStatus {
    subscribed: boolean
}

export function useSubscription() {
    const [checking, setChecking]     = useState(true)
    const [subscribed, setSubscribed] = useState(false)
    const { user } = useUser()
    const isSeedUser = user?.email === 'admin@itaagro.com' || user?.email === 'user@itaagro.com'

    useEffect(() => {
        if (!user || !user.emailVerified) return;

        if (isSeedUser) {
            setSubscribed(true);
            setChecking(false);
            return;
        }

        fetch(`${import.meta.env.VITE_API_BASE_URL}/api/subscription/status`, {
            credentials: 'include'
        })
            .then(res => res.json())
            .then((data: SubscriptionStatus) => {
                setSubscribed(data.subscribed)
            })
            .catch(() => {
                setSubscribed(false)
            })
            .finally(() => {
                setChecking(false)
            })
    }, [isSeedUser])

    return { checking, subscribed }
}
