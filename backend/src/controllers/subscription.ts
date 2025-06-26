// src/controllers/subscription.ts
import { FastifyInstance } from 'fastify';
import { MercadoPagoConfig, PreApproval, PreApprovalPlan } from 'mercadopago';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

export async function subscriptionRoutes(app: FastifyInstance) {
  // configura o client do Mercado Pago
  const mpConfig = new MercadoPagoConfig({
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
    options: { timeout: 5000 }
  });

  // 🎯 GET /plans — lista todos os planos ativos de assinatura
  app.get('/plans', { preHandler: [app.authenticate] }, async (req, reply) => {
    try {
      const planClient = new PreApprovalPlan(mpConfig);
      const res = await planClient.search({ options: { status: 'active' } });

      const plans = (res.results ?? []).map(plan => {
        // para planos ativos, auto_recurring e init_point sempre existem
        const ar = plan.auto_recurring!;
        return {
          id:            plan.id!,
          reason:        plan.reason!,
          transaction_amount: ar.transaction_amount,
          frequency_type:      ar.frequency_type,
          frequency:           ar.frequency,
          repetitions:         ar.repetitions,
          init_point:          plan.init_point!
        };
      });

      return reply.code(200).send(plans);
    } catch (err) {
      app.log.error(err, 'Error fetching subscription plans');
      return reply.code(500).send({ error: 'Failed to fetch subscription plans' });
    }
  });

  // 🛒 POST /checkout — cria sessão de checkout para um dado plano
  app.post(
      '/checkout',
      {
        preHandler: [app.authenticate],
        schema: {
          body: {
            type: 'object',
            required: ['planId'],
            properties: {
              planId: { type: 'string' },
              reason: { type: 'string' }
            }
          }
        }
      },
      async (req, reply) => {
        const { planId } = req.body as { planId: string };
        const email     = (req.user as any).email as string;
        const frontUrl  = process.env.FRONTEND_URL!;
        const token     = process.env.MERCADOPAGO_ACCESS_TOKEN!;

        // @ts-ignore
        const payload = {
          preapproval_plan_id: planId,
          payer_email:         email,
          back_url:            `${frontUrl}/subscribe/success`,
          external_reference:  `user_${req.user.sub}`
        };

        // Log legível:
        app.log.info('📤 Enviando para MP: ' + JSON.stringify(payload, null, 2));

        try {
          const mpRes = await fetch('https://api.mercadopago.com/preapproval', {
            method: 'POST',
            headers: {
              'Content-Type':  'application/json',
              Authorization:   `Bearer ${token}`
            },
            body: JSON.stringify(payload)
          });

          const data = await mpRes.json();
          app.log.info('📥 MP retornou: ' + JSON.stringify(data, null, 2));

          if (!mpRes.ok) {
            const msg = data.message || JSON.stringify(data);
            return reply.status(500).send({ error: `MP error: ${msg}` });
          }
          if (!data.init_point) {
            return reply.status(500).send({ error: 'init_point não retornado pelo MP' });
          }

          return reply.send({
            init_point:     data.init_point,
            subscriptionId: data.id
          });
        } catch (err: any) {
          app.log.error('❌ Erro ao chamar MP diretamente:', err);
          return reply.status(500).send({ error: err.message || 'Checkout failed' });
        }
      }
  )
  app.get(
      '/subscriptions/:id',
      { preHandler: [app.authenticate] },
      async (req, reply) => {
        const { id } = req.params as { id: string }
        try {
          // chamar Mercado Pago via node-fetch ou SDK:
          const mpRes = await fetch(`https://api.mercadopago.com/preapproval/${id}`, {
            headers: { Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}` }
          })
          const data = await mpRes.json()
          if (!mpRes.ok) {
            return reply.code(mpRes.status).send({ error: data.message })
          }
          return reply.send({
            id: data.id,
            status: data.status,
            next_payment_date: data.next_payment_date
          })
        } catch (err: any) {
          req.log.error(err)
          return reply.code(500).send({ error: 'Erro ao buscar assinatura' })
        }
      }
  )
  app.get(
      '/subscription/status',
      { preHandler: [app.authenticate] }, // já valida JWT
      async (req, reply) => {
        const userId = (req.user as any).sub
        // Exemplo: se você salva no BD:
        // const sub = await subscriptionRepo.findOne({ where: { userId, status: 'authorized' } })
        // return reply.send({ subscribed: !!sub })

        // Ou chame a API do MP pra checar:
        const mpRes = await fetch(
            `https://api.mercadopago.com/preapproval/search?payer.id=${userId}`,
            {
              headers: { Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}` }
            }
        )
        const mpJson = await mpRes.json()
        const active = mpJson.results?.some((p:any) => p.status === 'authorized' || p.status === 'paused')
        return reply.send({ subscribed: !!active })
      }
  )
}
