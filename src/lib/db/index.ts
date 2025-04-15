import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from "postgres";

// Check if the DATABASE_URL is defined in the environment
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined');
}

// Create a Drizzle client with the Neon HTTP adapter
export const db = drizzle(postgres(process.env.DATABASE_URL))