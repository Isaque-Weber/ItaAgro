import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { Repository }          from 'typeorm'
import { AppDataSource }   from '../services/typeorm/data-source'
import { User }            from '../entities/User'
import {Subscription} from "../entities/Subscription";

export async function adminRoutes(app: FastifyInstance) {
    const checkAdmin = async (req: FastifyRequest, reply: FastifyReply) => {
        const user = req.user as any
        if (user.role !== 'admin') return reply.code(403).send({ error: 'Forbidden' })
    }

    const userRepo: Repository<User> = AppDataSource.getRepository(User)
    // GET /admin/users
    app.get(
        '/users',
        { preHandler: [app.authenticate, checkAdmin] },
        async () => {
            const repo = AppDataSource.getRepository(User)
            return await repo.find({
                select: ['id','email','role','createdAt'],
            })
        }
    )

    app.get('/user/:id', { preHandler: [app.authenticate, checkAdmin] },
        async (req, reply) => {
            const u =await userRepo.findOneBy({ id: (req.params as any).id })
            if (!u) return reply.code(404).send({ error: 'Usuário não existe' })
            return u
    })

    app.post('/users', {
        preHandler: [app.authenticate, checkAdmin],
        schema: {
            body: {
                type: 'object',
                required: ['email', 'password', 'role'],
                properties: {
                    email:    { type: 'string', format: 'email' },
                    password: { type: 'string', minLength: 6 },
                    role: { type: 'string', enum: ['user', 'admin']}
                }
            }
        }
        },
        async (req, reply) => {
            const { email, password, role } = req.body as any
            // Lembrar do hash de senha em prod"
            const u = userRepo.create({ email, password, role })
            await userRepo.save(u)
            return reply.code(201).send({ message: 'Usuário criado com sucesso' })
        }
    )

    //atualizar
    app.put('/user/:id', {
        preHandler: [app.authenticate, checkAdmin],
        schema: {
            body: {
                type: 'object',
                properties: {
                    email:    { type: 'string', format: 'email' },
                    password: { type: 'string', minLength: 6 },
                    role:     { type: 'string', enum: ['user', 'admin'] }
                }
            }
        }
    },
        async (req, reply) => {
            const id = (req.params as any).id
            const upd = (req.body as any)
            await userRepo.update(id, upd)
            const u = await userRepo.findOneBy({ id })
            if (!u) return reply.code(404).send({ error: 'Usuário não existe' })
            return u

    }
    )

    //DELETE
    app.delete('/user/:id', {
        preHandler: [app.authenticate, checkAdmin],
    },
        async (req, reply) => {
            const id = (req.params as any).id
            const res = await userRepo.delete(id)
            if (res.affected ===0) return reply.code(404).send({ error: 'Usuário não existe' })
            return { message: 'Usuário deletado com sucesso' }
        }
    )


    const subRepo = AppDataSource.getRepository(Subscription)

    app.get('/subscriptions', { preHandler: [app.authenticate, checkAdmin] },
        async () => subRepo.find({ relations: ['user'] })
        )

    app.get('/subscription/:id', async (req, reply) => {
        const s = await subRepo.findOne({
            where: { id: (req.params as any).id },
            relations: ['user']
        })
        if (!s) return reply.code(404).send({ error: 'Assinatura não existe' })
        return s
    })

    app.post('/subscriptions', {
        preHandler: [app.authenticate, checkAdmin],
        schema: {
            body: {
                type: 'object',
                required: ['user_id', 'status', 'plan'],
                properties: {
                    user_id: { type: 'string', format: 'uuid' },
                    status: { type: 'string', enum: ['active', 'pending', 'canceled', 'authorized']},
                    plan: { type: 'string' }
                }
            }
        }
    },
        async (req, reply) => {
        const { user_id, status, plan } = req.body as any
            const s = subRepo.create({ 
                user: {id: user_id } as any, 
                status,
                plan
            })
            await subRepo.save(s)
            return reply.code(201).send(s)
        })

    app.put('/subscription/:id', { 
        preHandler: [app.authenticate, checkAdmin],
        schema: {
            body: {
                type: 'object',
                properties: {
                    status: { type: 'string', enum: ['active', 'pending', 'canceled', 'authorized'] },
                    plan: { type: 'string' },
                    expiresAt: { type: 'string', format: 'date-time' }
                }
            }
        }
    },
        async (req, reply) => {
            const id = (req.params as any).id
            await subRepo.update(id, req.body as any)
            const s = await subRepo.findOne({
                where: { id },
                relations: ['user']
            })
            if (!s) return reply.code(404).send({ error: 'Assinatura não existe' })
            return s
        })

    app.delete('/subscription/:id', { preHandler: [app.authenticate, checkAdmin] }, async (req, reply) => {
        const res = await subRepo.delete((req.params as any).id)
        if (res.affected === 0) return reply.code(404).send({ error: 'Assinatura não existe' })
        return { message: 'Assinatura deletada com sucesso' }
        })
}
