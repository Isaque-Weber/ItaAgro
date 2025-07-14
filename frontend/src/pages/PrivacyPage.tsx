import React from 'react'
import ReactMarkdown from 'react-markdown'

const markdown = `
# Política de Privacidade - ItaAgro AIChat

Última atualização: 13/07/2025

O ItaAgro AIChat respeita a sua privacidade e está comprometido com a proteção dos seus dados pessoais. Esta Política explica como coletamos, usamos, armazenamos e compartilhamos suas informações, em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 - LGPD).

## 1. Quem somos

Somos responsáveis pela operação do aplicativo ItaAgro AIChat, uma plataforma de assistência virtual por inteligência artificial voltada ao setor agropecuário.

Em caso de dúvidas, entre em contato pelo e-mail: **itasistemaia@gmail.com**

## 2. Dados que coletamos

Ao utilizar nosso aplicativo, poderemos coletar os seguintes dados:

- **Dados de identificação**: nome, e-mail, CPF (se aplicável), dados da assinatura.
- **Dados de autenticação**: código de verificação por e-mail.
- **Dados de pagamento**: processados com segurança via Mercado Pago (não armazenamos seus dados bancários).
- **Dados de uso**: interações com o chat, histórico de conversas, preferências.
- **Cookies e tecnologias similares**: para autenticação e manutenção da sessão.

## 3. Finalidade do uso dos dados

Utilizamos seus dados para:

- Criar e manter sua conta;
- Verificar sua identidade e prevenir fraudes;
- Gerenciar assinaturas e pagamentos;
- Melhorar a experiência do usuário com base no uso;
- Cumprir obrigações legais e regulatórias.

## 4. Compartilhamento de dados

Seus dados **não são vendidos**. Podemos compartilhá-los com:

- **Serviços de pagamento (ex: Mercado Pago)**;
- **Plataformas de autenticação (ex: envio de e-mails)**;
- **Plataforma de inteligência artificial (ex: OpenAI)**, exclusivamente para gerar respostas no chat.

Todos os terceiros contratados seguem medidas de segurança e estão sujeitos à confidencialidade.

## 5. Retenção e exclusão de dados

Seus dados são mantidos enquanto sua conta estiver ativa ou conforme exigido por lei. Você pode solicitar a exclusão dos seus dados a qualquer momento, mediante requisição por e-mail.

## 6. Direitos do titular (você)

Nos termos da LGPD, você pode:

- Acessar seus dados;
- Corrigir dados incompletos ou incorretos;
- Solicitar a exclusão de dados;
- Revogar o consentimento;
- Portar os dados para outro serviço.

Para exercer esses direitos, envie um e-mail para **contato@itaagro.com**

## 7. Segurança da informação

Adotamos medidas técnicas e organizacionais para proteger seus dados contra acesso não autorizado, perda, alteração ou destruição.

## 8. Alterações nesta Política

Esta Política pode ser atualizada periodicamente. Notificaremos os usuários em caso de alterações relevantes.

---

**Aceite**: Ao utilizar o ItaAgro AIChat, você concorda com esta Política de Privacidade.
`

export function PrivacyPage() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4">
            <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 shadow-md rounded-lg p-6 md:p-10 prose dark:prose-invert">
                <ReactMarkdown>{markdown}</ReactMarkdown>
            </div>
        </div>
    )
}
