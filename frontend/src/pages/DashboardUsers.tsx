import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUserPlan } from "../hooks/useUserPlan";
import UserPlanDebug from '../components/UserPlanDebug';

interface DashboardUsersProps {
    onLogout: () => void
}

export default function DashboardUsers({ onLogout }: DashboardUsersProps) {
    const navigate = useNavigate()
    const { data, loading, error } = useUserPlan()
    const [showDebug, setShowDebug] = useState(false)

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            <header className="bg-green-600 text-white p-4 flex justify-between items-center shadow">
                <h1 className="text-xl font-bold">🌱 ItaAgro • Meu Plano</h1>
                <button
                    onClick={onLogout}
                    className="text-sm underline hover:text-green-200 transition"
                >
                    Sair
                </button>
            </header>

            <main className="max-w-3xl mx-auto px-6 py-10">
                <section className="bg-white dark:bg-[#1f1f1f] p-6 rounded-lg shadow">
                    <h2 className="text-2xl font-bold mb-4">Informações do Plano</h2>
                    {loading && <div className="text-gray-500">Carregando...</div>}
                    {error && <div className="text-red-500">{error}</div>}
                    {data && (
                        <ul className="space-y-2 text-sm">
                            <li>👤 Nome: {data.name}</li>
                            <li>📧 E-mail: {data.email}</li>
                            <li>💳 Plano atual: {data.planName}</li>
                            <li>📆 Validade: até {formatDate(data.endDate)}</li>
                            <li>📈 Limite de perguntas: {data.limit ?? 'Ilimitado'}/mês</li>
                        </ul>
                    )}
                </section>

                <div className="mt-6 flex justify-between">
                    <button
                        onClick={() => navigate('/chat')}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                    >
                        Voltar para o Chat
                    </button>

                    <button
                        onClick={() => setShowDebug(!showDebug)}
                        className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
                    >
                        {showDebug ? 'Esconder Debug' : 'Mostrar Debug'}
                    </button>
                </div>

                {showDebug && (
                    <div className="mt-6">
                        <UserPlanDebug />
                    </div>
                )}
            </main>
        </div>
    )
}

function formatDate(dateStr?: string) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR');
}
