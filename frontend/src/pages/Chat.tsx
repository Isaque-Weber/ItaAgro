// frontend/src/pages/Chat.tsx
import React, { useRef, useState, useEffect, FormEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github.css'
import logoImg from '../assets/logo-removebg-preview.png'
import { useDarkMode } from '../contexts/DarkModeContext'
import { ChatStartScreen } from './ChatStartScreen'

type Role = 'user' | 'assistant'
type Message = { id: string; role: Role; content: string; createdAt: string }
type Session = { id: string; threadId: string; createdAt: string }

import { useAuth } from '../contexts/AuthContext';

export function Chat() {
    const navigate = useNavigate();
    const { user, onLogout } = useAuth();
    const userRole = user?.role;
    const [searchParams] = useSearchParams();
    const initialQuestion = searchParams.get('question')

    const [menuOpen, setMenuOpen] = useState(false)
    const [sessions, setSessions] = useState<Session[]>([])
    const [currentSession, setCurrentSession] = useState<Session | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [input, setInput] = useState('')
    const [loadingSessions, setLoadingSessions] = useState(true)
    const [loadingMsgs, setLoadingMsgs] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [isTyping, setIsTyping] = useState(false)
    const [isSending, setIsSending] = useState(false)
    const [initialQuestionSent, setInitialQuestionSent] = useState(false)
    const bottomRef = useRef<HTMLDivElement>(null)
    const sidebarRef = useRef<HTMLDivElement>(null)
    const { darkMode, toggleDarkMode } = useDarkMode()

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (
                menuOpen &&
                sidebarRef.current &&
                !sidebarRef.current.contains(e.target as Node)
            ) {
                setMenuOpen(false)
            }
        }
        if (menuOpen) {
            document.addEventListener('mousedown', handleClickOutside)
        }
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [menuOpen])

    useEffect(() => {
        fetchSessions()
    }, [])

    async function fetchSessions() {
        setLoadingSessions(true)
        setError(null)
        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_BASE_URL}/chat/sessions`,
                { credentials: 'include' }
            )
            if (res.status === 401) {
                navigate('/login')
                return
            }
            if (res.status === 403) {
                navigate('/subscribe')
                return
            }
            if (!res.ok) {
                throw new Error(`Erro ao buscar sessões (status ${res.status})`)
            }
            const data: Session[] = await res.json()
            setSessions(data)
            if (data.length > 0) {
                setCurrentSession(data[data.length - 1])
            } else {
                const newRes = await fetch(
                    `${import.meta.env.VITE_API_BASE_URL}/chat/sessions`,
                    { method: 'POST', credentials: 'include' }
                )
                if (newRes.status === 401) {
                    navigate('/login')
                    return
                }
                if (!newRes.ok) {
                    throw new Error('Erro ao criar sessão inicial')
                }
                const sess: Session = await newRes.json()
                setSessions([sess])
                setCurrentSession(sess)
            }
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoadingSessions(false)
        }
    }

    useEffect(() => {
        if (currentSession) {
            loadMessages(currentSession.id)
        }
    }, [currentSession])

    async function loadMessages(sessionId: string) {
        setLoadingMsgs(true)
        setError(null)
        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_BASE_URL}/chat/sessions/${sessionId}/messages`,
                { credentials: 'include' }
            )
            if (!res.ok) {
                throw new Error('Erro ao carregar mensagens')
            }
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
                { method: 'POST', credentials: 'include' }
            )
            if (!res.ok) throw new Error('Erro ao criar nova sessão')
            const sess: Session = await res.json()
            setSessions(prev => [...prev, sess])
            setCurrentSession(sess)
        } catch (err: any) {
            setError(err.message)
        }
    }

    async function handleDeleteSession(sessionId: string) {
        if (!confirm('Deseja realmente excluir esta conversa?')) return
        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_BASE_URL}/chat/sessions/${sessionId}`,
                { method: 'DELETE', credentials: 'include' }
            )
            if (!res.ok) throw new Error('Erro ao excluir sessão')
            setSessions(prev => prev.filter(s => s.id !== sessionId))
            if (currentSession?.id === sessionId) {
                setCurrentSession(null)
                setMessages([])
            }
        } catch (err) {
            console.error(err)
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
                    body: JSON.stringify({ content: initialQuestion })
                }
            )
                .then(res => {
                    if (!res.ok) throw new Error('Falha no envio inicial')
                    return res.json()
                })
                .then(() => loadMessages(currentSession.id))
                .catch(() => {
                    setMessages(msgs => [
                        ...msgs,
                        {
                            id: `err-${Date.now()}`,
                            role: 'assistant',
                            content: 'Erro ao enviar pergunta inicial.',
                            createdAt: new Date().toISOString()
                        }
                    ])
                })
                .finally(() => setIsTyping(false))
        }
    }, [
        initialQuestion,
        currentSession,
        messages.length,
        initialQuestionSent
    ])

    async function sendMessage(e: FormEvent) {
        e.preventDefault()
        if (!input.trim() || !currentSession) return
        setIsSending(true)
        setIsTyping(true)
        const tempMsg: Message = {
            id: `temp-${Date.now()}`,
            role: 'user',
            content: input,
            createdAt: new Date().toISOString()
        }
        setMessages(prev => [...prev, tempMsg])
        const content = input
        setInput('')
        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_BASE_URL}/chat/sessions/${currentSession.id}/messages`,
                {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content })
                }
            )
            if (!res.ok) throw new Error('Erro no servidor')
            const { reply } = await res.json()
            const botMsg: Message = {
                id: `bot-${Date.now()}`,
                role: 'assistant',
                content: reply,
                createdAt: new Date().toISOString()
            }
            setMessages(prev => [...prev, botMsg])
        } catch {
            setMessages(prev => [
                ...prev,
                {
                    id: `err-${Date.now()}`,
                    role: 'assistant',
                    content: 'Erro de comunicação com o servidor.',
                    createdAt: new Date().toISOString()
                }
            ])
        } finally {
            setIsTyping(false)
            setIsSending(false)
        }
    }

    async function logout() {
        await onLogout();
        navigate('/login');
    }

    return (
        <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-neutral-100 dark:bg-[#343541] text-gray-800 dark:text-[#d1d5db]">
            {!menuOpen && (
                <button
                    onClick={() => setMenuOpen(true)}
                    className="md:hidden fixed left-4 top-4 z-50 p-2 bg-green-600 text-white rounded"
                >
                    ☰
                </button>
            )}
            <aside
                ref={sidebarRef}
                className={`fixed md:static z-40 top-0 left-0 h-full w-64 p-4 transform transition-transform duration-300 ease-in-out
          ${menuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
          bg-white border-gray-200 dark:bg-[#202123] dark:border-gray-700`}
            >
                <div className="flex justify-between items-center mb-4 md:hidden">
                    <h2 className="text-lg font-semibold">Menu</h2>
                    <button
                        onClick={() => setMenuOpen(false)}
                        className="text-red-500 text-xl"
                    >
                        ✕
                    </button>
                </div>
                <div className="mb-6 space-y-2">
                    <button
                        onClick={() => {
                            setCurrentSession(null)
                            setMessages([])
                            navigate('/chat')
                        }}
                        className="w-full text-left px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-[#2a2b2e] dark:hover:bg-[#35363a]"
                    >
                        🌿 Início
                    </button>
                    {userRole === 'admin' && (
                        <button
                            onClick={() => navigate('/admin')}
                            className="w-full text-left px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-[#2a2b2e] dark:hover:bg-[#35363a]"
                        >
                            🧾 Painel ADM
                        </button>
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
                <button
                    onClick={handleNewSession}
                    className="mb-4 w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition"
                >
                    + Novo chat
                </button>
                <ul className="flex-1 overflow-auto space-y-1 text-sm">
                    {sessions.map(s => (
                        <li key={s.id}>
                            <div
                                onClick={() => {
                                    setCurrentSession(s)
                                    setMenuOpen(false)
                                }}
                                className={`relative px-3 py-2 rounded-md cursor-pointer group transition border
                  ${currentSession?.id === s.id
                                    ? 'bg-green-100 font-semibold border-green-400 dark:bg-[#444654]'
                                    : 'hover:bg-gray-100 border-transparent dark:hover:bg-[#3e3f4b]'}`}
                            >
                <span className="block truncate w-full pr-5">
                  {new Date(s.createdAt).toLocaleString()}
                </span>
                                <button
                                    onClick={e => {
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
                    className="mt-6 w-full px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 hover:text-red-700 text-sm transition dark:border-red-400 dark:hover:bg-red-950"
                >
                    Sair
                </button>
            </aside>
            <div className="flex-1 flex flex-col h-full">
                <header className="bg-green-600 text-white p-4 shadow text-center relative">
                    <div className="flex items-center justify-center">
                        <img
                            src={logoImg}
                            alt="ItaAgro Logo"
                            className="h-12 mr-2"
                            style={{ filter: 'drop-shadow(0 0 25px #0008)' }}
                        />
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
                                <div
                                    key={i}
                                    className="h-20 bg-gray-300 dark:bg-gray-700 rounded-lg w-3/4"
                                />
                            ))}
                        </div>
                    ) : messages.length === 0 ? (
                        <ChatStartScreen />
                    ) : (
                        <>
                            {messages.map(m => (
                                <div
                                    key={m.id}
                                    className={`max-w-[90%] md:max-w-2xl px-4 py-3 rounded-lg shadow-sm whitespace-pre-wrap
                    ${m.role === 'user' ? 'self-end ml-auto' : 'self-start mr-auto'}
                    bg-white dark:bg-[#444654]`}
                                >
                                    <p className="text-xs font-bold mb-1">
                                        {m.role === 'user' ? 'Você' : 'ItaAgro'}
                                    </p>
                                    <div className="prose prose-sm max-w-none text-sm leading-relaxed dark:prose-invert">
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
                                <div className="bg-white px-4 py-2 rounded-lg shadow-sm self-start mr-auto text-sm italic text-gray-500 animate-pulse dark:bg-neutral-800">
                                    ItaAgro está digitando…
                                </div>
                            )}
                            <div ref={bottomRef} />
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
                        onChange={e => setInput(e.target.value)}
                        placeholder="Digite sua mensagem…"
                        className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-400 dark:bg-[#343541] dark:text-white"
                    />
                    <button
                        type="submit"
                        disabled={isSending}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
                    >
                        Enviar
                    </button>
                </form>
            </div>
        </div>
    )
}
