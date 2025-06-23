import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { AppDataSource } from '../services/typeorm/data-source'
import { Subscription, SubscriptionStatus } from '../entities/Subscription'
import { User } from '../entities/User'

export async function userRoutes(app: FastifyInstance) {
    const subscriptionRepo = AppDataSource.getRepository(Subscription)
    const userRepo = AppDataSource.getRepository(User)

    app.get('/plan', { preHandler: [app.authenticate] }, async (req: FastifyRequest, reply: FastifyReply) => {
        const user = req.user as { sub: string }
        const userId = user?.sub

        if (!userId) {
            return reply.code(401).send({ error: 'Unauthorized' })
        }

        // Busca o plano mais recente do usuário
        const plan = await subscriptionRepo.findOne({
            where: { user: { id: userId } },
            order: { createdAt: 'DESC' },
            relations: ['user'],
        })

        if (!plan) {
            return reply.code(404).send({ error: 'Nenhum plano ativo encontrado' })
        }

        // Calcula status com base na data de expiração
        let status = plan.status
        if (plan.endDate && new Date(plan.endDate) < new Date()) {
            status = SubscriptionStatus.CANCELLED
        }

        return {
            name: plan.user.name,
            email: plan.user.email,
            endDate: plan.endDate,
            limit: plan.limit ?? null,
            status,
        }
    })
}
