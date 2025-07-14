import { openai } from './openai'
import { WeatherTool } from '../weather/weatherTool'
import { AgrofitTool } from '../agrofit/agrofitTool'

const agrofitTool = new AgrofitTool()

// Limita o tamanho das saídas das ferramentas para evitar erros >1MB
function safeOutput(str: string): string {
    if (!str) return ''
    const MAX = 200_000
    return str.length > MAX ? str.slice(0, MAX) : str
}

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
    console.log('📨 Mensagem registrada na thread:', threadId)

    const run = await openai.beta.threads.runs.create(threadId, {
        assistant_id: assistantId,
        temperature,
        max_completion_tokens: 1000,
    })
    console.log('⚙️ Run iniciado com ID:', run.id)

    let status = run.status
    let runResult = run

    const weatherTool = new WeatherTool()

    while (status !== 'completed' && status !== 'failed' && status !== 'cancelled') {
        await new Promise((resolve) => setTimeout(resolve, 1000))
        runResult = await openai.beta.threads.runs.retrieve(threadId, run.id)
        status = runResult.status
        console.log('🔄 Status do run:', status)

        if (status === 'requires_action' && runResult.required_action?.type === 'submit_tool_outputs') {
            const toolCalls = runResult.required_action.submit_tool_outputs.tool_calls
            console.log('🧠 Agente solicitou uso de ferramentas:', toolCalls.map(t => t.function.name))

            const toolOutputs: {tool_call_id: string, output: string}[] = []

            for (const toolCall of toolCalls) {
                const functionName = toolCall.function.name
                let functionResponse

                try {
                    const args = JSON.parse(toolCall.function.arguments)
                    console.log(`🔧 Executando ferramenta ${functionName} com argumentos:`, args)

                    if (functionName === 'get_weather') {
                        functionResponse = await weatherTool.handleFunctionCall(functionName, args)
                    } else if (functionName === 'get_product_info') {
                        functionResponse = await agrofitTool.handleFunctionCall(functionName, args)
                    } else {
                        functionResponse = { error: `Ferramenta não suportada: ${functionName}` }
                    }

                    console.log(`✅ Resposta da ferramenta ${functionName}:`, functionResponse)
                } catch (error) {
                    console.error(`❌ Erro na ferramenta ${functionName}:`, error)
                    functionResponse = { error: `Erro ao processar ferramenta: ${error}` }
                }

                // Usa safeOutput para não ultrapassar 1MB
                toolOutputs.push({
                    tool_call_id: toolCall.id,
                    output: safeOutput(JSON.stringify(functionResponse))
                })
            }

            await openai.beta.threads.runs.submitToolOutputs(threadId, run.id, {
                tool_outputs: toolOutputs
            })
            console.log('📤 Respostas das ferramentas enviadas ao agente.')

            // Aguarda o run terminar antes de seguir
            let finalRun = await openai.beta.threads.runs.retrieve(threadId, run.id)
            while (
                finalRun.status === 'in_progress' ||
                finalRun.status === 'requires_action' ||
                finalRun.status === 'queued'
                ) {
                await new Promise(r => setTimeout(r, 500))
                finalRun = await openai.beta.threads.runs.retrieve(threadId, run.id)
            }
            console.log('✅ Run finalizado com status:', finalRun.status)
        }
    }

    if (status !== 'completed') {
        // >>>>>>>>>>>> COMPLEMENTO DE LOG DETALHADO DE FALHA <<<<<<<<<<<<<<<
        try {
            // Consulta detalhes do run mais recente
            const failedRun = await openai.beta.threads.runs.retrieve(threadId, run.id)
            console.error('❗ Run não finalizado com sucesso:', status)
            // Loga objeto completo para inspecionar
            console.error('🪲 [Detalhes do run com falha]:', JSON.stringify(failedRun, null, 2))
            // Se houver campos de erro específicos, destaca
            if ((failedRun as any).last_error) {
                console.error('🛑 last_error:', (failedRun as any).last_error)
            }
            if ((failedRun as any).error) {
                console.error('🛑 error:', (failedRun as any).error)
            }
        } catch (fetchErr) {
            console.error('❌ Falha ao buscar detalhes do run com erro:', fetchErr)
        }
        // Lança o erro como antes
        throw new Error(`Run não finalizado com sucesso: ${status}`)
    }

    const messages = await openai.beta.threads.messages.list(threadId, { limit: 5 })
    const assistantMessage = messages.data.find((msg) => msg.role === 'assistant')

    const reply = assistantMessage?.content?.[0]?.type === 'text'
        ? (assistantMessage.content[0] as any).text.value
        : '[Resposta não textual ou vazia]'

    console.log('💬 Resposta final do agente:', reply)
    return reply
}
