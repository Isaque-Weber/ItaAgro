// src/pages/SuccessPage.tsx
import React, { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'

interface SubscriptionInfo {
    id: string
    status: string
    next_payment_date?: string
    // adicione outros campos que precisar
}

export function SuccessPage() {
    const [searchParams] = useSearchParams()
    const navigate       = useNavigate()
    const [loading, setLoading]     = useState(false)
    const [error, setError]         = useState<string|null>(null)
    const [info, setInfo]           = useState<SubscriptionInfo|null>(null)

    const subscriptionId = searchParams.get('preapproval_id')
        || searchParams.get('subscriptionId')
        || ''

    const statusParam = searchParams.get('status')  // por exemplo 'authorized'

    // Opcional: buscar detalhes no backend
    useEffect(() => {
        if (!subscriptionId) return
        setLoading(true)
        fetch(
            `${import.meta.env.VITE_API_BASE_URL}/api/subscriptions/${subscriptionId}`,
            { credentials: 'include' }
        )
            .then(res => {
                if (!res.ok) throw new Error(`Status ${res.status}`)
                return res.json()
            })
            .then((data: SubscriptionInfo) => {
                setInfo(data)
            })
            .catch(err => {
                console.error(err)
                setError('Não foi possível carregar os detalhes da assinatura.')
            })
            .finally(() => setLoading(false))
    }, [subscriptionId])

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
                ) : statusParam !== 'authorized' && statusParam !== 'pending' ? (
                    <>
                        <h1 className="text-2xl font-semibold mb-4 text-center">Pagamento não concluído</h1>
                        <p className="text-center">
                            Seu pagamento não foi autorizado (status: <strong>{statusParam}</strong>).
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
                        {loading ? (
                            <p className="text-center">Carregando detalhes...</p>
                        ) : error ? (
                            <p className="text-center text-red-500">{error}</p>
                        ) : info ? (
                            <div className="space-y-2">
                                <p><strong>ID:</strong> {info.id}</p>
                                <p><strong>Status:</strong> {info.status}</p>
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
                            onClick={() => navigate('/')}
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
