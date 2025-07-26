// frontend/src/pages/ChatStartScreen.tsx
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import logoImg from '../assets/logo-removebg-preview.png'

const quickQuestions = [
    { label: 'Consultar Bula', question: 'Quero consultar a bula de um produto específico' },
    { label: 'Análise de Solo', question: 'Preciso de ajuda com análise de solo' },
    { label: 'Ajuda sobre Produtos', question: 'Quais produtos você recomenda para minha lavoura?' },
]

export function ChatStartScreen() {
    const navigate = useNavigate()
    const [loadingLabel, setLoadingLabel] = useState<string | null>(null);

    async function handleQuickQuestion(question: string, label: string) {
        setLoadingLabel(label);
        try {
            // 1. Cria uma nova sessão
            const res = await fetch(
                `${import.meta.env.VITE_API_BASE_URL}/chat/sessions`,
                { method: 'POST', credentials: 'include' }
            );
            if (!res.ok) throw new Error('Erro ao criar sessão');
            const sess = await res.json();

            // 2. Envia a mensagem inicial já nesta sessão
            const msgRes = await fetch(
                `${import.meta.env.VITE_API_BASE_URL}/chat/sessions/${sess.id}/messages`,
                {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ content: question })
                }
            );
            if (!msgRes.ok) throw new Error('Erro ao enviar mensagem inicial');

            // 3. Navega para o chat usando o ID da sessão
            navigate(`/chat?session=${sess.id}`);
        } catch (err) {
            alert('Não foi possível iniciar a conversa. Tente novamente.');
        } finally {
            setLoadingLabel(null);
        }
    }

    return (
        <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="flex justify-center mb-4">
                <img
                    src={logoImg}
                    alt="ItaAgro Logo"
                    className="h-40 mx-auto"
                    style={{ filter: 'drop-shadow(0 0 25px #0008)' }}
                />
            </div>
            <h2 className="text-xl md:text-2xl font-bold mb-6 dark:text-white">
                Tudo pronto quando você também estiver.
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-w-lg w-full">
                {quickQuestions.map(({ label, question }) => (
                    <button
                        key={label}
                        onClick={() => handleQuickQuestion(question, label)}
                        className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition shadow"
                        disabled={!!loadingLabel}
                    >
                        {loadingLabel === label ? 'Iniciando...' : label}
                    </button>
                ))}
            </div>
        </div>
    )
}
