import React from 'react'
import { useDarkMode } from '../contexts/DarkModeContext'

export function DarkModeToggle() {
    const { darkMode, toggleDarkMode } = useDarkMode()

    return (
        <button
            onClick={toggleDarkMode}
            className={`
                fixed top-4 right-4 z-50
                px-3 py-2 rounded shadow
                text-white
                ${darkMode ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'}
                transition
              `}
            aria-label="Alternar modo escuro"
        >
            {darkMode ? '☀️ Claro' : '🌙 Escuro'}
        </button>
    )
}
