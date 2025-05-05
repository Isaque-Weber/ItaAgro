// frontend/src/pages/RecoverPassword.tsx
import React from 'react'
import { useForm, SubmitHandler } from 'react-hook-form'
import { useNavigate, Link } from 'react-router-dom'

type FormValues = { email: string }

export function RecoverPassword() {
    const navigate = useNavigate()
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>()

    const onSubmit: SubmitHandler<FormValues> = async ({ email }) => {
        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_BASE_URL}/auth/recover`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email }),
                }
            )
            if (!res.ok) throw new Error('Erro ao solicitar recuperação')
            alert('Verifique seu e-mail para o link de recuperação.')
            navigate('/login')
        } catch (err: any) {
            alert(err.message || 'Erro no servidor')
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="max-w-sm w-full bg-white p-6 rounded-lg shadow"
            >
                <h1 className="text-2xl font-semibold mb-6 text-center">
                    Recuperar Senha
                </h1>

                <div className="mb-6">
                    <label className="block text-gray-700 mb-1">E-mail</label>
                    <input
                        type="email"
                        {...register('email', {
                            required: 'E-mail é obrigatório',
                            pattern: {
                                value: /^\S+@\S+$/i,
                                message: 'Formato de e-mail inválido',
                            },
                        })}
                        className={`w-full px-3 py-2 border rounded focus:outline-none ${errors.email ? 'border-red-500' : 'border-gray-300'
                            }`}
                    />
                    {errors.email && (
                        <p className="text-red-500 text-sm mt-1">
                            {errors.email.message}
                        </p>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded disabled:opacity-50 mb-4"
                >
                    {isSubmitting ? 'Enviando...' : 'Enviar e-mail'}
                </button>

                <div className="text-center text-sm">
                    <Link to="/login" className="text-green-600 hover:underline">
                        Voltar ao login
                    </Link>
                </div>
            </form>
        </div>
    )
}
