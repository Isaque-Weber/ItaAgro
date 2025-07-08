import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPasswordResetFieldsToUser1751659116267 implements MigrationInterface {
    name = 'AddPasswordResetFieldsToUser1751659116267'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "passwordResetCode" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD "passwordResetCodeExpiresAt" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "passwordResetCodeExpiresAt"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "passwordResetCode"`);
    }

}
