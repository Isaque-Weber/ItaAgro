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

    @Column({ type: "jsonb", nullable: true })
    files?: { file_id: string, filename: string }[]

    @Column({ type: 'varchar', length: 20, default: 'completed' })
    status!: 'pending' | 'processing' | 'completed' | 'failed'

    @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
    createdAt!: Date
}
