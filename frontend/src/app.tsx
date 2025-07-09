// frontend/src/App.tsx
import React, { useState, useEffect } from 'react'
import {AppRoutes} from "./routes";
import { DarkModeToggle } from './components/DarkModeToggle'
import { AuthProvider, useAuth } from "./contexts/AuthContext";

function AppContent() {
    const { loading } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                Carregando...
            </div>
        );
    }

    return (
        <>
            <AppRoutes />
            <DarkModeToggle />
        </>
    );
}

export function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}
