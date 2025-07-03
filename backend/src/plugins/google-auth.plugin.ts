// src/plugins/google-auth.plugin.ts
import { FastifyInstance } from 'fastify'
import fastifySession from '@fastify/session'
import fastifyOauth2, { OAuth2Namespace } from '@fastify/oauth2'
import bcrypt from 'bcrypt'
import { AppDataSource } from '../services/typeorm/data-source'
import { User } from '../entities/User'
import { signJwt } from '../utils/jwt'

declare module 'fastify' {
  interface FastifyInstance {
    googleOAuth2: OAuth2Namespace
  }
}

export async function googleAuthPlugin(app: FastifyInstance): Promise<void> {
  // 1) Cookie + sessão
  await app.register(fastifySession, {
    secret: process.env.SESSION_SECRET
        ?? 'uma_secret_bem_forte_e_aleatoria_1234567890',
    cookie: {
      secure: false,   // em dev/local
      sameSite: 'lax',
      httpOnly: true,
    },
    saveUninitialized: false,
  })

  // 2) Plugin OAuth2 sem startRedirectPath (rota manual abaixo)
  await app.register(fastifyOauth2, {
    name: 'googleOAuth2',
    scope: ['email', 'profile', 'openid'],
    credentials: {
      client: {
        id: process.env.GOOGLE_CLIENT_ID!,
        secret: process.env.GOOGLE_CLIENT_SECRET!,
      },
      auth: {
        authorizeHost: 'https://accounts.google.com',
        authorizePath: '/o/oauth2/v2/auth',
        tokenHost: 'https://oauth2.googleapis.com',
        tokenPath: '/token',
      },
    },
    // rota de callback ajustada para password-recovery
    callbackUri: `${process.env.BACKEND_URL}/auth/google/password-recovery/callback`,
    // geramos e validamos state aqui:
    generateStateFunction: async (request) => {
      const state = await bcrypt.genSalt(10)
      request.session.googleState = state
      return state
    },
    checkStateFunction: async (request) => {
      const { state } = request.query as { state?: string }
      return !!state && state === request.session.googleState
    },
  })

  // 3) Inicia o fluxo de recuperação de senha
  app.get('/auth/google/password-recovery', async (request, reply) => {
    // esse método usa sua generateStateFunction automaticamente
    const authorizeUrl = await app.googleOAuth2.generateAuthorizationUri(request, reply)
    return reply.redirect(authorizeUrl)
  })

  // 4) Callback do Google para password-recovery
  app.get('/auth/google/password-recovery/callback', async (request, reply) => {
    try {
      // já validamos o state dentro do checkStateFunction
      const { token } = await app.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(request)

      // busca dados do usuário no Google
      const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${token.access_token}` },
      })
      const userInfo = (await res.json()) as { email: string; id: string; name: string }

      // verifica se o usuário existe
      const repo = AppDataSource.getRepository(User)
      const user = await repo.findOneBy({ email: userInfo.email })
      if (!user) {
        return reply.redirect(`${process.env.FRONTEND_URL}/login?error=user_not_found`)
      }

      // gera um token de recuperação (pode ser JWT ou outro)
      const resetToken = signJwt({ userId: user.id, email: user.email })

      // redireciona pro front-end com o token de recuperação
      return reply.redirect(
          `${process.env.FRONTEND_URL}/password-recovery?token=${resetToken}`
      )
    } catch (err) {
      request.log.error('Erro no callback Google password-recovery:', err)
      return reply.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`)
    }
  })
}
