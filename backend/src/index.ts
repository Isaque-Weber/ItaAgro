// src/index.ts
import 'reflect-metadata';
import 'dotenv/config';
import { AppDataSource } from './services/typeorm/data-source';
import { build } from './app';
import cron from 'node-cron';
import { LessThan } from 'typeorm';
import { Document } from './entities/Document';

// Job para limpeza de documentos expirados
function startCleanupJob() {
    cron.schedule('0 0 * * *', async () => {
        const repo = AppDataSource.getRepository(Document);
        const deleted = await repo.delete({ expiresAt: LessThan(new Date()) });
        if (deleted.affected) console.log(`🗑️ Removidos ${deleted.affected} documentos expirados`);
    });
}

async function start() {
    // Inicializa DataSource e rode migrations
    await AppDataSource.initialize();
    await AppDataSource.runMigrations();

    // Inicia job de limpeza de documentos
    startCleanupJob();

    // Constroi e inicia o servidor Fastify
    const app = await build();
    const port = Number(process.env.PORT) || 4000;
    await app.listen({ port, host: '0.0.0.0' });
    app.log.info(`Servidor rodando em http://localhost:${port}`);
}

start().catch(err => {
    console.error('Erro ao iniciar o servidor:', err);
    process.exit(1);
});