// backend/scripts/create-subscription-plans.ts
import { MercadoPagoConfig, PreApprovalPlan } from 'mercadopago'
import dotenv from "dotenv"
dotenv.config({ path: '../.env' })

async function createSubscriptionPlans() {
    const accessToken = String(process.env.MERCADOPAGO_ACCESS_TOKEN)
    const config = new MercadoPagoConfig({
        accessToken,
        options: { timeout: 10000 },
    })
    const planClient = new PreApprovalPlan(config)

    const backUrl = 'https://itaagroia.com.br/subscribe/success'
    const notificationUrl = 'https://api.itaagroia.com.br/webhook/mercadopago'

    console.log('🔔 Criando plano mensal...')
    const monthlyRes = await planClient.create({
        body: {
            reason: 'Plano Standard Ita Agro',
            back_url: backUrl,
            notification_url: notificationUrl, // <- Aceito pela API, mas não tipado
            auto_recurring: {
                frequency: 1,
                frequency_type: 'months',
                transaction_amount: 69.90,
                currency_id: 'BRL',
                start_date: new Date().toISOString(), // <- Aceito, mas não tipado
            },
        } as any, // força a aceitação do objeto completo
    })
    console.log('✅ Plano mensal criado:', monthlyRes.id)

    console.log('🔔 Criando plano anual (10% off)...')
    const yearlyRes = await planClient.create({
        body: {
            reason: 'Plano Premium Anual Ita Agro (10% de desconto)',
            back_url: backUrl,
            notification_url: notificationUrl,
            auto_recurring: {
                frequency: 1,
                frequency_type: 'months',
                repetitions: 12,
                transaction_amount: 62.10,
                currency_id: 'BRL',
                start_date: new Date().toISOString(),
            },
        } as any,
    })
    console.log('✅ Plano anual criado:', yearlyRes.id)
}

createSubscriptionPlans().catch(err => {
    console.error('❌ Erro ao criar planos:', err.response?.data || err)
    process.exit(1)
})
