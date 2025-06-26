import 'reflect-metadata';
import 'dotenv/config';
import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import authPlugin from './plugins/auth.plugin';
import { authRoutes } from './controllers/auth.controller';
import { adminRoutes } from './controllers/admin';
import { chatRoutes } from './controllers/chat';
import { webhookRoutes } from './controllers/webhook';
import { agrofitRoutes } from './controllers/agrofit';
import { paymentWebhookRoutes } from './controllers/paymentWebhookController';
import { subscriptionRoutes } from './controllers/subscription';

/**
 * Build a Fastify instance for the application
 * This is used both by the main server and by tests
 */
export async function build(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: true, // Enable logger for development
    bodyLimit: 10485760 // 10MB for larger webhook payloads
  });

  // 1) CORS (needs credentials to send HttpOnly cookies)
  await app.register(cors, {
    origin: (origin, cb) => {
      const allowedOrigins = [
        'http://localhost:5173',
        'https://itaagro.up.railway.app'
      ];
      if (!origin || allowedOrigins.includes(origin)) {
        cb(null, true);
      } else {
        cb(new Error("Not allowed by CORS"), false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  });

  // 2) Authentication plugin (cookie + jwt + authenticate)
  await app.register(authPlugin);

  // 3) Public auth routes
  await app.register(authRoutes, { prefix: '/auth' });

  // 4) Admin routes (already use app.authenticate internally)
  await app.register(adminRoutes, { prefix: '/admin' });

  // 5) Chat routes — só usuários assinantes ou admin entram
  await app.register(async fb => {
    // Hook roda antes de qualquer handler dentro de /chat
    fb.addHook('preHandler', async (req, reply) => {
      const user = req.user as any;
      // Admin ignora a verificação de assinatura
      if (user.role === 'admin') return;

      // Checa status de assinatura
      const statusRes = await fb.inject({
        method: 'GET',
        url: '/api/subscription/status',
        headers: { cookie: req.headers.cookie! }
      });
      const { subscribed } = statusRes.json() as { subscribed: boolean };

      if (!subscribed) {
        return reply.code(403).send({
          error: 'Você precisa assinar antes de acessar o chat.'
        });
      }
    });

    // Depois do hook, registramos as rotas normais de chat
    await fb.register(chatRoutes, { prefix: '' });
  }, { prefix: '/chat' });

  // 6) Webhook routes (no authentication)
  await app.register(webhookRoutes, { prefix: '/webhook' });

  // 7) Agrofit API routes
  await app.register(agrofitRoutes, { prefix: '/agrofit' });

  // 8) Payment webhook routes (no authentication)
  await app.register(paymentWebhookRoutes, { prefix: '/payments' });

  // 9) Subscription routes
  await app.register(subscriptionRoutes, { prefix: '/api' });

  // 10) Example protected route
  app.get(
    '/protected',
    { preHandler: [app.authenticate] },
    async () => ({ data: 'Protected content accessed!' })
  );

  return app;
}
