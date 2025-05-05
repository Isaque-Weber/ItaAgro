// frontend/src/pages/Dashboard.tsx
import React from 'react'
import { useNavigate } from 'react-router-dom'

interface DashboardProps {
  onLogout: () => void
}

export function Dashboard({ onLogout }: DashboardProps) {
  const navigate = useNavigate()

  const services = [
    { label: 'Consultar Bula',      path: '/products' },
    { label: 'Tabela de Preços',    path: '/pricing' },
    { label: 'Análise de Solo',     path: '/soil' },
    { label: 'Ajuda sobre Produtos',path: '/chat' },
  ]

  return (
    <div className="flex flex-col min-h-screen bg-green-50">
      {/* Header */}
      <header className="bg-green-600 text-white p-4 flex justify-between items-center">
        <h1 className="text-xl font-semibold">Ita Agro • Atendimento</h1>
        <button 
          onClick={onLogout} 
          className="underline hover:text-green-200 transition"
        >
          Sair
        </button>
      </header>

      {/* Main: card centralizado */}
      <main className="flex-1 flex justify-center items-start p-6">
        <div className="w-full max-w-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services.map((btn) => (
              <button
                key={btn.path}
                onClick={() => navigate(btn.path)}
                className="
                  w-full md:w-auto
                  px-6 py-3
                  bg-green-600 text-white
                  rounded-lg
                  hover:bg-green-700
                  transition duration-200
                "
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
