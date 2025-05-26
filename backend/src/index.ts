// backend/src/index.ts
import 'reflect-metadata'
import 'dotenv/config'         // <<— carrega o .env antes de tudo
import Fastify from 'fastify'
import cors from '@fastify/cors'
import { AppDataSource } from './services/typeorm/data-source'
import authPlugin    from './plugins/auth'
import { authRoutes }   from './controllers/auth'
import { adminRoutes }  from './controllers/admin'

async function start() {
  await AppDataSource.initialize()
      .then(() => console.log('Data Source initialized'))
      .catch(err => { console.error(err); process.exit(1) })
  const app = Fastify({ logger: true })

  // 1) CORS (precisa de credentials para enviar cookies HttpOnly)
  await app.register(cors, {
    origin:      'http://localhost:5173',
    credentials: true,
    methods: ['GET','POST','PUT','DELETE','OPTIONS']
  })

  // 2) Plugin de autenticação (cookie + jwt + authenticate)
  await app.register(authPlugin)

  // 3) Rotas públicas de auth
  await app.register(authRoutes, { prefix: '/auth' })

  // 4) Rotas de admin (já usam app.authenticate internamente)
  await app.register(adminRoutes, { prefix: '/admin' })

  // 5) Stub de chat protegido (ainda inline, só pra validar)
  app.post(
      '/chat',
      { preHandler: [app.authenticate] },
      async (request) => {
        const { prompt } = request.body as { prompt: string }
        return { reply: `Eco: ${prompt}` }
      }
  )

  // 6) Rota exemplo protegida
  app.get(
      '/protected',
      { preHandler: [app.authenticate] },
      async () => ({ data: 'Conteúdo protegido acessado!' })
  )

  const port = Number(process.env.PORT) || 4000
  await app.listen({ port })
  app.log.info(`Servidor rodando em http://localhost:${port}`)
}

start().catch(err => {
  console.error(err)
  process.exit(1)
})
