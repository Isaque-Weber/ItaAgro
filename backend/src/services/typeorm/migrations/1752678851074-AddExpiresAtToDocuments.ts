import { MigrationInterface, QueryRunner } from "typeorm";

export class AddExpiresAtToDocuments1752678851074 implements MigrationInterface {
    name = 'AddExpiresAtToDocuments1752678851074'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "documents" ADD "expires_at" TIMESTAMP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "documents" DROP COLUMN "expires_at"`);
    }

}
