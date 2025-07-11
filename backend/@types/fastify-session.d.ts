// @types/fastify-session.d.ts
import '@fastify/session'

declare module '@fastify/session' {
  interface FastifySessionObject {
    googleState?: string
  }
}