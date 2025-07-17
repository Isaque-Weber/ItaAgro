// frontend/src/pages/Chat.tsx
import React, { useRef, useState, useEffect, FormEvent } from 'react'
import { useNavigate, useSearchParams, useLocation  } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import 'highlight.js/styles/github.css'
import logoImg from '../assets/logo-removebg-preview.png'
import { useDarkMode } from '../contexts/DarkModeContext'
import { ChatStartScreen } from './ChatStartScreen'
import { Paperclip } from "lucide-react"

type Message = {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    createdAt: string;
    files?: Array<{ file_id: string; filename: string }>;
};
type Session = { id: string, threadId: string, createdAt: string }

import { useAuth } from '../contexts/AuthContext';

export function Chat() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, onLogout } = useAuth();
    const userRole = user?.role;
    const [searchParams] = useSearchParams();
    const initialQuestion = searchParams.get('question')
    const [starting, setStarting] = useState(false)
    const fileInputRef = useRef<HTMLInputElement | null>(null)
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
    const { toggleDarkMode } = useDarkMode()
    const [file, setFile] = useState<File | null>(null)

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
            setStarting(true)
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
                .finally(() => {
                    setIsTyping(false)
                    setStarting(false)
                    setInitialQuestionSent(false)
                    navigate(
                        { pathname: location.pathname },
                        { replace: true }
                    )
                })
        }
    }, [
        initialQuestion,
        currentSession,
        messages.length,
        initialQuestionSent,
        navigate,
        location.pathname
    ])

    async function sendMessage(e: FormEvent) {
        e.preventDefault();
        if (!input.trim() || !currentSession) return;
        setIsSending(true);
        setIsTyping(true);

        // Limpa input logo ao enviar
        setInput('');

        let file_id: string | undefined = undefined;
        let file_name: string | undefined = undefined;

        // 1. Se houver arquivo, faça upload primeiro (obtenha id + filename do backend)
        if (file) {
            const form = new FormData();
            form.append('file', file);
            const uploadRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/chat/upload`, {
                method: 'POST',
                credentials: 'include',
                body: form
            });
            if (!uploadRes.ok) {
                setMessages(prev => [
                    ...prev,
                    {
                        id: `err-${Date.now()}`,
                        role: 'assistant',
                        content: 'Falha ao enviar PDF.',
                        createdAt: new Date().toISOString()
                    }
                ]);
                setIsSending(false);
                setIsTyping(false);
                setFile(null)
                if (fileInputRef.current) {
                    fileInputRef.current.value = ''  // <-- Reseta o input!
                }
                return;
            }
            const data = await uploadRes.json();
            file_id = data.file_id;
            file_name = data.filename;
            setFile(null);
        }

        // Adiciona mensagem do usuário localmente para feedback instantâneo
        const userMsg: Message = {
            id: `user-${Date.now()}`,
            role: 'user',
            content: input,
            createdAt: new Date().toISOString(),
            files: file_id && file_name ? [{ file_id, filename: file_name }] : undefined
        };
        setMessages(prev => [...prev, userMsg]);

        // 2. Enviar mensagem para o chat (com file_id + filename se houver)
        const body: any = { content: input };
        if (file_id && file_name) body.files = [{ file_id, filename: file_name }];

        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_BASE_URL}/chat/sessions/${currentSession.id}/messages`,
                {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                }
            );
            if (!res.ok) throw new Error('Erro no servidor');
            // Após resposta, recarrega todas as mensagens da sessão (garante consistência)
            await loadMessages(currentSession.id);
        } catch {
            setMessages(prev => [
                ...prev,
                {
                    id: `err-${Date.now()}`,
                    role: 'assistant',
                    content: 'Erro de comunicação com o servidor.',
                    createdAt: new Date().toISOString()
                }
            ]);
        } finally {
            setIsTyping(false);
            setIsSending(false);
            setInput('');
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
                    { starting ? (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="animate-pulse text-gray-500 dark:text-gray-400">
                                Iniciando conversa…
                            </div>
                        </div>
                    ) : loadingMsgs ? (
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
                                    {/* Mostra anexo PDF se houver */}
                                    {m.files && m.files.length > 0 && m.files.map((file, i) =>
                                            file.filename?.toLowerCase().endsWith('.pdf') && (
                                                <div key={file.file_id || i} className="flex items-center gap-2 p-3 mb-2 rounded-lg bg-pink-50 dark:bg-pink-950 border border-pink-200 dark:border-pink-900 w-fit">
                                                  <span className="inline-flex items-center justify-center bg-pink-200 dark:bg-pink-800 rounded-full w-8 h-8 mr-2">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-pink-700 dark:text-pink-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7V3h10v4M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                    </svg>
                                                  </span>
                                                    <div>
                                                        <span className="font-semibold text-pink-700 dark:text-pink-200">{file.filename}</span>
                                                        <div className="text-xs text-pink-600 dark:text-pink-300">PDF</div>
                                                    </div>
                                                </div>
                                            )
                                    )}

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
                <form onSubmit={sendMessage} className="p-4 border-t flex gap-2 fixed bottom-0 left-0 w-full md:static md:border-none bg-white border-gray-200 dark:bg-[#40414f] dark:border-[#565869]">
                    <div className="relative flex items-center">
                        <input
                            type="file"
                            accept="application/pdf"
                            ref={fileInputRef}
                            onChange={e => {
                                const selectedFile = e.target.files?.[0] || null;
                                if (selectedFile && selectedFile.size > 2 * 1024 * 1024) { // 2MB
                                    alert('O arquivo PDF excede o tamanho máximo de 2MB.');
                                    e.target.value = ''; // Limpa o input
                                    setFile(null);
                                } else {
                                    setFile(selectedFile);
                                }
                            }}
                            className="hidden"
                            id="file-upload"
                        />
                        <label
                            htmlFor="file-upload"
                            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-neutral-800 border border-gray-300 dark:border-neutral-700 shadow-sm cursor-pointer hover:bg-gray-200 hover:dark:bg-neutral-700 transition text-sm font-medium text-gray-700 dark:text-gray-200"
                            tabIndex={0}
                            title="Anexar PDF"
                        >
                            {/* Ícone: pode usar <Paperclip size={18} /> se usar lucide-react */}
                            <span className="text-green-700">
                              <Paperclip size={18} className="inline" />
                                {/* ou: <span className="inline text-lg">📎</span> */}
                            </span>
                        </label>
                        {file && (
                            <div className="flex items-center ml-2 bg-green-50 dark:bg-green-950 px-3 py-1 rounded shadow text-green-800 dark:text-green-200 text-xs">
                                <span className="truncate max-w-[120px]">{file.name}</span>
                                <button
                                    type="button"
                                    className="ml-2 text-red-500 hover:text-red-700"
                                    onClick={() => setFile(null)}
                                    aria-label="Remover arquivo"
                                >
                                    ✕
                                </button>
                            </div>
                        )}
                    </div>
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
