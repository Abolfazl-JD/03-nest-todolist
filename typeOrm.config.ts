import { DataSource } from "typeorm"
import { User } from "./src/users/user.entity"
import { Todo } from './src/todos/todo.entity';
import { CreateTable1666007317441 } from './migrations/1666007317441-CreateTable';import { ConfigService } from '@nestjs/config';
import { config } from 'dotenv';
import { $Change_Todo_Title_constraint1666007916089 } from "./migrations/1666007916089-Change_Todo_Title_constraint";
import { TitleLength1666009887923 } from './migrations/1666009887923-Title_length';

 
config();
 
const configService = new ConfigService();


export default new DataSource({
    type: 'postgres',
    host: configService.get('POSTGRES_HOST'),
    port: configService.get('POSTGRES_PORT'),
    username: configService.get('POSTGRES_USERNAME'),
    password: configService.get('POSTGRES_PASSWORD'),
    database: configService.get('POSTGRES_DATABASE'),
    entities : [User, Todo],
    synchronize: false,
    migrations: [CreateTable1666007317441, $Change_Todo_Title_constraint1666007916089, TitleLength1666009887923]
})