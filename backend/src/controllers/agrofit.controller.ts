import { FastifyInstance } from 'fastify';
import { AgrofitService } from '../services/agrofit/agrofitService';

export async function agrofitRoutes(app: FastifyInstance) {
    const agrofitService = new AgrofitService();

    // GET /agrofit/products - Busca produtos com filtros opcionais
    app.get('/products', {
        schema: {
            querystring: {
                type: 'object',
                properties: {
                    culture: { type: 'string' },
                    pest: { type: 'string' },
                    activeIngredient: { type: 'string' },
                    brand: { type: 'string' },
                    holder: { type: 'string' },
                    name: { type: 'string' },
                    page: { type: 'integer', minimum: 1, default: 1 },
                    limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
                }
            }
        }
    }, async (request, reply) => {
        const filters = request.query as any;
        const products = await agrofitService.getProducts(filters);
        return reply.send(products);
    });

    // GET /agrofit/pests - Busca pragas com filtro opcional de nome
    app.get('/pests', {
        schema: {
            querystring: {
                type: 'object',
                properties: {
                    name: { type: 'string' },
                    page: { type: 'integer', minimum: 1, default: 1 },
                    limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
                }
            }
        }
    }, async (request, reply) => {
            const { name, page, limit } = request.query as any;
            const pests = await agrofitService.getPests(name, page);
            return reply.send(pests);
    });

    // GET /agrofit/cultures - Busca culturas com filtro opcional de nome
    app.get('/cultures', {
        schema: {
            querystring: {
                type: 'object',
                properties: {
                    name: { type: 'string' },
                    page: { type: 'integer', minimum: 1, default: 1 },
                    limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
                }
            }
        }
    }, async (request, reply) => {
            const { name, page, limit } = request.query as any;
            const cultures = await agrofitService.getCultures(name, page);
            return reply.send(cultures);
    });

    // GET /agrofit/brands - Busca marcas
    app.get('/brands', {
        schema: {
            querystring: {
                type: 'object',
                properties: {
                    page: { type: 'integer', minimum: 1, default: 1 },
                    limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
                }
            }
        }
    }, async (request, reply) => {
            const { page, limit } = request.query as any;
            const brands = await agrofitService.getBrands(page);
            return reply.send(brands);
    });

    // GET /agrofit/active-ingredients - Busca ingredientes ativos
    app.get('/active-ingredients', {
        schema: {
            querystring: {
                type: 'object',
                properties: {
                    name: { type: 'string' },
                    page: { type: 'integer', minimum: 1, default: 1 },
                    limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 }
                }
            }
        }
    }, async (request, reply) => {
            const { name, page, limit } = request.query as any;
            const activeIngredients = await agrofitService.getActiveIngredients(name, page);
            return reply.send(activeIngredients);
    });

    // POST /agrofit/sync - Sincroniza dados da API com o banco local
    app.post('/sync', {
        schema: {
            response: {
                200: {
                    type: 'object',
                    properties: {
                        success: { type: 'boolean' },
                        message: { type: 'string' },
                        stats: {
                            type: 'object',
                            properties: {
                                brands: { type: 'integer' },
                                activeIngredients: { type: 'integer' },
                                cultures: { type: 'integer' },
                                pests: { type: 'integer' },
                                products: { type: 'integer' }
                            }
                        }
                    }
                }
            }
        },
        preHandler: [app.authenticate] // Requer autenticação para sincronização
    }, async (request, reply) => {
            // Verifica se o usuário tem permissão de admin
            const user = request.user as { role: string };
            if (user.role !== 'admin') {
                return reply.code(403).send({ 
                    error: 'Acesso negado',
                    message: 'Apenas administradores podem sincronizar dados'
                });
            }

            const result = await agrofitService.syncData();
            return reply.send(result);
    });
}