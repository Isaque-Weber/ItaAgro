/**
 * Script para atualizar as ferramentas do assistente OpenAI
 * 
 * Este script adiciona a ferramenta de clima ao assistente OpenAI existente.
 * 
 * Uso: ts-node src/scripts/updateAssistantTools.ts
 */

import { openai } from '../services/openai/openai';
import { weatherToolDefinition } from '../services/weather/weatherTool';
import dotenv from 'dotenv';

// Carrega variáveis de ambiente
dotenv.config();

async function updateAssistant() {
  try {
    const assistantId = process.env.OPENAI_ASSISTANT_ID;

    if (!assistantId) {
      console.error('OPENAI_ASSISTANT_ID não configurado no .env');
      process.exit(1);
    }

    console.log(`Atualizando assistente ${assistantId} com a ferramenta de clima...`);

    // Obtém o assistente atual
    const assistant = await openai.beta.assistants.retrieve(assistantId);

    console.log('Assistente atual:', {
      name: assistant.name,
      instructions: assistant.instructions?.substring(0, 50) + '...',
      tools: assistant.tools.map(t => t.type === 'function' ? t.function.name : t.type)
    });

    // Verifica se a ferramenta já existe
    const hasWeatherTool = assistant.tools.some(
      tool => tool.type === 'function' && tool.function.name === 'get_weather'
    );

    if (hasWeatherTool) {
      console.log('A ferramenta de clima já está configurada no assistente.');
      return;
    }

    // Adiciona a ferramenta de clima às ferramentas existentes
    const updatedTools = [...assistant.tools, weatherToolDefinition as any];

    // Atualiza o assistente
    const updatedAssistant = await openai.beta.assistants.update(assistantId, {
      tools: updatedTools
    });

    console.log('Assistente atualizado com sucesso!');
    console.log('Ferramentas configuradas:', 
      updatedAssistant.tools.map(t => t.type === 'function' ? t.function.name : t.type)
    );

  } catch (error) {
    console.error('Erro ao atualizar o assistente:', error);
    process.exit(1);
  }
}

// Executa a função principal
updateAssistant();
