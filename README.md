




itaagro-mvp/
├── frontend/                # App React (mobile-first)
│   ├── public/              # favicon, manifest, index.html
│   ├── src/
│   │   ├── assets/          # logos, ícones
│   │   ├── components/      # botões, inputs, bolhas de mensagens
│   │   ├── pages/           # roteamento (React Router ou Next.js sem API)
│   │   ├── services/        # chamadas HTTP ao back-end (axios/React Query)
│   │   ├── styles/          # Tailwind config e CSS global
│   │   └── App.tsx
│   ├── package.json
│   └── vite.config.ts       # ou next.config.js se for Next.js
│
├── backend/                 # API REST
│   ├── src/
│   │   ├── controllers/     # rotas (auth, chat, products, stripe)
│   │   ├── services/        # lógica de negócio (OpenAI, DB, Stripe)
│   │   ├── models/          # interfaces / TypeORM / Prisma schema
│   │   ├── middlewares/     # auth JWT, CORS, logger
│   │   └── index.ts         # bootstrap do servidor (Fastify/Express/NestJS)
│   ├── package.json
│   └── tsconfig.json
│
├── docker-compose.yml       # orquestra frontend + backend + (opcional) db  
└── README.md
