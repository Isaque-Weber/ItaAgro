import { openai } from './openai'
import { ChatMessage } from '../../entities/ChatMessage'
import { WeatherTool, weatherToolDefinition } from '../weather/weatherTool'
import { AgrofitTool } from '../agrofit/agrofitTool'
import { agrofitTools } from '../agrofit/agrofitToolDefinition'
import { ChatCompletionMessageParam, ChatCompletionTool } from 'openai/resources/chat/completions'

const SYSTEM_PROMPT = `Você é ItaAgro, consultor agronômico sênior especialista em bulas de herbicidas, especificações de defensivos e argumentos comerciais. Refira-se a si mesmo no masculino e responda sempre em português.

ESTILO DE COMUNICAÇÃO:
- Tom técnico, analítico e conciso
- Use terminologia agronômica precisa. Não use emojis
- Explique mecanismos de ação e implicações práticas
- Responda de forma direta e estruturada, utilizando listas para detalhes técnicos
- Seja transparente ao indicar produtos do portfólio Ita Agro
- Limite de resposta: 350 tokens

TRATAMENTO DE PDFs ANEXADOS:
Quando receber conteúdo de PDF anexado:
1. Prioridade máxima: analise e responda exclusivamente com base no conteúdo do PDF
2. Não utilize base de conhecimento nem ferramentas externas enquanto houver conteúdo relevante no PDF
3. Faça referência ao PDF pelo nome fornecido quando pertinente
4. Apenas se a informação solicitada não estiver presente no PDF, utilize ferramentas para complementar
5. Se não encontrar a resposta no PDF, avise: "A informação solicitada não está presente no PDF enviado." Só então busque em outras fontes

SUA MISSÃO:
Atuar como consultor agronômico de alto nível, fornecendo análise técnica, orientação prática e recomendações de produtos Ita Agro conforme necessidade técnica.

Fluxo de Ação Principal (MIP):
1. Diagnóstico/Monitoramento: identifique espécie, nível de infestação e estágio da cultura. Use get_weather para dados meteorológicos (confirme cidade e estado)
2. Níveis de Ação: defina limiares conforme estágio da cultura e pressão da praga
3. Táticas de Controle: explique opções (Cultural, Biológico, Comportamental, Químico). Para químico, detalhe grupo IRAC, seletividade, momento ideal, tecnologia de aplicação e rotação
4. Manejo de Resistência: inclua recomendações sempre
5. Informações Adicionais: impacto ambiental, segurança do aplicador e intervalos de segurança

RECOMENDAÇÕES COMERCIAIS:
- Sempre inicie por análise técnica neutra
- Recomende produtos Ita Agro somente se pertinente e explique tecnicamente o motivo
- Compare alternativas se houver
- Destaque benefícios do portfólio Ita Agro
- Nunca informe preços

FERRAMENTAS DISPONÍVEIS:
- get_weather: dados meteorológicos (confirme cidade/estado)
- get_product_info: detalhes de produto Agrofit por nome (use se não encontrar na base)
- get_brands: listar marcas do Agrofit
- get_toxicological_classes: classificações toxicológicas
- get_environmental_classes: classificações ambientais
- get_application_techniques: técnicas de aplicação

Se uma ferramenta falhar, não mencione a falha. Responda com o melhor conhecimento disponível.

RESTRIÇÕES:
- Não forneça dosagens diretas; oriente a consultar a bula
- Nunca fabrique dados
- Não informe preços
- Não atenda temas fora de agronomia/clima brasileiro. Para outros temas: "Desculpe, minha especialidade é agronomia e clima em cidades brasileiras. Posso ajudar com alguma questão agronômica?"
- Sempre enfatize o cumprimento das recomendações de bula
- Sempre recomende a consulta a um engenheiro agrônomo local`

// Converte tools para formato Chat Completion
const tools: ChatCompletionTool[] = [
  {
    type: 'function',
    function: weatherToolDefinition.function
  },
  ...agrofitTools
    .filter(t => t.type === 'function')
    .map(t => ({
      type: 'function' as const,
      function: (t as any).function
    }))
]


function safeOutput(str: string): string {
  if (!str) return ''
  const MAX = 50_000
  return str.length > MAX ? str.slice(0, MAX) : str
}

export async function processMessageWithChatCompletion(
  content: string,
  history: ChatMessage[],
  onProgress?: (partialContent: string) => Promise<void>
): Promise<string> {
  
  // Monta mensagens com histórico
  const messages: ChatCompletionMessageParam[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history.map(m => ({ 
      role: m.role as 'user' | 'assistant', 
      content: m.content 
    })),
    { role: 'user', content }
  ]
  
  const weatherTool = new WeatherTool()
  const agrofitTool = new AgrofitTool()

  // Loop para tratar tool calls (máximo 5 iterações para evitar loops infinitos)
  for (let i = 0; i < 5; i++) {
    console.log(`🚀 Iniciando Chat Completion (Iteração ${i + 1})...`)
    
    // Usamos stream: true para poder capturar o conteúdo progressivamente
    const stream = await openai.chat.completions.create({
      model: 'gpt-5-mini',
      messages,
      tools,
      tool_choice: 'auto',
      max_completion_tokens: 1000,
      stream: true, 
    })

    let accumulatedContent = ''
    let toolCallsMap: Record<number, { id: string, name: string, args: string }> = {}
    let finishReason = null

    // Processa o stream
    for await (const chunk of stream) {
      const delta = chunk.choices[0].delta
      finishReason = chunk.choices[0].finish_reason

      // 1. Acumula Conteúdo (Resposta pro usuário)
      if (delta.content) {
        accumulatedContent += delta.content
        // Só chama o onProgress se tivermos conteúdo relevante e callback
        if (onProgress) {
            // Otimização: pode chamar a cada X caracteres ou a cada quebra de linha
            // Aqui chamamos direto, o worker pode controlar o debounce se quiser
            await onProgress(accumulatedContent)
        }
      }

      // 2. Acumula Tool Calls (Argumentos vêm fragmentados)
      if (delta.tool_calls) {
        for (const tc of delta.tool_calls) {
          const index = tc.index
          if (!toolCallsMap[index]) {
            toolCallsMap[index] = { 
              id: tc.id || '', 
              name: tc.function?.name || '', 
              args: tc.function?.arguments || '' 
            }
          } else {
            // Concatena argumentos
            if (tc.function?.arguments) {
              toolCallsMap[index].args += tc.function.arguments
            }
          }
        }
      }
    }

    // Se houve tool calls, elas terão prioridade sobre o content
    const toolCalls = Object.values(toolCallsMap)
    
    // Se não houve tool calls, terminamos aqui e retornamos o conteúdo final
    if (toolCalls.length === 0) {
      console.log('✅ Chat Completion finalizado (Sem tools)')
      return accumulatedContent || '[Resposta vazia]'
    }

    // Se houve tool calls, executamos
    console.log(`🛠️ Detectado(s) ${toolCalls.length} tool call(s)`)
    
    // Adiciona a mensagem do assistant com as tool_calls ao histórico (necessário para a próxima iteração)
    messages.push({
      role: 'assistant',
      content: accumulatedContent || null,
      tool_calls: toolCalls.map(tc => ({
        id: tc.id,
        type: 'function',
        function: { name: tc.name, arguments: tc.args }
      }))
    })

    // Executa cada tool
    for (const toolCall of toolCalls) {
        const functionName = toolCall.name
        const argsString = toolCall.args
        let result: any
        
        try {
          // Parse args com segurança
          const args = JSON.parse(argsString)
          console.log(`🔧 Executando ${functionName} com args:`, JSON.stringify(args).substring(0, 100))
          
          if (functionName === 'get_weather') {
            result = await weatherTool.handleFunctionCall(functionName, args)
          } else {
            result = await agrofitTool.handleFunctionCall(functionName, args)
          }
          console.log(`✅ Resultado ${functionName}:`, JSON.stringify(result).substring(0, 200))
        } catch (error) {
          console.error(`❌ Erro em ${functionName}:`, error)
          result = { error: `Erro ao executar ${functionName}: ${error}` }
        }
        
        // Adiciona resultado da tool ao histórico
        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: safeOutput(JSON.stringify(result))
        })
    }
    // Loop continua para a próxima iteração (OpenAI vai processar os resultados das tools)
  }

  return 'Limite de iterações de tool calling excedido.'
}
