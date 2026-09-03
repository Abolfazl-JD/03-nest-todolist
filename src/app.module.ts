import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from './auth/auth.module';
import { CategoriesModule } from './categories/categories.module';
import { buildDatabaseOptions } from './config/database.config';
import { validateEnv } from './config/env.validation';
import { TodosModule } from './todos/todos.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    TypeOrmModule.forRootAsync({
      useFactory: () => buildDatabaseOptions({ migrationsRun: true }),
    }),
    AuthModule,
    CategoriesModule,
    TodosModule,
    UsersModule,
  ],
})
export class AppModule {}
