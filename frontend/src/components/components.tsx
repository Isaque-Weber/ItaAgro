import React from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'

const navigate = useNavigate()
interface LayoutProps {
  onLogout: () => void
  userRole: string | null
}

export function openChat(){
  navigate('/chat')
}

export function Layout({ onLogout, userRole }: LayoutProps) {

  const handleLogout = () => {
    onLogout()
    navigate('/login')
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Cabeçalho com menu */}
      <header className="bg-green-600 text-white p-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold">ItaAgro</h1>
        <nav className="space-x-4">
          <NavLink
            to="/"
            className={({ isActive }) =>
              isActive ? 'underline' : 'hover:underline'
            }
          >
            Início
          </NavLink>
          <NavLink to="/admin" className="...">
            Admin
          </NavLink>
          <NavLink
            to="/chat"
            className={({ isActive }) =>
              isActive ? 'underline' : 'hover:underline'
            }
          >
            Chat
          </NavLink>
          {userRole === 'admin' && (
            <NavLink
              to="/admin/users"
              className={({ isActive }) =>
                isActive ? 'underline' : 'hover:underline'
              }
            >
              Usuários
            </NavLink>
          )}
        </nav>
        <button onClick={handleLogout} className="hover:text-green-200">
          Sair
        </button>
      </header>

      {/* Conteúdo principal */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
