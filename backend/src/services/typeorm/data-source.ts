import 'dotenv/config'
import 'reflect-metadata'
import { DataSource } from 'typeorm'
import { User } from '../../entities/User'
import { Subscription } from '../../entities/Subscription'
import { ChatSession } from '../../entities/ChatSession'
import { ChatMessage } from '../../entities/ChatMessage'

export const AppDataSource = new DataSource({
    type:     'postgres',
    url:      process.env.DATABASE_URL,
    synchronize: true,   // em dev true, em prod deixe false e use migrations
    dropSchema: false,
    logging:    false,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    entities: [
        User,
        Subscription,
        ChatSession,
        ChatMessage,
    ],
    migrations: [ process.env.NODE_ENV === 'production' ? 'dist/src/services/typeorm/migrations/*.js' : 'src/services/typeorm/migrations/*.ts' ],
})

AppDataSource.initialize()
  .then(() => {
    console.log('Conexão com o banco de dados estabelecida com sucesso!')
  })
  .catch((error) => {
    console.error('Erro ao conectar no banco de dados:', error)
  })
