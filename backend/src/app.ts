// src/app.ts
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
import fastifyMultipart from '@fastify/multipart';

// Aqui apenas registramos plugins e rotas, sem inicializar o DataSource nem iniciar jobs
export async function build(): Promise<FastifyInstance> {
  const app = Fastify({ logger: true, bodyLimit: 10485760 });

  // 1) CORS
  await app.register(cors, {
    origin: (origin, cb) => {
      const allowed = ['http://localhost:5173','https://itaagro.up.railway.app'];
      if (!origin || allowed.includes(origin)) cb(null, true);
      else cb(new Error('Not allowed by CORS'), false);
    },
    credentials: true,
    methods: ['GET','POST','PUT','DELETE','OPTIONS'],
    allowedHeaders: ['Content-Type','Authorization'],
  });

  // 2) Autenticação
  await app.register(authPlugin);

  // 3) Multipart para uploads
  app.register(fastifyMultipart);

  // 4) Rotas de auth e admin
  await app.register(authRoutes, { prefix: '/auth' });
  await app.register(adminRoutes, { prefix: '/admin' });

  // 5) Chat (assinantes)
  async function requireActiveSubscription(req: FastifyRequest, reply: FastifyReply) {
    const user = req.user as any;
    const SEED_USERS = ['admin@itaagro.com','user@itaagro.com'];
    if (user.role === 'admin' || SEED_USERS.includes(user.email)) return;
    const { AppDataSource } = await import('./services/typeorm/data-source');
    const { Subscription, SubscriptionStatus } = await import('./entities/Subscription');
    const plan = await AppDataSource.getRepository(Subscription).findOne({
      where: { user: { id: user.sub } },
      order: { createdAt: 'DESC' }
    });
    const ok = plan && [SubscriptionStatus.ACTIVE, SubscriptionStatus.AUTHORIZED].includes(plan.status);
    if (!ok) return reply.status(403).send({ error: 'Assinatura ativa necessária.' });
  }
  await app.register(async fb => {
    fb.addHook('preHandler', app.authenticate);
    fb.addHook('preHandler', requireActiveSubscription);
    await fb.register(chatRoutes, { prefix: '/chat' });
  });

  // 6) Outros módulos (webhook, agrofit, payments, subscription, googleAuth)
  await app.register(webhookRoutes, { prefix: '/webhook' });
  await app.register(agrofitRoutes, { prefix: '/agrofit' });
  await app.register(paymentWebhookRoutes, { prefix: '/payments' });
  await app.register(subscriptionRoutes, { prefix: '/api' });
  await app.register(googleAuthPlugin);

  return app;
}