// frontend/src/pages/Signup.tsx
import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from "../contexts/AuthContext"

interface SignupForm {
    name: string
    email: string
    password: string
}

export function Signup() {
    const navigate = useNavigate()
    const [form, setForm] = useState<SignupForm>({
        name: '',
        email: '',
        password: '',
    })
    const [acceptedTerms, setAcceptedTerms] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const { onLogin, setUserRole } = useAuth()

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        if (!acceptedTerms) {
            setError("Você deve aceitar os Termos de Uso e a Política de Privacidade.")
            return
        }

        setLoading(true)
        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_BASE_URL}/auth/signup`,
                {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(form),
                }
            )
            if (!res.ok) {
                const body = await res.json()
                throw new Error(body.message || `Erro ${res.status}`)
            }

            setLoading(false)
            navigate('/verify-email?afterSignup=1&email=' + encodeURIComponent(form.email))
        } catch (err: any) {
            setError(err.message ?? 'Falha ao cadastrar')
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
            <form
                onSubmit={handleSubmit}
                className="max-w-md w-full bg-white dark:bg-gray-800 p-6 rounded shadow-md space-y-4"
            >
                <h1 className="text-2xl font-semibold text-center text-gray-900 dark:text-gray-100">
                    Criar Conta
                </h1>

                {error && (
                    <div className="text-red-600 dark:text-red-400 text-sm">
                        {error}
                    </div>
                )}

                <input
                    name="name"
                    type="text"
                    placeholder="Nome completo"
                    value={form.name}
                    onChange={handleChange}
                    required
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                />

                <input
                    name="email"
                    type="email"
                    placeholder="Email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                />

                <input
                    name="password"
                    type="password"
                    placeholder="Senha"
                    value={form.password}
                    onChange={handleChange}
                    required
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500"
                />

                <div className="text-sm text-gray-700 dark:text-gray-300 flex items-start space-x-2">
                    <input
                        type="checkbox"
                        id="acceptTerms"
                        checked={acceptedTerms}
                        onChange={e => setAcceptedTerms(e.target.checked)}
                        className="mt-1"
                        required
                    />
                    <label htmlFor="acceptTerms">
                        Eu li e concordo com os{' '}
                        <Link to="/termos" target="_blank" className="underline text-blue-600 dark:text-blue-400">
                            Termos de Uso
                        </Link>{' '}
                        e a{' '}
                        <Link to="/privacidade" target="_blank" className="underline text-blue-600 dark:text-blue-400">
                            Política de Privacidade
                        </Link>.
                    </label>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-2 rounded text-white ${
                        loading
                            ? 'bg-gray-400 dark:bg-gray-600'
                            : 'bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800'
                    }`}
                >
                    {loading ? 'Cadastrando...' : 'Criar Conta e Ver Planos'}
                </button>

                <p className="text-sm text-center text-gray-700 dark:text-gray-300">
                    Já tem conta?{' '}
                    <Link
                        to="/login"
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                        Entrar
                    </Link>
                </p>
            </form>
        </div>
    )
}
