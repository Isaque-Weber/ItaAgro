// backend/scripts/create-subscription-plans.ts
import { MercadoPagoConfig, PreApprovalPlan } from 'mercadopago'
import dotenv from "dotenv";
dotenv.config({ path: '../.env' })

async function createSubscriptionPlans() {
  // const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN!
  const accessToken = "TEST-5772208681435317-062516-feb970665146b851e0bca4181305d715-452236309"
  const config = new MercadoPagoConfig({
    accessToken,
    options: { timeout: 5000 }
  })
  const planClient = new PreApprovalPlan(config)
  const backUrl = `${process.env.FRONTEND_URL}/subscribe/success`

  console.log('🔔 Criando plano mensal...')
  const monthlyRes = await planClient.create({
    body: {
      reason: 'Plano Mensal Ita Agro',
      back_url: backUrl,
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        transaction_amount: 40.00,
        currency_id: 'BRL',
      },
    },
  })
  console.log('✅ Plano mensal criado:', monthlyRes.id)

  console.log('🔔 Criando plano anual (10% off)...')
  const yearlyRes = await planClient.create({
    body: {
      reason: 'Plano Anual Ita Agro (10% de desconto)',
      back_url: backUrl,
      auto_recurring: {
        frequency: 1,
        frequency_type: 'months',
        repetitions: 12,
        transaction_amount: 36.00,
        currency_id: 'BRL',
      },
    },
  })
  console.log('✅ Plano anual criado:', yearlyRes.id)
}

createSubscriptionPlans().catch(err => {
  console.error('❌ Erro ao criar planos:', err)
  process.exit(1)
})
