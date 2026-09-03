import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCategoriesAndTodoMetadata1788430234304 implements MigrationInterface {
  name = 'AddCategoriesAndTodoMetadata1788430234304';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "categories" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar(40) NOT NULL, "userId" integer NOT NULL, CONSTRAINT "FK_13e8b2a21988bec6fdcbb1fa741" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_categories_owner_name" ON "categories" ("userId", "name")`,
    );

    await queryRunner.query(
      `CREATE TABLE "todos_new" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "title" varchar(52) NOT NULL, "done" boolean NOT NULL DEFAULT (0), "priority" varchar(10) NOT NULL DEFAULT ('medium'), "dueDate" datetime, "userId" integer NOT NULL, "categoryId" integer, CONSTRAINT "FK_4583be7753873b4ead956f040e3" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_b875cb9ebf0be6ff05ff0174926" FOREIGN KEY ("categoryId") REFERENCES "categories" ("id") ON DELETE SET NULL ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "todos_new" ("id", "title", "done", "userId") SELECT "id", "title", "done", "userId" FROM "todos"`,
    );
    await queryRunner.query(`DROP TABLE "todos"`);
    await queryRunner.query(`ALTER TABLE "todos_new" RENAME TO "todos"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "todos_old" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "title" varchar(52) NOT NULL, "done" boolean NOT NULL DEFAULT (0), "userId" integer, CONSTRAINT "FK_todos_user" FOREIGN KEY ("userId") REFERENCES "users" ("id"))`,
    );
    await queryRunner.query(
      `INSERT INTO "todos_old" ("id", "title", "done", "userId") SELECT "id", "title", "done", "userId" FROM "todos"`,
    );
    await queryRunner.query(`DROP TABLE "todos"`);
    await queryRunner.query(`ALTER TABLE "todos_old" RENAME TO "todos"`);

    await queryRunner.query(`DROP INDEX "UQ_categories_owner_name"`);
    await queryRunner.query(`DROP TABLE "categories"`);
  }
}
