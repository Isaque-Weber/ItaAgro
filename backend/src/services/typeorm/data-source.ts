import 'reflect-metadata'
import { DataSource } from 'typeorm'
import { User } from '../../entities/User'
import { Subscription } from '../../entities/Subscription'
import { ChatSession } from '../../entities/ChatSession'
import { ChatMessage } from '../../entities/ChatMessage'

export const AppDataSource = new DataSource({
    type:     'postgres',
    url:      process.env.DATABASE_URL,
    synchronize: false,   // em dev true, em prod deixe false e use migrations
    dropSchema: false,
    logging:    false,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    entities: [
        User,
        Subscription,
        ChatSession,
        ChatMessage,
    ],
    // migrations: [ 'src/services/typeorm/migrations/*.ts' ],
})
