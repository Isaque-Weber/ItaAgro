// backend/src/index.ts
import Fastify from 'fastify'
import cors from '@fastify/cors'
import cookie from '@fastify/cookie'
import authPlugin from './plugins/auth'
import { authRoutes } from './controllers/auth'

async function start() {
  const app = Fastify({ logger: true })

  // 1) CORS: libere seu front-end (5173) para chamar a API
  await app.register(cors, {
    origin: ['http://localhost:5173'],
    credentials: true, // Habilita o envio de cookies
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  })

  // 2) plugin de cookie para ler/escrever cookies
  await app.register(cookie, {
    parseOptions: {}                 // opções de parsing se precisar
  })

  // 3) Plugin de autenticação (Fastify-JWT, etc.)
  await app.register(authPlugin)

  // 4) Rotas de Auth (login, recover, etc.)
  await app.register(authRoutes)

  // 5) Rota de chat (stub — retorna eco da prompt)
  app.post(
    '/chat',
    {
      preHandler: [app.authenticate],
      schema: {
        body: {
          type: 'object',
          required: ['prompt'],
          properties: {
            prompt: { type: 'string' }
          }
        },
        response: {
          200: {
            type: 'object',
            properties: {
              reply: { type: 'string' }
            }
          }
        }
      }
    },
    async (request) => {
      const { prompt } = request.body as { prompt: string }
      return { reply: `Eco: ${prompt}` }
    }
  )


  // 6) Exemplo de rota protegida usando o decorator de auth do plugin
  app.get(
    '/protected',
    { preHandler: [app.authenticate] },
    async () => {
      return { data: 'Conteúdo protegido acessado!' }
    }
  )

  const port = Number(process.env.PORT) || 4000
  try {
    await app.listen({ port })
    app.log.info(`Servidor rodando em http://localhost:${port}`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }

  // await app.listen({ port: 4000 })
}

start()
