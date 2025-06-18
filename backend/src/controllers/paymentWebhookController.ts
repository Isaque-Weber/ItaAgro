import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { AppDataSource } from '../services/typeorm/data-source';
import { Subscription, SubscriptionStatus } from '../entities/Subscription';
import { User } from '../entities/User';
import { MercadoPagoClient } from '../services/mercadopago';

// Estendendo o tipo FastifyRequest para incluir rawBody
declare module 'fastify' {
  interface FastifyRequest {
    rawBody?: string | Buffer;
  }
}

interface WebhookPayload {
  action: string;
  data: {
    id: string;
  };
  type: string;
}

export async function paymentWebhookRoutes(app: FastifyInstance) {
  const subscriptionRepo = AppDataSource.getRepository(Subscription);
  const userRepo = AppDataSource.getRepository(User);
  const preapprovalClient = new MercadoPagoClient();

  // Configuração para receber o corpo bruto da requisição
  app.addContentTypeParser('application/json', { parseAs: 'string' }, (req, body, done) => {
    try {
      req.rawBody = body;
      done(null, {});
    } catch (err) {
      done(err as Error, {});
    }
  });

  app.post('/webhook', async (req: FastifyRequest, reply: FastifyReply) => {
    const rawBody = req.rawBody as string || '';
    const signature = req.headers['x-mp-signature'] as string;
    const webhookSecret = process.env.MP_WEBHOOK_SECRET;

    app.log.info('Webhook do Mercado Pago recebido');

    // Validação da assinatura HMAC-SHA256 no formato ts.payload
    if (process.env.NODE_ENV === 'production') {
      if (!signature || !webhookSecret) {
        app.log.error('Assinatura ou segredo do webhook não fornecidos');
        return reply.code(401).send({ error: 'Assinatura inválida' });
      }

      try {
        const isValid = verifyMpSignature(signature, rawBody, webhookSecret);
        if (!isValid) {
          app.log.error('Assinatura do webhook inválida');
          return reply.code(401).send({ error: 'Assinatura inválida' });
        }
      } catch (error) {
        app.log.error(`Erro ao validar assinatura: ${error}`);
        return reply.code(500).send({ error: 'Erro ao validar assinatura' });
      }
    } else {
      // Em ambiente de desenvolvimento, apenas registra
      app.log.info('Ambiente de desenvolvimento: validação de assinatura ignorada');
    }

    // Parsing seguro do JSON
    let payload: WebhookPayload;
    try {
      payload = JSON.parse(rawBody);
      app.log.info(`Payload processado: ${JSON.stringify(payload)}`);
    } catch (error) {
      app.log.error(`Erro ao processar JSON: ${error}`);
      return reply.code(400).send({ error: 'JSON inválido' });
    }

    // Filtra apenas eventos relacionados a assinaturas
    if (
      payload.type !== 'preapproval' && 
      payload.type !== 'subscription_preapproval'
    ) {
      app.log.info(`Evento ignorado: ${payload.type}`);
      return reply.code(200).send({ received: true, processed: false });
    }

    try {
      // Consulta detalhes da assinatura no Mercado Pago
      app.log.info(`Consultando assinatura ${payload.data.id} no Mercado Pago`);
      const mpSubscription = await preapprovalClient.getSubscription(payload.data.id);

      // Se a assinatura não foi encontrada no Mercado Pago
      if (!mpSubscription) {
        app.log.warn(`Assinatura ${payload.data.id} não encontrada no Mercado Pago`);

        // Se for uma ação de atualização ou cancelamento, podemos tentar processar localmente
        if (payload.action === 'updated' || payload.action === 'cancelled') {
          // Busca assinatura existente pelo ID externo
          const existingSubscription = await subscriptionRepo.findOne({
            where: { externalId: payload.data.id },
            relations: ['user']
          });

          if (existingSubscription) {
            app.log.info(`Assinatura encontrada localmente: ${existingSubscription.id}`);

            // Se for cancelamento, atualizamos o status
            if (payload.action === 'cancelled') {
              existingSubscription.status = SubscriptionStatus.CANCELED;
              await subscriptionRepo.save(existingSubscription);
              app.log.info(`Assinatura ${existingSubscription.id} marcada como cancelada`);
            }

            return reply.code(200).send({ received: true, processed: true });
          }
        }

        // Se não encontrou localmente ou não é uma ação que podemos processar
        return reply.code(200).send({ received: true, processed: false, reason: 'subscription_not_found' });
      }

      // Mapeia o status do Mercado Pago para o enum SubscriptionStatus
      let status: SubscriptionStatus;
      switch (mpSubscription.status) {
        case 'authorized':
          status = SubscriptionStatus.AUTHORIZED;
          break;
        case 'paused':
        case 'pending':
        case 'in_process':
        case 'payment_in_process':
        case 'payment_failed':
          status = SubscriptionStatus.PENDING;
          break;
        case 'cancelled':
          status = SubscriptionStatus.CANCELED;
          break;
        case 'approved':
        case 'charged':
          status = SubscriptionStatus.ACTIVE;
          break;
        default:
          status = SubscriptionStatus.PENDING;
      }

      app.log.info(`Status da assinatura: ${mpSubscription.status} -> ${status}`);

      // Busca assinatura existente pelo ID externo
      let subscription = await subscriptionRepo.findOne({
        where: { externalId: payload.data.id },
        relations: ['user']
      });

      if (subscription) {
        // Atualiza assinatura existente
        app.log.info(`Atualizando assinatura existente: ${subscription.id}`);
        subscription.status = status;

        if (mpSubscription.end_date) {
          subscription.expiresAt = new Date(mpSubscription.end_date);
        }

        await subscriptionRepo.save(subscription);
      } else {
        // Cria nova assinatura
        app.log.info(`Criando nova assinatura para ${mpSubscription.payer_email}`);

        // Busca usuário pelo email
        const user = await userRepo.findOne({
          where: { email: mpSubscription.payer_email }
        });

        if (!user) {
          app.log.error(`Usuário não encontrado para o email: ${mpSubscription.payer_email}`);
          return reply.code(404).send({ error: 'Usuário não encontrado' });
        }

        subscription = subscriptionRepo.create({
          externalId: payload.data.id,
          status,
          user,
          expiresAt: mpSubscription.end_date ? new Date(mpSubscription.end_date) : undefined
        });

        await subscriptionRepo.save(subscription);
      }

      // Se o status for "authorized" ou "active", atualiza permissão do usuário
      if (status === SubscriptionStatus.AUTHORIZED || status === SubscriptionStatus.ACTIVE) {
        app.log.info(`Atualizando permissões do usuário: ${subscription.user.id}`);
        await userRepo.update(subscription.user.id, { role: 'user' });
      }

      return reply.code(200).send({ received: true });
    } catch (error) {
      app.log.error(`Erro ao processar webhook: ${error}`);
      return reply.code(500).send({ error: 'Erro interno ao processar webhook' });
    }
  });
}

// Função utilitária para verificar a assinatura do Mercado Pago
function verifyMpSignature(signature: string, raw: string, secret: string): boolean {
  try {
    const crypto = require('crypto');
    const [timestamp, signatureHash] = signature.split('.');

    if (!timestamp || !signatureHash) {
      return false;
    }

    const data = `${timestamp}.${raw}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(data)
      .digest('hex');

    return expectedSignature === signatureHash;
  } catch (error) {
    console.error('Erro ao verificar assinatura:', error);
    return false;
  }
}
