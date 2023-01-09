import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTable1666007317441 implements MigrationInterface {
    name = 'CreateTable1666007317441'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "todos" ("id" SERIAL NOT NULL, "title" character varying(50) NOT NULL, "done" boolean NOT NULL DEFAULT false, "userId" integer, CONSTRAINT "UQ_c427d5928f463be5c8965e0d684" UNIQUE ("title"), CONSTRAINT "PK_ca8cafd59ca6faaf67995344225" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "users" ("id" SERIAL NOT NULL, "username" character varying NOT NULL, "gmail" character varying NOT NULL, "password" character varying NOT NULL, CONSTRAINT "UQ_97429b42372c6d841a8fc0ad871" UNIQUE ("gmail"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "todos" ADD CONSTRAINT "FK_4583be7753873b4ead956f040e3" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "todos" DROP CONSTRAINT "FK_4583be7753873b4ead956f040e3"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "todos"`);
    }

}
