import React from 'react'
import { Link } from 'react-router-dom'

export function Signup() {
    // Próxima Sprint
    // const mercadoPagoURL = import.meta.env.VITE_MERCADOPAGO_CHECKOUT_URL

    const handleSignup = () => {
        window.location.href = 'mercadopago.com'
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4 transition-colors duration-300">
            <div className="max-w-sm w-full bg-white dark:bg-gray-800 dark:text-white p-6 rounded-lg shadow dark:shadow-lg text-center">
                <h1 className="text-2xl font-semibold mb-4">Criar Conta</h1>
                <p className="mb-6">
                    Para criar sua conta e assinar o Ita Agro, você será redirecionado
                    ao nosso checkout no MercadoPago.
                </p>
                <button
                    onClick={handleSignup}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded mb-4"
                >
                    Ir para Cadastro
                </button>
                <Link to="/login" className="text-green-600 hover:underline text-sm dark:text-green-400">
                    Já tenho conta
                </Link>
            </div>
        </div>
    )
}
