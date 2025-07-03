import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function GoogleCallback() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { onLogin } = useAuth();

    useEffect(() => {
        const token = searchParams.get('token');
        const error = searchParams.get('error');

        if (error) {
            navigate('/login?error=' + error);
            return;
        }

        if (token) {
            // Salva o token
            localStorage.setItem('auth_token', token);
            // Chama onLogin que irá carregar as informações do usuário
            onLogin();
            navigate('/');
        } else {
            navigate('/login?error=No token received');
        }
    }, [searchParams, navigate, onLogin]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
                <p className="mt-4 text-gray-600 dark:text-gray-400">Autenticando...</p>
            </div>
        </div>
    );
}
