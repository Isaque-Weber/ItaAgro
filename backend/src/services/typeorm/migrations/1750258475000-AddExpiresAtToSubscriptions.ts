import { MigrationInterface, QueryRunner } from "typeorm";

export class AddExpiresAtToSubscriptions1750258475000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add the column with default value of null
        await queryRunner.query(`
            ALTER TABLE subscriptions 
            ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
        `);

        // Comment explaining the migration
        await queryRunner.query(`
            COMMENT ON COLUMN subscriptions.expires_at IS 'Timestamp when the subscription expires';
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert the changes if needed
        await queryRunner.query(`
            ALTER TABLE subscriptions DROP COLUMN IF EXISTS expires_at;
        `);
    }
}