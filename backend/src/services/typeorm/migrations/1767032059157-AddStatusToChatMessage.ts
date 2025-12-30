import { MigrationInterface, QueryRunner } from "typeorm";

export class AddStatusToChatMessage1767032059157 implements MigrationInterface {
    name = 'AddStatusToChatMessage1767032059157'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasStatus = await queryRunner.query(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'chat_messages' AND column_name = 'status'
        `);
        if (hasStatus.length === 0) {
            await queryRunner.query(`ALTER TABLE "chat_messages" ADD "status" character varying(20) NOT NULL DEFAULT 'completed'`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chat_messages" DROP COLUMN IF EXISTS "status"`);
    }

}
