// frontend/src/App.tsx
import {AppRoutes} from "./routes"
import { DarkModeToggle } from './components/DarkModeToggle'
import { useAuth } from "./contexts/AuthContext"

function AppContent() {
    const { loading } = useAuth()

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                Carregando...
            </div>
        )
    }

    return (
        <>
            <AppRoutes />
            <DarkModeToggle />
        </>
    )
}

export function App() {
    return (
        <AppContent />
    )
}
