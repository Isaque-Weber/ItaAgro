import React, {createContext, useState, useEffect, useContext, useMemo} from 'react';
import { useLocation } from 'react-router-dom';

interface User {
    sub: string;
    email: string;
    role: 'user' | 'admin';
    emailVerified: boolean;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    onLogin: () => void;
    onLogout: () => void;
    isSeedUser: boolean;
    setUserRole: (role: 'user' | 'admin') => void;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    isSeedUser: false,
    onLogin: () => {},
    onLogout: () => {},
    setUserRole: () => {},
});


export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const SEED_USERS = ['admin@itaagro.com', 'user@itaagro.com'];
    const location = useLocation();

    const isSeedUser = useMemo(() => {
        return user?.email === 'admin@itaagro.com' || user?.email === 'user@itaagro.com';
    }, [user?.email]);

    const loadUser = (): Promise<void> => {
        return new Promise((resolve, reject) => {
            fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/me`, {
                method: 'GET',
                credentials: 'include',
            })
                .then(async (res) => {
                    if (!res.ok) {
                        if (res.status === 401) {
                            setUser(null);
                            window.location.href = '/login';
                        }
                        reject(new Error('Não autenticado'));
                        return;
                    }
                    return res.json();
                })
                .then((data: User) => {
                    if (SEED_USERS.includes(data.email)) {
                        setUser({ ...data, emailVerified: true });
                    } else {
                        setUser(data);
                    }
                    resolve();
                })
                .catch((err) => {
                    setUser(null);
                    reject(err);
                })
                .finally(() => setLoading(false));
        });
    };

    useEffect(() => {
        const isLoginPage = location.pathname === '/login';
        const isRecoverPage = location.pathname === '/recover';
        const isSignupPage = location.pathname === '/signup';

        if (isLoginPage || isRecoverPage || isSignupPage) {
            setLoading(false);
        } else {
            loadUser().catch(() => {
                // O erro já é tratado em loadUser, que redireciona para /login
            });
        }
    }, [location.pathname]);

    const onLogin = async (): Promise<void> => {
        setLoading(true);
        try {
            await loadUser();
        } catch (error) {
            // O erro já é tratado em loadUser, mas podemos logar se quisermos
            console.error("Falha no processo de login", error);
            throw error; // Re-lança para que a página de login possa saber que falhou
        }
    };

    const onLogout = async () => {
        await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/logout`, {
            method: 'POST',
            credentials: 'include',
        });
        setUser(null);
    };

    const setUserRole = (role: 'user' | 'admin') => {
        if (user) {
            setUser({ ...user, role });
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, onLogin, onLogout, isSeedUser, setUserRole }}>
            {children}
        </AuthContext.Provider>
    );
};

export function useUser() {
    return useContext(AuthContext);
}

export function useAuth() {
    return useContext(AuthContext);
}
