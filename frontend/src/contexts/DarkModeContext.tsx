import { createContext, useContext, useEffect, useState } from "react";

interface DarkModeContextProps {
    darkMode: boolean
    toggleDarkMode: () => void
}

const  DarkModeContext = createContext<DarkModeContextProps | undefined>(undefined)

export function DarkModeProvider({ children }: { children: React.ReactNode }) {
    const [darkMode, setDarkMode] = useState(() => {
        return localStorage.getItem('darkMode') === 'true'
    })

    useEffect(() => {
        const root = document.documentElement
        if (darkMode) {
            root.classList.add('dark')
        } else {
            root.classList.remove('dark')
        }
        localStorage.setItem('darkMode', String(darkMode))
    }, [darkMode])

    const toggleDarkMode = () => setDarkMode((prev) => !prev)

    return (
        <DarkModeContext.Provider value={{ darkMode, toggleDarkMode }}>
            {children}
        </DarkModeContext.Provider>
    )

}

export function useDarkMode() {
    const context = useContext(DarkModeContext)
    if(!context) {
        throw new Error('useDarkMode must be used within a DarkModeProvider')
    }
    return context
}