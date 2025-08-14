// backend/src/plugins/auth.plugin.ts
import fp from 'fastify-plugin';
import fastifyCookie from '@fastify/cookie';
import fastifyJwt from '@fastify/jwt';
import { FastifyPluginAsync } from 'fastify';

const authPlugin: FastifyPluginAsync = async (fastify) => {
    // 1) Cookies
    fastify.register(fastifyCookie, {
        secret: process.env.JWT_SECRET as string,
        parseOptions: {
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        },
    });

    // 2) JWT via cookie ou header
    fastify.register(fastifyJwt, {
        secret: process.env.JWT_SECRET as string,
        cookie: {
            cookieName: 'itaagro_token',
            signed: false,
        },
        decode: { complete: true },
        messages: {
            badRequestErrorMessage: 'Formato de requisição inválido',
            noAuthorizationInHeaderMessage: 'Token ausente',
            authorizationTokenExpiredMessage: 'Token expirado',
            authorizationTokenInvalid: 'Token inválido',
        },
    });

    // 3) Adiciona token manualmente caso só esteja no header
    fastify.addHook('preHandler', async (request, reply) => {
        const auth = request.headers.authorization;
        if (auth?.startsWith('Bearer ') && !request.cookies['itaagro_token']) {
            const token = auth.substring(7);
            reply.setCookie('itaagro_token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'none',
                path: '/',
                maxAge: 60 * 60 * 24,
                domain: process.env.NODE_ENV === 'production' ? '.itaagroia.com.br' : undefined,
            });
        }
    });

    // 4) Middleware de autenticação
    fastify.decorate('authenticate', async (req, reply) => {
        try {
            await req.jwtVerify()
            req.user = req.user || (req as any).jwtPayload;
        } catch (err) {
            const token = req.cookies['itaagro_token'];
            if (token) {
                try {
                    req.user = fastify.jwt.verify(token);
                    return;
                } catch (e) {}
            }
            reply.code(401).send({ error: 'Unauthorized' });
        }
    });
};

export default fp(authPlugin);
