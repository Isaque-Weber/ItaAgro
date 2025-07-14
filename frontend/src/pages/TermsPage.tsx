import React from 'react'
import ReactMarkdown from 'react-markdown'

const markdown = `
# Termos de Uso - ItaAgro AIChat

Última atualização: 13/07/2025

## 1. Aceitação dos Termos

Ao utilizar o aplicativo ItaAgro AIChat, você concorda com estes Termos de Uso, com a Política de Privacidade e com todas as leis e regulamentos aplicáveis. Caso não concorde, você não deve utilizar o serviço.

## 2. Descrição do Serviço

O ItaAgro AIChat é uma plataforma de assistência virtual alimentada por Inteligência Artificial, voltada ao setor agropecuário, com funcionalidades informativas e operacionais para usuários assinantes.

## 3. Cadastro e Acesso

- O acesso ao serviço requer cadastro com e-mail válido.
- O usuário deve confirmar sua identidade por meio de código enviado por e-mail.
- Menores de 18 anos devem estar autorizados por seus responsáveis legais.

## 4. Assinatura e Pagamento

- O uso do serviço está condicionado à assinatura paga, exceto para administradores autorizados.
- Os pagamentos são processados via Mercado Pago, conforme plano escolhido.
- Cancelamentos podem ser feitos a qualquer momento via painel do usuário, respeitando os prazos de cobrança.

## 5. Uso Adequado

Você concorda em utilizar o serviço de forma ética e legal, sendo vedado:

- Tentar burlar o sistema, explorar falhas ou violar segurança;
- Utilizar o chat para fins ilícitos, ofensivos ou discriminatórios;
- Compartilhar conteúdo sensível ou confidencial sem autorização.

## 6. Propriedade Intelectual

Todos os direitos sobre a plataforma, incluindo código, design, textos, marca ItaAgro e respostas geradas por IA, pertencem ao titular do aplicativo. É vedada a reprodução, cópia ou uso comercial não autorizado.

## 7. Responsabilidades e Limitações

- O ItaAgro AIChat oferece respostas automatizadas com base em inteligência artificial e não substitui orientação profissional qualificada.
- A empresa não se responsabiliza por decisões tomadas com base nas respostas fornecidas.

## 8. Privacidade e Proteção de Dados

O tratamento dos dados pessoais segue a Lei Geral de Proteção de Dados (LGPD). Consulte nossa [Política de Privacidade](/privacidade) para saber como seus dados são coletados, armazenados e tratados.

## 9. Cancelamento de Conta

O usuário pode solicitar a exclusão da conta e de seus dados pessoais a qualquer momento, conforme previsto na LGPD.

## 10. Alterações nos Termos

Podemos atualizar estes Termos periodicamente. Ao continuar utilizando o serviço após mudanças, você concorda com os novos termos.

## 11. Foro

Fica eleito o foro da comarca de Saboeiro/CE, com renúncia a qualquer outro, por mais privilegiado que seja, para dirimir dúvidas oriundas deste contrato.

---

Em caso de dúvidas, entre em contato pelo e-mail: **itasistemaia@gmail.com**
`

export function TermsPage() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4">
            <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 md:p-10 prose dark:prose-invert">
                <ReactMarkdown>{markdown}</ReactMarkdown>
            </div>
        </div>
    )
}
