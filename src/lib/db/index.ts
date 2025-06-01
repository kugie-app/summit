import { drizzle as drizzlePostgres } from 'drizzle-orm/postgres-js';
import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3';
import postgres from "postgres";
import Database from "better-sqlite3";

type PostgresDB = ReturnType<typeof drizzlePostgres>;
type SqliteDB = ReturnType<typeof drizzleSqlite>;

const databaseUrl = process.env.DATABASE_URL;
const db =
  databaseUrl?.startsWith('postgres') && databaseUrl
    ? drizzlePostgres(postgres(databaseUrl))
    : drizzleSqlite(new Database('./db/seed.sqlite'));

export { db };