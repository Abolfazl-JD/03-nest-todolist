import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameGmailToEmail1788429735954 implements MigrationInterface {
  name = 'RenameGmailToEmail1788429735954';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" RENAME COLUMN "gmail" TO "email"`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" RENAME COLUMN "email" TO "gmail"`,
    );
  }
}
