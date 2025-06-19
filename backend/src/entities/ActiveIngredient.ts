import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToMany
} from 'typeorm'
import { Product } from './Product'

@Entity({ name: 'active_ingredients' })
export class ActiveIngredient {
    @PrimaryGeneratedColumn('uuid')
    id!: string

    @Column({ type: 'varchar', length: 255 })
    name!: string

    @Column({ type: 'varchar', length: 255, nullable: true })
    chemicalGroup?: string

    @Column({ type: 'varchar', length: 255, nullable: true })
    actionMode?: string

    @Column({ type: 'jsonb', nullable: true })
    additionalData?: any

    @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
    createdAt!: Date

    @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
    updatedAt!: Date

    @ManyToMany(() => Product, product => product.activeIngredients)
    products!: Product[]
}