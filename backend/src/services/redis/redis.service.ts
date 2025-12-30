import Redis from 'ioredis'
import dotenv from 'dotenv'

dotenv.config()

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'

export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: null, // Necessário para BullMQ
})

redis.on('connect', () => {
  console.log('✅ Redis conectado')
})

redis.on('error', (err) => {
  console.error('❌ Erro de conexão Redis:', err)
})

// Exporta configuração de conexão para BullMQ
export const redisConnection = {
  connection: redis
}
