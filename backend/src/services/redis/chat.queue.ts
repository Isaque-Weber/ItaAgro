import { Queue } from 'bullmq'
import { redisConnection } from './redis.service'

export interface ChatJobData {
  sessionId: string
  userMessageId: string
  threadId: string
  content: string
  userId: string
}

export const chatQueue = new Queue<ChatJobData>('chat-processing', {
  ...redisConnection,
  defaultJobOptions: {
    attempts: 3, // Retry até 3 vezes em caso de falha
    backoff: {
      type: 'exponential',
      delay: 2000, // 2s, 4s, 8s
    },
    removeOnComplete: 100, // Mantém últimos 100 jobs completados
    removeOnFail: 500, // Mantém últimos 500 jobs falhados para análise
  }
})

chatQueue.on('error', (err) => {
  console.error('❌ Erro na fila chat-processing:', err)
})
