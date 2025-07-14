// backend/src/scripts/updateAssistantTools.ts
import { openai } from '../services/openai/openai';
import { weatherToolDefinition } from '../services/weather/weatherTool';
import { agrofitTools } from '../services/agrofit/agrofitToolDefinition';
import dotenv from 'dotenv';

dotenv.config();

async function updateAssistant(): Promise<void> {
  try {
    const assistantId = process.env.OPENAI_ASSISTANT_ID;
    if (!assistantId) {
      console.error('❌ OPENAI_ASSISTANT_ID não configurado no .env');
      process.exit(1);
    }

    console.log(`🔄 Redefinindo ferramentas do assistant ${assistantId}...`);

    const newTools = [
      weatherToolDefinition as any,
      ...agrofitTools as any,
    ];

    const updatedAssistant = await openai.beta.assistants.update(assistantId, {
      tools: newTools,
    });

    console.log('✅ Tools redefinidas com sucesso:');
    console.log(
        updatedAssistant.tools.map(t =>
            t.type === 'function' ? t.function.name : t.type
        )
    );
  } catch (error) {
    console.error('❌ Erro ao atualizar o assistente:', error);
    process.exit(1);
  }
}

void updateAssistant();
