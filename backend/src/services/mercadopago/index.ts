import axios from 'axios'

/**
 * Cliente para integração com a API de Assinaturas do Mercado Pago
 */
export class MercadoPagoClient {
  private accessToken: string
  private baseURL = 'https://api.mercadopago.com'

  constructor() {
    const token = process.env.MERCADOPAGO_ACCESS_TOKEN
    if (!token) {
      throw new Error('MERCADOPAGO_ACCESS_TOKEN não configurado no .env')
    }
    this.accessToken = token
  }

  async cancelSubscription(id: string) {
    try {
      await axios.put(`${this.baseURL}/preapproval/${id}`,
          { status: 'cancelled' },
          { headers: { 'Authorization': `Bearer ${this.accessToken}` } }
      )
    } catch (error) {
      throw new Error('Erro ao cancelar no Mercado Pago')
    }
  }

  async listSubscriptions(): Promise<any[]> {
    const urlBase = 'https://api.mercadopago.com/preapproval/search';
    const results: any[] = [];
    let offset = 0;
    const limit = 50; // máximo permitido pela API

    while (true) {
      const url = `${urlBase}?offset=${offset}&limit=${limit}`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      });
      const data = await response.json();

      // console.log(`[MP API] Resposta página offset=${offset}:`, JSON.stringify(data, null, 2));

      if (data.results && data.results.length > 0) {
        results.push(...data.results);
        offset += limit;
        if (data.results.length < limit) break; // chegou no final
      } else {
        break; // nada mais a buscar
      }
    }

    console.log('[MP API] Total de assinaturas buscadas:', results.length);
    return results;
  }


  /**
   * Consulta detalhes de uma assinatura (preapproval) pelo ID
   * @returns Detalhes da assinatura ou null se não encontrada (404)
   */
  async getSubscription(id: string) {
    try {
      const response = await axios.get(`${this.baseURL}/preapproval/${id}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      })
      return response.data
    } catch (error: any) {
      // Se for erro 404 (assinatura não encontrada), retorna null em vez de lançar erro
      if (error.response && error.response.status === 404) {
        console.log(`Assinatura ${id} não encontrada no Mercado Pago (404)`)
        return null
      }
      console.error('Erro ao consultar assinatura no Mercado Pago:', error)
      throw error
    }
  }
}

/**
 * Converte status do Mercado Pago para o formato interno
 */
export function transformMercadoPagoStatus(mpStatus: string) {
  const statusMap: Record<string, string> = {
    'authorized': 'authorized',
    'paused': 'pending',
    'cancelled': 'canceled',
    'in_process': 'pending',
    'pending': 'pending',
    'approved': 'active',
    'charged': 'active',
    'payment_in_process': 'pending',
    'payment_failed': 'pending'
  }

  return statusMap[mpStatus] || 'pending'
}

/**
 * Valida assinatura HMAC do webhook do Mercado Pago
 */
export function validateWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  try {
    const crypto = require('crypto')
    const hmac = crypto.createHmac('sha256', secret)
    const calculatedSignature = hmac.update(payload).digest('hex')
    return calculatedSignature === signature
  } catch (error) {
    console.error('Erro ao validar assinatura do webhook:', error)
    return false
  }
}
