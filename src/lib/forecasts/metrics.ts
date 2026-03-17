import { getForecastSummary } from './summary';

export interface ForecastMetrics {
  years: number[];
  yoyGrowthRevenue: Record<number, number | null>;
  yoyGrowthExpenses: Record<number, number | null>;
  yoyGrowthProfit: Record<number, number | null>;
  profitMargin: Record<number, number>;
  burnRate: Record<number, number>; // average monthly expenses
  runRate: Record<number, number>;  // average monthly revenue
}

export async function getForecastMetrics(forecastId: number): Promise<ForecastMetrics> {
  const summary = await getForecastSummary(forecastId);
  const years = Object.keys(summary.totalRevenue).map(Number).sort();

  const yoyGrowthRevenue: Record<number, number | null> = {};
  const yoyGrowthExpenses: Record<number, number | null> = {};
  const yoyGrowthProfit: Record<number, number | null> = {};
  const profitMargin: Record<number, number> = {};
  const burnRate: Record<number, number> = {};
  const runRate: Record<number, number> = {};

  for (let i = 0; i < years.length; i++) {
    const year = years[i];
    const prevYear = years[i - 1];

    const rev = summary.totalRevenue[year] ?? 0;
    const exp = summary.totalExpenses[year] ?? 0;
    const profit = summary.netProfit[year] ?? 0;

    profitMargin[year] = rev > 0 ? (profit / rev) * 100 : 0;
    burnRate[year] = exp / 12;
    runRate[year] = rev / 12;

    if (prevYear !== undefined) {
      const prevRev = summary.totalRevenue[prevYear] ?? 0;
      const prevExp = summary.totalExpenses[prevYear] ?? 0;
      const prevProfit = summary.netProfit[prevYear] ?? 0;

      yoyGrowthRevenue[year] = prevRev !== 0 ? ((rev - prevRev) / Math.abs(prevRev)) * 100 : null;
      yoyGrowthExpenses[year] = prevExp !== 0 ? ((exp - prevExp) / Math.abs(prevExp)) * 100 : null;
      yoyGrowthProfit[year] = prevProfit !== 0 ? ((profit - prevProfit) / Math.abs(prevProfit)) * 100 : null;
    } else {
      yoyGrowthRevenue[year] = null;
      yoyGrowthExpenses[year] = null;
      yoyGrowthProfit[year] = null;
    }
  }

  return { years, yoyGrowthRevenue, yoyGrowthExpenses, yoyGrowthProfit, profitMargin, burnRate, runRate };
}
