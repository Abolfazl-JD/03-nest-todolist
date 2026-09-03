import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1788426883479 implements MigrationInterface {
  name = 'InitialSchema1788426883479';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "username" varchar NOT NULL,
        "gmail" varchar NOT NULL,
        "password" varchar NOT NULL,
        CONSTRAINT "UQ_users_gmail" UNIQUE ("gmail")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "todos" (
        "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
        "title" varchar(52) NOT NULL,
        "done" boolean NOT NULL DEFAULT (0),
        "userId" integer,
        CONSTRAINT "FK_todos_user" FOREIGN KEY ("userId") REFERENCES "users" ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "todos"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
