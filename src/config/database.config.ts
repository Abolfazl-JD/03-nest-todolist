import { join } from 'path';
import { mkdirSync } from 'fs';
import { DataSourceOptions } from 'typeorm';

import { Category } from '../categories/category.entity';
import { Todo } from '../todos/todo.entity';
import { User } from '../users/user.entity';
import { migrations } from '../migrations';

export const DEFAULT_DATABASE_PATH = join(
  process.cwd(),
  'data',
  'university-project.sqlite',
);

export const buildDatabaseOptions = (
  overrides: Partial<DataSourceOptions> = {},
): DataSourceOptions => {
  const database = process.env.DATABASE_PATH || DEFAULT_DATABASE_PATH;

  if (database !== ':memory:') {
    mkdirSync(join(database, '..'), { recursive: true });
  }

  return {
    type: 'better-sqlite3',
    database,
    entities: [User, Todo, Category],
    migrations,
    synchronize: false,
    ...overrides,
  } as DataSourceOptions;
};
