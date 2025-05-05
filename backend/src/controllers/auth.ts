import { FastifyInstance } from 'fastify';
import fastifyJwt from '@fastify/jwt';

export async function authRoutes(app: FastifyInstance) {
    app.register(fastifyJwt, { secret: 'your-secret-key' })

    app.post('/auth/login', { /* schema */ }, async (req, reply) => {
        const { email, password } = req.body as { email: string; password: string }
        if (email === 'teste@itaagro.com' && password === '123456') {
            const token = app.jwt.sign({ email })

            reply
                .setCookie('itaagro_token', token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax',
                    path: '/',               // cookie válido para toda a API
                    maxAge: 60 * 60 * 24,     // 1 dia, em segundos
                })
                .code(200)
                .send({ success: true })
            return
        }
        reply.status(401).send({ message: 'Credenciais inválidas' })
    })

    // logout limpa o cookie
    app.post('/auth/logout', async (_request, reply) => {
        reply
          .clearCookie('itaagro_token', {
            path: '/',               // mesmo path usado na hora de setar o cookie
            httpOnly: true,          // garante que é o mesmo cookie
            sameSite: 'lax',
          })
          .code(200)
          .send({ success: true })
      })

    // rota de checagem de sessão
    app.get('/auth/me', { preHandler: [app.authenticate] }, async (req) => {
        return { email: (req.user as any).email }
    })

    app.post('/auth/recover', async (request, reply) => {
        const { email } = request.body as { email: string }
        // TODO: enviar e-mail de recuperação
        return reply.send({ message: `Link de recuperação enviado para ${email}` })
    });
}