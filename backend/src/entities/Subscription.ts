// backend/src/entities/Subscription.ts
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn
} from 'typeorm'
import { User } from './User'

export enum SubscriptionStatus {
    ACTIVE   = 'active',
    CANCELED = 'canceled',
    PENDING  = 'pending',
    AUTHORIZED = 'authorized'
}

@Entity({ name: 'subscriptions' })
export class Subscription {
    @PrimaryGeneratedColumn('uuid')
    id!: string

    @Column({ name: 'external_id', type: 'varchar', nullable: true })
    externalId?: string

    @ManyToOne(() => User, u => u.subscriptions)
    @JoinColumn({ name: 'user_id' })
    user!: User

    @Column({
        type:    'enum',
        enum:    SubscriptionStatus,
        default: SubscriptionStatus.PENDING
    })
    status!: SubscriptionStatus

    @CreateDateColumn({ name: 'created_at', type: 'timestamp with time zone' })
    createdAt!: Date

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamp with time zone', nullable: true })
    updatedAt?: Date

    @Column({ name: 'expires_at', type: 'timestamp with time zone', nullable: true })
    expiresAt?: Date

    @Column({ type: 'varchar', length: 50, nullable: true })
    plan?: string
}
