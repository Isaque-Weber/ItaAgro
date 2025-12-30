import { MigrationInterface, QueryRunner } from "typeorm";

export class AddExpiresAtToDocuments1752678851074 implements MigrationInterface {
    name = 'AddExpiresAtToDocuments1752678851074'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasExpiresAt = await queryRunner.query(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'documents' AND column_name = 'expires_at'
        `);
        if (hasExpiresAt.length === 0) {
            await queryRunner.query(`ALTER TABLE "documents" ADD "expires_at" TIMESTAMP NOT NULL DEFAULT NOW()`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "documents" DROP COLUMN IF EXISTS "expires_at"`);
    }

}
