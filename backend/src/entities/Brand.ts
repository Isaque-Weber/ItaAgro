import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany
} from 'typeorm'
import { Product } from './Product'

@Entity({ name: 'brands' })
export class Brand {
    @PrimaryGeneratedColumn('uuid')
    id!: string

    @Column({ type: 'varchar', length: 255 })
    name!: string

    @Column({ type: 'varchar', length: 255, nullable: true })
    company?: string

    @Column({ type: 'jsonb', nullable: true })
    additionalData?: any

    @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
    createdAt!: Date

    @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
    updatedAt!: Date

    @OneToMany(() => Product, product => product.brand)
    products!: Product[]
}