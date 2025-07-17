import { openai } from './openai'
import { WeatherTool } from '../weather/weatherTool'
import { AgrofitTool } from '../agrofit/agrofitTool'

function safeOutput(str: string): string {
    if (!str) return ''
    const MAX = 200_000
    return str.length > MAX ? str.slice(0, MAX) : str
}

// Agora recebe o array de arquivos!
export async function processMessageWithAssistant(
    threadId: string,
    assistantId: string,
    content: string,
): Promise<string> {
    await openai.beta.threads.messages.create(threadId, {
        role: 'user',
        content
    })
    console.log('🛠️  Prompt para o assistant:', {
        threadId,
        assistantId,
        content
    })

    const run = await openai.beta.threads.runs.create(threadId, {
        assistant_id: assistantId,
        // max_completion_tokens: 1000,
    })
    console.log('⚙️ Run iniciado com ID:', run.id)

    let status = run.status
    let runResult = run
    const waiting = ['in_progress', 'requires_action', 'queued']
    let attempts = 0

    const weatherTool = new WeatherTool()
    const agrofitTool = new AgrofitTool()

    while (waiting.includes(status) && attempts < 40) {
        await new Promise((resolve) => setTimeout(resolve, 1000))
        runResult = await openai.beta.threads.runs.retrieve(threadId, run.id)
        status = runResult.status
        console.log('🔄 Status do run:', status)

        if (status === 'incomplete') {
            console.warn('⚠️ Run retornou status “incomplete”, saindo do loop.')
            break
        }
        attempts++

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
        try {
            const failedRun = await openai.beta.threads.runs.retrieve(threadId, run.id)
            console.error('❗ Run não finalizado com sucesso:', status)
            console.error('🪲 [Detalhes do run com falha]:', JSON.stringify(failedRun, null, 2))
            if ((failedRun as any).last_error) {
                console.error('🛑 last_error:', (failedRun as any).last_error)
            }
            if ((failedRun as any).error) {
                console.error('🛑 error:', (failedRun as any).error)
            }
        } catch (fetchErr) {
            console.error('❌ Falha ao buscar detalhes do run com erro:', fetchErr)
        }
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
