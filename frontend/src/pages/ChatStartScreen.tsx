import { useNavigate } from 'react-router-dom'
import logoImg from '../assets/logo-removebg-preview.png'

const quickQuestions = [
    { label: 'Consultar Bula', question: 'Quero consultar a bula de um produto' },
    { label: 'Tabela de Preços', question: 'Me envie a tabela de preços atualizada' },
    { label: 'Análise de Solo', question: 'Preciso de ajuda com análise de solo' },
    { label: 'Ajuda sobre Produtos', question: 'Quais são os produtos recomendados para minha lavoura?' },
]

export function ChatStartScreen() {
    const navigate = useNavigate()

    return (
        <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="flex justify-center mb-4">
                <img src={logoImg} alt="ItaAgro Logo" className="h-40 mx-auto" style={{ filter: 'drop-shadow(0 0 25px #0008)' }} />
            </div>
            <h2 className="text-xl md:text-2xl font-bold mb-6 dark:text-white">
                Tudo pronto quando você também estiver.
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md w-full">
                {quickQuestions.map((btn) => (
                    <button
                        key={btn.label}
                        onClick={() => navigate(`/chat?question=${encodeURIComponent(btn.question)}`)}
                        className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition shadow"
                    >
                        {btn.label}
                    </button>
                ))}
            </div>
        </div>
    )
}
