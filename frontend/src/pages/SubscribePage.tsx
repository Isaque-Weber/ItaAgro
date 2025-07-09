// frontend/src/pages/SubscribePage.tsx
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {useAuth} from "../contexts/AuthContext"

interface Plan {
  id: string
  reason: string
  transaction_amount: number
  frequency_type: 'months'
  frequency: number
  repetitions?: number
}

export function SubscribePage() {
  const navigate = useNavigate()
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { onLogout } = useAuth();

  useEffect(() => {
    fetchPlans()
  }, [])

  async function fetchPlans() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/plans`,
          { credentials: 'include' }
      )
      if (res.status === 401) {
        setError('Sua sessão expirou. Faça login novamente.')
        return
      }
      if (!res.ok) {
        setError(`Falha ao buscar planos (status ${res.status})`)
        return
      }
      setPlans(await res.json())
    } catch (err: any) {
      console.error('Error fetching plans:', err)
      setError(err.message || 'Erro ao carregar planos')
    } finally {
      setLoading(false)
    }
  }

  function formatCurrency(value: number) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  function formatPlanDescription(plan: Plan) {
    const price = formatCurrency(plan.transaction_amount)
    if (plan.repetitions) {
      return `${price}/mês por ${plan.repetitions} meses`
    }
    return `${price}/mês`
  }

  return (
      <main className="min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col items-center p-4 transition-colors duration-300">
        <header className="w-full max-w-4xl flex justify-between items-center mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
            Planos de Assinatura
          </h1>
          <div className="space-x-2">
            <button
                onClick={() => navigate(-1)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition"
            >
              Voltar
            </button>
            <button
                onClick={onLogout}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded transition"
            >
              Sair
            </button>
          </div>
        </header>

        {error && (
            <div className="w-full max-w-4xl bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 p-4 rounded-md mb-6 flex justify-between items-center">
              <p>{error}</p>
              <button
                  onClick={fetchPlans}
                  className="ml-4 px-3 py-1 bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200 rounded-md hover:bg-red-300 dark:hover:bg-red-700 transition text-sm"
              >
                Tentar Novamente
              </button>
            </div>
        )}

        {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-gray-600 dark:text-gray-400">
                Carregando planos...
              </p>
            </div>
        ) : (
            <div className="w-full max-w-4xl grid gap-6 grid-cols-1 md:grid-cols-2">
              {plans.length === 0 ? (
                  <p className="text-center col-span-full text-gray-600 dark:text-gray-400">
                    Nenhum plano disponível no momento.
                  </p>
              ) : (
                  plans.map(plan => {
                    const description = formatPlanDescription(plan)
                    const total =
                        plan.repetitions
                            ? formatCurrency(plan.transaction_amount * plan.repetitions)
                            : null
                    const href = `https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=${plan.id}`

                    return (
                        <div
                            key={plan.id}
                            className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 p-6 rounded-lg shadow-md dark:shadow-lg flex flex-col justify-between"
                        >
                          <div>
                            <h2 className="text-xl font-semibold mb-2">
                              {plan.reason}
                            </h2>
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                              {description}
                            </p>
                            {total && (
                                <p className="text-gray-600 dark:text-gray-400">
                                  Total: {total}
                                </p>
                            )}
                          </div>
                          {/* Injetar name via any para o script do Mercado Pago */}
                          <a
                              {...({ name: 'MP-payButton' } as any)}
                              href={href}
                              className="mt-4 inline-block text-center w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition"
                          >
                            Assinar
                          </a>
                        </div>
                    )
                  })
              )}
            </div>
        )}
      </main>
  )
}
