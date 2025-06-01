import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

export default defineConfig({
  dialect: 'sqlite',
  schema: './src/lib/db/schema.ts',
  out: './src/lib/db/migrations-sqlite',
  dbCredentials: {
    // You can use a static path or env-based one
    url: './db/seed.sqlite',
  },
});
