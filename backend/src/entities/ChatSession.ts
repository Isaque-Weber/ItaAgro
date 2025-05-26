// backend/src/entities/ChatSession.ts
import {
    Entity,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    ManyToOne,
    OneToMany,
    JoinColumn
} from 'typeorm'
import { User } from './User'
import { ChatMessage } from './ChatMessage'

@Entity({ name: 'chat_sessions' })
export class ChatSession {
    @PrimaryGeneratedColumn('uuid')
    id!: string

    @ManyToOne(() => User, u => u.chatSessions)
    @JoinColumn({ name: 'user_id' })
    user!: User

    @CreateDateColumn({ type: 'timestamp', name: 'started_at' })
    startedAt!: Date

    @OneToMany(() => ChatMessage, m => m.session)
    messages!: ChatMessage[]
}
