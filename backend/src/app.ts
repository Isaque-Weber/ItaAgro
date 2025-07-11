// backend/src/app.ts
import 'reflect-metadata';
import 'dotenv/config';
import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import authPlugin from './plugins/auth.plugin';
import { authRoutes } from './controllers/auth.controller';
import { adminRoutes } from './controllers/admin';
import { chatRoutes } from './controllers/chat';
import { webhookRoutes } from './controllers/webhook';
import { agrofitRoutes } from './controllers/agrofit';
import { paymentWebhookRoutes } from './controllers/paymentWebhookController';
import { subscriptionRoutes } from './controllers/subscription';
import { googleAuthPlugin } from './plugins/google-auth.plugin';

// Importa entidade e datasource para checar assinatura
import { Subscription, SubscriptionStatus } from './entities/Subscription';
import { AppDataSource }                     from './services/typeorm/data-source';

export async function build(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: true,            // log no console
    bodyLimit: 10485760      // 10MB para webhooks grandes
  });

  // 1) CORS (com credenciais)
  await app.register(cors, {
    origin: (origin, cb) => {
      const allowed = [
        'http://localhost:5173',
        'https://itaagro.up.railway.app'
      ]
      if (!origin || allowed.includes(origin)) {
        cb(null, true)
      } else {
        cb(new Error('Not allowed by CORS'), false)
      }
    },
    credentials: true,
    methods: ['GET','POST','PUT','DELETE','OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })

  // 2) Autenticação (cookie + JWT)
  await app.register(authPlugin);

  // 3) Rotas públicas de auth
  await app.register(authRoutes, { prefix: '/auth' });

  // 4) Rotas de admin (já fazem app.authenticate internamente)
  await app.register(adminRoutes, { prefix: '/admin' });

  // --------------------------------------
  // 5) Rotas de chat — somente assinantes
  // --------------------------------------

  // Middleware que exige assinatura ACTIVE ou AUTHORIZED (ou admin)
  async function requireActiveSubscription(
      req: FastifyRequest,
      reply: FastifyReply
  ) {
    const user = req.user as any;
    // Admins e seed users pulam checagem
    const SEED_USERS = ['admin@itaagro.com', 'user@itaagro.com'];
    if (user.role === 'admin' || SEED_USERS.includes(user.email)) return;

    // Busca última assinatura
    const subscriptionRepo = AppDataSource.getRepository(Subscription);
    const plan = await subscriptionRepo.findOne({
      where: { user: { id: user.sub } },
      order: { createdAt: 'DESC' }
    });

    const ok =
        plan &&
        (plan.status === SubscriptionStatus.ACTIVE ||
            plan.status === SubscriptionStatus.AUTHORIZED);

    if (!ok) {
      return reply.status(403).send({
        error: 'É necessário ter uma assinatura ativa para acessar o chat.'
      });
    }
  }

  // Registro do bloco /chat com o hook acima
  await app.register(async fb => {
    // 1) Autentica o usuário e popula req.user
    fb.addHook('preHandler', app.authenticate);
    // 2) Verifica assinatura/admin
    fb.addHook('preHandler', requireActiveSubscription);
    // 3) Registra suas rotas de chat
    await fb.register(chatRoutes, { prefix: '' });
  }, { prefix: '/chat' });

  // 6) Webhook (sem autenticação)
  await app.register(webhookRoutes, { prefix: '/webhook' });

  // 7) Agrofit API
  await app.register(agrofitRoutes, { prefix: '/agrofit' });

  // 8) Payment webhooks (sem autenticação)
  await app.register(paymentWebhookRoutes, { prefix: '/payments' });

  // 9) Subscription routes (plans, checkout, status…)
  await app.register(subscriptionRoutes, { prefix: '/api' });

  // Registra o plugin do Google OAuth
  await app.register(googleAuthPlugin);

  return app;
}
