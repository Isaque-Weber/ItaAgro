import fp from 'fastify-plugin';
import { FastifyPluginAsync } from 'fastify';

const authPlugin: FastifyPluginAsync = async (fastify) => {
  fastify.decorate('authenticate', async (request, reply) => {
    // Lógica de autenticação
    const token = request.headers.authorization;
    if (!token || token !== 'valid-token') {
      reply.code(401).send({ error: 'Unauthorized' });
    }
  });
};

export default fp(authPlugin);