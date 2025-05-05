// frontend/src/pages/Signup.tsx
import React from 'react'
import { Link } from 'react-router-dom'

export function Signup() {
    const hotmartUrl = import.meta.env.VITE_HOTMART_CHECKOUT_URL

    const handleSignup = () => {
        // redireciona para o checkout Hotmart
        window.location.href = hotmartUrl
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="max-w-sm w-full bg-white p-6 rounded-lg shadow text-center">
                <h1 className="text-2xl font-semibold mb-4">Criar Conta</h1>
                <p className="mb-6">
                    Para criar sua conta e assinar o Ita Agro, você será redirecionado
                    ao nosso checkout na Hotmart.
                </p>
                <button
                    onClick={handleSignup}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded mb-4"
                >
                    Ir para Cadastro
                </button>
                <Link to="/login" className="text-green-600 hover:underline text-sm">
                    Já tenho conta
                </Link>
            </div>
        </div>
    )
}
