import { db } from '@/lib/db';
import { forecastItems, forecastPeriodValues, forecastStreams, income, expenses } from '@/lib/db/schema';
import { and, eq, gte, lte, sql, sum } from 'drizzle-orm';

export interface ComparisonRow {
  itemId: number;
  itemName: string;
  streamType: 'revenue' | 'expense';
  period: string;
  budgeted: number;
  actual: number;
  variance: number;
  variancePct: number | null;
}

export async function getForecastComparison(
  forecastId: number,
  companyId: number,
  startPeriod?: string,
  endPeriod?: string
): Promise<ComparisonRow[]> {
  const items = await db
    .select()
    .from(forecastItems)
    .where(eq(forecastItems.forecastId, forecastId));

  const streams = await db
    .select()
    .from(forecastStreams)
    .where(eq(forecastStreams.forecastId, forecastId));

  const streamMap = new Map(streams.map((s) => [s.id, s]));

  let pvQuery = db
    .select()
    .from(forecastPeriodValues)
    .where(eq(forecastPeriodValues.forecastId, forecastId))
    .$dynamic();

  if (startPeriod) {
    pvQuery = pvQuery.where(
      and(
        eq(forecastPeriodValues.forecastId, forecastId),
        sql`${forecastPeriodValues.period} >= ${startPeriod}`
      )
    );
  }
  if (endPeriod) {
    pvQuery = pvQuery.where(
      and(
        eq(forecastPeriodValues.forecastId, forecastId),
        sql`${forecastPeriodValues.period} <= ${endPeriod}`
      )
    );
  }

  const periodValues = await pvQuery;

  // Gather actuals: income by categoryId+period, expenses by categoryId+period
  const incomeActuals: Record<string, number> = {};
  const expenseActuals: Record<string, number> = {};

  // Get unique income category ids referenced by items
  const incomeCategoryIds = [...new Set(items.filter((i) => i.incomeCategoryId).map((i) => i.incomeCategoryId!))]
  const expenseCategoryIds = [...new Set(items.filter((i) => i.expenseCategoryId).map((i) => i.expenseCategoryId!))]

  if (incomeCategoryIds.length > 0) {
    const incomeRows = await db
      .select({
        categoryId: income.categoryId,
        period: sql<string>`TO_CHAR(${income.incomeDate}, 'YYYY-MM')`,
        total: sum(sql<number>`CAST(${income.amount} AS DECIMAL)`),
      })
      .from(income)
      .where(
        and(
          eq(income.companyId, companyId),
          eq(income.softDelete, false),
          sql`${income.categoryId} = ANY(ARRAY[${sql.raw(incomeCategoryIds.join(','))}])`
        )
      )
      .groupBy(income.categoryId, sql`TO_CHAR(${income.incomeDate}, 'YYYY-MM')`);

    for (const row of incomeRows) {
      const key = `${row.categoryId}__${row.period}`;
      incomeActuals[key] = (incomeActuals[key] ?? 0) + Number(row.total ?? 0);
    }
  }

  if (expenseCategoryIds.length > 0) {
    const expenseRows = await db
      .select({
        categoryId: expenses.categoryId,
        period: sql<string>`TO_CHAR(${expenses.expenseDate}, 'YYYY-MM')`,
        total: sum(sql<number>`CAST(${expenses.amount} AS DECIMAL)`),
      })
      .from(expenses)
      .where(
        and(
          eq(expenses.companyId, companyId),
          eq(expenses.softDelete, false),
          sql`${expenses.categoryId} = ANY(ARRAY[${sql.raw(expenseCategoryIds.join(','))}])`
        )
      )
      .groupBy(expenses.categoryId, sql`TO_CHAR(${expenses.expenseDate}, 'YYYY-MM')`);

    for (const row of expenseRows) {
      const key = `${row.categoryId}__${row.period}`;
      expenseActuals[key] = (expenseActuals[key] ?? 0) + Number(row.total ?? 0);
    }
  }

  const itemMap = new Map(items.map((i) => [i.id, i]));

  const rows: ComparisonRow[] = periodValues.map((pv) => {
    const item = itemMap.get(pv.itemId);
    if (!item) return null as unknown as ComparisonRow;

    const stream = streamMap.get(item.streamId);
    const streamType = (stream?.type ?? 'revenue') as 'revenue' | 'expense';
    const budgeted = Number(pv.amount);

    let actual = 0;
    if (streamType === 'revenue' && item.incomeCategoryId) {
      actual = incomeActuals[`${item.incomeCategoryId}__${pv.period}`] ?? 0;
    } else if (streamType === 'expense' && item.expenseCategoryId) {
      actual = expenseActuals[`${item.expenseCategoryId}__${pv.period}`] ?? 0;
    }

    const variance = actual - budgeted;
    const variancePct = budgeted !== 0 ? (variance / Math.abs(budgeted)) * 100 : null;

    return {
      itemId: pv.itemId,
      itemName: item.name,
      streamType,
      period: pv.period,
      budgeted,
      actual,
      variance,
      variancePct,
    };
  }).filter(Boolean);

  return rows;
}
