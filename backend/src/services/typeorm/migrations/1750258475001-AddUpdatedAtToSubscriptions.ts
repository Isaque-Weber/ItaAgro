import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUpdatedAtToSubscriptions1750258475001 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add the column with default value of current timestamp
        await queryRunner.query(`
            ALTER TABLE subscriptions 
            ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        `);

        // Comment explaining the migration
        await queryRunner.query(`
            COMMENT ON COLUMN subscriptions.updated_at IS 'Timestamp of last update, managed by TypeORM UpdateDateColumn';
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert the changes if needed
        await queryRunner.query(`
            ALTER TABLE subscriptions DROP COLUMN IF EXISTS updated_at;
        `);
    }
}