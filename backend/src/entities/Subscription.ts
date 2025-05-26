// backend/src/entities/Subscription.ts
import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn
} from 'typeorm'
import { User } from './User'

export enum SubscriptionStatus {
    ACTIVE   = 'active',
    CANCELED = 'canceled',
    PENDING  = 'pending'
}

@Entity({ name: 'subscriptions' })
export class Subscription {
    @PrimaryGeneratedColumn('uuid')
    id!: string

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
}
