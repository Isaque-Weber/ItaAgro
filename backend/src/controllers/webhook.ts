import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { AppDataSource } from '../services/typeorm/data-source';
import { Subscription, SubscriptionStatus } from '../entities/Subscription';
import { User } from '../entities/User';
import { MercadoPagoClient, transformMercadoPagoStatus, validateWebhookSignature } from '../services/mercadopago';

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

  // Configuração para receber o corpo bruto da requisição
  app.addContentTypeParser('application/json', { parseAs: 'string' }, (req, body, done) => {
    done(null, body);
  });

  app.post('/mercadopago', async (req: FastifyRequest, reply: FastifyReply) => {
    const rawBody = req.body as string;
    const signature = req.headers['x-signature'] as string;
    const webhookSecret = process.env.MP_WEBHOOK_SECRET;

    app.log.info('Webhook do Mercado Pago recebido');

    // Validação da assinatura HMAC
    if (process.env.NODE_ENV === 'production') {
      if (!signature || !webhookSecret) {
        app.log.error('Assinatura ou segredo do webhook não fornecidos');
        return reply.code(401).send({ error: 'Assinatura inválida' });
      }

      const isValid = validateWebhookSignature(rawBody, signature, webhookSecret);
      if (!isValid) {
        app.log.error('Assinatura do webhook inválida');
        return reply.code(401).send({ error: 'Assinatura inválida' });
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
    if (payload.type !== 'preapproval' || !payload.data?.id) {
      app.log.info(`Evento ignorado: ${payload.type}`);
      return reply.code(200).send({ received: true, processed: false });
    }

    try {
      // Consulta detalhes da assinatura no Mercado Pago
      app.log.info(`Consultando assinatura ${payload.data.id} no Mercado Pago`);
      const mpSubscription = await mpClient.getSubscription(payload.data.id);
      
      // Transforma o status do Mercado Pago para o formato interno
      const status = transformMercadoPagoStatus(mpSubscription.status) as SubscriptionStatus;
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
        subscription.updatedAt = new Date();
        
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

      // Se o status for "authorized", atualiza permissão do usuário
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