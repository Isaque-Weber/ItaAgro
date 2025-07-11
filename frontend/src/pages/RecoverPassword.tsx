import React, { useState, useRef } from 'react'
import { useForm, SubmitHandler } from 'react-hook-form'
import { useNavigate, Link } from 'react-router-dom'

type EmailForm = { email: string }
type ResetForm = { code: string; newPassword: string; confirmPassword: string }

export function RecoverPassword() {
    const navigate = useNavigate()
    const [step, setStep] = useState<'request' | 'reset'>('request')
    const [email, setEmail] = useState('')


    // Novo: estado do código por dígito (array)
    const [code, setCode] = useState(['', '', '', '', '', ''])
    const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors, isSubmitting },
        watch,
    } = useForm<EmailForm & ResetForm>()

    // Integração para atualizar valor do campo 'code' no hook form
    React.useEffect(() => {
        setValue('code', code.join(''))
    }, [code, setValue])

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
            if (code.join('').length < 6) {
                alert('Informe o código de 6 dígitos.')
                return
            }
            try {
                const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/reset-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email,
                        code: code.join(''),
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

    // Lógica do input de código, igual ao VerifyEmail
    const handleCodeChange = (idx: number, value: string) => {
        if (!/^[0-9]?$/.test(value)) return;
        const newCode = [...code];
        newCode[idx] = value;
        setCode(newCode);
        if (value && idx < 5) inputRefs.current[idx + 1]?.focus();
        if (!value && idx > 0) inputRefs.current[idx - 1]?.focus();
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        const paste = e.clipboardData.getData('text').replace(/\D/g, '');
        if (paste.length === 6) {
            setCode(paste.split(''));
            inputRefs.current[5]?.focus();
        }
    };

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
                            <div className="flex gap-2 mb-1">
                                {code.map((digit, idx) => (
                                    <input
                                        key={idx}
                                        ref={el => { inputRefs.current[idx] = el; }}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        className="w-10 h-12 text-2xl text-center border rounded border-gray-300 dark:border-gray-600 focus:border-green-600 outline-none"
                                        value={digit}
                                        onChange={e => handleCodeChange(idx, e.target.value)}
                                        onPaste={handlePaste}
                                        autoFocus={idx === 0}
                                    />
                                ))}
                            </div>
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
                    {step === 'request'
                        ? (isSubmitting ? 'Enviando...' : 'Enviar e-mail')
                        : (isSubmitting ? 'Redefinindo...' : 'Redefinir Senha')}
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
