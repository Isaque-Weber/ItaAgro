//backend/src/services/openai/processMessageWithAssistant.ts
import { openai } from './openai'
import { FastifyReply } from "fastify";
import { WeatherTool } from '../weather/weatherTool';

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

    // Inicializa as ferramentas
    const weatherTool = new WeatherTool();

    // Loop para processar o run e lidar com chamadas de ferramentas
    while (status !== 'completed' && status !== 'failed' && status !== 'cancelled') {
        await new Promise((resolve) => setTimeout(resolve, 1000))
        runResult = await openai.beta.threads.runs.retrieve(threadId, run.id)
        status = runResult.status

        // Verifica se há chamadas de ferramentas pendentes
        if (status === 'requires_action' && runResult.required_action?.type === 'submit_tool_outputs') {
            const toolCalls = runResult.required_action.submit_tool_outputs.tool_calls;
            const toolOutputs = [];

            // Processa cada chamada de ferramenta
            for (const toolCall of toolCalls) {
                const functionName = toolCall.function.name;
                let functionResponse;

                try {
                    // Parse dos argumentos da função
                    const args = JSON.parse(toolCall.function.arguments);
                    console.log(`Chamada de ferramenta: ${functionName}`, args);

                    // Direciona para a ferramenta apropriada
                    if (functionName === 'get_weather') {
                        functionResponse = await weatherTool.handleFunctionCall(functionName, args);
                    } else {
                        functionResponse = { error: `Ferramenta não suportada: ${functionName}` };
                    }
                } catch (error) {
                    console.error(`Erro ao processar chamada de ferramenta ${functionName}:`, error);
                    functionResponse = { error: `Erro ao processar ferramenta: ${error}` };
                }

                // Adiciona a resposta da ferramenta
                toolOutputs.push({
                    tool_call_id: toolCall.id,
                    output: JSON.stringify(functionResponse)
                });
            }

            // Submete as respostas das ferramentas
            await openai.beta.threads.runs.submitToolOutputs(threadId, run.id, {
                tool_outputs: toolOutputs
            });
        }
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
