import { Worker, Job } from 'bullmq'
import { redisConnection } from './redis.service'
import { ChatJobData } from './chat.queue'
import { processMessageWithChatCompletion } from '../openai/processMessageWithChatCompletion'
import { AppDataSource } from '../typeorm/data-source'
import { ChatMessage } from '../../entities/ChatMessage'
import { ChatSession } from '../../entities/ChatSession'

export function createChatWorker() {
  const worker = new Worker<ChatJobData>(
    'chat-processing',
    async (job: Job<ChatJobData>) => {
      const { sessionId, userMessageId, content } = job.data
      
      console.log('')
      console.log('╔══════════════════════════════════════════════════════════╗')
      console.log('║ 📨 PROCESSANDO JOB                                       ║')
      console.log('╠══════════════════════════════════════════════════════════╣')
      console.log(`║ Job ID:     ${job.id}`)
      console.log(`║ Session ID: ${sessionId}`)
      console.log(`║ Message ID: ${userMessageId}`)
      console.log(`║ Conteúdo:   ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`)
      console.log('╚══════════════════════════════════════════════════════════╝')
      
      const messageRepo = AppDataSource.getRepository(ChatMessage)
      const sessionRepo = AppDataSource.getRepository(ChatSession)
      
      // Atualiza status para "processing"
      await messageRepo.update(userMessageId, { status: 'processing' })
      console.log('⏳ Status atualizado para: processing')
      
      try {
        // Busca sessão
        const session = await sessionRepo.findOneOrFail({ where: { id: sessionId } })
        
        // Busca histórico de mensagens da sessão (últimas 20)
        const history = await messageRepo.find({
          where: { session: { id: sessionId } },
          order: { createdAt: 'ASC' },
          take: 20
        })
        console.log(`📜 Histórico carregado: ${history.length} mensagens`)
        
        // Cria a mensagem do assistente IMEDIATAMENTE (vazia) para podermos atualizar o conteúdo
        const assistantMsg = messageRepo.create({
            session: { id: sessionId },
            role: 'assistant',
            content: '', // Começa vazia
            status: 'processing'
        })
        await messageRepo.save(assistantMsg)
        console.log(`🤖 Mensagem do assistente criada (ID: ${assistantMsg.id}) aguardando stream...`)

        // Controle de throttle para não spamar o banco
        let lastUpdate = Date.now()
        let lastContentLength = 0
        
        // Callback para atualização progressiva
        const onProgress = async (partialContent: string) => {
            const now = Date.now()
            // Atualiza se passou 150ms OU se tem quebra de parágrafo nova
            // ou se cresceu um pouco (>15 chars) desde o último update
            if (
                (now - lastUpdate > 150) ||
                (partialContent.length - lastContentLength > 15) ||
                (partialContent.endsWith('\n\n'))
            ) {
                await messageRepo.update(assistantMsg.id, { content: partialContent })
                lastUpdate = now
                lastContentLength = partialContent.length
                // Opcional: Logar progresso
                // console.log(`Stream: ${partialContent.length} chars...`)
            }
        }

        // Processa com Chat Completion (Streaming)
        console.log('🚀 Iniciando Chat Completion...')
        
        const startTime = Date.now()
        
        // Passamos o callback onProgress
        const reply = await processMessageWithChatCompletion(content, history, onProgress)
        
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(2)
        console.log(`✅ Chat Completion finalizado em ${elapsed}s`)
        
        // Atualiza mensagem final com status completed e conteúdo completo
        await messageRepo.update(assistantMsg.id, { 
            content: reply,
            status: 'completed'
        })
        console.log('💾 Resposta final salva no banco')
        
        // Atualiza mensagem do usuário como completed
        await messageRepo.update(userMessageId, { status: 'completed' })
        
        console.log('')
        console.log('╔══════════════════════════════════════════════════════════╗')
        console.log('║ ✅ JOB CONCLUÍDO COM SUCESSO                             ║')
        console.log('╠══════════════════════════════════════════════════════════╣')
        console.log(`║ Tempo total: ${elapsed}s`)
        console.log(`║ Resposta: ${reply.substring(0, 60)}${reply.length > 60 ? '...' : ''}`)
        console.log('╚══════════════════════════════════════════════════════════╝')
        console.log('')
        
        return { success: true, replyId: assistantMsg.id }
      } catch (error) {
        console.error('')
        console.error('╔══════════════════════════════════════════════════════════╗')
        console.error('║ ❌ JOB FALHOU                                            ║')
        console.error('╠══════════════════════════════════════════════════════════╣')
        console.error(`║ Erro:`, error)
        console.error('╚══════════════════════════════════════════════════════════╝')
        console.error('')
        await messageRepo.update(userMessageId, { status: 'failed' })
        throw error
      }
    },
    {
      ...redisConnection,
      concurrency: 5, // Processa até 5 jobs em paralelo
    }
  )

  worker.on('completed', (job) => {
    console.log(`✅ Worker: Job ${job.id} completed`)
  })

  worker.on('failed', (job, err) => {
    console.error(`❌ Worker: Job ${job?.id} failed:`, err.message)
  })

  worker.on('error', (err) => {
    console.error('❌ Worker error:', err)
  })

  return worker
}
