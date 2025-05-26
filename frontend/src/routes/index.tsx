// frontend/src/routes/index.tsx
import React, { ReactElement } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Login }           from '../pages/Login'
import { RecoverPassword } from '../pages/RecoverPassword'
import { Signup }          from '../pages/Signup'
import { Dashboard }       from '../pages/Dashboard'
import { Chat }            from '../pages/Chat'
import { AdminDashboard }  from '../pages/AdminDashboard'

export interface AppRoutesProps {
    /** Chamada após um login bem-sucedido */
    onLogin(): void
    /** Atualiza o papel do usuário */
    setUserRole(role: string): void
    /** Chamada ao clicar em “Sair” */
    onLogout(): void
    /** Está autenticado? */
    isAuth: boolean
    /** Papel do usuário (e.g. 'admin' ou 'user') */
    userRole: string | null
}

/**
 * Componente que centraliza TODAS as rotas da aplicação.
 */
export function AppRoutes({
                              onLogin,
                              onLogout,
                              isAuth,
                              setUserRole,
                              userRole
                          }: AppRoutesProps): ReactElement {
    return (
        <Routes>
            {/** Rota raiz — Dashboard */}
            <Route
                path="/"
                element={
                    isAuth && userRole ? (
                        <Dashboard onLogout={onLogout} userRole={userRole} />
                    ) : (
                        <Navigate to="/login" replace />
                    )
                }
            />

            {/** Páginas de autenticação */}
            <Route
                path="/login"
                element={
                    isAuth
                        ? <Navigate to="/" replace />
                        : <Login
                            onLogin={onLogin}
                            setUserRole={setUserRole}
                        />
                }
            />
            <Route
                path="/recover"
                element={
                    isAuth
                        ? <Navigate to="/" replace />
                        : <RecoverPassword />
                }
            />
            <Route
                path="/signup"
                element={
                    isAuth
                        ? <Navigate to="/" replace />
                        : <Signup />
                }
            />

            {/** Chat */}
            <Route
                path="/chat"
                element={
                    isAuth
                        ? <Chat onLogout={onLogout} />
                        : <Navigate to="/login" replace />
                }
            />

            {/** Painel Admin — só para role === 'admin' */}
            <Route
                path="/admin"
                element={
                    isAuth && userRole === 'admin'
                        ? <AdminDashboard onLogout={onLogout} />
                        : <Navigate to="/login" replace />
                }
            />
        </Routes>
    )
}
