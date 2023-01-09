import { MigrationInterface, QueryRunner } from "typeorm";

export class $Change_Todo_Title_constraint1666007916089 implements MigrationInterface {
    name = '$Change_Todo_Title_constraint1666007916089'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "todos" DROP CONSTRAINT "UQ_c427d5928f463be5c8965e0d684"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "todos" ADD CONSTRAINT "UQ_c427d5928f463be5c8965e0d684" UNIQUE ("title")`);
    }

}
