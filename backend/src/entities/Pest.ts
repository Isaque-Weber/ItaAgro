import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToMany
} from 'typeorm'
import { Product } from './Product'

@Entity({ name: 'pests' })
export class Pest {
    @PrimaryGeneratedColumn('uuid')
    id!: string

    @Column({ type: 'varchar', length: 255 })
    commonName!: string

    @Column({ type: 'varchar', length: 255, nullable: true })
    scientificName?: string

    @Column({ type: 'varchar', length: 255, nullable: true })
    type?: string

    @Column({ type: 'jsonb', nullable: true })
    additionalData?: any

    @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
    createdAt!: Date

    @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
    updatedAt!: Date

    @ManyToMany(() => Product, product => product.pests)
    products!: Product[]
}