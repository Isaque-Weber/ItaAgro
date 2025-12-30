// backend/src/controllers/user.ts
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { AppDataSource } from '../services/typeorm/data-source'
import { Subscription, SubscriptionStatus } from '../entities/Subscription'
import { User } from '../entities/User'

export async function userRoutes(app: FastifyInstance) {
    const subscriptionRepo = AppDataSource.getRepository(Subscription)

    app.get(
        '/plan',
        { preHandler: [app.authenticate] },
        async (req: FastifyRequest, reply: FastifyReply) => {
            // 1) Pego o userId do JWT
            const user = req.user as { sub: string }
            const userId = user.sub
            if (!userId) return reply.code(401).send({ error: 'Unauthorized' })

            // 2) Busco o plano mais recente no banco
            const plan = await subscriptionRepo.findOne({
                where: { user: { id: userId } },
                order: { createdAt: 'DESC' },
                relations: ['user'],
            })
            if (!plan) return reply.code(404).send({ error: 'Nenhum plano ativo encontrado' })

            // 3) Recalculo status se já expirou
            let status = plan.status
            if (plan.expiresAt && plan.expiresAt < new Date()) {
                status = SubscriptionStatus.CANCELED
            }

            // 4) Retorno apenas os campos corretos
            return {
                name:     plan.user.name,
                email:    plan.user.email,
                expiresAt: plan.expiresAt ?? null,    // usa expiresAt
                plan:     plan.plan   ?? null,        // nome do plano (se quiser)
                status,                              // enum corrigido
            }
        }
    )
}
