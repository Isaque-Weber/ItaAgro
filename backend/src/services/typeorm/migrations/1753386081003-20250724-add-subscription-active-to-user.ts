import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSubscriptionActiveToUser1753386081003 implements MigrationInterface {
    name = 'AddSubscriptionActiveToUser1753386081003'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "subscriptionActive" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "subscriptionActive"`);
    }

}
