import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { AppDataSource } from '../services/typeorm/data-source';
import { Subscription, SubscriptionStatus } from '../entities/Subscription';
import { User } from '../entities/User';
import { MercadoPagoClient, transformMercadoPagoStatus } from '../services/mercadopago';
import crypto from 'crypto';

interface WebhookPayload {
    type: string;
    data: {
        id: string;
    };
}

export async function webhookRoutes(app: FastifyInstance) {
    const mpClient = new MercadoPagoClient();
    const subscriptionRepo = AppDataSource.getRepository(Subscription);
    const userRepo = AppDataSource.getRepository(User);

    // 🔧 Captura corpo bruto (necessário p/ assinatura)
    app.addContentTypeParser('application/json', { parseAs: 'string' }, (req, body, done) => {
        done(null, body);
    });

    app.post('/mercadopago', async (req: FastifyRequest, reply: FastifyReply) => {
        const rawBody = req.body as string;
        const signatureHeader = req.headers['x-signature'] as string;
        const requestId = req.headers['x-request-id'] as string;
        const webhookSecret = process.env.MP_WEBHOOK_SECRET;

        app.log.info('🪝 Webhook do Mercado Pago recebido');
        app.log.info({ headers: req.headers });

        // --------------------------
        // 1️⃣ Validação da assinatura
        // --------------------------
        if (process.env.NODE_ENV === 'production') {
            if (!signatureHeader || !webhookSecret || !requestId) {
                app.log.error('Faltando cabeçalhos ou segredo');
                return reply.code(401).send({ error: 'Assinatura inválida (headers ausentes)' });
            }

            // Extrai ts e v1
            const matchTs = signatureHeader.match(/ts=([^,]+)/);
            const matchV1 = signatureHeader.match(/v1=([^,]+)/);
            const ts = matchTs?.[1];
            const v1 = matchV1?.[1];

            if (!ts || !v1) {
                app.log.error('Cabeçalho x-signature inválido');
                return reply.code(401).send({ error: 'Assinatura inválida (formato incorreto)' });
            }

            // Tenta extrair o ID do JSON antes de validar
            let dataId: string | null = null;
            try {
                const temp = JSON.parse(rawBody);
                dataId = temp?.data?.id ?? null;
            } catch {}

            if (!dataId) {
                app.log.error('Webhook sem data.id — não é possível validar assinatura');
                return reply.code(400).send({ error: 'Webhook inválido: sem data.id' });
            }

            // Cria manifest oficial
            const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
            const hash = crypto.createHmac('sha256', webhookSecret).update(manifest).digest('hex');

            app.log.info({ manifest, generatedHash: hash, receivedHash: v1 });

            if (hash !== v1) {
                app.log.error('❌ Assinatura HMAC inválida');
                return reply.code(401).send({ error: 'Assinatura inválida (HMAC incorreto)' });
            }
        } else {
            app.log.info('🔓 Ambiente de desenvolvimento: validação ignorada');
        }

        // --------------------------
        // 2️⃣ Parsing do payload
        // --------------------------
        let payload: WebhookPayload;
            payload = JSON.parse(rawBody);
            app.log.info(`Payload processado: ${JSON.stringify(payload)}`);

        if (payload.type !== 'preapproval' || !payload.data?.id) {
            app.log.info(`Evento ignorado: ${payload.type}`);
            return reply.code(200).send({ received: true, processed: false });
        }

        // --------------------------
        // 3️⃣ Processamento do evento
        // --------------------------
            app.log.info(`🔎 Consultando assinatura ${payload.data.id} no Mercado Pago`);
            const mpSubscription = await mpClient.getSubscription(payload.data.id);
            const newStatus = transformMercadoPagoStatus(mpSubscription.status) as SubscriptionStatus;

            let subscription = await subscriptionRepo.findOne({
                where: { externalId: payload.data.id },
                relations: ['user'],
            });

            if (subscription) {
                subscription.status = newStatus;
                subscription.updatedAt = new Date();
                if (mpSubscription.end_date) {
                    subscription.expiresAt = new Date(mpSubscription.end_date);
                }
                await subscriptionRepo.save(subscription);
            } else {
                const user = await userRepo.findOne({
                    where: { email: mpSubscription.payer_email },
                });
                if (!user) {
                    app.log.error(`Usuário não encontrado para ${mpSubscription.payer_email}`);
                    return reply.code(404).send({ error: 'Usuário não encontrado' });
                }

                subscription = subscriptionRepo.create({
                    externalId: payload.data.id,
                    status: newStatus,
                    user,
                    expiresAt: mpSubscription.end_date ? new Date(mpSubscription.end_date) : undefined,
                });
                await subscriptionRepo.save(subscription);
            }

            // Atualiza flag do usuário
            const isActive = [SubscriptionStatus.ACTIVE, SubscriptionStatus.AUTHORIZED].includes(newStatus);
            if (subscription.user) {
                await userRepo.update(subscription.user.id, { subscriptionActive: isActive });
            }

            return reply.code(200).send({ received: true });
    });
}
