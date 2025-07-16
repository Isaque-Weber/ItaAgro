// frontend/src/pages/ChatStartScreen.tsx
import { useNavigate } from 'react-router-dom'
import logoImg from '../assets/logo-removebg-preview.png'

const quickQuestions = [
    { label: 'Consultar Bula', question: 'Quero consultar a bula de um produto específico' },
    { label: 'Análise de Solo', question: 'Preciso de ajuda com análise de solo' },
    { label: 'Ajuda sobre Produtos', question: 'Quais produtos você recomenda para minha lavoura?' },
]

export function ChatStartScreen() {
    const navigate = useNavigate()

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

            {/* Aqui mudei para 3 colunas em md+ e aumentei o max-width */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-w-lg w-full">
                {quickQuestions.map(({ label, question }) => (
                    <button
                        key={label}
                        onClick={() =>
                            // ao navegar, o Chat.tsx irá ler ?question=... e enviar a mensagem inicial automaticamente
                            navigate(`/chat?question=${encodeURIComponent(question)}`)
                        }
                        className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition shadow"
                    >
                        {label}
                    </button>
                ))}
            </div>
        </div>
    )
}
