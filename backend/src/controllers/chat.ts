import { FastifyInstance } from 'fastify'
import { AppDataSource } from '../services/typeorm/data-source'
import { ChatSession } from '../entities/ChatSession'
import { ChatMessage } from '../entities/ChatMessage'
import { processMessageWithAssistant } from '../services/openai/processMessageWithAssistant'
import { openai } from '../services/openai/openai'
import { Document } from '../entities/Document'
import * as fs from "node:fs";
import pdfParse from 'pdf-parse'
import pump from 'pump'
import * as path from 'path';
import * as os from "node:os";

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
        // Garante sempre array de arquivos, nunca null/undefined
        const withFiles = messages.map(m => ({
            ...m,
            files: Array.isArray((m as any).files) ? (m as any).files : [],
        }));

        return res.send(withFiles);
    })

    // Envia mensagem e obtém resposta do assistente
    app.post('/sessions/:id/messages', { preHandler: [app.authenticate] }, async (req, res) => {
        const { id } = req.params as { id: string }
        const { content, documents, files } = req.body as {
            content: string
            documents?: { document_id: string; filename: string }[]
            files?: { file_id: string; filename: string }[]
        }

        if (!content.trim()) {
            return res.status(400).send({ error: 'Mensagem inválida.' })
        }

        const session = await sessionRepo.findOneByOrFail({ id })

        // --- Monta o fullContent injetando PDF-to-text ---
        let fullContent = content
        const attachments = documents?.map(d => ({ id: d.document_id, filename: d.filename }))
            ?? files?.map(f => ({ id: f.file_id,       filename: f.filename   }))

        if (attachments?.length) {
            const docRepo = AppDataSource.getRepository(Document)
            const parts: string[] = []

            for (const att of attachments) {
                const doc = await docRepo.findOne({ where: { id: att.id } })
                if (doc) {
                    parts.push(`--- Conteúdo de ${att.filename} ---\n${doc.content}`)
                }
            }

            if (parts.length) {
                fullContent = parts.join('\n\n') + `\n\nPergunta: ${content}`
            }
        }

        // DEBUG: veja aqui no log o conteúdo que vai pro assistant
        req.log.debug({ fullContent }, '🛠️  Prompt para o assistant')

        // Salva a mensagem do usuário no banco
        const userMsg = messageRepo.create({ session, role: 'user', content: content, files })
        await messageRepo.save(userMsg)

        // Chama o assistant
        const reply = await processMessageWithAssistant(
            session.threadId,
            session.assistantId,
            fullContent
        )

        // Salva resposta do assistant
        const assistantMsg = messageRepo.create({ session, role: 'assistant', content: reply })
        await messageRepo.save(assistantMsg)

        return res.send({
            reply,
            userMessage: {
                id: userMsg.id,
                content: userMsg.content,
                createdAt: userMsg.createdAt
            }
        })
    })

    app.post('/upload', { preHandler: [app.authenticate] }, async (req, res) => {
        const data = await req.file();
        if (!data) return res.status(400).send({ error: 'Nenhum arquivo enviado.' });

        const tmpDir = os.tmpdir();
        const tmpPath = path.join(tmpDir, `${Date.now()}_${data.filename}`);
        await new Promise<void>((resolve, reject) => {
            pump(data.file, fs.createWriteStream(tmpPath), err => err ? reject(err) : resolve());
        });

        try {
            const buffer = fs.readFileSync(tmpPath);
            const { text } = await pdfParse(buffer);
            const now = new Date();
            const expiresAt = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

            const repo = AppDataSource.getRepository(Document);
            const doc = repo.create({ filename: data.filename, content: text, expiresAt });
            await repo.save(doc);

            fs.unlink(tmpPath, () => {});
            // Mantém file_id para compatibilidade com frontend
            return res.send({ file_id: doc.id, filename: data.filename });
        } catch (err) {
            fs.unlink(tmpPath, () => {});
            console.error('Erro ao processar PDF:', err);
            return res.status(500).send({ error: 'Falha ao processar PDF' });
        }
    });

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
