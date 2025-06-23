import { openai } from '../services/openai/openai'
import { weatherToolDefinition } from '../services/weather/weatherTool'
import { agrofitTools } from '../services/agrofit/agrofitToolDefinition'
import dotenv from 'dotenv'

dotenv.config()

async function updateAssistant(): Promise<void> {
  try {
    const assistantId = process.env.OPENAI_ASSISTANT_ID

    if (!assistantId) {
      console.error('OPENAI_ASSISTANT_ID não configurado no .env')
      process.exit(1)
    }

    console.log(`🔄 Atualizando assistente ${assistantId} com ferramentas...`)

    const assistant = await openai.beta.assistants.retrieve(assistantId)

    const existingTools = assistant.tools.map(t =>
        t.type === 'function' ? t.function.name : t.type
    )

    const updatedTools = [...assistant.tools]

    let addedCount = 0

    // Adiciona ferramenta de clima se não existir
    if (!existingTools.includes('get_weather')) {
      console.log('✅ Adicionando ferramenta de clima')
      updatedTools.push(weatherToolDefinition as any)
      addedCount++
    }

    // Adiciona ferramenta do Agrofit se não existir
    if (!existingTools.includes('get_product_info')) {
      console.log('✅ Adicionando ferramenta Agrofit')
      updatedTools.push(...agrofitTools as any)
      addedCount++
    }

    if (addedCount > 0) {
      const updatedAssistant = await openai.beta.assistants.update(assistantId, {
        tools: updatedTools
      })

      console.log('✅ Assistente atualizado com sucesso!')
      console.log('🧰 Ferramentas configuradas:',
          updatedAssistant.tools.map(t => t.type === 'function' ? t.function.name : t.type)
      )
    } else {
      console.log('🚫 Nenhuma ferramenta nova para adicionar.')
    }

  } catch (error) {
    console.error('❌ Erro ao atualizar o assistente:', error)
    process.exit(1)
  }
}

void updateAssistant()
