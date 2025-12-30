import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import crypto from 'crypto'
import { MercadoPagoClient } from '../services/mercadopago'
import { AppDataSource } from '../services/typeorm/data-source'
import { Subscription, SubscriptionStatus } from '../entities/Subscription'
import { User } from '../entities/User'

declare module 'fastify' {
    interface FastifyRequest {
        rawBody?: string | Buffer
    }
}

interface WebhookPayload {
    action: string
    type: string
    data: { id: string }
}

export async function paymentWebhookRoutes(app: FastifyInstance) {
    const mpClient = new MercadoPagoClient()
    const subscriptionRepo = AppDataSource.getRepository(Subscription)
    const userRepo = AppDataSource.getRepository(User)

    // 🧩 Necessário para capturar o corpo bruto (validação de assinatura)
    app.addContentTypeParser('application/json', { parseAs: 'string' }, (req, body, done) => {
        req.rawBody = body
        done(null, body)
    })

    app.post('/webhook', async (req: FastifyRequest, reply: FastifyReply) => {
        const rawBody = req.rawBody as string
        const signature = req.headers['x-signature'] as string
        const requestId = req.headers['x-request-id'] as string
        const secret = process.env.MP_WEBHOOK_SECRET

        app.log.info('💰 Webhook de pagamento recebido')
        app.log.info({ headers: req.headers })

        // -----------------------------
        // 1️⃣ Validação da assinatura
        // -----------------------------
        if (process.env.NODE_ENV === 'production') {
            if (!signature || !secret || !requestId) {
                app.log.error('Assinatura, segredo ou request-id ausentes')
                return reply.code(401).send({ error: 'Assinatura inválida' })
            }

            const matchTs = signature.match(/ts=([^,]+)/)
            const matchV1 = signature.match(/v1=([^,]+)/)
            const ts = matchTs?.[1]
            const v1 = matchV1?.[1]

            if (!ts || !v1) {
                app.log.error('Cabeçalho x-signature em formato incorreto')
                return reply.code(401).send({ error: 'Assinatura inválida' })
            }

            // Extrai o ID do pagamento do corpo
            let paymentId = ''
            try {
                const parsed = JSON.parse(rawBody)
                paymentId = parsed?.data?.id ?? ''
            } catch {}

            if (!paymentId) {
                app.log.error('Webhook de pagamento sem data.id')
                return reply.code(400).send({ error: 'Webhook inválido' })
            }

            // Monta o manifest conforme doc oficial
            const manifest = `id:${paymentId};request-id:${requestId};ts:${ts};`
            const generatedHash = crypto.createHmac('sha256', secret).update(manifest).digest('hex')

            app.log.info({ manifest, generatedHash, receivedHash: v1 })

            if (generatedHash !== v1) {
                app.log.error('❌ Assinatura HMAC inválida')
                return reply.code(401).send({ error: 'Assinatura inválida (hash incorreto)' })
            }
        } else {
            app.log.info('🔓 Ambiente de desenvolvimento: validação ignorada')
        }

        // -----------------------------
        // 2️⃣ Processamento do evento
        // -----------------------------
        let payload: WebhookPayload
        payload = JSON.parse(rawBody)

        if (payload.type !== 'payment' || !payload.data?.id) {
            app.log.info(`Evento ignorado: ${payload.type}`)
            return reply.code(200).send({ received: true, processed: false })
        }

            // Consulta o pagamento no Mercado Pago
            const payment = await mpClient.getPayment(payload.data.id)
            app.log.info(`💳 Pagamento ${payload.data.id} status=${payment.status}`)

            // Aqui você pode relacionar o pagamento com uma assinatura local
            const subscription = await subscriptionRepo.findOne({
                where: { externalId: payment.preapproval_id },
                relations: ['user'],
            })

            if (subscription) {
                const isPaid = payment.status === 'approved' || payment.status === 'accredited'
                subscription.status = isPaid
                    ? SubscriptionStatus.ACTIVE
                    : SubscriptionStatus.PENDING

                await subscriptionRepo.save(subscription)

                await userRepo.update(subscription.user.id, {
                    subscriptionActive: isPaid,
                })

                app.log.info(`✅ Assinatura ${subscription.id} atualizada: ${subscription.status}`)
            } else {
                app.log.warn(`Nenhuma assinatura encontrada para preapproval_id ${payment.preapproval_id}`)
            }

            return reply.code(200).send({ received: true })
    })
}
