// src/pages/SuccessPage.tsx
import React, { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import {useAuth} from "../contexts/AuthContext";

interface SubscriptionInfo {
    id: string
    status: string
    next_payment_date?: string
    plan?: string
    // adicione outros campos que precisar
}

export function SuccessPage() {
    const [searchParams] = useSearchParams()
    const navigate       = useNavigate()
    const [loading, setLoading]     = useState(false)
    const [error, setError]         = useState<string|null>(null)
    const [info, setInfo]           = useState<SubscriptionInfo|null>(null)
    const { refreshUser } = useAuth()

    const subscriptionId = searchParams.get('preapproval_id')
        || searchParams.get('subscriptionId')
        || ''

    // 🚩 Troca GET por POST para /subscriptions/confirm
    useEffect(() => {
        if (!subscriptionId) return
        setLoading(true)
        fetch(
            `${import.meta.env.VITE_API_BASE_URL}/api/subscriptions/confirm`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ preapproval_id: subscriptionId })
            }
        )
            .then(res => res.json())
            .then(async (data: any) => {
                if (!data || ('error' in data)) throw new Error((data && data.error) || 'Erro inesperado')
                setInfo(data as SubscriptionInfo)
                await refreshUser?.()
            })
            .catch(err => {
                setError('Não foi possível confirmar sua assinatura. ' + (err?.message ?? ''))
            })
            .finally(() => setLoading(false))
    }, [subscriptionId])

    // Define o status real da assinatura
    const status = info?.status

    return (
        <main className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center p-4 transition-colors duration-300">
            <div className="max-w-md w-full bg-white dark:bg-gray-800 dark:text-white p-6 rounded-lg shadow-lg">
                {!subscriptionId ? (
                    <>
                        <h1 className="text-2xl font-semibold mb-4 text-center">Ops!</h1>
                        <p className="text-center">Não encontrei o ID da assinatura na URL.</p>
                        <button
                            onClick={() => navigate('/subscribe')}
                            className="mt-6 w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
                        >
                            Voltar aos Planos
                        </button>
                    </>
                ) : loading ? (
                    <p className="text-center">Carregando detalhes...</p>
                ) : error ? (
                    <>
                        <h1 className="text-2xl font-semibold mb-4 text-center">Pagamento não concluído</h1>
                        <p className="text-center text-red-500">{error}</p>
                        <button
                            onClick={() => navigate('/subscribe')}
                            className="mt-6 w-full py-2 bg-red-500 hover:bg-red-600 text-white rounded"
                        >
                            Tentar Novamente
                        </button>
                    </>
                ) : status !== 'authorized' && status !== 'active' ? (
                    <>
                        <h1 className="text-2xl font-semibold mb-4 text-center">Pagamento não concluído</h1>
                        <p className="text-center">
                            Seu pagamento não foi autorizado (status: <strong>{status}</strong>).
                        </p>
                        <button
                            onClick={() => navigate('/subscribe')}
                            className="mt-6 w-full py-2 bg-red-500 hover:bg-red-600 text-white rounded"
                        >
                            Tentar Novamente
                        </button>
                    </>
                ) : (
                    <>
                        <h1 className="text-2xl font-semibold mb-4 text-center">
                            🎉 Assinatura Confirmada!
                        </h1>
                        {info ? (
                            <div className="space-y-2">
                                <p><strong>ID:</strong> {info.id}</p>
                                <p><strong>Status:</strong> {info.status}</p>
                                {info.plan && (
                                    <p>
                                        <strong>Plano:</strong> {info.plan}
                                    </p>
                                )}
                                {info.next_payment_date && (
                                    <p>
                                        <strong>Próximo pagamento:</strong>{' '}
                                        {new Date(info.next_payment_date).toLocaleDateString()}
                                    </p>
                                )}
                            </div>
                        ) : (
                            <p className="text-center">Detalhes não disponíveis.</p>
                        )}
                        <button
                            onClick={() => navigate('/chat')}
                            className="mt-6 w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded"
                        >
                            Ir para o Chat
                        </button>
                    </>
                )}
            </div>
        </main>
    )
}
