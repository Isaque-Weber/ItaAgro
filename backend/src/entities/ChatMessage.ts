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

    @ManyToOne(() => ChatSession, s => s.messages, {
        nullable: false,
        onDelete: 'CASCADE'
    })
    @JoinColumn({ name: 'session_id', referencedColumnName: 'id' })
    session!: ChatSession

    @Column({ type: 'varchar', length: 20 })
    role!: 'user' | 'assistant' | 'system'

    @Column('text')
    content!: string

    @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
    createdAt!: Date
}
