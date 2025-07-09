import { FastifyInstance } from 'fastify'
import { AppDataSource } from '../services/typeorm/data-source'
import { User } from '../entities/User'
import bcrypt from 'bcrypt'
import crypto from 'crypto'
import {
    sendVerificationCodeEmail,
    sendPasswordResetCodeEmail
} from '../utils/mailer'

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
    const repo = AppDataSource.getRepository(User)
    const SEED_USERS = ['admin@itaagro.com', 'user@itaagro.com']

    app.post<{ Body: SignupBody }>('/signup', async (req, reply) => {
        const { name, email, password } = req.body
        const existing = await repo.findOneBy({ email })
        if (existing) return reply.code(400).send({ message: 'E-mail já cadastrado.' })

        // const hashed = await bcrypt.hash(password, 10)
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
    })

    app.post<{ Body: LoginBody }>('/login', async (req, reply) => {
        const { email, password } = req.body
        const user = await repo.findOneBy({ email })

        if (!user || !user.password) {
            return reply.code(401).send({ message: 'Usuário ou senha inválidos' })
        }

        const match = await bcrypt.compare(password, user.password)
        if (!match) return reply.code(401).send({ message: 'Credenciais inválidas' })

        const isSeed = ['user@itaagro.com', 'admin@itaagro.com'].includes(user.email)
        if (!user.emailVerified && !isSeed) {
            return reply.code(403).send({
                message: 'Verifique seu e-mail antes de fazer login.',
                reason: 'email_not_verified'
            })
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
    })

    app.post<{ Body: RecoverBody }>('/recover', async (req, reply) => {
        const { email } = req.body
        const user = await repo.findOneBy({ email })
        if (!user) return reply.code(200).send()

        const code = crypto.randomInt(100000, 999999).toString()
        user.passwordResetCode = code
        user.passwordResetCodeExpiresAt = new Date(Date.now() + 15 * 60 * 1000)
        await repo.save(user)
        await sendPasswordResetCodeEmail(email, code)

        return reply.send({ message: 'Código de recuperação enviado.' })
    })

    app.post<{ Body: { email: string; code: string } }>('/verify-email-code', async (req, reply) => {
        const { email, code } = req.body
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
        await repo.save(user)

        return reply.send({ message: 'E-mail verificado com sucesso.' })
    })

    app.get('/me', async (req, reply) => {
        try {
            const token = req.headers.authorization?.replace('Bearer ', '') || ''
            const decoded = app.jwt.verify(token) as any

            const user = await repo.findOneBy({ id: decoded.sub })
            if (!user) return reply.code(401).send({ message: 'Não autenticado' })

            const isSeed = SEED_USERS.includes(user.email)

            return reply.send({
                sub: user.id,
                email: user.email,
                role: user.role,
                emailVerified: isSeed ? true : user.emailVerified // <<< FORÇA AQUI
            })
        } catch {
            return reply.code(401).send({ message: 'Não autenticado' })
        }
    })
    app.post<{ Body: { email: string; code: string; newPassword: string } }>('/reset-password', async (req, reply) => {
        const { email, code, newPassword } = req.body;
        const user = await repo.findOneBy({ email });

        if (!user || !user.passwordResetCode || !user.passwordResetCodeExpiresAt) {
            return reply.code(400).send({ message: 'Código inválido.' });
        }

        if (user.passwordResetCode !== code) {
            return reply.code(400).send({ message: 'Código incorreto.' });
        }

        if (user.passwordResetCodeExpiresAt < new Date()) {
            return reply.code(400).send({ message: 'Código expirado.' });
        }

        user.password = newPassword
        user.passwordResetCode = undefined;
        user.passwordResetCodeExpiresAt = undefined;

        await repo.save(user);

        return reply.send({ message: 'Senha redefinida com sucesso.' });
    });

    app.post('/logout', async (req, reply) => {
        return reply
            .clearCookie('itaagro_token', {
                path: '/',
                httpOnly: true,
                sameSite: 'lax',
                secure: process.env.NODE_ENV === 'production'
            })
            .send({ message: 'Logout realizado com sucesso.' });
    });
}
