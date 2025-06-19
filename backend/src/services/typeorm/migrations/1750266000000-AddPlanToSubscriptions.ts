import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPlanToSubscriptions1750266000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add the column with default value of null
        await queryRunner.query(`
            ALTER TABLE subscriptions 
            ADD COLUMN IF NOT EXISTS plan VARCHAR(50) DEFAULT NULL;
        `);

        // Comment explaining the migration
        await queryRunner.query(`
            COMMENT ON COLUMN subscriptions.plan IS 'Subscription plan type (e.g. basic, premium)';
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert the changes if needed
        await queryRunner.query(`
            ALTER TABLE subscriptions DROP COLUMN IF EXISTS plan;
        `);
    }
}