import { FastifyInstance } from 'fastify'
import { AppDataSource } from '../services/typeorm/data-source'
import { User } from '../entities/User'
import { Subscription, SubscriptionStatus } from '../entities/Subscription'
import bcrypt from 'bcrypt'
import crypto from 'crypto'
import { z } from 'zod'
import {
    sendVerificationCodeEmail,
    sendPasswordResetCodeEmail
} from '../utils/mailer'

// Schemas de validação Zod
const signupBodySchema = z.object({
    name: z.string().min(3, "O nome precisa ter no mínimo 3 caracteres."),
    email: z.string().email("Formato de e-mail inválido."),
    password: z.string().min(8, "A senha precisa ter no mínimo 8 caracteres."),
});

const loginBodySchema = z.object({
    email: z.string().email("Formato de e-mail inválido."),
    password: z.string().nonempty("A senha é obrigatória."),
});

const recoverBodySchema = z.object({
    email: z.string().email("Formato de e-mail inválido."),
});

const verifyEmailCodeBodySchema = z.object({
    email: z.string().email("Formato de e-mail inválido."),
    code: z.string().length(6, "O código deve ter 6 dígitos."),
});

const resetPasswordBodySchema = z.object({
    email: z.string().email("Formato de e-mail inválido."),
    code: z.string().length(6, "O código deve ter 6 dígitos."),
    newPassword: z.string().min(8, "A nova senha precisa ter no mínimo 8 caracteres."),
});

const resendVerificationCodeBodySchema = z.object({
    email: z.string().email("Formato de e-mail inválido."),
});


export async function authRoutes(app: FastifyInstance) {
    const repo = AppDataSource.getRepository(User)
    const SEED_USERS = ['admin@itaagro.com', 'user@itaagro.com']

    app.post('/signup', async (req, reply) => {
        try {
            const { name, email, password } = signupBodySchema.parse(req.body)
            const existing = await repo.findOneBy({ email })
            if (existing) return reply.code(400).send({ message: 'E-mail já cadastrado.' })

            const code = crypto.randomInt(100000, 999999).toString()

            const user = repo.create({
                name,
                email,
                password,
                verificationCode: code,
                verificationCodeExpiresAt: new Date(Date.now() + 15 * 60 * 1000)
            })

            await repo.save(user)
            await sendVerificationCodeEmail(email, code)

            reply.code(201).send({ message: 'Cadastro realizado com sucesso. Verifique seu e-mail.' })
        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.code(400).send({ message: 'Dados inválidos.', issues: error.format() })
            }
            return reply.code(500).send({ message: 'Erro interno no servidor.' })
        }
    })

    app.post('/login', async (req, reply) => {
        try {
            const { email, password } = loginBodySchema.parse(req.body)
            const user = await repo.findOne({
                where: { email },
                relations: ['subscriptions'],
            })

            if (!user || !user.password) {
                return reply.code(401).send({ message: 'Usuário ou senha inválidos' })
            }

            const match = await bcrypt.compare(password, user.password)
            if (!match) return reply.code(401).send({ message: 'Credenciais inválidas' })

            const isSeed = SEED_USERS.includes(user.email)
            if (!user.emailVerified && !isSeed) {
                return reply.code(403).send({
                    message: 'Verifique seu e-mail antes de fazer login.',
                    reason: 'email_not_verified'
                })
            }

            // --- Atualiza o status subscriptionActive baseado nas assinaturas ---
            const hasActive = user.subscriptions.some(
                s => s.status === SubscriptionStatus.ACTIVE || s.status === SubscriptionStatus.AUTHORIZED
            )
            if (user.subscriptionActive !== hasActive) {
                user.subscriptionActive = hasActive
                await repo.save(user)
            }

            const token = app.jwt.sign(
                { sub: user.id, email: user.email, role: user.role },
                { expiresIn: '1d' }
            )

            return reply
                .setCookie('itaagro_token', token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                    path: '/',
                    maxAge: 60 * 60 * 24
                })
                .header('Authorization', `Bearer ${token}`)
                .send({ success: true, role: user.role })
        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.code(400).send({ message: 'Dados inválidos.', issues: error.format() })
            }
            return reply.code(500).send({ message: 'Erro interno no servidor.' })
        }
    })


    app.post('/recover', async (req, reply) => {
        try {
            const { email } = recoverBodySchema.parse(req.body)
            const user = await repo.findOneBy({ email })
            if (!user) return reply.code(200).send()

            const code = crypto.randomInt(100000, 999999).toString()
            user.passwordResetCode = code
            user.passwordResetCodeExpiresAt = new Date(Date.now() + 15 * 60 * 1000)
            await repo.save(user)
            await sendPasswordResetCodeEmail(email, code)

            return reply.send({ message: 'Código de recuperação enviado.' })
        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.code(400).send({ message: 'Dados inválidos.', issues: error.format() })
            }
            return reply.code(500).send({ message: 'Erro interno no servidor.' })
        }
    })

    app.post('/verify-email-code', async (req, reply) => {
        try {
            const { email, code } = verifyEmailCodeBodySchema.parse(req.body)
            const user = await repo.findOneBy({ email })

            if (!user || !user.verificationCode || !user.verificationCodeExpiresAt) {
                return reply.code(400).send({ message: 'Código inválido.' })
            }

            if (user.verificationCode !== code) {
                return reply.code(400).send({ message: 'Código incorreto.' })
            }

            if (user.verificationCodeExpiresAt < new Date()) {
                return reply.code(400).send({ message: 'Código expirado.' })
            }

            user.emailVerified = true
            user.verificationCode = undefined
            user.verificationCodeExpiresAt = undefined

            // --- Atualiza o campo subscriptionActive de acordo com assinaturas ativas ---
            const subscriptions = await repo.manager.getRepository(Subscription).find({ where: { user: { id: user.id } } })
            const hasActive = subscriptions.some(
                s => s.status === SubscriptionStatus.ACTIVE || s.status === SubscriptionStatus.AUTHORIZED
            )
            if (user.subscriptionActive !== hasActive) {
                user.subscriptionActive = hasActive
                await repo.save(user)
            } else {
                await repo.save(user)
            }

            const token = app.jwt.sign(
                {
                    sub: user.id,
                    email: user.email,
                    role: user.role,
                    emailVerified: user.emailVerified
                },
                { expiresIn: '1d' }
            )

            return reply
                .setCookie('itaagro_token', token, {
                    httpOnly: true,
                    secure: process.env.NODE_ENV === 'production',
                    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                    path: '/',
                    maxAge: 60 * 60 * 24
                })
                .header('Authorization', `Bearer ${token}`)
                .send({ message: 'E-mail verificado com sucesso.' })
        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.code(400).send({ message: 'Dados inválidos.', issues: error.format() })
            }
            return reply.code(500).send({ message: 'Erro interno no servidor.' })
        }
    })

    app.get('/me', async (req, reply) => {
        try {
            await req.jwtVerify()
            // @ts-ignore
            const userId = String(req.user.sub)
            const user = await repo.findOne({
                where: { id: userId },
                relations: ['subscriptions'],
            })
            if (!user) return reply.code(401).send({ message: 'Não autenticado' })

            const isSeed = SEED_USERS.includes(user.email)
            const plan = user.subscriptions?.find(s => s.status === 'active')?.plan || null

            return reply.send({
                sub: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                emailVerified: isSeed ? true : user.emailVerified,
                subscriptionActive: user.subscriptionActive, // <--- Alteração aqui
                plan,
            })
        } catch (err) {
            return reply.code(401).send({ message: 'Não autenticado' })
        }
    })

    app.post('/reset-password', async (req, reply) => {
        try {
            const { email, code, newPassword } = resetPasswordBodySchema.parse(req.body)
            const user = await repo.findOneBy({ email })

            if (!user || !user.passwordResetCode || !user.passwordResetCodeExpiresAt) {
                return reply.code(400).send({ message: 'Código inválido.' })
            }

            if (user.passwordResetCode !== code) {
                return reply.code(400).send({ message: 'Código incorreto.' })
            }

            if (user.passwordResetCodeExpiresAt < new Date()) {
                return reply.code(400).send({ message: 'Código expirado.' })
            }

            user.password = newPassword
            user.passwordResetCode = undefined
            user.passwordResetCodeExpiresAt = undefined

            await repo.save(user)

            return reply.send({ message: 'Senha redefinida com sucesso.' })
        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.code(400).send({ message: 'Dados inválidos.', issues: error.format() })
            }
            return reply.code(500).send({ message: 'Erro interno no servidor.' })
        }
    })

    app.post('/logout', async (req, reply) => {
        return reply
            .clearCookie('itaagro_token', {
                path: '/',
                httpOnly: true,
                sameSite: 'lax',
                secure: process.env.NODE_ENV === 'production'
            })
            .send({ message: 'Logout realizado com sucesso.' })
    })

    app.post('/resend-verification-code', async (req, reply) => {
        try {
            const { email } = resendVerificationCodeBodySchema.parse(req.body)
            const user = await repo.findOneBy({ email })
            if (!user) return reply.code(400).send({ message: 'Usuário não encontrado.' })

            const code = crypto.randomInt(100000, 999999).toString()
            user.verificationCode = code
            user.verificationCodeExpiresAt = new Date(Date.now() + 15 * 60 * 1000)
            await repo.save(user)
            await sendVerificationCodeEmail(email, code)
            return reply.send({ message: 'Novo código enviado.' })
        } catch (error) {
            if (error instanceof z.ZodError) {
                return reply.code(400).send({ message: 'Dados inválidos.', issues: error.format() })
            }
            return reply.code(500).send({ message: 'Erro interno no servidor.' })
        }
    })
}
