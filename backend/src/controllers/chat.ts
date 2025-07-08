import { FastifyInstance } from 'fastify'
import { AppDataSource } from '../services/typeorm/data-source'
import { ChatSession } from '../entities/ChatSession'
import { ChatMessage } from '../entities/ChatMessage'
import { processMessageWithAssistant } from '../services/openai/processMessageWithAssistant'
import { openai } from '../services/openai/openai'

export async function chatRoutes(app: FastifyInstance) {
    const sessionRepo = AppDataSource.getRepository(ChatSession)
    const messageRepo = AppDataSource.getRepository(ChatMessage)

    // Cria uma nova sessão de chat
    app.post('/sessions', { preHandler: [app.authenticate] }, async (req, res) => {
        try {
            const userId = String((req.user as any).sub)
            const assistantId = process.env.OPENAI_ASSISTANT_ID
            console.log(req.user)
            console.log('[DEBUG] userId:', userId)
            console.log('[DEBUG] assistantId:', assistantId)

            if (!userId || !assistantId) {
                return res.status(400).send({ error: 'Usuário ou assistente não identificado.' })
            }

            // Cria um novo thread real na OpenAI
            const thread = await openai.beta.threads.create()

            const session = sessionRepo.create({
                user: { id: userId },
                assistantId,
                threadId: thread.id,
            })

            await sessionRepo.save(session)
            return res.status(201).send(session)
        } catch (err) {
            console.error('[ERRO] Falha ao criar sessão:', err)
            return res.status(500).send({ error: 'Erro ao criar sessão' })
        }
    })

    app.get('/sessions', { preHandler: [app.authenticate] }, async (req, reply) => {
        const sessions = await sessionRepo.find({
            where: { user: { id: (req.user as any).sub } },
            order: { createdAt: 'DESC' }
        })
        reply.send(sessions)

    })

    // Retorna mensagens de uma sessão
    app.get('/sessions/:id/messages', { preHandler: [app.authenticate] }, async (req, res) => {
        const { id } = req.params as { id: string }

        const messages = await messageRepo.find({
            where: { session: { id } },
            order: { createdAt: 'ASC' },
        })

        return res.send(messages)
    })

    // Envia mensagem e obtém resposta do assistente
    app.post('/sessions/:id/messages', { preHandler: [app.authenticate] }, async (req, res) => {
        const { id } = req.params as { id: string }
        const { content } = req.body as { content: string }

        if (!content || content.trim() === '') {
            return res.status(400).send({ error: 'Mensagem inválida.' })
        }

        const session = await sessionRepo.findOneByOrFail({ id })

        // Salva mensagem do usuário
        const userMsg = messageRepo.create({
            session: session,
            role: 'user',
            content,
        })
        await messageRepo.save(userMsg)

        // Processa resposta da IA
        const reply = await processMessageWithAssistant(session.threadId, session.assistantId, content, 0.6)

        const assistantMsg = messageRepo.create({
            session: session,
            role: 'assistant',
            content: reply,
        })
        await messageRepo.save(assistantMsg)

        return res.send({ reply })
    })
    app.delete('/sessions/:id', { preHandler: [app.authenticate] }, async (req, res) => {
        const sessionId = (req.params as any).id
        const userId = (req.user as any).sub

        const session = await sessionRepo.findOne({
            where: { id: sessionId, user: { id:userId } }
        })

        if (!session) {
            return res.status(404).send({ error: 'sessão não encontrada' })
        }

        await sessionRepo.remove(session)
        return res.status(204).send()
    })
}
