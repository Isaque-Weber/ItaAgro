import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { AppDataSource } from '../services/typeorm/data-source'
import { User } from '../entities/User'
import bcrypt from 'bcrypt'
import { signJwt } from '../utils/jwt'
import { sendRecoveryEmail, sendVerificationEmail } from '../utils/mailer'
import crypto from 'crypto'

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

export async function authRoutes(app: FastifyInstance): Promise<void> {
    // 1) Login
    app.post<{ Body: LoginBody }>(
        '/login',
        {
            schema: {
                body: {
                    type: 'object',
                    required: ['email', 'password'],
                    properties: {
                        email:    { type: 'string', format: 'email' },
                        password: { type: 'string', minLength: 6 }
                    }
                }
            }
        },
        async (req, reply) => {
            const { email, password } = req.body

            const repo = AppDataSource.getRepository(User)
            const user = await repo.findOneBy({ email })
            if (!user) {
                return reply.code(401).send({ message: 'Usuário inválido' })
            }

            // Garante que o hash existe antes de comparar
            if (!user.password) {
                app.log.error(`Login falhou: usuário ${user.id} sem senha definida`)
                return reply.code(500).send({ message: 'Erro interno de autenticação' })
            }

            const match = await bcrypt.compare(password, user.password)
            if (!match) {
                return reply.code(401).send({ message: 'Credenciais inválidas' })
            }

            // Bloqueia login se e-mail não verificado, exceto usuários seed
            const isSeed = [
                'user@itaagro.com',
                'admin@itaagro.com'
            ].includes(user.email)
            if (!user.emailVerified && !isSeed) {
                return reply.code(403).send({ message: 'Verifique seu e-mail antes de fazer login.' })
            }

            const token = app.jwt.sign(
                { sub: user.id, email: user.email, role: user.role },
                { expiresIn: '1d' }
            )

            const cookieOptions = {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'none' as const,
                path: '/',
                maxAge: 60 * 60 * 24 // 1 dia
            }

            return reply
                .setCookie('itaagro_token', token, cookieOptions)
                .header('Authorization', `Bearer ${token}`)
                .code(200)
                .send({ success: true, role: user.role, token })
        }
    )

    // 2) Signup
    app.post<{ Body: SignupBody }>(
        '/signup',
        {
            schema: {
                body: {
                    type: 'object',
                    required: ['name', 'email', 'password'],
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

            const repo = AppDataSource.getRepository(User)
            const exists = await repo.findOneBy({ email })
            if (exists) {
                return reply.code(409).send({ message: 'Email já cadastrado' })
            }

            const verificationToken = crypto.randomBytes(32).toString('hex')
            const verificationTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

            const user = repo.create({
                name,
                email,
                password,
                verificationToken,
                verificationTokenExpiresAt,
                emailVerified: false
            })
            await repo.save(user)

            const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`
            await sendVerificationEmail(email, verificationUrl)

            const token = app.jwt.sign(
                { sub: user.id, email: user.email, role: user.role },
                { expiresIn: '1d' }
            )

            return reply
                .setCookie('itaagro_token', token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: 'lax' as const,
                    path: '/',
                    maxAge: 60 * 60 * 24
                })
                .code(201)
                .send({
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    emailVerified: false,
                    message: 'Por favor, verifique seu email para ativar sua conta'
                })
        }
    )

    // 3) Verificação de e-mail
    app.get(
        '/verify-email',
        async (req: FastifyRequest<{ Querystring: { token?: string } }>, reply) => {
            const { token } = req.query
            if (!token) {
                return reply.code(400).send({ message: 'Token não fornecido' })
            }

            const repo = AppDataSource.getRepository(User)
            const user = await repo.findOneBy({ verificationToken: token })
            if (!user) {
                return reply.code(404).send({ message: 'Token inválido' })
            }

            if (user.verificationTokenExpiresAt! < new Date()) {
                return reply.code(400).send({ message: 'Token expirado' })
            }

            user.emailVerified = true
            user.verificationToken = undefined
            user.verificationTokenExpiresAt = undefined
            await repo.save(user)

            return reply.send({ message: 'Email verificado com sucesso' })
        }
    )

    // 4) Logout
    app.post('/logout', async (_req, reply) => {
        return reply
            .clearCookie('itaagro_token', {
                path:     '/',
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'none'
            })
            .code(200)
            .send({ success: true })
    })

    // 5) /me
    app.get(
        '/me',
        { preHandler: [app.authenticate] },
        async (req) => {
            const user = req.user as { email: string; role: string }
            return { email: user.email, role: user.role }
        }
    )

    // 6) Recuperar senha
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
        async (req, reply) => {
            const { email } = req.body

            const repo = AppDataSource.getRepository(User)
            const user = await repo.findOneBy({ email })
            if (!user) {
                return reply.code(404).send({ message: 'E-mail não encontrado. Por favor, envie um e-mail cadastrado.' })
            }

            const token = signJwt(
                { sub: user.id, email: user.email, scope: 'recover' },
                { expiresIn: '1h' }
            )

            const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`
            try {
                await sendRecoveryEmail(user.email, resetUrl)
            } catch (err: any) {
                req.log.error('Erro ao enviar e-mail de recuperação:', err)
                return reply.code(500).send({ message: 'Erro ao enviar e-mail de recuperação: ' + (err?.message || err) })
            }

            return reply.code(200).send({ message: 'Verifique seu e-mail para o link de recuperação.' })
        }
    )

    // 7) Verificação de e-mail via token
    app.post<{ Body: { token: string } }>(
        '/verify-email',
        {
            schema: {
                body: {
                    type: 'object',
                    required: ['token'],
                    properties: {
                        token: { type: 'string' }
                    }
                }
            }
        },
        async (req, reply) => {
            const { token } = req.body
            const repo = AppDataSource.getRepository(User)
            const user = await repo.findOneBy({ verificationToken: token })
            if (!user) {
                return reply.code(404).send({ message: 'Token inválido.' })
            }
            if (!user.verificationTokenExpiresAt || user.verificationTokenExpiresAt < new Date()) {
                return reply.code(400).send({ message: 'Token expirado.' })
            }
            user.emailVerified = true
            user.verificationToken = undefined
            user.verificationTokenExpiresAt = undefined
            await repo.save(user)
            return reply.send({ message: 'E-mail verificado com sucesso.' })
        }
    )
}
