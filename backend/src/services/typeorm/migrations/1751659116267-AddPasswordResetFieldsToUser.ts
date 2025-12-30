import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPasswordResetFieldsToUser1751659116267 implements MigrationInterface {
    name = 'AddPasswordResetFieldsToUser1751659116267'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasPasswordResetCode = await queryRunner.query(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'passwordResetCode'
        `);
        if (hasPasswordResetCode.length === 0) {
            await queryRunner.query(`ALTER TABLE "users" ADD "passwordResetCode" character varying`);
        }

        const hasExpiresAt = await queryRunner.query(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'passwordResetCodeExpiresAt'
        `);
        if (hasExpiresAt.length === 0) {
            await queryRunner.query(`ALTER TABLE "users" ADD "passwordResetCodeExpiresAt" TIMESTAMP`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "passwordResetCodeExpiresAt"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN IF EXISTS "passwordResetCode"`);
    }

}
