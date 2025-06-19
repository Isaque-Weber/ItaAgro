# Ferramenta de Clima para o Chat ItaAgro

Esta documentação descreve a implementação da ferramenta de clima para o chat do ItaAgro, que permite aos usuários obterem informações sobre o clima atual e previsões do tempo para cidades brasileiras.

## Visão Geral

A ferramenta de clima integra o OpenWeatherMap API com o assistente OpenAI para fornecer:
- Dados de clima atual para qualquer cidade brasileira
- Previsão do tempo para os próximos 5 dias
- Informações detalhadas como temperatura, umidade, vento, etc.

## Configuração

### 1. Obtenha uma API Key do OpenWeatherMap

1. Crie uma conta em [OpenWeatherMap](https://openweathermap.org/)
2. Navegue até a seção API Keys
3. Gere uma nova API key
4. Copie a API key gerada

### 2. Configure as Variáveis de Ambiente

Adicione a API key ao arquivo `.env` na raiz do projeto backend:

```
OPENWEATHERMAP_API_KEY=sua_chave_api_aqui
```

### 3. Atualize o Assistente OpenAI

Execute o script para atualizar o assistente OpenAI com a nova ferramenta de clima:

```bash
cd backend
npx ts-node src/scripts/updateAssistantTools.ts
```

Este script adicionará a ferramenta de clima ao assistente OpenAI existente.

## Como Usar

Os usuários podem solicitar informações sobre o clima diretamente no chat, usando linguagem natural. Por exemplo:

- "Como está o clima em São Paulo hoje?"
- "Qual a previsão do tempo para Recife nos próximos dias?"
- "Está chovendo em Brasília agora?"
- "Qual a temperatura em Porto Alegre?"

O assistente detectará automaticamente essas solicitações e utilizará a ferramenta de clima para fornecer as informações relevantes.

## Detalhes Técnicos

### Arquitetura

A implementação consiste em três componentes principais:

1. **Cliente da API de Clima** (`weatherApi.ts`):
   - Responsável por fazer requisições à API do OpenWeatherMap
   - Formata os dados recebidos para um formato amigável em português

2. **Definição da Ferramenta** (`weatherTool.ts`):
   - Define o schema da função para o OpenAI Assistant
   - Implementa o manipulador de chamadas de função

3. **Integração com o Processador de Mensagens** (`processMessageWithAssistant.ts`):
   - Detecta quando o assistente precisa usar a ferramenta
   - Processa as chamadas de função e retorna os resultados

### Dados Fornecidos

Para o clima atual, a ferramenta fornece:
- Temperatura atual, mínima e máxima
- Sensação térmica
- Descrição do clima (ensolarado, nublado, etc.)
- Velocidade e direção do vento
- Umidade e pressão atmosférica
- Visibilidade

Para a previsão do tempo, a ferramenta fornece:
- Previsões para os próximos 5 dias
- Temperatura para cada período
- Descrição do clima
- Probabilidade de chuva
- Velocidade e direção do vento
- Umidade

## Solução de Problemas

### A ferramenta não está respondendo

Verifique se:
1. A API key do OpenWeatherMap está configurada corretamente no arquivo `.env`
2. O assistente OpenAI foi atualizado com a ferramenta de clima
3. A cidade solicitada existe e está escrita corretamente

### Erros de API

Se você encontrar erros relacionados à API do OpenWeatherMap:
1. Verifique se sua API key é válida
2. Confirme se você não excedeu o limite de requisições do seu plano
3. Verifique os logs do servidor para mensagens de erro específicas

## Limitações

- A ferramenta funciona apenas para cidades brasileiras
- A precisão dos dados depende da API do OpenWeatherMap
- Há um limite de requisições baseado no plano do OpenWeatherMap utilizado