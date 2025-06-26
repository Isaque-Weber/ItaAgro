// backend/src/controllers/auth.controller.ts
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { AppDataSource } from '../services/typeorm/data-source'
import { User } from '../entities/User'
import bcrypt from 'bcrypt'
import { signJwt } from '../utils/jwt'
import { sendRecoveryEmail } from '../utils/mailer'    // <- sua implementação de envio de e-mail

interface SignupBody {
    name: string
    email: string
    password: string
}

interface LoginBody {
    email: string
    password: string
}

interface RecoverBody {
    email: string
}

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

            // Log para debug
            console.log('Token gerado:', token)

            // Configuração do cookie
            const cookieOptions = {
                httpOnly: true,
                secure: true,
                sameSite: 'none' as const,
                path: '/',
                maxAge: 60 * 60 * 24 // 1 dia
            };

            console.log('Configuração do cookie:', cookieOptions);

            return reply
                .setCookie('itaagro_token', token, cookieOptions)
                .header('Authorization', `Bearer ${token}`) // Adiciona o token no header também
                .code(200)
                .send({ 
                    success: true, 
                    role: user.role, 
                    token, // Incluir token na resposta para debug
                    cookieSet: true // Indicador que o cookie foi definido
                })
        }
    )

    app.post<{ Body: SignupBody }>(
        '/signup',
        {
            schema: {
                body: {
                    type: 'object',
                    required: ['name','email','password'],
                    properties: {
                        name:     { type: 'string' },
                        email:    { type: 'string', format: 'email' },
                        password: { type: 'string', minLength: 6 }
                    }
                }
            }
        },
        async (req, reply) => {
            const { name, email, password } = req.body

            // 1) Verifica se já existe
            const repo = AppDataSource.getRepository(User)  // ou AppDataSource
            const exists = await repo.findOne({ where: { email } })
            if (exists) {
                return reply.status(409).send({ message: 'Email já cadastrado' })
            }

            // 2) Cria e salva
            const hash = await bcrypt.hash(password, 10)
            const user = repo.create({ name, email, password: hash })
            await repo.save(user)

            // 3) Gera JWT
            const token = app.jwt.sign(
                { sub: user.id, email: user.email, role: user.role },
                { expiresIn: '1d' }
            )

            // 4) Seta cookie HttpOnly + envia token no corpo
            reply
                .setCookie('itaagro_token', token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax' as const,
                    path: '/',
                    maxAge: 60 * 60 * 24 // 1 dia
                })
                .header('Authorization', `Bearer ${token}`)
                .code(201)
                .send({
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    token  // opcional, facilita debug no front
                })
        }
    )

    // 2) Logout — limpa o cookie
    app.post('/logout', async (_req, reply) => {
        reply
            .clearCookie('itaagro_token', {
                path:     '/',
                httpOnly: true,
                secure: true,
                sameSite: 'none'
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
    app.post<{ Body: RecoverBody }>(
        '/recover',
        {
            schema: {
                body: {
                    type: 'object',
                    required: ['email'],
                    properties: {
                        email: { type: 'string', format: 'email' }
                    }
                }
            }
        },
        async (req: FastifyRequest<{ Body: RecoverBody }>, reply: FastifyReply) => {
            const { email } = req.body

            // 1️⃣ Verifica se existe o usuário
            const userRepo = AppDataSource.getRepository(User)
            const user = await userRepo.findOneBy({ email })
            if (!user) {
                // Para evitar leak de existência, você pode retornar 200 mesmo assim:
                return reply
                    .code(200)
                    .send({ message: 'Se este e-mail estiver cadastrado, você receberá instruções.' })
            }

            // 2️⃣ Gera um token de recuperação com vencimento curto (ex.: 1h)
            const token = signJwt(
                { sub: user.id, email: user.email, scope: 'recover' },
                { expiresIn: '1h' }
            )

            // 3️⃣ Salva (ou não) esse token para futuras validações, se quiser
            //    Exemplo: user.resetToken = token; user.resetExpires = Date.now() + 3600_000;
            //             await userRepo.save(user);

            // 4️⃣ Envia o e-mail de recuperação com link para a sua página de reset
            const resetUrl = `${process.env.APP_BASE_URL}/reset-password?token=${token}`
            await sendRecoveryEmail(user.email, resetUrl)

            // 5️⃣ Responde ao cliente
            return reply
                .code(200)
                .send({ message: 'Se este e-mail estiver cadastrado, você receberá instruções.' })
        }
    )
}
