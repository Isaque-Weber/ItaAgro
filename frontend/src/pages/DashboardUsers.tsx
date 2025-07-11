import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUserPlan } from "../hooks/useUserPlan"
import UserPlanDebug from '../components/UserPlanDebug'
import {useAuth} from "../contexts/AuthContext"
import {useDarkMode} from "../contexts/DarkModeContext"
import logoImg from '../assets/logo-removebg-preview.png'

export default function DashboardUsers() {
    const navigate = useNavigate()
    const { data, loading, error } = useUserPlan()
    const [showDebug, setShowDebug] = useState(false)
    const { onLogout } = useAuth()
    const [showCancelModal, setShowCancelModal] = useState(false)
    const { darkMode, toggleDarkMode } = useDarkMode()

    async function handleCancelPlan() {
        if (!data?.planId) return alert('Assinatura não encontrada!')
        if (!window.confirm('Tem certeza que deseja cancelar sua assinatura?')) return
        try {
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/subscriptions/cancel`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ preapproval_id: data.planId }) // ou o ID externo correto
            })
            if (!res.ok) throw new Error('Erro ao cancelar')
            alert('Assinatura cancelada com sucesso!')
            window.location.reload()
        } catch (err: any) {
            alert('Erro ao cancelar: ' + err.message)
        }
    }


    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            <header className="bg-green-600 text-white p-4 shadow relative">
                <div className="flex items-center justify-between">
                    <button
                        onClick={onLogout}
                        className="text-sm underline hover:text-green-200 transition"
                    >
                        Sair
                    </button>

                    <div className="flex items-center">
                        <img
                            src={logoImg}
                            alt="ItaAgro Logo"
                            className="h-8 mr-2"
                            style={{ filter: 'drop-shadow(0 0 15px #0008)' }}
                        />
                        <h1 className="text-lg font-semibold">ItaAgro • Meu Plano</h1>
                    </div>

                    <button
                        onClick={toggleDarkMode}
                        className="text-white text-sm"
                    >
                        {darkMode ? '☀️' : '🌙'}
                    </button>
                </div>
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
                            <li>💳 Plano atual: {data.plan}</li>
                            <li>
                                📆 Validade: {data.endDate
                                ? `até ${formatDate(data.endDate)}`
                                : <span className="text-gray-500">Unlimited</span>}
                            </li>
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

                    {/*<button*/}
                    {/*    onClick={() => setShowDebug(!showDebug)}*/}
                    {/*    className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition"*/}
                    {/*>*/}
                    {/*    {showDebug ? 'Esconder Debug' : 'Mostrar Debug'}*/}
                    {/*</button>*/}

                    <button
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition"
                        onClick={() => setShowCancelModal(true)}
                    >
                        Cancelar Plano
                    </button>

                    {showCancelModal && (
                        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/40">
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-xs">
                                <h2 className="text-lg font-bold mb-2 text-center text-red-600">Cancelar assinatura?</h2>
                                <p className="text-center mb-6 text-gray-700 dark:text-gray-300">
                                    Tem certeza que deseja cancelar sua assinatura? Esta ação é irreversível.
                                </p>
                                <div className="flex gap-4">
                                    <button
                                        className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded transition"
                                        onClick={() => setShowCancelModal(false)}
                                    >
                                        Voltar
                                    </button>
                                    <button
                                        className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded transition"
                                        onClick={async () => {
                                            setShowCancelModal(false)
                                            await handleCancelPlan()
                                        }}
                                    >
                                        Cancelar Plano
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

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
    if (!dateStr) return '-'
    const d = new Date(dateStr)
    return d.toLocaleDateString('pt-BR')
}
