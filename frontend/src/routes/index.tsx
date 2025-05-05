import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Login } from '../pages/Login'
import { Chat } from '../pages/Chat'
import { RecoverPassword } from '../pages/RecoverPassword'
import { Signup } from '../pages/Signup'

// ① Declare a interface para as props que virão do App
interface AppRoutesProps {
    onLogin: () => void
    onLogout: () => void
  }

export function AppRoutes({ onLogin, onLogout }: AppRoutesProps) {
    const isAuth = !!localStorage.getItem('itaagro_token')

    return (
        <Routes>
            <Route
                path="/login"
                element={isAuth ? <Navigate to="/chat" /> : <Login onLogin={onLogin} />}
            />
            <Route
                path="/recover"
                element={isAuth ? <Navigate to="/chat" /> : <RecoverPassword />}
            />
            <Route
                path="/signup"
                element={isAuth ? <Navigate to="/chat" /> : <Signup />}
            />
            <Route
                path="/chat"
                element={isAuth ? <Chat onLogout={onLogout} /> : <Navigate to="/login" />}
            />
            <Route
                path="*"
                element={<Navigate to={isAuth ? '/chat' : '/login'} />}
            />
        </Routes>
    )
}