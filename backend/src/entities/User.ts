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

    @Column({type: 'varchar', length: 255})
    name!: string

    @Column({ type: 'varchar', length: 100, nullable: true })
    password?: string

    @Column({ type: 'boolean', default: false })
    emailVerified!: boolean

    @Column({ type: 'varchar', length: 6, nullable: true })
    verificationCode?: string

    @Column({ type: 'timestamp', nullable: true })
    verificationCodeExpiresAt?: Date

    @Column({ type: 'varchar', nullable: true })
    passwordResetCode?: string;

    @Column({ type: 'timestamp', nullable: true })
    passwordResetCodeExpiresAt?: Date;

    @Column({ type: 'enum', enum: ['user','admin'], default: 'user' })
    role!: 'user' | 'admin'

    @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
    createdAt!: Date

    @Column({ type: 'boolean', default: false })
    subscriptionActive!: boolean;

    @OneToMany(() => Subscription, s => s.user)
    subscriptions!: Subscription[]

    @OneToMany(() => ChatSession, s => s.user)
    chatSessions!: ChatSession[]

    /** Hashea a senha antes de inserir ou atualizar */
    @BeforeInsert()
    @BeforeUpdate()
    private async hashPassword() {
        if (this.password && !this.password.startsWith('$2b$')) {
            this.password = await bcrypt.hash(this.password, 10)
        }
    }
}
