import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNotifications1788447768625 implements MigrationInterface {
  name = 'AddNotifications1788447768625';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "notifications" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "type" varchar(20) NOT NULL, "message" varchar(255) NOT NULL, "readAt" datetime, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "userId" integer NOT NULL, "todoId" integer, CONSTRAINT "FK_692a909ee0fa9383e7859f9b406" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_92a1abf9e248319bfe0226ce588" FOREIGN KEY ("todoId") REFERENCES "todos" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_notifications_todo_type" ON "notifications" ("todoId", "type")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_notifications_user_created" ON "notifications" ("userId", "createdAt")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_notifications_user_created"`);
    await queryRunner.query(`DROP INDEX "IDX_notifications_todo_type"`);
    await queryRunner.query(`DROP TABLE "notifications"`);
  }
}
