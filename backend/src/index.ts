// backend/src/index.ts
import 'reflect-metadata'
import 'dotenv/config'         // <<— carrega o .env antes de tudo
import Fastify from 'fastify'
import cors from '@fastify/cors'
import { AppDataSource } from './services/typeorm/data-source'
import authPlugin    from './plugins/auth'
import { authRoutes }   from './controllers/auth'
import { adminRoutes }  from './controllers/admin'
import {chatRoutes} from "./controllers/chat";

async function start() {
  await AppDataSource.initialize()
      .then(() => console.log('Data Source initialized'))
      .catch(err => { console.error(err); process.exit(1) })
  const app = Fastify({ logger: true })

  // 1) CORS (precisa de credentials para enviar cookies HttpOnly)
  await app.register(cors, {
    origin: (origin, cb) => {
      const allowedOrigins = [
        'http://localhost:5173',
        'https://itaback-production.up.railway.app'
      ]
      if (!origin || allowedOrigins.includes(origin)) {
        cb(null, true)
      } else {
        cb(new Error("Not allowed by CORS"), false)
      }
    },
    credentials: true,
    methods: ['GET','POST','PUT','DELETE','OPTIONS']
  })

  // 2) Plugin de autenticação (cookie + jwt + authenticate)
  await app.register(authPlugin)

  // 3) Rotas públicas de auth
  await app.register(authRoutes, { prefix: '/auth' })

  // 4) Rotas de admin (já usam app.authenticate internamente)
  await app.register(adminRoutes, { prefix: '/admin' })

  // 5)Rota de chat
    await app.register(chatRoutes, { prefix: '/chat' })

  // 6) Rota exemplo protegida
  app.get(
      '/protected',
      { preHandler: [app.authenticate] },
      async () => ({ data: 'Conteúdo protegido acessado!' })
  )

  const port = Number(process.env.PORT) || 4000
  await app.listen({ port })
  app.log.info(`Servidor rodando em http://localhost:${port}`)

  app.get('/health', async (req, res) => {
    return { status: 'ok', uptime: process.uptime() }
  })

}



start().catch(err => {
  console.error(err)
  process.exit(1)
})
