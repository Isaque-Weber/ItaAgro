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
        },
        decode: { complete: true },
        messages: {
            badRequestErrorMessage: 'Formato de requisição inválido',
            noAuthorizationInHeaderMessage: 'Token de autenticação ausente',
            authorizationTokenExpiredMessage: 'Token de autenticação expirado',
            authorizationTokenInvalid: 'Token de autenticação inválido',
            authorizationTokenUntrusted: 'Token de autenticação não confiável'
        }
    })

    // Hook para tentar extrair o token do header Authorization se não estiver no cookie
    fastify.addHook('preHandler', async (request, reply) => {
        const authHeader = request.headers.authorization
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7)
            if (!request.cookies['itaagro_token']) {
                // Se não tiver o cookie, mas tiver o header, define o cookie
                fastify.log.info('Token encontrado no header Authorization, definindo cookie')
                reply.setCookie('itaagro_token', token, {
                    httpOnly: true,
                    secure: true,
                    sameSite: 'none',
                    path: '/',
                    maxAge: 60 * 60 * 24 // 1 dia
                })
            }
        }
    })

    // 3) O método que valida o JWT e popula `request.user`
    fastify.decorate(
        'authenticate',
        async (request, reply) => {
            try {
                // Log para debug
                fastify.log.info('Cookies recebidos:', request.cookies)

                // Tenta verificar o JWT
                await request.jwtVerify()
                request.user = request.user || (request as any).jwtPayload

                // Log para debug
                fastify.log.info('JWT verificado com sucesso, user:', request.user)
            } catch (error) {
                // Log para debug
                fastify.log.error('Erro ao verificar JWT:', error)

                // Tenta extrair o token do cookie diretamente
                const token = request.cookies['itaagro_token']
                if (token) {
                    try {
                        // Tenta verificar o token manualmente
                        const decoded = fastify.jwt.verify(token)
                        request.user = decoded
                        fastify.log.info('JWT verificado manualmente com sucesso, user:', request.user)
                        return
                    } catch (err) {
                        fastify.log.error('Erro ao verificar JWT manualmente:', err)
                    }
                }

                reply.code(401).send({ error: 'Unauthorized' })
            }
        }
    )
}

export default fp(authPlugin)
