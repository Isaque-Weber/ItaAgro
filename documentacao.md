# Documentação de Requisitos – Projeto Ita Agro

## 1. Introdução

**Propósito:** Fornecer um guia completo de requisitos e design para o MVP do assistente de consultoria agronômica digital Ita Agro.

**Escopo do MVP:**

* Web App (mobile-first) com Login e Chat integrado ao motor OpenAI
* Base de dados de produtos e bulas (busca e exibição)
* Integração com WhatsApp e Telegram como canais de atendimento
* Controle de acesso via assinatura mensal (Hotmart)

## 2. Stakeholders

| Stakeholder             | Papel                               | Expectativa                                 |
| ----------------------- | ----------------------------------- | ------------------------------------------- |
| Engenheiro Agrônomo     | Dono do produto / Conteúdo técnico  | Respostas corretas e rápidas                |
| Produtor Rural          | Usuário final                       | Facilidade de uso, acesso móvel e histórico |
| Time de Desenvolvimento | Implementação, deploy, manutenção   | Requisitos claros, entregas iterativas      |
| Administrador de Dados  | Atualização de base (Airtable/CSV)  | Processo simples de importação/exportação   |
| Operações / Financeiro  | Gestão de assinaturas e faturamento | Integração estável com Stripe               |

## 3. Personas

* **Luiz, Pequeno Produtor**: Usa principalmente no celular, quer preço e bula rápidos.
* **Marina, Técnica de Campo**: Usa no desktop e Telegram, precisa de detalhes técnicos (modal PDF).
* **Admin Agro**: Atualiza a base de produtos, monitorando métricas de uso e faturamento.

## 4. Casos de Uso Destacados

A seguir, os UC essenciais para garantir operação fluida e completa:

| ID    | Nome                        | Ator    | Objetivo                                         |   |
| ----- | --------------------------- | ------- | ------------------------------------------------ | - |
| UC-01 | Login                       | Usuário | Autenticar no Web App                            |ok |
| UC-02 | Recuperar Senha             | Usuário | Enviar link para redifinir senha                 |ok |
| UC-03 | Assinatura / Checkout       | Usuário | Comprar acesso mensal via Hotmart                |   |
| UC-04 | Verificar Plano             | Sistema | Validar assinatura antes de permitir chat        |   |
| UC-05 | Enviar Mensagem             | Usuário | Enviar pergunta para o bot                       |   |
| UC-06 | Receber Resposta            | Sistema | Chamar OpenAI + dados e retornar resposta        |   |
| UC-07 | Buscar Produto              | Usuário | Listar produtos por nome/código com preço e link |   |
| UC-08 | Detalhar Produto            | Usuário | Exibir bula PDF e ficha técnica do item          |   |
| UC-09 | Histórico de Chat           | Usuário | Visualizar conversas anteriores                  |   |
| UC-10 | Integração WhatsApp         | Sistema | Receber/Enviar mensagens via Twilio              |   |
| UC-11 | Tela de Atendimento         | Usuário | Selec. o tipo de serviço antes de iniciar o chat |   |
| UC-12 | Importar/Atualizar Dados    | Admin   | Upload de CSV/Airtable com produtos e preços     |   |
| UC-13 | Gerenciar Usuários & Planos | Admin   | CRUD de usuários e níveis de acesso              |   |
| UC-14 | Painel de Métricas          | Admin   | Visualizar KPIs: uso de chat, consultas, receita |   |


Cada UC deverá conter: pré-condição, gatilho, fluxo principal, fluxos alternativos, pós-condição. (Exemplo em anexo ao final).

## 5. Requisitos Funcionais

1. **Autenticação**: JWT via endpoint `/auth/login`; recuperação via `/auth/recover`.
2. **Chat**: endpoint `/api/chat` recebe prompt e retorna resposta estruturada.
3. **Produtos**: `/api/products?search=...` e `/api/products/:id` para detalhe.
4. **Assinatura**: integração com Hotmart (Checkout ou API) e tratamento de webhooks `/api/webhooks/hotmart`.
5. **Canais**: web React, bot WhatsApp (Twilio) e Telegram (Telegraf).
6. **Admin**: painel restrito para importação de dados e gestão de usuários.

## 6. Requisitos Não-Funcionais

* **Performance**: tempo de resposta < 2s (cache de bulas)
* **Escalabilidade**: suportar 100 usuários simultâneos no MVP
* **Segurança**: TLS em todas as rotas, sanitização de inputs
* **Disponibilidade**: 99,5% de uptime
* **Usabilidade**: mobile-first, WCAG AA para cores e contrastes

## 7. Arquitetura e Tech Stack

* **Front-end**: React + Vite (mobile-first) + Tailwind CSS + React Query
* **Back-end**: Node.js + TypeScript + Fastify
* **DB**: Supabase/Postgres ou Airtable
* **Cache**: Redis para bulas e resultados frequentes
* **OpenAI**: `openai-node` SDK
* **Pagamentos**: Hotmart API / webhooks
* **Bots**: Twilio API for WhatsApp, Telegraf para Telegram

## 8. Estrutura de Pastas

Separe o front-end do back-end em pastas distintas para permitir deploy independente e clareza de responsabilidades:

```
itaagro-mvp/
├── frontend/                # App React (mobile-first)
│   ├── public/              # favicon, manifest, index.html
│   ├── src/
│   │   ├── assets/          # logos, ícones
│   │   ├── components/      # botões, inputs, bolhas de mensagens
│   │   ├── pages/           # roteamento (React Router ou Next.js sem API)
│   │   ├── services/        # chamadas HTTP ao back-end (axios/React Query)
│   │   ├── styles/          # Tailwind config e CSS global
│   │   └── App.tsx          # componente raiz
│   ├── package.json         # dependências front-end
│   └── vite.config.ts       # ou next.config.js se for Next.js
│
├── backend/                 # API REST independente
│   ├── src/
│   │   ├── controllers/     # rotas (auth, chat, products, stripe)
│   │   ├── services/        # lógica de negócio (OpenAI, DB, Stripe)
│   │   ├── models/          # interfaces / TypeORM / Prisma schema
│   │   ├── middlewares/     # auth JWT, CORS, logger
│   │   └── index.ts         # bootstrap do servidor (Fastify/Express/NestJS)
│   ├── package.json         # dependências back-end
│   └── tsconfig.json        # configuração TS para back-end
│
├── docker-compose.yml       # orquestra frontend + backend (+ db opcional)
└── README.md                # visão geral e instruções de setup
```

Essa estrutura permite deploy e CI/CD independentes: o front pode ir para Vercel/Netlify e o back para Heroku/Render ou container Docker isolado.

## 9. Especificação de API (Resumo). Especificação de API (Resumo)

| Rota                     | Método | Descrição                                  |   |
| ------------------------ | ------ | ------------------------------------------ | - |
| POST `/auth/login`       | POST   | Login retorna JWT                          |   |
| POST `/auth/recover`     | POST   | Envia e-mail de reset                      |   |
| GET `/products`          | GET    | Lista produtos (filtro `?search=`)         |   |
| GET `/products/:id`      | GET    | Detalhe de produto + link de bula          |   |
| POST `/chat`             | POST   | Envia prompt, retorna mensagem do bot      |   |
| POST `/webhooks/hotmart` | POST   | Webhook de evento de pagamento via Hotmart |   |

## 10. Protótipos & UI

* Tela mobile: login, chat, mensagem de erro.
* Wireframes no Figma: link compartilhado separadamente.

## 11. Cronograma (sprints)

| Sprint | Entregas Principais                      | Duração  |
| ------ | ---------------------------------------- | -------- |
| 1      | Setup monorepo, auth, UI login/mobile    | 1 semana |
| 2      | Chat Web App, integração OpenAI          | 1 semana |
| 3      | Base de produtos (search + detalhe)      | 1 semana |
| 4      | Stripe + Webhooks, controle de acesso    | 1 semana |
| 5      | Bots WhatsApp & Telegram + testes finais | 1 semana |
