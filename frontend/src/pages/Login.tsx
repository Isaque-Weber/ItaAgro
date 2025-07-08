import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import logoImg from '../assets/logo-removebg-preview.png'

interface LoginProps {
    onLogin: () => void
    setUserRole: (role: string) => void
}

export function Login({ onLogin, setUserRole }: LoginProps) {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/login`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            })

            const resBody = await res.json().catch(() => null)

            if (!res.ok) {
                setError(resBody?.message || 'Credenciais inválidas')
                setLoading(false)
                return
            }

            if (resBody?.token) {
                localStorage.setItem('auth_token', resBody.token)
                console.log('[Login] Token salvo no localStorage')
            }

            const meRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/me`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Authorization': resBody?.token ? `Bearer ${resBody.token}` : ''
                }
            })

            const meBody = await meRes.json().catch(() => null)
            console.log('[Login] /auth/me response:', meBody)

            if (meRes.ok && meBody?.role) {
                setUserRole(meBody.role)
                onLogin()
                navigate('/')
            } else {
                setError(meBody?.message || 'Erro ao obter informações do usuário')
            }

        } catch (err) {
            console.error('[Login] Erro inesperado:', err)
            setError('Erro inesperado. Tente novamente.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <main className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 transition-colors duration-300">
            <form
                onSubmit={handleSubmit}
                className="max-w-sm w-full bg-white dark:bg-gray-800 dark:text-white p-6 rounded-lg shadow dark:shadow-lg"
            >
                <div className="flex justify-center mb-4">
                    <img src={logoImg} alt="ItaAgro Logo" className="h-40 mx-auto" style={{ filter: 'drop-shadow(0 0 25px #0008)' }} />
                </div>
                <h1 className="text-2xl font-semibold mb-6 text-center">Login</h1>

                <div className="mb-4">
                    <label className="block text-gray-700 dark:text-gray-200 mb-1">E-mail</label>
                    <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        className="w-full px-3 py-2 border rounded focus:outline-none border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        required
                    />
                </div>

                <div className="mb-2">
                    <label className="block text-gray-700 dark:text-gray-200 mb-1">Senha</label>
                    <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full px-3 py-2 border rounded focus:outline-none border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        required
                        minLength={6}
                    />
                </div>

                <div className="text-right mb-4">
                    <Link to="/recover" className="text-sm text-blue-600 hover:underline">
                        Esqueci minha senha
                    </Link>
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

                <div className="mt-4 flex justify-center text-sm">
                    <span className="text-gray-600 dark:text-gray-300">Ainda não tem conta? </span>
                    <Link to="/signup" className="ml-1 text-green-600 hover:underline">
                        Cadastre-se
                    </Link>
                </div>
            </form>
        </main>
    )
}
