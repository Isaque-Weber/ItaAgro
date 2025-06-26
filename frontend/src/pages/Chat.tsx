// frontend/src/pages/Chat.tsx
import { useNavigate, useSearchParams } from 'react-router-dom'
import React, { useRef, useState, useEffect, FormEvent } from 'react'
import ReactMarkdown from 'react-markdown'
import logoImg from '../assets/logo-removebg-preview.png'
import remarkGfm from 'remark-gfm'
import 'highlight.js/styles/github.css'
import rehypeHighlight from 'rehype-highlight'
import { useDarkMode } from '../contexts/DarkModeContext'
import {ChatStartScreen} from "./ChatStartScreen";

type Role = 'user' | 'assistant'
type Message = { id: string; role: Role; content: string; createdAt: string }
type Session = { id: string; threadId: string; createdAt: string }

interface ChatProps {
    onLogout(): void
    userRole: string | null
}

export function Chat({ onLogout, userRole }: ChatProps) {
    const navigate = useNavigate()

    // lista de sessões
    const [sessions, setSessions] = useState<Session[]>([])
    const [currentSession, setCurrentSession] = useState<Session | null>(null)

    // mensagens da sessão ativa
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')

    // loading / error
    const [loadingSessions, setLoadingSessions] = useState(true)
    const [loadingMsgs, setLoadingMsgs] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // sair do menu ao clicar fora
    const sidebarRef = useRef<HTMLDivElement>(null)

    // botão darkmode
    const { darkMode, toggleDarkMode } = useDarkMode()

    // 'digitando...' do bot, pro usuário ver alguma coisa enquanto espera a resposta
    const bottomRef = useRef<HTMLDivElement>(null)
    const [isTyping, setIsTyping] = useState(false)

    // estado de abrir/fechar login
    const [menuOpen, setMenuOpen] = useState(false)

    // Estado para bloquear temporariamente o botão de enviar
    const [isSending, setIsSending] = useState(false)

    //interpreta os parâmetros do botão de question pré chat
    const [searchParams] = useSearchParams()
    const initialQuestion = searchParams.get('question')
    const [initialQuestionSent, setInitialQuestionSent] = useState(false)

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuOpen && sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
                setMenuOpen(false)
            }
        }

        if (menuOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [menuOpen])

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    // carrega todas as sessões ao montar
    useEffect(() => {
        fetchSessions()
    }, [])

    // sempre que mudar a sessão ativa, carrega as mensagens
    useEffect(() => {
        if (currentSession) loadMessages(currentSession.id)
    }, [currentSession])

    async function fetchSessions() {
        setLoadingSessions(true)
        setError(null)
        try {
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/chat/sessions`, {
                credentials: 'include',
            })
            if (!res.ok) throw new Error('Falha ao carregar sessões')

            const data: Session[] = await res.json()
            setSessions(data)

            if (data.length > 0) {
                setCurrentSession(data[data.length - 1])
            } else {
                // ✅ Cria automaticamente se não houver nenhuma
                const newSessionRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/chat/sessions`, {
                    method: 'POST',
                    credentials: 'include',
                })
                if (!newSessionRes.ok) throw new Error('Falha ao criar sessão automática')
                const newSession: Session = await newSessionRes.json()
                setSessions([newSession])
                setCurrentSession(newSession)
            }
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoadingSessions(false)
        }
    }

    async function loadMessages(sessionId: string) {
        setLoadingMsgs(true)
        setError(null)
        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_BASE_URL}/chat/sessions/${sessionId}/messages`,
                { credentials: 'include' }
            )
            if (!res.ok) throw new Error('Falha ao carregar mensagens')
            const data: Message[] = await res.json()
            setMessages(data)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoadingMsgs(false)
        }
    }

    async function handleNewSession() {
        setError(null)
        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_BASE_URL}/chat/sessions`,
                {
                    method: 'POST',
                    credentials: 'include',
                }
            )
            if (!res.ok) throw new Error('Falha ao criar nova sessão')
            const sess: Session = await res.json()
            setSessions((s) => [...s, sess])
            setCurrentSession(sess)
        } catch (err: any) {
            setError(err.message)
        }
    }

    const handleDeleteSession = async (sessionId: string) => {
        if (!confirm('deseja realmente excluir esta conversa?')) return

        try {
            const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/chat/sessions/${sessionId}`, {
                method: 'DELETE',
                credentials: 'include'
            })

            if(!res.ok) throw new Error('Erro ao excluir sessão')

            setSessions((prev) => prev.filter((s) => s.id !== sessionId))

            if (currentSession?.id ===sessionId) {
                setCurrentSession(null)
                setMessages([])
            }
        } catch (err) {
            console.error('Erro ao excluir sessão:', err)
        }
    }

    useEffect(() => {
        if (
            initialQuestion &&
            currentSession &&
            messages.length === 0 &&
            !initialQuestionSent
        ) {
            setIsTyping(true)
            setInitialQuestionSent(true)

            fetch(
                `${import.meta.env.VITE_API_BASE_URL}/chat/sessions/${currentSession.id}/messages`,
                {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content: initialQuestion }),
                }
            )
                .then((res) => {
                    if (!res.ok) throw new Error('Falha no envio')
                    return res.json()
                })
                .then(() => {
                    return loadMessages(currentSession.id) // ✅ Recarrega histórico salvo
                })
                .catch(() => {
                    setMessages((msgs) => [
                        ...msgs,
                        {
                            id: `err-${Date.now()}`,
                            role: 'assistant',
                            content: 'Erro ao enviar pergunta inicial.',
                            createdAt: new Date().toISOString(),
                        },
                    ])
                })
                .finally(() => {
                    setIsTyping(false)
                })
        }
    }, [initialQuestion, currentSession, messages.length, initialQuestionSent])


    const sendMessage = async (e: FormEvent) => {
        e.preventDefault()
        if (!input.trim() || !currentSession) return

        setIsSending(true)
        setIsTyping(true)

        // apend user msg local
        const tempId = `temp-${Date.now()}`
        const userMsg: Message = {
            id: tempId,
            role: 'user',
            content: input,
            createdAt: new Date().toISOString(),
        }
        setMessages((msgs) => [...msgs, userMsg])
        setInput('')

        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_BASE_URL}/chat/sessions/${currentSession.id}/messages`,
                {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content: input }),
                }
            )
            if (!res.ok) throw new Error('Erro no servidor')
            const { reply } = await res.json()
            const botMsg: Message = {
                id: `bot-${Date.now()}`,
                role: 'assistant',
                content: reply,
                createdAt: new Date().toISOString(),
            }
            setMessages((msgs) => [...msgs, botMsg])
        } catch {
            setMessages((msgs) => [
                ...msgs,
                {
                    id: `err-${Date.now()}`,
                    role: 'assistant',
                    content: 'Erro de comunicação com o servidor.',
                    createdAt: new Date().toISOString(),
                },
            ])
        } finally {
            setIsTyping(false) // ✅ encerra a animação SEMPRE, mesmo em erro
            setIsSending(false) // encerra o bloqueio após a conclusão da resposta do assistant
        }
    }

    const logout = async () => {
        await fetch(`${import.meta.env.VITE_API_BASE_URL}/auth/logout`, {
            method: 'POST',
            credentials: 'include',
        })
        onLogout()
        navigate('/login')
    }

    return (
        <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-neutral-100 text-gray-800 dark:bg-[#343541] dark:text-[#d1d5db]">
            {!menuOpen && (
                <button
                    onClick={() => setMenuOpen(true)}
                    className="md:hidden fixed left-4 top-4 text-white z-50"
                >
                    ☰
                </button>
            )}

            <aside
                className={`fixed md:static z-40 top-0 left-0 h-full w-64 p-4 transform transition-transform duration-300 ease-in-out
    ${menuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:flex md:flex-col
    bg-white border-gray-200 dark:bg-[#202123] dark:border-gray-700`}
            >
                <div className="flex justify-between items-center mb-4 md:hidden">
                    <h2 className="text-lg font-semibold">Menu</h2>
                    <button onClick={() => setMenuOpen(false)} className="text-red-500 text-lg">✕</button>
                </div>

                {/** Botões de navegação */}
                <div className="mb-6 space-y-2">
                    <button
                        onClick={() => {
                            setCurrentSession(null)
                            setMessages([])
                            navigate('/chat') // Reinicia a interface
                        }}
                        className="w-full text-left px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-[#2a2b2e] dark:hover:bg-[#35363a]"
                    >
                        🌿 Início
                    </button>

                    {userRole === 'admin' && (
                        <>
                            <button
                                onClick={() => navigate('/admin')}
                                className="w-full text-left px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-[#2a2b2e] dark:hover:bg-[#35363a]"
                            >
                                🧾Painel ADM
                            </button>
                        </>
                    )}

                    {userRole === 'user' && (
                        <button
                            onClick={() => navigate('/user/plan')}
                            className="w-full text-left px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-[#2a2b2e] dark:hover:bg-[#35363a]"
                        >
                            👤 Meu Plano
                        </button>
                    )}
                </div>

                {/** Botão de novo chat após os menus */}
                <button
                    onClick={handleNewSession}
                    className="mb-4 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition w-full"
                >
                    + Novo chat
                </button>

                {/** Lista de sessões */}
                <ul className="flex-1 overflow-auto mt-2 space-y-1 text-sm">
                    {sessions.map((s) => (
                        <li key={s.id}>
                            <div
                                className={`relative px-3 py-2 rounded-md cursor-pointer group transition border
            ${currentSession?.id === s.id
                                    ? 'bg-green-100 font-semibold border-green-400 dark:bg-[#444654]'
                                    : 'hover:bg-gray-100 border-transparent dark:hover:bg-[#3e3f4b]'}`}
                                onClick={() => {
                                    setCurrentSession(s)
                                    setMenuOpen(false)
                                }}
                            >
          <span className="block truncate w-full pr-5">
            {new Date(s.createdAt).toLocaleString()}
          </span>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        handleDeleteSession(s.id)
                                    }}
                                    className="absolute top-1/2 right-2 transform -translate-y-1/2 text-red-500 hover:text-red-700 text-xs opacity-0 group-hover:opacity-100 transition"
                                >
                                    ✕
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>

                <button
                    onClick={logout}
                    className="mt-6 px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 hover:text-red-700 text-sm transition dark:border-red-400 dark:hover:bg-red-950"
                >
                    Sair
                </button>
            </aside>
            <div className="flex-1 flex flex-col h-full">
                <header className="bg-green-600 text-white p-4 shadow text-center relative">
                    <div className="flex items-center justify-center">
                        <img src={logoImg} alt="ItaAgro Logo" className="h-12 mr-2" style={{ filter: 'drop-shadow(0 0 25px #0008)' }} />
                        <h1 className="text-lg font-semibold">ItaAgro Chat</h1>
                    </div>
                    <button
                        onClick={toggleDarkMode}
                        className="absolute top-4 right-4 text-white text-sm"
                    >
                        🌙/☀️
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 scroll-smooth pb-28 md:pb-6">
                    {loadingMsgs ? (
                        <div className="space-y-4 animate-pulse">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="h-20 bg-gray-300 dark:bg-gray-700 rounded-lg w-3/4" />
                            ))}
                        </div>
                    ) : messages.length === 0 ? (
                        <ChatStartScreen />
                    ) : (
                        <>
                            {messages.map((m) => (
                                <div
                                    key={m.id}
                                    className={`max-w-[90%] md:max-w-2xl px-4 py-3 rounded-lg shadow-sm whitespace-pre-wrap
                                    ${m.role === 'user' ? 'self-end ml-auto' : 'self-start mr-auto'}
                                    bg-white dark:bg-[#444654]`}
                                    >
                                    <p className="text-xs font-bold mb-1">{m.role === 'user' ? 'Você' : 'ItaAgro'}</p>
                                    <div className="prose prose-sm max-w-none text-sm leading-relaxed">
                                        <ReactMarkdown
                                            remarkPlugins={[remarkGfm]}
                                            rehypePlugins={[rehypeHighlight]}
                                        >
                                            {m.content}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            ))}
                            {isTyping && (
                                <div className="bg-white px-4 py-2 rounded-lg shadow-sm self-start mr-auto text-sm text-gray-500 italic animate-pulse dark:bg-neutral-800">
                                    ItaAgro está digitando…
                                </div>
                            )}
                            <div ref={bottomRef}></div>
                        </>
                    )}
                </div>

                <form
                    onSubmit={sendMessage}
                    className="p-4 border-t flex gap-2 fixed bottom-0 left-0 w-full md:static md:border-none bg-white border-gray-200 dark:bg-[#40414f] dark:border-[#565869]"
                >
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Digite sua mensagem…"
                        className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 dark:bg-[#343541] dark:text-white"
                    />
                    <button
                        type="submit"
                        disabled={isSending}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                    >
                        Enviar
                    </button>
                </form>
            </div>
        </div>
    )
}
