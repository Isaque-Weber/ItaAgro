import { MigrationInterface, QueryRunner } from "typeorm";

export class AddVerificationCodeToUser1720099200000 implements MigrationInterface {
    name = 'AddVerificationCodeToUser1720099200000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "verificationCode" character varying(6)`);
        await queryRunner.query(`ALTER TABLE "users" ADD "verificationCodeExpiresAt" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "verificationCodeExpiresAt"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "verificationCode"`);
    }
}
