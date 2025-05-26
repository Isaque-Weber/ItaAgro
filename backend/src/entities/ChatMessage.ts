// backend/src/entities/ChatMessage.ts
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn
} from 'typeorm'
import { ChatSession } from './ChatSession'

@Entity({ name: 'chat_messages' })
export class ChatMessage {
    @PrimaryGeneratedColumn('uuid')
    id!: string

    @ManyToOne(() => ChatSession, s => s.messages, { nullable: false })
    @JoinColumn({ name: 'session_id', referencedColumnName: 'id' })
    session!: ChatSession

    @Column({ type: 'varchar', length: 20 })
    role!: 'user' | 'admin' | 'system'

    @Column('text')
    text!: string

    @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
    createdAt!: Date
}
