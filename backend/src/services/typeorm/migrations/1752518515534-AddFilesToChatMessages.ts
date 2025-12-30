import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFilesToChatMessages1752518515534 implements MigrationInterface {
    name = 'AddFilesToChatMessages1752518515534'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasFiles = await queryRunner.query(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name = 'chat_messages' AND column_name = 'files'
        `);
        if (hasFiles.length === 0) {
            await queryRunner.query(`ALTER TABLE "chat_messages" ADD "files" jsonb`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chat_messages" DROP COLUMN IF EXISTS "files"`);
    }

}
