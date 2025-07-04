// frontend/src/routes/index.tsx
import React, { ReactElement } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Login }           from '../pages/Login'
import { RecoverPassword } from '../pages/RecoverPassword'
import { Signup }          from '../pages/Signup'
import { Chat }            from '../pages/Chat'
import { AdminDashboard }  from '../pages/AdminDashboard'
import DashboardUsers from "../pages/DashboardUsers"
import { SubscribePage }   from '../pages/SubscribePage'
import { SuccessPage }   from '../pages/SuccessPage'
import {ProtectedRoute} from "../components/ProtectedRoute"
import { GoogleCallback } from '../pages/GoogleCallback'
import VerifyEmail from '../pages/VerifyEmail'

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
    userRole,
}: AppRoutesProps): ReactElement {
    return (
        <Routes>
            {/* Rota raiz — Chat */}
            <Route
                path="/"
                element={
                    isAuth && (userRole === 'admin' || userRole === 'user')
                        ? <Navigate to="/chat" replace />
                        : <Navigate to="/login" replace />
                }
            />

            {/* Páginas de autenticação */}
            <Route
                path="/login"
                element={
                    isAuth && (userRole === 'admin' || userRole === 'user')
                        ? <Navigate to="/chat" replace />
                        : <Login
                            onLogin={onLogin}
                            setUserRole={setUserRole}
                        />
                }
            />
            <Route
                path="/recover"
                element={
                    isAuth && (userRole === 'admin' || userRole === 'user')
                        ? <Navigate to="/" replace />
                        : <RecoverPassword />
                }
            />
            <Route
                path="/signup"
                element={
                    isAuth && (userRole === 'admin' || userRole === 'user')
                        ? <Navigate to="/" replace />
                        : <Signup
                            onLogin={onLogin}
                            setUserRole={setUserRole}
                        />
                }
            />
            <Route
                path="/verify-email"
                element={
                    isAuth && (userRole === 'admin' || userRole === 'user')
                        ? <Navigate to="/" replace />
                        : <VerifyEmail />
                }
            />

            {/** Chat */}
            <Route
                path="/chat"
                element={
                    isAuth && (userRole === 'admin' || userRole === 'user')
                        ? <ProtectedRoute>
                            <Chat onLogout={onLogout} userRole={userRole as 'admin' | 'user'} />
                        </ProtectedRoute>
                        : <Navigate to="/login" replace />
                }
            />

            {/* Página de Assinatura */}
            <Route
                path="/subscribe"
                element={
                    isAuth
                        ? <SubscribePage onLogout={onLogout} />
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
            <Route
                path="/user/plan"
                element={
                    isAuth && userRole === 'user'
                        ? <DashboardUsers onLogout={onLogout} />
                        : <Navigate to="/login" replace />
                }
            />
            <Route path="/subscribe/success" element={<SuccessPage />} />
            <Route path="/auth/google/callback" element={<GoogleCallback />} />
            {/* rota catch-all / home / dashboard */}
            <Route path="*" element={<Navigate to={isAuth ? "/" : "/login"} replace />} />
        </Routes>
    )
}
