import { db } from '@/lib/db';
import { SQL, and, eq } from 'drizzle-orm';
import { PgTableWithColumns, PgSelectQueryBuilder } from 'drizzle-orm/pg-core';

/**
 * Utility for ensuring all database queries are scoped to the user's company
 * This helps enforce multi-tenancy and data isolation between companies
 */

/**
 * Get records from a table scoped to a specific company
 */
export async function getCompanyScopedRecords<T extends PgTableWithColumns<any>>({
  table,
  companyId,
  where = undefined,
  withSoftDeleted = false,
  limit = undefined,
  offset = undefined,
  orderBy = undefined,
}: {
  table: T;
  companyId: number;
  where?: SQL<unknown>;
  withSoftDeleted?: boolean;
  limit?: number;
  offset?: number;
  orderBy?: SQL<unknown>;
}) {
  // Build all conditions first
  let conditions: SQL<unknown> | undefined = eq(table.companyId as any, companyId);
  
  if (!withSoftDeleted && 'softDelete' in table) {
    conditions = and(conditions, eq(table.softDelete as any, false));
  }
  
  if (where) {
    conditions = and(conditions, where);
  }

  let query = db
    .select()
    .from(table as any)
    .where(conditions)
    .$dynamic();

  if (orderBy) {
    query = query.orderBy(orderBy);
  }

  if (limit) {
    query = query.limit(limit);
  }

  if (offset) {
    query = query.offset(offset);
  }

  return query;
}

/**
 * Get a single record from a table scoped to a specific company
 */
export async function getCompanyScopedRecord<T extends PgTableWithColumns<any>>({
  table,
  companyId,
  id,
  withSoftDeleted = false,
}: {
  table: T;
  companyId: number;
  id: number;
  withSoftDeleted?: boolean;
}) {
  let query = db
    .select()
    .from(table as any)
    .where(and(
      eq(table.companyId as any, companyId),
      eq(table.id as any, id)
    ))
    .$dynamic();

  if (!withSoftDeleted && 'softDelete' in table) {
    query = query.where(eq(table.softDelete as any, false));
  }

  const results = await query;
  return results[0];
}

/**
 * Insert a record into a table with company ID automatically applied
 */
export async function insertCompanyScopedRecord<T extends PgTableWithColumns<any>, U>({
  table,
  companyId,
  data,
}: {
  table: T;
  companyId: number;
  data: U;
}) {
  return db
    .insert(table)
    .values({
      ...data,
      companyId,
    } as any)
    .returning();
}

/**
 * Update a record in a table scoped to a specific company
 */
export async function updateCompanyScopedRecord<T extends PgTableWithColumns<any>, U>({
  table,
  companyId,
  id,
  data,
}: {
  table: T;
  companyId: number;
  id: number;
  data: U;
}) {
  return db
    .update(table)
    .set({
      ...data,
      updatedAt: new Date(),
    } as any)
    .where(and(
      eq(table.companyId as any, companyId),
      eq(table.id as any, id)
    ))
    .returning();
}

/**
 * Soft delete a record in a table scoped to a specific company
 */
export async function softDeleteCompanyScopedRecord<T extends PgTableWithColumns<any>>({
  table,
  companyId,
  id,
}: {
  table: T;
  companyId: number;
  id: number;
}) {
  return db
    .update(table)
    .set({
      softDelete: true,
      updatedAt: new Date(),
    } as any)
    .where(and(
      eq(table.companyId as any, companyId),
      eq(table.id as any, id)
    ))
    .returning();
}

/**
 * Hard delete a record in a table scoped to a specific company
 * Use with caution as this permanently removes data
 */
export async function hardDeleteCompanyScopedRecord<T extends PgTableWithColumns<any>>({
  table,
  companyId,
  id,
}: {
  table: T;
  companyId: number;
  id: number;
}) {
  return db
    .delete(table)
    .where(and(
      eq(table.companyId as any, companyId),
      eq(table.id as any, id)
    ))
    .returning();
} 