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
    entities: [
        User,
        Subscription,
        ChatSession,
        ChatMessage,
    ],
    // migrations: [ 'src/services/typeorm/migrations/*.ts' ]
})
