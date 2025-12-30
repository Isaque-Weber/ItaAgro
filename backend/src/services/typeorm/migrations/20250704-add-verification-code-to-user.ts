import { MigrationInterface, QueryRunner } from "typeorm";

export class AddVerificationCodeToUser1720099200000 implements MigrationInterface {
    name = 'AddVerificationCodeToUser1720099200000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Verifica se a coluna já existe antes de criar
        const hasVerificationCode = await queryRunner.query(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'verificationCode'
        `);
        if (hasVerificationCode.length === 0) {
            await queryRunner.query(`ALTER TABLE "users" ADD "verificationCode" character varying(6)`);
        }

        const hasExpiresAt = await queryRunner.query(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'verificationCodeExpiresAt'
        `);
        if (hasExpiresAt.length === 0) {
            await queryRunner.query(`ALTER TABLE "users" ADD "verificationCodeExpiresAt" TIMESTAMP`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "verificationCodeExpiresAt"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "verificationCode"`);
    }
}
