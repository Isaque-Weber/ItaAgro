import { openai } from './openai'
import { WeatherTool } from '../weather/weatherTool'
import { AgrofitTool } from '../agrofit/agrofitTool'

const agrofitTool = new AgrofitTool()

export async function processMessageWithAssistant(
    threadId: string,
    assistantId: string,
    content: string,
    temperature: number,
): Promise<string> {
    // console.log('📩 Nova mensagem recebida do usuário:', content)

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

            const toolOutputs = []

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
                    output: JSON.stringify(functionResponse)
                })
            }

            await openai.beta.threads.runs.submitToolOutputs(threadId, run.id, {
                tool_outputs: toolOutputs
            })
            console.log('📤 Respostas das ferramentas enviadas ao agente.')
        }
    }

    if (status !== 'completed') {
        console.error('❗ Run não finalizado com sucesso:', status)
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
