import { db } from '@/lib/db';
import {
  forecastItems,
  forecastPeriodValues,
  forecastStreams,
  forecastGrowthRules,
  forecastSeasonalityWeights,
} from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';

/**
 * Apply YoY growth rules and seasonality weights to generate forecast_period_values
 * for all years beyond the base year (the earliest year in the forecast's startDate).
 */
export async function applyAssumptions(forecastId: number, companyId: number): Promise<void> {
  // Load all items for this forecast
  const items = await db
    .select()
    .from(forecastItems)
    .where(eq(forecastItems.forecastId, forecastId));

  if (items.length === 0) return;

  // Load streams for scope lookups
  const streams = await db
    .select()
    .from(forecastStreams)
    .where(eq(forecastStreams.forecastId, forecastId));

  // Load growth rules
  const growthRules = await db
    .select()
    .from(forecastGrowthRules)
    .where(eq(forecastGrowthRules.forecastId, forecastId));

  // Load seasonality weights
  const seasonalityWeights = await db
    .select()
    .from(forecastSeasonalityWeights)
    .where(eq(forecastSeasonalityWeights.forecastId, forecastId));

  // Load existing period values
  const existingValues = await db
    .select()
    .from(forecastPeriodValues)
    .where(eq(forecastPeriodValues.forecastId, forecastId));

  // Build lookup: itemId → period → amount
  const baseValues: Record<number, Record<string, number>> = {};
  for (const pv of existingValues) {
    if (!baseValues[pv.itemId]) baseValues[pv.itemId] = {};
    baseValues[pv.itemId][pv.period] = Number(pv.amount);
  }

  // Determine base year (earliest year present in period values)
  const allPeriods = existingValues.map((v) => v.period);
  if (allPeriods.length === 0) return;

  const years = [...new Set(allPeriods.map((p) => parseInt(p.substring(0, 4))))].sort();
  const baseYear = years[0];
  const forecastYears = years.filter((y) => y > baseYear);

  // Helper: get growth rate for a specific item + year
  function getGrowthRate(itemId: number, year: number): number {
    const item = items.find((i) => i.id === itemId);
    if (!item) return 0;

    // Item-level rule (most specific)
    const itemRule = growthRules.find(
      (r) => r.scopeType === 'item' && r.scopeId === itemId && r.year === year
    );
    if (itemRule) return Number(itemRule.growthRate);

    // Stream-level rule
    const streamRule = growthRules.find(
      (r) => r.scopeType === 'stream' && r.scopeId === item.streamId && r.year === year
    );
    if (streamRule) return Number(streamRule.growthRate);

    // Global rule
    const globalRule = growthRules.find(
      (r) => r.scopeType === 'global' && r.year === year
    );
    if (globalRule) return Number(globalRule.growthRate);

    return 0;
  }

  // Helper: get seasonality weights for an item (12 months)
  function getSeasonalityWeights(itemId: number): number[] {
    // Try item-level weights
    const itemWeights = seasonalityWeights.filter(
      (w) => w.scopeType === 'item' && w.scopeId === itemId
    );
    if (itemWeights.length === 12) {
      const arr = new Array(12).fill(0);
      for (const w of itemWeights) arr[w.month - 1] = Number(w.weight);
      return arr;
    }

    // Try global weights
    const globalWeights = seasonalityWeights.filter((w) => w.scopeType === 'global');
    if (globalWeights.length === 12) {
      const arr = new Array(12).fill(0);
      for (const w of globalWeights) arr[w.month - 1] = Number(w.weight);
      return arr;
    }

    // Equal distribution
    return new Array(12).fill(1 / 12);
  }

  // Compute and upsert values for non-base years
  const upsertRows: Array<{
    forecastId: number;
    itemId: number;
    period: string;
    amount: string;
  }> = [];

  for (const item of items) {
    const itemBaseValues = baseValues[item.id] ?? {};

    // Sum base year monthly values to get annual total
    const baseAnnual = Object.entries(itemBaseValues)
      .filter(([period]) => parseInt(period.substring(0, 4)) === baseYear)
      .reduce((sum, [, amt]) => sum + amt, 0);

    for (const year of forecastYears) {
      const growthRate = getGrowthRate(item.id, year);
      const prevYear = year - 1;

      // Get previous year annual total (already computed or base)
      let prevAnnual: number;
      if (prevYear === baseYear) {
        prevAnnual = baseAnnual;
      } else {
        prevAnnual = Object.entries(itemBaseValues)
          .filter(([period]) => parseInt(period.substring(0, 4)) === prevYear)
          .reduce((sum, [, amt]) => sum + amt, 0);
        // Use computed rows if available
        const computed = upsertRows
          .filter((r) => r.itemId === item.id && r.period.startsWith(String(prevYear)))
          .reduce((sum, r) => sum + Number(r.amount), 0);
        if (computed > 0) prevAnnual = computed;
      }

      const annualTotal = prevAnnual * (1 + growthRate);
      const weights = getSeasonalityWeights(item.id);
      const weightSum = weights.reduce((s, w) => s + w, 0) || 1;

      for (let month = 1; month <= 12; month++) {
        const period = `${year}-${String(month).padStart(2, '0')}`;
        const monthlyAmount = (annualTotal * (weights[month - 1] / weightSum)).toFixed(2);
        upsertRows.push({ forecastId, itemId: item.id, period, amount: monthlyAmount });
      }
    }
  }

  // Bulk upsert
  if (upsertRows.length === 0) return;

  for (const row of upsertRows) {
    await db
      .insert(forecastPeriodValues)
      .values({ ...row, createdAt: new Date(), updatedAt: new Date() })
      .onConflictDoUpdate({
        target: [forecastPeriodValues.itemId, forecastPeriodValues.period],
        set: { amount: row.amount, updatedAt: new Date() },
      });
  }
}
