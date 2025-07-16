import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm'

@Entity({ name: 'documents' })
export class Document {
        @PrimaryGeneratedColumn('uuid')
        id!: string

        @Column({ type: 'varchar' })
        filename!: string

        @Column('text')
        content!: string

        @CreateDateColumn({ name: 'created_at' })
        createdAt!: Date

        @Column({ name: 'expires_at', type: 'timestamp' })
        expiresAt!: Date
    }