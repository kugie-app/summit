import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });

if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL is not defined. Please ensure your environment variables are properly configured.\n' +
    'For local development: Create a .env file with DATABASE_URL\n' +
    'For Railway: Ensure DATABASE_URL is set in your service variables'
  );
}

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/lib/db/schema.ts',
  out: './src/lib/db/migrations',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});