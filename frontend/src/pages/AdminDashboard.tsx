// frontend/src/pages/AdminDashboard.tsx
import React, { useState, useEffect } from 'react'
import { AdminUsers } from './AdminUsers'
import { AdminSubscriptions } from './AdminSubscriptions'
import {openChat} from "../components/components";

export function AdminDashboard({ onLogout }: { onLogout: () => void }) {
    // aba atual: "users" | "subscriptions"
    const [tab, setTab] = useState<'users' | 'subscriptions'>('users')

    return (
        <div className="h-full flex flex-col">
            {/* header */}
            <header className="bg-green-600 text-white px-6 py-4 flex items-center justify-between">
                <h1 className="text-xl font-bold">Painel Administrativo</h1>
                <button
                    onClick={onLogout}
                    className="underline hover:text-green-200"
                >
                    Sair
                </button>
                {/*<button*/}
                {/*    className="underline hover:text-green-200"*/}
                {/*    onClick={openChat}*/}
                {/*>*/}
                {/*    Chat*/}
                {/*</button>*/}
            </header>

            {/* abas */}
            <nav className="bg-green-50 p-4 flex gap-4">
                <button
                    onClick={() => setTab('users')}
                    className={`px-4 py-2 rounded ${
                        tab === 'users'
                            ? 'bg-green-600 text-white'
                            : 'bg-white text-green-600 shadow hover:bg-green-100'
                    }`}
                >
                    Usuários
                </button>
                <button
                    onClick={() => setTab('subscriptions')}
                    className={`px-4 py-2 rounded ${
                        tab === 'subscriptions'
                            ? 'bg-green-600 text-white'
                            : 'bg-white text-green-600 shadow hover:bg-green-100'
                    }`}
                >
                    Assinaturas
                </button>
            </nav>

            {/* conteúdo */}
            <main className="flex-1 overflow-auto bg-green-50 p-6">
                {tab === 'users' && <AdminUsers />}
                {tab === 'subscriptions' && <AdminSubscriptions />}
            </main>
        </div>
    )
}
