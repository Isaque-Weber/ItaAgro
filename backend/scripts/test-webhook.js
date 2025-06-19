/**
 * Script para testar o webhook do Mercado Pago localmente
 * 
 * Uso: node scripts/test-webhook.js [id-da-assinatura]
 * 
 * Se não for fornecido um ID de assinatura, será usado um ID de exemplo.
 */

const axios = require('axios');
const crypto = require('crypto');

// Configurações
const WEBHOOK_URL = 'http://localhost:4000/webhook/mercadopago';
const DEFAULT_SUBSCRIPTION_ID = 'test_subscription_123';

// Pega o ID da assinatura dos argumentos da linha de comando ou usa o padrão
const subscriptionId = process.argv[2] || DEFAULT_SUBSCRIPTION_ID;

// Cria o payload do webhook
const payload = {
  type: 'preapproval',
  data: {
    id: subscriptionId
  },
  action: 'payment.created',
  api_version: 'v1',
  date_created: new Date().toISOString(),
  user_id: '123456789'
};

// Converte o payload para string
const payloadString = JSON.stringify(payload);

// Gera uma assinatura HMAC simulada
const generateSignature = () => {
  const webhookSecret = process.env.MP_WEBHOOK_SECRET || '2dcb4b43feea00337d9ebdd6b1146e0e45cd8a98241f63c5a696e01557790d80';
  const hmac = crypto.createHmac('sha256', webhookSecret);
  return hmac.update(payloadString).digest('hex');
};

// Envia a requisição para o webhook
async function testWebhook() {
  console.log(`\n🚀 Testando webhook com ID de assinatura: ${subscriptionId}`);
  console.log(`\n📦 Payload: ${payloadString}`);
  
  try {
    const signature = generateSignature();
    console.log(`\n🔑 Assinatura HMAC gerada: ${signature}`);
    
    console.log(`\n📡 Enviando requisição para: ${WEBHOOK_URL}`);
    const response = await axios.post(WEBHOOK_URL, payloadString, {
      headers: {
        'Content-Type': 'application/json',
        'X-Signature': signature
      }
    });
    
    console.log(`\n✅ Resposta: ${response.status} ${JSON.stringify(response.data)}`);
    console.log('\n🎉 Teste concluído com sucesso!');
  } catch (error) {
    console.error('\n❌ Erro ao testar webhook:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Dados: ${JSON.stringify(error.response.data)}`);
    } else {
      console.error(error.message);
    }
    console.log('\n⚠️ Verifique se o servidor backend está rodando em http://localhost:4000');
  }
}

// Executa o teste
testWebhook();