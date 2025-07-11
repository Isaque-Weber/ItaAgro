import 'fastify'

declare module 'fastify' {
    interface FastifyRequest {
        user: {
            sub: string
            email: string
            role: 'user' | 'admin'
            emailVerified?: boolean
            // inclua outros campos do seu JWT se quiser
        }
    }
}
