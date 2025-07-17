import { Routes, Route, Navigate } from 'react-router-dom'
import { Login } from '../pages/Login'
import { RecoverPassword } from '../pages/RecoverPassword'
import { Signup } from '../pages/Signup'
import { Chat } from '../pages/Chat'
import { AdminDashboard } from '../pages/AdminDashboard'
import DashboardUsers from "../pages/DashboardUsers"
import { SubscribePage } from '../pages/SubscribePage'
import { SuccessPage } from '../pages/SuccessPage'
import { ProtectedRoute } from "../components/ProtectedRoute"
import { GoogleCallback } from '../pages/GoogleCallback'
import VerifyEmail from '../pages/VerifyEmail'
import { useAuth } from '../contexts/AuthContext'
import { TermsPage } from '../pages/TermsPage'
import { PrivacyPage } from '../pages/PrivacyPage'


export function AppRoutes() {
    const { user } = useAuth()
    const isAuth = !!user
    // const userRole = user?.role

    return (
        <Routes>
            <Route
                path="/"
                element={isAuth ? <Navigate to="/chat" replace /> : <Navigate to="/login" replace />}
            />
            <Route
                path="/login"
                element={isAuth ? <Navigate to="/chat" replace /> : <Login />}
            />
            <Route
                path="/recover"
                element={isAuth ? <Navigate to="/" replace /> : <RecoverPassword />}
            />
            <Route
                path="/signup"
                element={isAuth ? <Navigate to="/" replace /> : <Signup />}
            />
            <Route
                path="/verify-email"
                element={isAuth ? <Navigate to="/" replace /> : <VerifyEmail />}
            />
            <Route
                path="/chat"
                element={
                    <ProtectedRoute>
                        <Chat />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/subscribe"
                element={
                    <ProtectedRoute requireSubscription={false}>
                        <SubscribePage />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/admin"
                element={
                    <ProtectedRoute>
                        <AdminDashboard />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/user/plan"
                element={
                    <ProtectedRoute>
                        <DashboardUsers />
                    </ProtectedRoute>
                }
            />
            <Route path="/subscribe/success" element={<SuccessPage />} />
            <Route path="/auth/google/callback" element={<GoogleCallback />} />
            <Route path="*" element={<Navigate to={isAuth ? "/" : "/login"} replace />} />
            <Route path="/termos" element={<TermsPage />} />
            <Route path="/privacidade" element={<PrivacyPage />} />

        </Routes>
    )
}
