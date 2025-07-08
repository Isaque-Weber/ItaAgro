import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveVerificationTokenColumns1751654112955 implements MigrationInterface {
    name = 'RemoveVerificationTokenColumns1751654112955'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "verificationToken"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "verificationTokenExpiresAt"`);
        await queryRunner.query(`COMMENT ON COLUMN "subscriptions"."updated_at" IS NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "subscriptions"."expires_at" IS NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "subscriptions"."plan" IS NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`COMMENT ON COLUMN "subscriptions"."plan" IS 'Subscription plan type (e.g. basic, premium)'`);
        await queryRunner.query(`COMMENT ON COLUMN "subscriptions"."expires_at" IS 'Timestamp when the subscription expires'`);
        await queryRunner.query(`COMMENT ON COLUMN "subscriptions"."updated_at" IS 'Timestamp of last update, managed by TypeORM UpdateDateColumn'`);
        await queryRunner.query(`ALTER TABLE "users" ADD "verificationTokenExpiresAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "users" ADD "verificationToken" character varying(64)`);
    }

}
