//backend/src/services/openai/processMessageWithAssistant.ts
import { openai } from './openai'
import {FastifyReply} from "fastify";

export async function processMessageWithAssistant(
    threadId: string,
    assistantId: string,
    content: string,
    temperature: number,
): Promise<string> {
    await openai.beta.threads.messages.create(threadId, {
        role: 'user',
        content,
    })

    const run = await openai.beta.threads.runs.create(threadId, {
        assistant_id: assistantId,
        temperature,
        max_completion_tokens: 1000,
    })

    let status = run.status
    let runResult = run

    while (status !== 'completed' && status !== 'failed' && status !== 'cancelled') {
        await new Promise((resolve) => setTimeout(resolve, 1000))
        runResult = await openai.beta.threads.runs.retrieve(threadId, run.id)
        status = runResult.status
    }

    if (status !== 'completed') {
        throw new Error(`Run não finalizado com sucesso: ${status}`)
    }

    const messages = await openai.beta.threads.messages.list(threadId, { limit: 5 })
    const assistantMessage = messages.data.find((msg) => msg.role === 'assistant')

    const reply = assistantMessage?.content?.[0]?.type === 'text'
        ? (assistantMessage.content[0] as any).text.value
        : '[Resposta não textual ou vazia]'

    return reply
}
