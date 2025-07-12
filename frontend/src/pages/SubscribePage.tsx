// frontend/src/pages/SubscribePage.tsx
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from "../contexts/AuthContext"

interface Plan {
  id: string
  reason: string
  transaction_amount: number
  frequency_type: 'months'
  frequency: number
  repetitions?: number
  init_point?: string
}

export function SubscribePage() {
  const navigate = useNavigate()
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { onLogout } = useAuth();

  useEffect(() => {
    fetchPlans()
    // eslint-disable-next-line
  }, [])

  async function fetchPlans() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/plans`,
          { credentials: 'include' }
      )
      if (!res.ok) {
        setError(`Falha ao buscar planos (status ${res.status})`)
        return
      }
      setPlans(await res.json())
    } catch (err: any) {
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
      <main className="
      min-h-screen bg-gray-100 dark:bg-gray-900 flex flex-col items-center
      p-2 sm:p-4 transition-colors duration-300
    ">
        {/* Header responsivo */}
        <header className="
        w-full max-w-4xl flex flex-col sm:flex-row justify-between items-center
        mb-4 sm:mb-6 pb-2 sm:pb-4 border-b border-gray-200 dark:border-gray-700
      ">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2 sm:mb-0 text-center sm:text-left">
            Planos de Assinatura
          </h1>
          <div className="flex flex-row gap-2">
            <button
                onClick={() => navigate(-1)}
                className="
              px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200
              rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition w-full sm:w-auto
            "
            >
              Voltar
            </button>
            <button
                onClick={onLogout}
                className="
              px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded transition w-full sm:w-auto
            "
            >
              Sair
            </button>
          </div>
        </header>

        {error && (
            <div className="
          w-full max-w-4xl bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200
          p-3 sm:p-4 rounded-md mb-6 flex flex-col sm:flex-row justify-between items-center
        ">
              <p>{error}</p>
              <button
                  onClick={fetchPlans}
                  className="
              mt-2 sm:mt-0 sm:ml-4 px-3 py-1 bg-red-200 dark:bg-red-800
              text-red-800 dark:text-red-200 rounded-md
              hover:bg-red-300 dark:hover:bg-red-700 transition text-sm
            "
              >
                Tentar Novamente
              </button>
            </div>
        )}

        {loading ? (
            <div className="flex-1 flex items-center justify-center w-full">
              <p className="text-gray-600 dark:text-gray-400">
                Carregando planos...
              </p>
            </div>
        ) : (
            <div className="
          w-full max-w-4xl grid gap-4 sm:gap-6
          grid-cols-1 sm:grid-cols-2
        ">
              {plans.length === 0 ? (
                  <p className="text-center col-span-full text-gray-600 dark:text-gray-400">
                    Nenhum plano disponível no momento.
                  </p>
              ) : (
                  plans.map(plan => {
                    const description = formatPlanDescription(plan)
                    const total = plan.repetitions
                        ? formatCurrency(plan.transaction_amount * plan.repetitions)
                        : null
                    const href = plan.init_point
                        ? plan.init_point
                        : `https://www.mercadopago.com.br/subscriptions/checkout?preapproval_plan_id=${plan.id}`

                    return (
                        <div
                            key={plan.id}
                            className="
                    bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100
                    p-4 sm:p-6 rounded-lg shadow-md dark:shadow-lg
                    flex flex-col justify-between min-w-0
                  "
                        >
                          <div>
                            <h2 className="text-lg sm:text-xl font-semibold mb-2">
                              {plan.reason}
                            </h2>
                            <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400 mb-1">
                              {description}
                            </p>
                            {total && (
                                <p className="text-gray-600 dark:text-gray-400">
                                  Total: {total}
                                </p>
                            )}
                          </div>
                          <a
                              {...({ name: 'MP-payButton' } as any)}
                              href={href}
                              className="
                      mt-4 inline-block text-center w-full py-3
                      bg-blue-600 hover:bg-blue-700 text-white
                      font-medium rounded-md transition
                      text-base sm:text-lg
                    "
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
