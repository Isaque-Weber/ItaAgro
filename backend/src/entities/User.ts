// backend/src/entities/User.ts
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    OneToMany,
    BeforeInsert,
    BeforeUpdate,
} from 'typeorm'
import { Subscription } from './Subscription'
import { ChatSession }  from './ChatSession'
import bcrypt from "bcrypt";

@Entity({ name: 'users' })
export class User {
    @PrimaryGeneratedColumn('uuid')
    id!: string

    @Column({ type: 'varchar', length: 255, unique: true })
    email!: string

    @Column({ type: 'varchar', length: 100 })
    password!: string

    @Column({ type: 'enum', enum: ['user','admin'], default: 'user' })
    role!: 'user' | 'admin'

    @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
    createdAt!: Date

    @OneToMany(() => Subscription, s => s.user)
    subscriptions!: Subscription[]

    @OneToMany(() => ChatSession, s => s.user)
    chatSessions!: ChatSession[]

    /** Hashea a senha antes de inserir ou atualizar */
    @BeforeInsert()
    @BeforeUpdate()
    private async hashPassword() {
        if (this.password) {
            this.password = await bcrypt.hash(this.password, 10)
        }
    }
}
