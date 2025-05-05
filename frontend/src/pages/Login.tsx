import React from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

type FormValues = {
    email: string;
    password: string;
};

interface LoginProps {
    onLogin: () => void;
}


export function Login({onLogin}: LoginProps) {
    const navigate = useNavigate();
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<FormValues>();

    const onSubmit: SubmitHandler<FormValues> = async ({ email, password }) => {
        try {
            console.log('Tentando logar com', email, password)

            const res = await fetch(
                `${import.meta.env.VITE_API_BASE_URL}/auth/login`,
                {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password }),
                }
            );
            if (!res.ok) throw new Error('Credenciais inválidas');
            console.log('Token salvo, navegando para /chat')
            onLogin()
            navigate('/');
        } catch (err: any) {
            alert(err.message || 'Erro ao fazer login');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="max-w-sm w-full bg-white p-6 rounded-lg shadow"
            >
                <h1 className="text-2xl font-semibold mb-6 text-center">Login</h1>

                <div className="mb-4">
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

                <div className="mb-6">
                    <label className="block text-gray-700 mb-1">Senha</label>
                    <input
                        type="password"
                        {...register('password', {
                            required: 'Senha é obrigatória',
                            minLength: {
                                value: 6,
                                message: 'Mínimo de 6 caracteres',
                            },
                        })}
                        className={`w-full px-3 py-2 border rounded focus:outline-none ${errors.password ? 'border-red-500' : 'border-gray-300'
                            }`}
                    />
                    {errors.password && (
                        <p className="text-red-500 text-sm mt-1">
                            {errors.password.message}
                        </p>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded disabled:opacity-50"
                >
                    {isSubmitting ? 'Entrando...' : 'Entrar'}
                </button>
            </form>
        </div>
    );
}
