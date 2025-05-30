import React from 'react'
import { useNavigate } from 'react-router-dom'

interface DashboardProps {
    onLogout: () => void
    userRole: string
}

export function Dashboard({ onLogout, userRole }: DashboardProps) {
    const navigate = useNavigate()
    const services = [
        { label: 'Consultar Bula', question: 'Quero consultar a bula de um produto' },
        { label: 'Tabela de Preços', question: 'Me envie a tabela de preços atualizada' },
        { label: 'Análise de Solo', question: 'Preciso de ajuda com análise de solo' },
        { label: 'Ajuda sobre Produtos', question: 'Quais são os produtos recomendados para minha lavoura?' },
    ]

    return (
        <div className="flex flex-col min-h-screen bg-[#f1fdf5] dark:bg-gray-900">
            {/* Header */}
            <header className="bg-[#2e7d32] text-white p-5 flex justify-between items-center shadow">
                <h1 className="text-2xl font-bold tracking-wide">🌱 Ita Agro • Atendimento</h1>
                <button
                    onClick={onLogout}
                    className="text-sm underline hover:text-green-200 transition"
                >
                    Sair
                </button>
            </header>

            {/* Main */}
            <main className="flex-1 flex flex-col items-center justify-center px-4 py-10">
                <div className="w-full max-w-xl grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {services.map((btn) => (
                        <button
                            key={btn.label}
                            onClick={() => navigate(`/chat?question=${encodeURIComponent(btn.question)}`)}
                            className="
                w-full
                px-6 py-3
                bg-[#43a047] text-white
                rounded-lg
                font-medium text-lg
                hover:bg-[#388e3c]
                transition duration-200 shadow-md
                dark:bg-green-700 dark:hover:bg-green-600
              "
                        >
                            {btn.label}
                        </button>
                    ))}
                </div>

                {userRole === 'admin' && (
                    <div className="mt-8">
                        <button
                            onClick={() => navigate('/admin')}
                            className="
                px-6 py-3
                bg-[#43a047] text-white
                rounded-lg
                font-medium text-lg
                hover:bg-[#388e3c]
                transition duration-200 shadow-md
                dark:bg-green-700 dark:hover:bg-green-600
              "
                        >
                            Ir para Painel Admin
                        </button>
                    </div>
                )}
            </main>
        </div>
    )
}
