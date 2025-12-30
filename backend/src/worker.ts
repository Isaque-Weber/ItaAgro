import 'reflect-metadata'
import dotenv from 'dotenv'
dotenv.config()

import { AppDataSource } from './services/typeorm/data-source'
import { createChatWorker } from './services/redis/chat.worker'

async function start() {
  console.log('🚀 Iniciando worker de processamento de chat...')
  
  try {
    await AppDataSource.initialize()
    console.log('✅ Banco de dados conectado')
    
    const worker = createChatWorker()
    console.log('✅ Worker rodando e aguardando jobs...')
    
    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('🛑 Recebido SIGTERM, fechando worker...')
      await worker.close()
      await AppDataSource.destroy()
      process.exit(0)
    })
    
    process.on('SIGINT', async () => {
      console.log('🛑 Recebido SIGINT, fechando worker...')
      await worker.close()
      await AppDataSource.destroy()
      process.exit(0)
    })
    
  } catch (error) {
    console.error('❌ Erro ao iniciar worker:', error)
    process.exit(1)
  }
}

start()
