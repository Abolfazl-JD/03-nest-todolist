import { config } from 'dotenv';
import { DataSource } from 'typeorm';

import { buildDatabaseOptions } from './src/config/database.config';

config();

// Used by the TypeORM CLI only (migration generate / run / revert).
export default new DataSource(buildDatabaseOptions());
