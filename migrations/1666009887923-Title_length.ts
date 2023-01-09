import { MigrationInterface, QueryRunner } from "typeorm";

export class TitleLength1666009887923 implements MigrationInterface {
    name = 'TitleLength1666009887923'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "todos" DROP COLUMN "title"`);
        await queryRunner.query(`ALTER TABLE "todos" ADD "title" character varying(52) NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "todos" DROP COLUMN "title"`);
        await queryRunner.query(`ALTER TABLE "todos" ADD "title" character varying(50) NOT NULL`);
    }

}
