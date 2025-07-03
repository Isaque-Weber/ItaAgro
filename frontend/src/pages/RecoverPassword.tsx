import React from 'react'
import { useForm, SubmitHandler } from 'react-hook-form'
import { useNavigate, Link } from 'react-router-dom'

type FormValues = { email: string }

export function RecoverPassword() {
    const navigate = useNavigate()
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>()

    const onSubmit: SubmitHandler<FormValues> = async ({ email }) => {
        console.log('onSubmit chamado com:', email);
        const url = `${import.meta.env.VITE_API_BASE_URL}/auth/recover`;
        console.log('URL chamada:', url);
        try {
            const res = await fetch(
                url,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email }),
                }
            )
            if (!res.ok) {
                let msg = 'Erro ao solicitar recuperação';
                try {
                    const data = await res.json();
                    msg = data?.message || msg;
                } catch {}
                // Exibe mensagem personalizada para e-mail não cadastrado
                alert(msg);
                return;
            }
            alert('Verifique seu e-mail para o link de recuperação.')
            navigate('/login')
        } catch (err: any) {
            console.error('Erro no onSubmit:', err);
            alert(err.message || 'Erro no servidor')
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 transition-colors duration-300">
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="max-w-sm w-full bg-white dark:bg-gray-800 dark:text-white p-6 rounded-lg shadow dark:shadow-lg"
            >
                <h1 className="text-2xl font-semibold mb-6 text-center">
                    Recuperar Senha
                </h1>

                <div className="mb-6">
                    <label className="block text-gray-700 dark:text-gray-200 mb-1">E-mail</label>
                    <input
                        type="email"
                        {...register('email', {
                            required: 'E-mail é obrigatório',
                            pattern: {
                                value: /^\S+@\S+$/i,
                                message: 'Formato de e-mail inválido',
                            },
                        })}
                        className={`w-full px-3 py-2 border rounded focus:outline-none dark:bg-gray-700 dark:text-white dark:border-gray-600 ${errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}`}
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
                    <Link to="/login" className="text-green-600 hover:underline dark:text-green-400">
                        Voltar ao login
                    </Link>
                </div>
            </form>
        </div>
    )
}
