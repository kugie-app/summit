import { db } from '@/lib/db';
import { invoices, clients, payments } from '@/lib/db/schema';
import { and, eq, gte, lte, sql, count, sum, isNull, not, lt } from 'drizzle-orm';
import { format, subDays, parseISO, subMonths } from 'date-fns';
import { formatMonthSql, castDecimalSql} from '@/lib/db/util/formatter'

// Get invoice summary for a company
export const getInvoiceSummary = async (
  companyId: number,
  startDate?: string,
  endDate?: string,
  previousPeriodComparison = true
) => {
  // Base conditions that apply to all queries
  let baseConditions = and(
    eq(invoices.companyId, companyId),
    eq(invoices.softDelete, false)
  );

  // Add date range conditions if provided
  if (startDate && endDate) {
    baseConditions = and(
      baseConditions,
      gte(invoices.issueDate, startDate),
      lte(invoices.issueDate, endDate)
    );
  }

  // Get total invoices
  const [totalResult] = await db
    .select({
      count: count(),
      total: sum(castDecimalSql(invoices.total)),
    })
    .from(invoices)
    .where(baseConditions);

  // Get total paid invoices
  const [paidResult] = await db
    .select({
      count: count(),
      total: sum(castDecimalSql(invoices.total)),
    })
    .from(invoices)
    .where(
      and(
        baseConditions,
        eq(invoices.status, 'paid')
      )
    );

  // Get total overdue invoices
  const [overdueResult] = await db
    .select({
      count: count(),
      total: sum(castDecimalSql(invoices.total)),
    })
    .from(invoices)
    .where(
      and(
        baseConditions,
        eq(invoices.status, 'overdue')
      )
    );

  // Get total unpaid (sent, not overdue) invoices
  const [unpaidResult] = await db
    .select({
      count: count(),
      total: sum(castDecimalSql(invoices.total)),
    })
    .from(invoices)
    .where(
      and(
        baseConditions,
        eq(invoices.status, 'sent')
      )
    );

  // Get total draft invoices
  const [draftResult] = await db
    .select({
      count: count(),
      total: sum(castDecimalSql(invoices.total)),
    })
    .from(invoices)
    .where(
      and(
        baseConditions,
        eq(invoices.status, 'draft')
      )
    );

  // Calculate trends if requested and if dates are provided
  let trends = undefined;
  
  if (previousPeriodComparison && startDate && endDate) {
    // Calculate the previous period (same duration as the selected period)
    const selectedStartDate = new Date(startDate);
    const selectedEndDate = new Date(endDate);
    const periodDuration = selectedEndDate.getTime() - selectedStartDate.getTime();
    
    const previousPeriodEndDate = new Date(selectedStartDate);
    previousPeriodEndDate.setTime(previousPeriodEndDate.getTime() - 1); // 1 ms before the current period starts
    
    const previousPeriodStartDate = new Date(previousPeriodEndDate);
    previousPeriodStartDate.setTime(previousPeriodStartDate.getTime() - periodDuration);
    
    const formattedPrevStartDate = format(previousPeriodStartDate, 'yyyy-MM-dd');
    const formattedPrevEndDate = format(previousPeriodEndDate, 'yyyy-MM-dd');
    
    // Get previous period paid invoices
    const [prevPaidResult] = await db
      .select({
        count: count(),
        total: sum(castDecimalSql(invoices.total)),
      })
      .from(invoices)
      .where(
        and(
          eq(invoices.companyId, companyId),
          eq(invoices.status, 'paid'),
          gte(invoices.issueDate, formattedPrevStartDate),
          lte(invoices.issueDate, formattedPrevEndDate),
          eq(invoices.softDelete, false)
        )
      );
    
    // Get previous period overdue invoices
    const [prevOverdueResult] = await db
      .select({
        count: count(),
        total: sum(castDecimalSql(invoices.total)),
      })
      .from(invoices)
      .where(
        and(
          eq(invoices.companyId, companyId),
          eq(invoices.status, 'overdue'),
          gte(invoices.issueDate, formattedPrevStartDate),
          lte(invoices.issueDate, formattedPrevEndDate),
          eq(invoices.softDelete, false)
        )
      );
    
    // Calculate percentage changes
    const prevPaidTotal = Number(prevPaidResult?.total || 0);
    const currentPaidTotal = Number(paidResult?.total || 0);
    const paidChange = prevPaidTotal === 0 
      ? (currentPaidTotal > 0 ? 100 : 0)
      : ((currentPaidTotal - prevPaidTotal) / prevPaidTotal) * 100;
    
    const prevOverdueTotal = Number(prevOverdueResult?.total || 0);
    const currentOverdueTotal = Number(overdueResult?.total || 0);
    const overdueChange = prevOverdueTotal === 0
      ? (currentOverdueTotal > 0 ? 100 : 0)
      : ((currentOverdueTotal - prevOverdueTotal) / prevOverdueTotal) * 100;
    
    trends = {
      paid: {
        value: Math.abs(Math.round(paidChange * 10) / 10), // Round to 1 decimal place
        label: "vs. previous period",
        positive: paidChange >= 0
      },
      overdue: {
        value: Math.abs(Math.round(overdueChange * 10) / 10), // Round to 1 decimal place
        label: "vs. previous period",
        positive: overdueChange <= 0 // For overdue, negative change is positive trend
      }
    };
  }

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
    trends,
    dateRange: startDate && endDate ? { startDate, endDate } : undefined
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
export const getAgingReceivables = async (
  companyId: number,
  startDate?: string,
  endDate?: string
) => {
  const today = new Date();
  const thirtyDaysAgo = format(subDays(today, 30), 'yyyy-MM-dd');
  const sixtyDaysAgo = format(subDays(today, 60), 'yyyy-MM-dd');
  const ninetyDaysAgo = format(subDays(today, 90), 'yyyy-MM-dd');

  // Base conditions that apply to all queries
  let baseConditions = and(
    eq(invoices.companyId, companyId),
    not(eq(invoices.status, 'paid')),
    not(eq(invoices.status, 'draft')),
    eq(invoices.softDelete, false)
  );

  // Add date range conditions if provided
  if (startDate && endDate) {
    baseConditions = and(
      baseConditions,
      gte(invoices.issueDate, startDate),
      lte(invoices.issueDate, endDate)
    );
  }

  // Current (0-30 days)
  const [current] = await db
    .select({
      count: count(),
      total: sum(castDecimalSql(invoices.total)),
    })
    .from(invoices)
    .where(
      and(
        baseConditions,
        gte(invoices.dueDate, thirtyDaysAgo)
      )
    );
  
  // 31-60 days
  const [thirtyToSixty] = await db
    .select({
      count: count(),
      total: sum(castDecimalSql(invoices.total)),
    })
    .from(invoices)
    .where(
      and(
        baseConditions,
        gte(invoices.dueDate, sixtyDaysAgo),
        lt(invoices.dueDate, thirtyDaysAgo)
      )
    );
  
  // 61-90 days
  const [sixtyToNinety] = await db
    .select({
      count: count(),
      total: sum(castDecimalSql(invoices.total)),
    })
    .from(invoices)
    .where(
      and(
        baseConditions,
        gte(invoices.dueDate, ninetyDaysAgo),
        lt(invoices.dueDate, sixtyDaysAgo)
      )
    );
  
  // Over 90 days
  const [overNinety] = await db
    .select({
      count: count(),
      total: sum(castDecimalSql(invoices.total)),
    })
    .from(invoices)
    .where(
      and(
        baseConditions,
        lt(invoices.dueDate, ninetyDaysAgo)
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
    dateRange: startDate && endDate ? { startDate, endDate } : undefined
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
      total: sum(castDecimalSql(invoices.total)),
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