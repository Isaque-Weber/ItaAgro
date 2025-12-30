import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSubscriptionActiveToUser1753386081003 implements MigrationInterface {
    name = 'AddSubscriptionActiveToUser1753386081003'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasSubscriptionActive = await queryRunner.query(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'subscriptionActive'
        `);
        if (hasSubscriptionActive.length === 0) {
            await queryRunner.query(`ALTER TABLE "users" ADD "subscriptionActive" boolean NOT NULL DEFAULT false`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "subscriptionActive"`);
    }

}
