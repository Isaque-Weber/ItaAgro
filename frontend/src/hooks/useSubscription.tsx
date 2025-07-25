import { useEffect, useState } from 'react';
import { useUser } from '../contexts/AuthContext';

export function useSubscription() {
    const { user, loading } = useUser();
    const [checking, setChecking] = useState(true);
    const [subscribed, setSubscribed] = useState(false);

    useEffect(() => {
        if (loading) {
            setChecking(true);
            return;
        }

        if (!user) {
            setSubscribed(false);
            setChecking(false);
            return;
        }

        // A informação já vem no objeto `user` do AuthContext
        const isSubscribed = user.subscriptionActive || user.role === 'admin';
        setSubscribed(isSubscribed);
        setChecking(false);

    }, [user, loading]);

    return { checking, subscribed };
}
