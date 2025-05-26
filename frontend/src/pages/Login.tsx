import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface LoginProps {
    onLogin: () => void;
    setUserRole: (role: string) => void;
}

export function Login({ onLogin, setUserRole }: LoginProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            console.log('Enviando para:', `${import.meta.env.VITE_API_BASE_URL}/auth/login`);

            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/login`, {
                method: 'POST',
                credentials: 'include',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({email, password}),
            });

            const resBody = await res.json().catch(() => null);
            console.log('Resposta login:', res.status, resBody);

            if (!res.ok) {
                setError(resBody?.message || 'Credenciais inválidas');
                setLoading(false);
                return;
            }

            const meRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/me`, {
                credentials: 'include',
            });

            const meBody = await meRes.json().catch(() => null);
            console.log('Resposta /me:', meRes.status, meBody);

            if (meRes.ok) {
                setUserRole(meBody.role);
                onLogin();
                navigate('/');
            } else {
                setError(meBody?.message || 'Erro ao obter informações do usuário');
            }
        } catch (err) {
            console.error('Erro inesperado:', err);
            setError('Erro inesperado. Tente novamente.');
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <form
                onSubmit={handleSubmit}
                className="max-w-sm w-full bg-white p-6 rounded-lg shadow"
            >
                <h1 className="text-2xl font-semibold mb-6 text-center">Login</h1>

                <div className="mb-4">
                    <label className="block text-gray-700 mb-1">E-mail</label>
                    <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full px-3 py-2 border rounded focus:outline-none border-gray-300"
                        required
                    />
                </div>

                <div className="mb-6">
                    <label className="block text-gray-700 mb-1">Senha</label>
                    <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full px-3 py-2 border rounded focus:outline-none border-gray-300"
                        required
                        minLength={6}
                    />
                </div>

                {error && (
                    <p className="text-red-500 text-sm mb-4 text-center">{error}</p>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded disabled:opacity-50"
                >
                    {loading ? 'Entrando...' : 'Entrar'}
                </button>
            </form>
        </div>
    );
}
