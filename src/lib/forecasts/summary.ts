import { db } from '@/lib/db';
import { forecastItems, forecastPeriodValues, forecastStreams } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { sql, sum } from 'drizzle-orm';

export interface StreamSummary {
  streamId: number;
  streamName: string;
  streamType: 'revenue' | 'expense';
  years: Record<number, number>;
}

export interface ForecastSummary {
  streams: StreamSummary[];
  totalRevenue: Record<number, number>;
  totalExpenses: Record<number, number>;
  netProfit: Record<number, number>;
}

export async function getForecastSummary(forecastId: number): Promise<ForecastSummary> {
  const streams = await db
    .select()
    .from(forecastStreams)
    .where(eq(forecastStreams.forecastId, forecastId))
    .orderBy(forecastStreams.order);

  const items = await db
    .select()
    .from(forecastItems)
    .where(eq(forecastItems.forecastId, forecastId));

  const periodValues = await db
    .select()
    .from(forecastPeriodValues)
    .where(eq(forecastPeriodValues.forecastId, forecastId));

  // Build item → streamId map
  const itemStreamMap: Record<number, number> = {};
  for (const item of items) {
    itemStreamMap[item.id] = item.streamId;
  }

  // Aggregate per stream per year
  const streamYearTotals: Record<number, Record<number, number>> = {};
  for (const pv of periodValues) {
    const streamId = itemStreamMap[pv.itemId];
    if (streamId === undefined) continue;
    const year = parseInt(pv.period.substring(0, 4));
    if (!streamYearTotals[streamId]) streamYearTotals[streamId] = {};
    streamYearTotals[streamId][year] = (streamYearTotals[streamId][year] ?? 0) + Number(pv.amount);
  }

  const allYears = [...new Set(periodValues.map((v) => parseInt(v.period.substring(0, 4))))].sort();

  const streamSummaries: StreamSummary[] = streams.map((s) => ({
    streamId: s.id,
    streamName: s.name,
    streamType: s.type as 'revenue' | 'expense',
    years: Object.fromEntries(allYears.map((y) => [y, streamYearTotals[s.id]?.[y] ?? 0])),
  }));

  const totalRevenue: Record<number, number> = {};
  const totalExpenses: Record<number, number> = {};
  const netProfit: Record<number, number> = {};

  for (const year of allYears) {
    totalRevenue[year] = streamSummaries
      .filter((s) => s.streamType === 'revenue')
      .reduce((sum, s) => sum + (s.years[year] ?? 0), 0);
    totalExpenses[year] = streamSummaries
      .filter((s) => s.streamType === 'expense')
      .reduce((sum, s) => sum + (s.years[year] ?? 0), 0);
    netProfit[year] = totalRevenue[year] - totalExpenses[year];
  }

  return { streams: streamSummaries, totalRevenue, totalExpenses, netProfit };
}
