// backend/src/plugins/auth.ts
import fp from 'fastify-plugin'
import fastifyCookie from '@fastify/cookie'
import fastifyJwt    from '@fastify/jwt'
import { FastifyPluginAsync } from 'fastify'

const authPlugin: FastifyPluginAsync = async (fastify) => {
    // 1) Cookie parser
    fastify.register(fastifyCookie)

    // 2) JWT (lê o token do header ou do cookie itaagro_token)
    fastify.register(fastifyJwt, {
        secret: process.env.JWT_SECRET as string,
        cookie: {
            cookieName: 'itaagro_token',
            signed:     false
        }
    })

    // 3) O método que valida o JWT e popula `request.user`
    fastify.decorate(
        'authenticate',
        async (request, reply) => {
            try {
                await request.jwtVerify()
                request.user = request.user || (request as any).jwtPayload

            } catch {
                reply.code(401).send({ error: 'Unauthorized' })
            }
        }
    )
}

export default fp(authPlugin)
