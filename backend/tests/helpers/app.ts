import Fastify, { FastifyInstance } from 'fastify';
import { build } from '../../src/app';

export async function createTestApp() {
  return await build();
}
