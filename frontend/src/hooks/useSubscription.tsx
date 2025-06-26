// src/hooks/useSubscription.tsx
import { useEffect, useState } from 'react'

interface SubscriptionStatus {
    subscribed: boolean
}

export function useSubscription() {
    const [checking, setChecking]     = useState(true)
    const [subscribed, setSubscribed] = useState(false)

    useEffect(() => {
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
    }, [])

    return { checking, subscribed }
}
