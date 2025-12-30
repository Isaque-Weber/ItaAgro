// src/app.ts
import { z } from 'zod';
import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import authPlugin from './plugins/auth.plugin';
import { authRoutes } from './controllers/auth.controller';
import { adminRoutes } from './controllers/admin.controller';
import { chatRoutes } from './controllers/chat.controller';
import { webhookRoutes } from './controllers/webhook.controller';
import { agrofitRoutes } from './controllers/agrofit.controller';
import { paymentWebhookRoutes } from './controllers/payment-webhook.controller';
import { subscriptionRoutes } from './controllers/subscription.controller';
import { googleAuthPlugin } from './plugins/google-auth.plugin';
import fastifyMultipart from '@fastify/multipart';
import cron from 'node-cron';
import { syncSubscriptionsJob } from './jobs/syncSubscriptions';

// Aqui apenas registramos plugins e rotas, sem inicializar o DataSource nem iniciar jobs
export async function build(): Promise<FastifyInstance> {
  const app = Fastify({ logger: true, bodyLimit: 10485760 });

  // 1) CORS
  await app.register(cors, {
    origin: (origin, cb) => {
      const allowed = [
        'http://localhost:5173',
        'https://itaagro.up.railway.app'
      ];
      
      // Permitir qualquer subdomínio de itaagro.com.br
      const isItaagroDomain = origin && origin.endsWith('.itaagroia.com.br');
      const isMainItaagroDomain = origin === 'https://itaagroia.com.br';
      
      if (!origin || allowed.includes(origin) || isItaagroDomain || isMainItaagroDomain) {
        cb(null, true);
      } else {
        cb(new Error('Not allowed by CORS'), false);
      }
    },
    credentials: true,
    methods: ['GET','POST','PUT','DELETE','OPTIONS'],
    allowedHeaders: ['Content-Type','Authorization'],
  });

  // Adicionando um Error Handler global
  app.setErrorHandler((error, request, reply) => {
    if (error instanceof z.ZodError) {
      reply.status(400).send({
        message: 'Validation error',
        errors: error.flatten().fieldErrors,
      });
    } else {
      // Log do erro para depuração
      request.log.error(error);

      // Em ambiente de produção, não exponha detalhes do erro
      if (process.env.NODE_ENV === 'production') {
        reply.status(500).send({
          message: 'Internal Server Error',
        });
      } else {
        // Em desenvolvimento, envie detalhes do erro
        reply.status(500).send({
          message: error.message,
          stack: error.stack,
        });
      }
    }
  });

  // 2) Autenticação
  await app.register(authPlugin);

  // 3) Multipart para uploads
  await app.register(fastifyMultipart, {
    limits: {
      fileSize: 5 * 1024 * 1024  // 5 MB
    }
  });

  // 4) Rotas de auth e admin
  await app.register(authRoutes, { prefix: '/auth' });
  await app.register(adminRoutes, { prefix: '/admin' });

  // 5) Chat (assinantes)
  async function requireActiveSubscription(req: FastifyRequest, reply: FastifyReply) {
    const user = req.user as any;
    const SEED_USERS = ['admin@itaagroia.com.br', 'user@itaagroia.com.br', 'elianebueno@itaagroia.com.br', 'tatu@itaagroia.com.br', 'luiz@itaagroia.com.br', 'ivo@itaagroia.com.br', 'vinicius@itaagroia.com.br'];
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

  // Sincroniza assinaturas todos os dias às 5h da manhã (horário do servidor)
  cron.schedule('0 5 * * *', async () => {
    app.log.info('Iniciando job de sincronizacao de assinaturas MercadoPago...');
    try {
      await syncSubscriptionsJob();
      app.log.info('Job de sincronização concluído.');
    } catch (err) {
        app.log.error({ err }, 'Erro no job de sincronização');
    }
  });
  syncSubscriptionsJob()
      .then(() => app.log.info('Job de sincronizacao executado ao iniciar o backend!'))
      .catch(err => app.log.error('Erro ao rodar sync no startup', err));

  return app;
}
