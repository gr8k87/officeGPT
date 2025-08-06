// server/src/db/migrate.ts
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db, pool } from './index.js'; // Use .js extension for ESM imports
import dotenv from 'dotenv';

dotenv.config();

async function runMigrations() {
  console.log('Running database migrations...');
  try {
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('Migrations completed successfully!');
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigrations();