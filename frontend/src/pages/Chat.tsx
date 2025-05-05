// frontend/src/pages/Chat.tsx
import React, { useState, useEffect, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

type Message = { from: 'user' | 'bot'; text: string }

interface ChatProps {
    onLogout: () => void
}

export function Chat({onLogout}: ChatProps) {
    const navigate = useNavigate()
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')

    // Exemplo: carregar histórico (se tiver) ao montar
    useEffect(() => {
        // aqui você pode buscar histórico real via API
        setMessages([])
    }, [])

    const sendMessage = async (e: FormEvent) => {
        e.preventDefault()
        if (!input.trim()) return

        const userMsg: Message = { from: 'user', text: input }
        setMessages((msgs) => [...msgs, userMsg])
        setInput('')

        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_BASE_URL}/chat`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${localStorage.getItem('itaagro_token')}`,
                    },
                    body: JSON.stringify({ prompt: input }),
                }
            )
            const data = await res.json()
            const botMsg: Message = {
                from: 'bot',
                text: data.reply || 'Ops, sem resposta.',
            }
            setMessages((msgs) => [...msgs, botMsg])
        } catch {
            setMessages((msgs) => [
                ...msgs,
                { from: 'bot', text: 'Erro de comunicação com o servidor.' },
            ])
        }
    }

    const logout = async () => {
        await fetch(
            `${import.meta.env.VITE_API_BASE_URL}/auth/logout`, {
            method: 'POST',
            credentials: 'include',
        })
        onLogout()
        navigate('/login')
    }

    return (
        <div className="flex flex-col h-screen">
            <header className="bg-green-600 text-white p-4 flex justify-between">
                <h1 className="text-lg font-semibold">ItaAgro Chat</h1>
                <button onClick={logout} className="underline">
                    Sair
                </button>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-100">
                {messages.map((m, i) => (
                    <div
                        key={i}
                        className={`max-w-xs px-3 py-2 rounded ${m.from === 'user'
                            ? 'bg-green-200 self-end'
                            : 'bg-white self-start'
                            }`}
                    >
                        {m.text}
                    </div>
                ))}
            </div>

            <form
                onSubmit={sendMessage}
                className="p-4 bg-white flex items-center space-x-2"
            >
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Digite sua mensagem..."
                    className="flex-1 px-3 py-2 border rounded focus:outline-none"
                />
                <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
                >
                    Enviar
                </button>
            </form>
        </div>
    )
}