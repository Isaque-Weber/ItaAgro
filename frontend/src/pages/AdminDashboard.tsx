import React, { useState } from 'react'
import { AdminUsers } from './AdminUsers'
import { AdminSubscriptions } from './AdminSubscriptions'

export function AdminDashboard({ onLogout }: { onLogout: () => void }) {
    const [tab, setTab] = useState<'users' | 'subscriptions'>('users')

    return (
        <div className="h-full flex flex-col dark:bg-gray-900 dark:text-white transition-colors duration-300">
            {/* header */}
            <header className="bg-green-600 text-white px-6 py-4 flex items-center justify-between">
                <h1 className="text-xl font-bold">Painel Administrativo</h1>
                <div className="flex gap-4 items-center">
                    <button
                        onClick={onLogout}
                        className="underline hover:text-green-200"
                    >
                        Sair
                    </button>
                </div>
            </header>

            {/* abas */}
            <nav className="bg-green-50 dark:bg-gray-800 p-4 flex gap-4 transition-colors">
                <button
                    onClick={() => setTab('users')}
                    className={`px-4 py-2 rounded transition-colors ${
                        tab === 'users'
                            ? 'bg-green-600 text-white'
                            : 'bg-white dark:bg-gray-700 text-green-600 dark:text-green-300 shadow hover:bg-green-100 dark:hover:bg-gray-600'
                    }`}
                >
                    Usuários
                </button>
                <button
                    onClick={() => setTab('subscriptions')}
                    className={`px-4 py-2 rounded transition-colors ${
                        tab === 'subscriptions'
                            ? 'bg-green-600 text-white'
                            : 'bg-white dark:bg-gray-700 text-green-600 dark:text-green-300 shadow hover:bg-green-100 dark:hover:bg-gray-600'
                    }`}
                >
                    Assinaturas
                </button>
            </nav>

            {/* conteúdo */}
            <main className="flex-1 overflow-auto bg-green-50 dark:bg-gray-900 p-6 transition-colors">
                {tab === 'users' && <AdminUsers />}
                {tab === 'subscriptions' && <AdminSubscriptions />}
            </main>
        </div>
    )
}
