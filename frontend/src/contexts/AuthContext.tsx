// src/contexts/AuthContext.tsx
import React, {createContext, useState, useEffect, useContext, useMemo} from 'react';

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

    const isSeedUser = useMemo(() => {
        return user?.email === 'admin@itaagro.com' || user?.email === 'user@itaagro.com';
    }, [user?.email]);

    const loadUser = () => {
        fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/me`, {
            method: 'GET',
            credentials: 'include',
        })
            .then(async (res) => { // Tornando a função async
                if (!res.ok) {
                    // Se a resposta não for OK, verifica se é 401
                    if (res.status === 401) {
                        // Limpa o estado e redireciona para o login
                        setUser(null);
                        window.location.href = '/login'; 
                    }
                    throw new Error('Não autenticado');
                }
                return res.json();
            })
            .then((data: User) => {
                if (SEED_USERS.includes(data.email)) {
                    setUser({ ...data, emailVerified: true });
                } else {
                    setUser(data);
                }
            })
            .catch(() => {
                // O catch agora lida com outros erros de fetch, etc.
                setUser(null);
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadUser();
    }, []);

    const onLogin = () => {
        setLoading(true);
        loadUser();
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
