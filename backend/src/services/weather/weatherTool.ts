import { WeatherApiClient } from './weatherApi';

/**
 * Definição do schema da ferramenta de clima para o OpenAI Assistant
 */
export const weatherToolDefinition = {
  type: "function",
  function: {
    name: "get_weather",
    description: "Obtém informações de clima atual ou previsão do tempo para uma cidade brasileira",
    parameters: {
      type: "object",
      properties: {
        city: {
          type: "string",
          description: "Nome da cidade brasileira (ex: São Paulo, Rio de Janeiro, Brasília)"
        },
        state: {
          type: "string",
          description: "Sigla do estado brasileiro (ex: SP, RJ, DF)",
          enum: [
            "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", 
            "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", 
            "SP", "SE", "TO"
          ]
        },
        forecast: {
          type: "boolean",
          description: "Se true, retorna a previsão para os próximos dias. Se false, retorna apenas o clima atual."
        }
      },
      required: ["city"]
    }
  }
};

/**
 * Implementação da ferramenta de clima
 */
export class WeatherTool {
  private client: WeatherApiClient;

  constructor() {
    this.client = new WeatherApiClient();
  }

  /**
   * Manipula chamadas de função para obter dados de clima
   */
  async handleFunctionCall(functionName: string, args: any): Promise<any> {
    if (functionName !== 'get_weather') {
      throw new Error(`Função não suportada: ${functionName}`);
    }

    const { city, state, forecast = false } = args;

    if (!city) {
      return {
        error: "É necessário informar o nome da cidade"
      };
    }

    try {
      if (forecast) {
        const forecastData = await this.client.getForecast(city, state);
        return {
          tipo: "previsao",
          ...forecastData
        };
      } else {
        const weatherData = await this.client.getCurrentWeather(city, state);
        return {
          tipo: "atual",
          ...weatherData
        };
      }
    } catch (error: any) {
      console.error('Erro ao processar ferramenta de clima:', error);
      
      // Verifica se é um erro de cidade não encontrada
      if (error.response && error.response.status === 404) {
        return {
          error: `Cidade não encontrada: ${city}${state ? `, ${state}` : ''}`
        };
      }
      
      return {
        error: "Erro ao obter dados de clima: " + (error.message || "Erro desconhecido")
      };
    }
  }
}