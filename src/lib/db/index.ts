import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

// Check if the DATABASE_URL is defined in the environment
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not defined');
}

// Optional: Set neonConfig for WebSocket connections in production
neonConfig.fetchConnectionCache = true;

// Create a SQL connection
const sql = neon(process.env.DATABASE_URL!);

// Create a Drizzle client with the Neon HTTP adapter
export const db = drizzle(sql); 