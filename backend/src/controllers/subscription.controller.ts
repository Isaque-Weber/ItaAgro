// src/controllers/subscription.ts
import { FastifyInstance, FastifyRequest, FastifyReply, RouteShorthandOptions } from 'fastify';
import { MercadoPagoConfig, PreApprovalPlan } from 'mercadopago'
import dotenv from 'dotenv'
import { AppDataSource } from '../services/typeorm/data-source'
import { Subscription, SubscriptionStatus } from '../entities/Subscription'
import { User } from '../entities/User'
import { MercadoPagoClient, transformMercadoPagoStatus } from '../services/mercadopago'
dotenv.config({ path: '../.env' })

interface AuthenticatedRequest extends FastifyRequest<{
  Body: { planId: string }
}> {
  user: {
    sub:   string
    email: string
    role:  string
  }
}
type CancelBody = { preapproval_id: string }

export async function subscriptionRoutes(app: FastifyInstance) {
  // configura o client do Mercado Pago
  const mpConfig = new MercadoPagoConfig({
    accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN!,
    options: { timeout: 5000 }
  })
  const cancelOpts: RouteShorthandOptions = {
    preHandler: [app.authenticate],
    schema: {
      body: {
        type: 'object',
        required: ['preapproval_id'],
        properties: { preapproval_id: { type: 'string' } },
      },
    },
  };

  // 🎯 GET /plans — lista todos os planos ativos de assinatura
  app.get('/plans', { preHandler: [app.authenticate] }, async (req, reply) => {
      const planClient = new PreApprovalPlan(mpConfig)
      const res = await planClient.search({ options: { status: 'active' } })

      const plans = (res.results ?? []).map(plan => {
        // para planos ativos, auto_recurring e init_point sempre existem
        const ar = plan.auto_recurring!
        return {
          id:            plan.id!,
          reason:        plan.reason!,
          transaction_amount: ar.transaction_amount,
          frequency_type:      ar.frequency_type,
          frequency:           ar.frequency,
          repetitions:         ar.repetitions,
          init_point:          plan.init_point!
        }
      })

      return reply.code(200).send(plans)
  })

  app.get('/user/plan', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { sub: userId } = req.user as any
    const subscriptionRepo = AppDataSource.getRepository(Subscription)
    const userRepo = AppDataSource.getRepository(User)

    const user = await userRepo.findOne({ where: { id: userId } })
    if (!user) return reply.code(404).send({ error: 'Usuário não encontrado' })

    // Busca a assinatura ativa/authorized do usuário
    const subscription = await subscriptionRepo
        .createQueryBuilder('subscription')
        .leftJoinAndSelect('subscription.user', 'user')
        .where('user.id = :userId', { userId })
        .andWhere('subscription.status IN (:...statuses)', { statuses: ['authorized', 'active'] })
        .orderBy('subscription.updatedAt', 'DESC')
        .getOne()

    if (!subscription) return reply.code(404).send({ error: 'Assinatura não encontrada' })

    // Estrutura de resposta para o frontend
    return reply.send({
      name: user.name,
      email: user.email,
      plan: subscription.plan,
      endDate: subscription.expiresAt,
      planId: subscription.externalId,
    })
  })


  app.post('/checkout', {
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

          app.log.info(`🚀 Enviando para MP: ${JSON.stringify(payload, null, 2)}`);

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
      }
  )
  app.get(
      '/subscriptions/:id',
      { preHandler: [app.authenticate] },
      async (req, reply) => {
        const { id } = req.params as { id: string }
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
  app.post(
      '/subscriptions/confirm',
      { preHandler: [app.authenticate] },
      async (req, reply) => {
        const { preapproval_id } = req.body as { preapproval_id: string }
        const { sub: userId } = req.user as any

        if (!preapproval_id) {
          return reply.code(400).send({ error: 'preapproval_id não fornecido' })
        }

          // Consulta assinatura no Mercado Pago
          const mp = new MercadoPagoClient()
          const mpSub = await mp.getSubscription(preapproval_id)

          if (!mpSub) {
            return reply.code(404).send({ error: 'Assinatura não encontrada no Mercado Pago' })
          }

          // Busca user pelo userId (sempre associar ao logado!)
          const userRepo = AppDataSource.getRepository(User)
          const user = await userRepo.findOne({ where: { id: userId } })
          if (!user) {
            return reply.code(404).send({ error: 'Usuário não encontrado' })
          }

          // Busca ou cria assinatura local
          const subscriptionRepo = AppDataSource.getRepository(Subscription)
          let sub = await subscriptionRepo.findOne({
            where: { externalId: preapproval_id },
            relations: ['user'],
          })

          if (sub) {
            // Atualiza assinatura existente
            sub.status = transformMercadoPagoStatus(mpSub.status) as SubscriptionStatus
            sub.expiresAt = mpSub.end_date ? new Date(mpSub.end_date) : undefined
            sub.plan = mpSub.reason
            sub.updatedAt = new Date()
            sub.user = user // reforça vínculo
            await subscriptionRepo.save(sub)
          } else {
            // Cria nova assinatura
            sub = subscriptionRepo.create({
              externalId: preapproval_id,
              status: transformMercadoPagoStatus(mpSub.status) as SubscriptionStatus,
              user,
              expiresAt: mpSub.end_date ? new Date(mpSub.end_date) : undefined,
              plan: mpSub.reason,
            })
            await subscriptionRepo.save(sub)
          }

          return reply.send({
            id: sub.externalId,
            status: sub.status,
            next_payment_date: mpSub.next_payment_date,
            plan: sub.plan,
          })
      }
  )

  app.post(
      '/subscriptions/refresh',
      { preHandler: [app.authenticate] },
      async (req, reply) => {
        const { preapproval_id } = req.body as { preapproval_id: string }
        const { sub: userId } = req.user as any

        if (!preapproval_id) {
          return reply.code(400).send({ error: 'preapproval_id não fornecido' })
        }

          // Consulta assinatura diretamente no Mercado Pago
          const mp = new MercadoPagoClient()
          const mpSub = await mp.getSubscription(preapproval_id)
          if (!mpSub) {
            return reply.code(404).send({ error: 'Assinatura não encontrada no Mercado Pago' })
          }

          // Busca user pelo userId
          const userRepo = AppDataSource.getRepository(User)
          const user = await userRepo.findOne({ where: { id: userId } })
          if (!user) {
            return reply.code(404).send({ error: 'Usuário não encontrado' })
          }

          // Busca ou cria assinatura local
          const subscriptionRepo = AppDataSource.getRepository(Subscription)
          let sub = await subscriptionRepo.findOne({
            where: { externalId: preapproval_id },
            relations: ['user'],
          })

          const newStatus = transformMercadoPagoStatus(mpSub.status) as SubscriptionStatus

          if (sub) {
            sub.status = newStatus
            sub.expiresAt = mpSub.end_date ? new Date(mpSub.end_date) : undefined
            sub.plan = mpSub.reason
            sub.updatedAt = new Date()
            sub.user = user
            await subscriptionRepo.save(sub)
          } else {
            // Se não existir, opcional: crie localmente
            sub = subscriptionRepo.create({
              externalId: preapproval_id,
              status: newStatus,
              user,
              expiresAt: mpSub.end_date ? new Date(mpSub.end_date) : undefined,
              plan: mpSub.reason,
            })
            await subscriptionRepo.save(sub)
          }

          // Atualize o campo de acesso do usuário
          const isActive = newStatus === SubscriptionStatus.ACTIVE || newStatus === SubscriptionStatus.AUTHORIZED
          await userRepo.update(user.id, { subscriptionActive: isActive })

          return reply.send({
            id: sub.externalId,
            status: sub.status,
            next_payment_date: mpSub.next_payment_date,
            plan: sub.plan,
          })
      }
  )

  app.post<{ Body: CancelBody }>('/subscriptions/cancel', cancelOpts,
      async (req: FastifyRequest<{ Body: CancelBody }>, reply: FastifyReply) => {
        const { preapproval_id } = req.body;
        if (!preapproval_id) {
          return reply.code(400).send({ error: 'preapproval_id obrigatório' });
        }
          const mp = new MercadoPagoClient();
          // Cancela no MP
          await mp.cancelSubscription(preapproval_id);

          // Atualiza status no banco
          const subscriptionRepo = AppDataSource.getRepository(Subscription);
          await subscriptionRepo.update(
              { externalId: preapproval_id },
              { status: SubscriptionStatus.CANCELED }
          );

          return reply.send({ success: true });
      }
  );


}
