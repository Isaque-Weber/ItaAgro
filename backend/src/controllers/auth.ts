// backend/src/controllers/auth.ts
import { FastifyInstance } from 'fastify'
import {AppDataSource} from "../services/typeorm/data-source";
import {User} from "../entities/User";
import bcrypt from 'bcrypt'

export async function authRoutes(app: FastifyInstance) {
    // ** NÃO repita fastify.register(fastifyJwt) aqui **
    // 1) Login
    app.post(
        '/login',                     // se for dentro de authRoutes com prefix '/auth'
        {
            schema: {
                body: {
                    type: 'object',
                    required: ['email','password'],
                    properties: {
                        email:    { type: 'string', format: 'email' },
                        password: { type: 'string', minLength: 6 }
                    }
                }
            }
        },
        async (req, reply) => {
            const { email, password } = req.body as { email: string; password: string }

            const repo = AppDataSource.getRepository(User)
            const user = await repo.findOneBy({ email })
            if (!user) {
                return reply.code(401).send({ message: 'Usuário inválido' })
            }

            const match = await bcrypt.compare(password, user.password)
            if (!match) {
                return reply.code(401).send({ message: 'Credenciais inválidas' })
            }

            const token = app.jwt.sign(
                { sub: user.id, email: user.email, role: user.role },
                { expiresIn: '1d' }
            )

            return reply
                .setCookie('itaagro_token', token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    path: '/',
                    maxAge: 60 * 60 * 24
                })
                .code(200)
                .send({ success: true, role: user.role })
        }
    )

    // 2) Logout — limpa o cookie
    app.post('/logout', async (_req, reply) => {
        reply
            .clearCookie('itaagro_token', {
                path:     '/',
                httpOnly: true,
                sameSite: 'lax'
            })
            .code(200)
            .send({ success: true })
    })

    // 3) Checa sessão — só acessível se o token for válido
    app.get(
        '/me',
        { preHandler: [app.authenticate] },
        async (req) => {
            const user = req.user as { email: string; role: string }
            return { email: user.email, role: user.role }
        }
    )

    // 4) Recuperar senha (sem autenticação)
    app.post('/recover', async (req, reply) => {
        const { email } = req.body as { email: string }
        // TODO: enviar e-mail de recuperação
        return reply.send({ message: `Link de recuperação enviado para ${email}` })
    })
}
