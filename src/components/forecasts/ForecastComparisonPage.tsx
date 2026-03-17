'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { VarianceCell } from './VarianceCell';
import { cn } from '@/lib/utils';

interface ComparisonRow {
  itemId: number;
  itemName: string;
  streamType: 'revenue' | 'expense';
  period: string;
  budgeted: number;
  actual: number;
  variance: number;
  variancePct: number | null;
}

interface ForecastComparisonPageProps {
  forecastId: number;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'decimal', maximumFractionDigits: 0 }).format(amount);
}

export default function ForecastComparisonPage({ forecastId }: ForecastComparisonPageProps) {
  const [rows, setRows] = useState<ComparisonRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [forecastName, setForecastName] = useState('');

  useEffect(() => {
    Promise.all([
      fetch(`/api/forecasts/${forecastId}`).then((r) => r.json()),
      fetch(`/api/forecasts/${forecastId}/comparison`).then((r) => r.json()),
    ]).then(([forecast, comparison]) => {
      setForecastName(forecast.name ?? '');
      setRows(comparison);
    }).finally(() => setLoading(false));
  }, [forecastId]);

  // Get unique periods and items
  const periods = [...new Set(rows.map((r) => r.period))].sort();
  const itemIds = [...new Set(rows.map((r) => r.itemId))];

  // Build matrix: itemId → period → row
  const matrix: Record<number, Record<string, ComparisonRow>> = {};
  const itemNames: Record<number, string> = {};
  for (const row of rows) {
    if (!matrix[row.itemId]) matrix[row.itemId] = {};
    matrix[row.itemId][row.period] = row;
    itemNames[row.itemId] = row.itemName;
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/forecasts/${forecastId}`}><ArrowLeft className="h-4 w-4 mr-1" /> Back to Editor</Link>
        </Button>
        <h1 className="text-2xl font-bold">Budget vs Actuals</h1>
        {forecastName && <span className="text-muted-foreground text-sm">— {forecastName}</span>}
      </div>

      {rows.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          No comparison data. Make sure items are linked to income/expense categories and have budget values set.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="sticky left-0 bg-muted/50 text-left px-3 py-2 font-medium min-w-[180px]">Item</th>
                {periods.map((p) => (
                  <th key={p} colSpan={3} className="px-2 py-2 text-center font-medium border-l min-w-[200px]">
                    {p}
                  </th>
                ))}
              </tr>
              <tr className="bg-muted/30 text-xs text-muted-foreground">
                <th className="sticky left-0 bg-muted/30 px-3 py-1"></th>
                {periods.map((p) => (
                  <React.Fragment key={p}>
                    <th className="px-2 py-1 text-right border-l">Budget</th>
                    <th className="px-2 py-1 text-right">Actual</th>
                    <th className="px-2 py-1 text-right">Variance</th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {itemIds.map((itemId) => {
                const firstRow = rows.find((r) => r.itemId === itemId);
                return (
                  <tr key={itemId} className="border-t hover:bg-accent/20">
                    <td className="sticky left-0 bg-background px-3 py-2 font-medium">
                      {itemNames[itemId]}
                    </td>
                    {periods.map((p) => {
                      const row = matrix[itemId]?.[p];
                      if (!row) {
                        return (
                          <React.Fragment key={p}>
                            <td className="px-2 py-2 text-right text-muted-foreground/40 border-l">—</td>
                            <td className="px-2 py-2 text-right text-muted-foreground/40">—</td>
                            <td className="px-2 py-2 text-right text-muted-foreground/40">—</td>
                          </React.Fragment>
                        );
                      }
                      const isPositiveVariance = row.streamType === 'revenue'
                        ? row.variance >= 0
                        : row.variance <= 0;
                      return (
                        <React.Fragment key={p}>
                          <td className="px-2 py-2 text-right border-l">{formatCurrency(row.budgeted)}</td>
                          <td className="px-2 py-2 text-right">{formatCurrency(row.actual)}</td>
                          <td
                            className={cn(
                              'px-2 py-2 text-right text-xs',
                              isPositiveVariance ? 'text-green-600' : 'text-red-600'
                            )}
                          >
                            {row.variance >= 0 ? '+' : ''}{formatCurrency(row.variance)}
                            {row.variancePct !== null && (
                              <span className="block text-xs opacity-75">
                                {row.variancePct >= 0 ? '+' : ''}{row.variancePct.toFixed(1)}%
                              </span>
                            )}
                          </td>
                        </React.Fragment>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
