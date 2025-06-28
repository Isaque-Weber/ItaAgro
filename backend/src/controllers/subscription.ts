// src/controllers/subscription.ts
import {FastifyInstance, FastifyRequest} from 'fastify';
import { MercadoPagoConfig, PreApproval, PreApprovalPlan } from 'mercadopago';
import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });

interface AuthenticatedRequest extends FastifyRequest<{
  Body: { planId: string }
}> {
  user: {
    sub:   string
    email: string
    role:  string
  }
}

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

  app.post(
      '/checkout',
      {
        preHandler: [app.authenticate],
        schema: {
          body: {
            type: 'object',
            required: ['planId'],
            properties: {
              planId: { type: 'string' }
            }
          }
        }
      },
      async (rawReq, reply) => {
        // **2) “Cast” do FastifyRequest genérico para o nosso AuthenticatedRequest**
        const req = rawReq as AuthenticatedRequest

        // 3) Agora podemos ler com segurança
        const { planId } = req.body
        const { email, sub: userId } = req.user
        const frontUrl = process.env.FRONTEND_URL!
        const token    = process.env.MERCADOPAGO_ACCESS_TOKEN!

        // 4) Monta o payload
        const payload = {
          preapproval_plan_id: planId,
          payer_email:         email,
          back_url:            `${frontUrl}/subscribe/success`,
          external_reference:  `user_${userId}`
        }

        app.log.info('🚀 Enviando para MP:', JSON.stringify(payload, null, 2))

        try {
          // 5) Chama a API do Mercado Pago direto com fetch
          const mpRes = await fetch('https://api.mercadopago.com/preapproval', {
            method: 'POST',
            headers: {
              'Content-Type':  'application/json',
              Authorization:   `Bearer ${token}`
            },
            body: JSON.stringify(payload)
          })
          const d = await mpRes.json()

          app.log.info('📥 MP retornou:', d)

          if (!d.init_point) {
            app.log.error('❌ init_point ausente na resposta', d)
            return reply.code(500).send({ error: 'init_point não retornado pelo Mercado Pago' })
          }

          // 6) Retorna a URL para o cliente redirecionar
          return reply.code(200).send({
            init_point:     d.init_point,
            subscriptionId: d.id
          })
        } catch (err: any) {
          app.log.error('-=-=- Erro Mercado Pago -=-=-')
          app.log.error('Message:', err.message)
          app.log.error('Response data:', err.response?.data ?? err)

          return reply.code(500).send({
            error: err.response?.data ?? err.message
          })
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
