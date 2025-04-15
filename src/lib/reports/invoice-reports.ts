import { db } from '@/lib/db';
import { invoices, clients, payments } from '@/lib/db/schema';
import { and, eq, gte, lte, sql, count, sum, isNull, not } from 'drizzle-orm';
import { format, subDays, parseISO } from 'date-fns';

// Get invoice summary for a company
export const getInvoiceSummary = async (companyId: number) => {
  // Get total invoices
  const [totalResult] = await db
    .select({
      count: count(),
      total: sum(sql<number>`CAST(${invoices.total} AS DECIMAL)`),
    })
    .from(invoices)
    .where(
      and(
        eq(invoices.companyId, companyId),
        eq(invoices.softDelete, false)
      )
    );

  // Get total paid invoices
  const [paidResult] = await db
    .select({
      count: count(),
      total: sum(sql<number>`CAST(${invoices.total} AS DECIMAL)`),
    })
    .from(invoices)
    .where(
      and(
        eq(invoices.companyId, companyId),
        eq(invoices.status, 'paid'),
        eq(invoices.softDelete, false)
      )
    );

  // Get total overdue invoices
  const [overdueResult] = await db
    .select({
      count: count(),
      total: sum(sql<number>`CAST(${invoices.total} AS DECIMAL)`),
    })
    .from(invoices)
    .where(
      and(
        eq(invoices.companyId, companyId),
        eq(invoices.status, 'overdue'),
        eq(invoices.softDelete, false)
      )
    );

  // Get total unpaid (sent, not overdue) invoices
  const [unpaidResult] = await db
    .select({
      count: count(),
      total: sum(sql<number>`CAST(${invoices.total} AS DECIMAL)`),
    })
    .from(invoices)
    .where(
      and(
        eq(invoices.companyId, companyId),
        eq(invoices.status, 'sent'),
        eq(invoices.softDelete, false)
      )
    );

  // Get total draft invoices
  const [draftResult] = await db
    .select({
      count: count(),
      total: sum(sql<number>`CAST(${invoices.total} AS DECIMAL)`),
    })
    .from(invoices)
    .where(
      and(
        eq(invoices.companyId, companyId),
        eq(invoices.status, 'draft'),
        eq(invoices.softDelete, false)
      )
    );

  // Return the summary
  return {
    all: {
      count: Number(totalResult?.count || 0),
      total: Number(totalResult?.total || 0),
    },
    paid: {
      count: Number(paidResult?.count || 0),
      total: Number(paidResult?.total || 0),
    },
    overdue: {
      count: Number(overdueResult?.count || 0),
      total: Number(overdueResult?.total || 0),
    },
    unpaid: {
      count: Number(unpaidResult?.count || 0),
      total: Number(unpaidResult?.total || 0),
    },
    draft: {
      count: Number(draftResult?.count || 0),
      total: Number(draftResult?.total || 0),
    },
  };
};

// Get recent invoices
export const getRecentInvoices = async (companyId: number, limit: number = 5) => {
  const query = db
    .select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      status: invoices.status,
      issueDate: invoices.issueDate,
      dueDate: invoices.dueDate,
      total: invoices.total,
      clientId: invoices.clientId,
      clientName: clients.name,
    })
    .from(invoices)
    .leftJoin(clients, eq(invoices.clientId, clients.id))
    .where(
      and(
        eq(invoices.companyId, companyId),
        eq(invoices.softDelete, false)
      )
    )
    .orderBy(sql`${invoices.createdAt} DESC`)
    .limit(limit);

  return query;
};

// Get aging receivables report (0-30, 31-60, 61-90, 90+ days)
export const getAgingReceivables = async (companyId: number) => {
  const today = new Date();
  const thirtyDaysAgo = format(subDays(today, 30), 'yyyy-MM-dd');
  const sixtyDaysAgo = format(subDays(today, 60), 'yyyy-MM-dd');
  const ninetyDaysAgo = format(subDays(today, 90), 'yyyy-MM-dd');

  // Current (0-30 days)
  const [current] = await db
    .select({
      count: count(),
      total: sum(sql<number>`CAST(${invoices.total} AS DECIMAL)`),
    })
    .from(invoices)
    .where(
      and(
        eq(invoices.companyId, companyId),
        not(eq(invoices.status, 'paid')),
        not(eq(invoices.status, 'draft')),
        gte(invoices.dueDate, thirtyDaysAgo),
        eq(invoices.softDelete, false)
      )
    );
  
  // 31-60 days
  const [thirtyToSixty] = await db
    .select({
      count: count(),
      total: sum(sql<number>`CAST(${invoices.total} AS DECIMAL)`),
    })
    .from(invoices)
    .where(
      and(
        eq(invoices.companyId, companyId),
        not(eq(invoices.status, 'paid')),
        not(eq(invoices.status, 'draft')),
        gte(invoices.dueDate, sixtyDaysAgo),
        lte(invoices.dueDate, thirtyDaysAgo),
        eq(invoices.softDelete, false)
      )
    );
  
  // 61-90 days
  const [sixtyToNinety] = await db
    .select({
      count: count(),
      total: sum(sql<number>`CAST(${invoices.total} AS DECIMAL)`),
    })
    .from(invoices)
    .where(
      and(
        eq(invoices.companyId, companyId),
        not(eq(invoices.status, 'paid')),
        not(eq(invoices.status, 'draft')),
        gte(invoices.dueDate, ninetyDaysAgo),
        lte(invoices.dueDate, sixtyDaysAgo),
        eq(invoices.softDelete, false)
      )
    );
  
  // Over 90 days
  const [overNinety] = await db
    .select({
      count: count(),
      total: sum(sql<number>`CAST(${invoices.total} AS DECIMAL)`),
    })
    .from(invoices)
    .where(
      and(
        eq(invoices.companyId, companyId),
        not(eq(invoices.status, 'paid')),
        not(eq(invoices.status, 'draft')),
        lte(invoices.dueDate, ninetyDaysAgo),
        eq(invoices.softDelete, false)
      )
    );

  // Return the aging report
  return {
    current: {
      range: '0-30 days',
      count: Number(current?.count || 0),
      total: Number(current?.total || 0),
    },
    thirtyToSixty: {
      range: '31-60 days',
      count: Number(thirtyToSixty?.count || 0),
      total: Number(thirtyToSixty?.total || 0),
    },
    sixtyToNinety: {
      range: '61-90 days',
      count: Number(sixtyToNinety?.count || 0),
      total: Number(sixtyToNinety?.total || 0),
    },
    overNinety: {
      range: '90+ days',
      count: Number(overNinety?.count || 0),
      total: Number(overNinety?.total || 0),
    },
  };
};

// Get revenue by client
export const getRevenueByClient = async (
  companyId: number,
  startDate: string,
  endDate: string
) => {
  const query = db
    .select({
      clientId: clients.id,
      clientName: clients.name,
      total: sum(sql<number>`CAST(${payments.amount} AS DECIMAL)`),
    })
    .from(payments)
    .leftJoin(invoices, eq(payments.invoiceId, invoices.id))
    .leftJoin(clients, eq(payments.clientId, clients.id))
    .where(
      and(
        eq(payments.companyId, companyId),
        gte(payments.paymentDate, startDate),
        lte(payments.paymentDate, endDate),
        eq(payments.status, 'completed'),
        eq(payments.softDelete, false)
      )
    )
    .groupBy(clients.id, clients.name)
    .orderBy(sql`total DESC`);

  return query;
}; 