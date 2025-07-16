import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFilesToChatMessages1752518515534 implements MigrationInterface {
    name = 'AddFilesToChatMessages1752518515534'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chat_messages" ADD "files" jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "chat_messages" DROP COLUMN "files"`);
    }

}
