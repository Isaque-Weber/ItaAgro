import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToMany,
    JoinTable,
    ManyToOne,
    JoinColumn
} from 'typeorm'
import { Culture } from './Culture'
import { Pest } from './Pest'
import { ActiveIngredient } from './ActiveIngredient'
import { Brand } from './Brand'

@Entity({ name: 'products' })
export class Product {
    @PrimaryGeneratedColumn('uuid')
    id!: string

    @Column({ type: 'varchar', length: 255 })
    name!: string

    @Column({ type: 'varchar', length: 255, nullable: true })
    registrationNumber?: string

    @Column({ type: 'varchar', length: 255, nullable: true })
    holder?: string

    @Column({ type: 'varchar', length: 50, nullable: true })
    toxicologicalClass?: string

    @Column({ type: 'varchar', length: 50, nullable: true })
    environmentalClass?: string

    @Column({ type: 'varchar', length: 255, nullable: true })
    formulationType?: string

    @Column({ type: 'text', nullable: true })
    applicationMode?: string

    @Column({ type: 'boolean', default: false })
    isBiological!: boolean

    @Column({ type: 'boolean', default: false })
    isOrganic!: boolean

    @Column({ type: 'jsonb', nullable: true })
    additionalData?: any

    @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
    createdAt!: Date

    @UpdateDateColumn({ type: 'timestamp', name: 'updated_at' })
    updatedAt!: Date

    @ManyToMany(() => Culture)
    @JoinTable({
        name: 'product_cultures',
        joinColumn: { name: 'product_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'culture_id', referencedColumnName: 'id' }
    })
    cultures!: Culture[]

    @ManyToMany(() => Pest)
    @JoinTable({
        name: 'product_pests',
        joinColumn: { name: 'product_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'pest_id', referencedColumnName: 'id' }
    })
    pests!: Pest[]

    @ManyToMany(() => ActiveIngredient)
    @JoinTable({
        name: 'product_active_ingredients',
        joinColumn: { name: 'product_id', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'active_ingredient_id', referencedColumnName: 'id' }
    })
    activeIngredients!: ActiveIngredient[]

    @ManyToOne(() => Brand, { nullable: true })
    @JoinColumn({ name: 'brand_id' })
    brand?: Brand
}