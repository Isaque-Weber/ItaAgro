import { FastifyInstance } from 'fastify';
import { AppDataSource } from '../services/typeorm/data-source';
import { MercadoPagoConfig, PreApprovalPlan } from 'mercadopago';

// Interface for plan data returned by the API
export interface Plan {
  id: string;
  reason: string;
  transaction_amount: number;
  frequency_type: 'months';
  frequency: number;
  repetitions?: number;
  init_point: string;
}

/**
 * Routes for subscription plans and checkout
 */
export async function subscriptionRoutes(app: FastifyInstance) {
  // GET /plans - Fetch available subscription plans
  app.get('/plans', async (req, reply) => {
    try {
      const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
      if (!accessToken) {
        throw new Error('MERCADOPAGO_ACCESS_TOKEN not configured');
      }

      const config = new MercadoPagoConfig({
        accessToken,
        options: { timeout: 5000 }
      });
      const planClient = new PreApprovalPlan(config);

      // Fetch all plans
      const response = await planClient.search({
        options: {
          status: 'active'
        }
      });

      // Map to the expected format
      const plans: Plan[] = (response.results ?? []).map((plan: any) => ({
        id: plan.id,
        reason: plan.reason,
        transaction_amount: plan.auto_recurring.transaction_amount,
        frequency_type: plan.auto_recurring.frequency_type,
        frequency: plan.auto_recurring.frequency,
        repetitions: plan.auto_recurring.repetitions,
        init_point: plan.init_point
      }));

      return reply.code(200).send(plans);
    } catch (error) {
      app.log.error('Error fetching subscription plans:', error);
      return reply.code(500).send({ 
        error: 'Failed to fetch subscription plans',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // POST /checkout - Create a checkout session for a plan
  app.post('/checkout', {
    schema: {
      body: {
        type: 'object',
        required: ['planId'],
        properties: {
          planId: { type: 'string' }
        }
      }
    }
  }, async (req, reply) => {
    try {
      const { planId } = req.body as { planId: string };
      
      const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
      if (!accessToken) {
        throw new Error('MERCADOPAGO_ACCESS_TOKEN not configured');
      }

      const config = new MercadoPagoConfig({
        accessToken,
        options: { timeout: 5000 }
      });
      const planClient = new PreApprovalPlan(config);

      // Get the plan details
      const plan = await planClient.get({preApprovalPlanId: planId });

      if (!plan || !plan.init_point) {
        return reply.code(404).send({ error: 'Plan not found or init_point not available' });
      }

      return reply.code(200).send({ init_point: plan.init_point });
    } catch (error) {
      app.log.error('Error creating checkout session:', error);
      return reply.code(500).send({ 
        error: 'Failed to create checkout session',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}