import axios from 'axios';
import 'dotenv/config';

/**
 * Cliente para integração com a API de clima para o Brasil
 */
export class WeatherApiClient {
  private apiKey: string;
  private baseURL = 'https://api.openweathermap.org/data/2.5';

  constructor() {
    console.log(process.env.OPENWEATHERMAP_API_KEY)
    const apiKey = process.env.OPENWEATHERMAP_API_KEY;
    if (!apiKey) {
      throw new Error('OPENWEATHERMAP_API_KEY não configurado no .env');
    }
    this.apiKey = apiKey;
  }

  /**
   * Obtém dados do clima atual para uma cidade brasileira
   * @param city Nome da cidade
   * @param state Sigla do estado (opcional)
   */
  async getCurrentWeather(city: string, state?: string) {
    try {
      const query = state ? `${city},${state},BR` : `${city},BR`;
      const response = await axios.get(`${this.baseURL}/weather`, {
        params: {
          q: query,
          appid: this.apiKey,
          units: 'metric', // Celsius
          lang: 'pt_br'    // Português do Brasil
        }
      });
      return this.formatWeatherData(response.data);
    } catch (error) {
      console.error('Erro ao consultar clima:', error);
      throw error;
    }
  }

  /**
   * Obtém previsão do tempo para 5 dias para uma cidade brasileira
   * @param city Nome da cidade
   * @param state Sigla do estado (opcional)
   */
  async getForecast(city: string, state?: string) {
    try {
      const query = state ? `${city},${state},BR` : `${city},BR`;
      const response = await axios.get(`${this.baseURL}/forecast`, {
        params: {
          q: query,
          appid: this.apiKey,
          units: 'metric', // Celsius
          lang: 'pt_br',   // Português do Brasil
          cnt: 40          // Número de intervalos (8 por dia = 5 dias)
        }
      });
      return this.formatForecastData(response.data);
    } catch (error) {
      console.error('Erro ao consultar previsão do tempo:', error);
      throw error;
    }
  }

  /**
   * Formata os dados do clima atual para um formato mais amigável
   */
  private formatWeatherData(data: any) {
    return {
      cidade: data.name,
      pais: 'Brasil',
      temperatura: {
        atual: Math.round(data.main.temp),
        sensacaoTermica: Math.round(data.main.feels_like),
        minima: Math.round(data.main.temp_min),
        maxima: Math.round(data.main.temp_max)
      },
      clima: {
        descricao: data.weather[0].description,
        icone: data.weather[0].icon
      },
      vento: {
        velocidade: data.wind.speed, // m/s
        direcao: data.wind.deg
      },
      umidade: data.main.humidity, // %
      pressao: data.main.pressure, // hPa
      visibilidade: data.visibility / 1000, // km
      atualizadoEm: new Date(data.dt * 1000).toLocaleString('pt-BR')
    };
  }

  /**
   * Formata os dados de previsão para um formato mais amigável
   */
  private formatForecastData(data: any) {
    // Agrupa previsões por dia
    const previsoesPorDia: any = {};
    
    data.list.forEach((previsao: any) => {
      const data = new Date(previsao.dt * 1000);
      const dataStr = data.toISOString().split('T')[0];
      
      if (!previsoesPorDia[dataStr]) {
        previsoesPorDia[dataStr] = {
          data: data.toLocaleDateString('pt-BR'),
          previsoes: []
        };
      }
      
      previsoesPorDia[dataStr].previsoes.push({
        hora: data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        temperatura: Math.round(previsao.main.temp),
        clima: {
          descricao: previsao.weather[0].description,
          icone: previsao.weather[0].icon
        },
        vento: {
          velocidade: previsao.wind.speed,
          direcao: previsao.wind.deg
        },
        umidade: previsao.main.humidity,
        probabilidadeChuva: previsao.pop * 100 // Convertido para porcentagem
      });
    });
    
    return {
      cidade: data.city.name,
      pais: 'Brasil',
      previsoes: Object.values(previsoesPorDia)
    };
  }
}