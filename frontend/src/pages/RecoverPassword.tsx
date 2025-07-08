import React, { useState } from 'react'
import { useForm, SubmitHandler } from 'react-hook-form'
import { useNavigate, Link } from 'react-router-dom'

type EmailForm = { email: string }
type ResetForm = { code: string; newPassword: string; confirmPassword: string }

export function RecoverPassword() {
    const navigate = useNavigate()
    const [step, setStep] = useState<'request' | 'reset'>('request')
    const [email, setEmail] = useState('')
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        watch,
    } = useForm<EmailForm & ResetForm>()

    const onSubmit: SubmitHandler<EmailForm & ResetForm> = async (data) => {
        if (step === 'request') {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/recover`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: data.email }),
                })
                if (!res.ok) {
                    const json = await res.json().catch(() => ({}))
                    alert(json?.message || 'Erro ao solicitar recuperação')
                    return
                }
                setEmail(data.email)
                setStep('reset')
            } catch (err: any) {
                alert(err.message || 'Erro no servidor')
            }
        }

        if (step === 'reset') {
            try {
                const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/reset-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email,
                        code: data.code,
                        newPassword: data.newPassword,
                    }),
                })
                const json = await res.json().catch(() => ({}))
                if (!res.ok) {
                    alert(json?.message || 'Erro ao redefinir senha')
                    return
                }
                alert('Senha redefinida com sucesso!')
                navigate('/login')
            } catch (err: any) {
                alert(err.message || 'Erro no servidor')
            }
        }
    }

    const password = watch('newPassword')

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 transition-colors duration-300">
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="max-w-sm w-full bg-white dark:bg-gray-800 dark:text-white p-6 rounded-lg shadow dark:shadow-lg"
            >
                <h1 className="text-2xl font-semibold mb-6 text-center">
                    {step === 'request' ? 'Recuperar Senha' : 'Redefinir Senha'}
                </h1>

                {step === 'request' && (
                    <div className="mb-6">
                        <label className="block text-gray-700 dark:text-gray-200 mb-1">E-mail</label>
                        <input
                            type="email"
                            {...register('email', {
                                required: 'E-mail é obrigatório',
                                pattern: { value: /^\S+@\S+$/, message: 'Formato de e-mail inválido' },
                            })}
                            className={`w-full px-3 py-2 border rounded focus:outline-none dark:bg-gray-700 dark:text-white ${errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                        />
                        {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
                    </div>
                )}

                {step === 'reset' && (
                    <>
                        <div className="mb-4">
                            <label className="block text-gray-700 dark:text-gray-200 mb-1">Código</label>
                            <input
                                type="text"
                                {...register('code', { required: 'Código é obrigatório' })}
                                className={`w-full px-3 py-2 border rounded focus:outline-none dark:bg-gray-700 dark:text-white ${errors.code ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                            />
                            {errors.code && <p className="text-red-500 text-sm mt-1">{errors.code.message}</p>}
                        </div>

                        <div className="mb-4">
                            <label className="block text-gray-700 dark:text-gray-200 mb-1">Nova Senha</label>
                            <input
                                type="password"
                                {...register('newPassword', {
                                    required: 'Senha é obrigatória',
                                    minLength: { value: 6, message: 'Mínimo 6 caracteres' },
                                })}
                                className={`w-full px-3 py-2 border rounded focus:outline-none dark:bg-gray-700 dark:text-white ${errors.newPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                            />
                            {errors.newPassword && <p className="text-red-500 text-sm mt-1">{errors.newPassword.message}</p>}
                        </div>

                        <div className="mb-6">
                            <label className="block text-gray-700 dark:text-gray-200 mb-1">Confirmar Senha</label>
                            <input
                                type="password"
                                {...register('confirmPassword', {
                                    validate: (value) => value === password || 'As senhas não coincidem',
                                })}
                                className={`w-full px-3 py-2 border rounded focus:outline-none dark:bg-gray-700 dark:text-white ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
                            />
                            {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>}
                        </div>
                    </>
                )}

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded disabled:opacity-50 mb-4"
                >
                    {step === 'request' ? (isSubmitting ? 'Enviando...' : 'Enviar e-mail') : (isSubmitting ? 'Redefinindo...' : 'Redefinir Senha')}
                </button>

                <div className="text-center text-sm">
                    <Link to="/login" className="text-green-600 hover:underline dark:text-green-400">
                        Voltar ao login
                    </Link>
                </div>
            </form>
        </div>
    )
}
