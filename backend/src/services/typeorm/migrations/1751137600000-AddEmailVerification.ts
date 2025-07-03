import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddEmailVerification1751137600000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const table = "users";

        const hasEmailVerified = await queryRunner.hasColumn(table, "emailVerified");
        if (!hasEmailVerified) {
            await queryRunner.addColumn(table, new TableColumn({
                name: "emailVerified",
                type: "boolean",
                default: false,
                isNullable: false,
            }));
        }

        const hasVerificationToken = await queryRunner.hasColumn(table, "verificationToken");
        if (!hasVerificationToken) {
            await queryRunner.addColumn(table, new TableColumn({
                name: "verificationToken",
                type: "varchar",
                length: "64",
                isNullable: true,
            }));
        }

        const hasVerificationTokenExpiresAt = await queryRunner.hasColumn(table, "verificationTokenExpiresAt");
        if (!hasVerificationTokenExpiresAt) {
            await queryRunner.addColumn(table, new TableColumn({
                name: "verificationTokenExpiresAt",
                type: "timestamp",
                isNullable: true,
            }));
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = "users";

        const hasEmailVerified = await queryRunner.hasColumn(table, "emailVerified");
        if (hasEmailVerified) {
            await queryRunner.dropColumn(table, "emailVerified");
        }

        const hasVerificationToken = await queryRunner.hasColumn(table, "verificationToken");
        if (hasVerificationToken) {
            await queryRunner.dropColumn(table, "verificationToken");
        }

        const hasVerificationTokenExpiresAt = await queryRunner.hasColumn(table, "verificationTokenExpiresAt");
        if (hasVerificationTokenExpiresAt) {
            await queryRunner.dropColumn(table, "verificationTokenExpiresAt");
        }
    }
}
