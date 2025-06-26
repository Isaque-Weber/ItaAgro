// frontend/src/pages/Signup.tsx
import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'

interface SignupForm {
    name: string
    email: string
    password: string
}

interface SignupProps {
    onLogin(): void
    setUserRole(role: string): void
}

export function Signup({ onLogin, setUserRole }: SignupProps) {
    const navigate = useNavigate()
    const [form, setForm] = useState<SignupForm>({
        name: '',
        email: '',
        password: '',
    })
    const [error, setError] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setLoading(true)
        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_BASE_URL}/auth/signup`,
                {
                    method: 'POST',
                    credentials: 'include', // para receber cookie HttpOnly
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(form),
                }
            )
            if (!res.ok) {
                const body = await res.json()
                throw new Error(body.message || `Erro ${res.status}`)
            }

            const data = (await res.json()) as { token: string; role: string }

            // 1) Atualiza o estado de autenticação no App.tsx
            onLogin()
            setUserRole(data.role)

            // 2) Redireciona para a página de planos
            navigate('/subscribe')
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
                <h1 className="text-2xl font-semibold text-center">Criar Conta</h1>

                {error && <div className="text-red-600 text-sm">{error}</div>}

                <input
                    name="name"
                    type="text"
                    placeholder="Nome completo"
                    value={form.name}
                    onChange={handleChange}
                    required
                    className="w-full p-2 border rounded"
                />

                <input
                    name="email"
                    type="email"
                    placeholder="Email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    className="w-full p-2 border rounded"
                />

                <input
                    name="password"
                    type="password"
                    placeholder="Senha"
                    value={form.password}
                    onChange={handleChange}
                    required
                    className="w-full p-2 border rounded"
                />

                <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-2 rounded text-white ${
                        loading ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'
                    }`}
                >
                    {loading ? 'Cadastrando...' : 'Criar Conta e Ver Planos'}
                </button>

                <p className="text-sm text-center">
                    Já tem conta?{' '}
                    <Link to="/login" className="text-blue-600 hover:underline">
                        Entrar
                    </Link>
                </p>
            </form>
        </div>
    )
}
