
import { sql } from 'drizzle-orm';
const isSQLite = process.env.DATABASE_URL?.startsWith('sqlite') ?? true;

const formatMonthSql = (col: any) =>
  isSQLite
    ? sql<string>`strftime('%Y-%m', ${col})`
    : sql<string>`TO_CHAR(${col}, 'YYYY-MM')`;

const castDecimalSql = (col: any) =>
  isSQLite
    ? sql<number>`CAST(${col} AS REAL)` // or NUMERIC
    : sql<number>`CAST(${col} AS DECIMAL)`;

const dateTruncSql = (col: any) =>
    isSQLite
    ? sql<string>`strftime('%Y-%m-01', ${col})`
    : sql<string>`DATE_TRUNC('month', ${col})`;

export {
    formatMonthSql,
    castDecimalSql,
    dateTruncSql
}