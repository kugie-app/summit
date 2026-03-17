import { getForecastComparison, ComparisonRow } from './comparison';

export type TrackingStatus = 'on_track' | 'at_risk' | 'off_track';

export interface TrackingRow extends ComparisonRow {
  status: TrackingStatus;
  ratio: number | null;
}

/**
 * Determine on-track status for each item+period.
 * Revenue: higher actual = good (ratio = actual/budgeted)
 * Expense: lower actual = good (ratio = budgeted/actual — spending less is better)
 *
 * Thresholds (applied to ratio):
 *   >= 0.90 → on_track
 *   0.75–0.90 → at_risk
 *   < 0.75 → off_track
 */
function computeStatus(budgeted: number, actual: number, streamType: 'revenue' | 'expense'): {
  status: TrackingStatus;
  ratio: number | null;
} {
  if (budgeted === 0) return { status: 'on_track', ratio: null };

  let ratio: number;
  if (streamType === 'revenue') {
    ratio = actual / budgeted;
  } else {
    // For expenses, being under budget is good
    ratio = budgeted / (actual === 0 ? budgeted : actual);
  }

  const status: TrackingStatus =
    ratio >= 0.9 ? 'on_track' : ratio >= 0.75 ? 'at_risk' : 'off_track';

  return { status, ratio };
}

export async function getForecastTracking(
  forecastId: number,
  companyId: number,
  startPeriod?: string,
  endPeriod?: string
): Promise<TrackingRow[]> {
  const comparison = await getForecastComparison(forecastId, companyId, startPeriod, endPeriod);

  return comparison.map((row) => {
    const { status, ratio } = computeStatus(row.budgeted, row.actual, row.streamType);
    return { ...row, status, ratio };
  });
}
