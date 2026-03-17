'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, CheckCircle2, AlertTriangle, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { cn } from '@/lib/utils';

interface TrackingRow {
  itemId: number;
  itemName: string;
  streamType: 'revenue' | 'expense';
  period: string;
  budgeted: number;
  actual: number;
  variance: number;
  variancePct: number | null;
  status: 'on_track' | 'at_risk' | 'off_track';
  ratio: number | null;
}

interface ForecastTrackingPageProps {
  forecastId: number;
}

const statusConfig = {
  on_track: { label: 'On Track', icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30' },
  at_risk:  { label: 'At Risk',  icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-900/30' },
  off_track: { label: 'Off Track', icon: XCircle, color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30' },
};

function formatCurrency(v: number) {
  return new Intl.NumberFormat('en-US', { style: 'decimal', maximumFractionDigits: 0 }).format(v);
}

function formatPeriodLabel(period: string) {
  const [y, m] = period.split('-');
  const date = new Date(parseInt(y), parseInt(m) - 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export default function ForecastTrackingPage({ forecastId }: ForecastTrackingPageProps) {
  const [allRows, setAllRows] = useState<TrackingRow[]>([]);
  const [forecastName, setForecastName] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');

  useEffect(() => {
    Promise.all([
      fetch(`/api/forecasts/${forecastId}`).then((r) => r.json()),
      fetch(`/api/forecasts/${forecastId}/tracking`).then((r) => r.json()),
    ]).then(([forecast, tracking]) => {
      setForecastName(forecast.name ?? '');
      setAllRows(tracking);

      // Default to current month if within forecast range, else first period
      const periods: string[] = [...new Set((tracking as TrackingRow[]).map((r) => r.period))].sort() as string[];
      if (periods.length > 0) {
        const today = new Date();
        const currentPeriod = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
        setSelectedPeriod(periods.includes(currentPeriod) ? currentPeriod : periods[0]);
      }
    }).finally(() => setLoading(false));
  }, [forecastId]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const allPeriods = [...new Set(allRows.map((r) => r.period))].sort();
  const currentIndex = allPeriods.indexOf(selectedPeriod);
  const rows = allRows.filter((r) => r.period === selectedPeriod);

  // Status counts for the selected period
  const statusCounts = { on_track: 0, at_risk: 0, off_track: 0 };
  for (const r of rows) statusCounts[r.status]++;
  const total = rows.length;

  // Chart data: all periods (for trend view)
  const chartData = allPeriods.map((p) => {
    const pRows = allRows.filter((r) => r.period === p);
    return {
      period: p,
      budgeted: pRows.reduce((s, r) => s + r.budgeted, 0),
      actual: pRows.reduce((s, r) => s + r.actual, 0),
    };
  });

  return (
    <div className="p-6 space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href={`/forecasts/${forecastId}`}><ArrowLeft className="h-4 w-4 mr-1" /> Back to Editor</Link>
        </Button>
        <h1 className="text-2xl font-bold">Tracking Dashboard</h1>
        {forecastName && <span className="text-muted-foreground text-sm">— {forecastName}</span>}
      </div>

      {/* Period navigator */}
      <div className="flex items-center justify-between rounded-lg border px-4 py-3 bg-muted/30">
        <Button
          variant="ghost"
          size="sm"
          disabled={currentIndex <= 0}
          onClick={() => setSelectedPeriod(allPeriods[currentIndex - 1])}
        >
          <ChevronLeft className="h-4 w-4 mr-1" /> Prev
        </Button>

        <div className="flex items-center gap-2">
          <span className="font-semibold text-lg">
            {selectedPeriod ? formatPeriodLabel(selectedPeriod) : '—'}
          </span>
          <span className="text-xs text-muted-foreground">
            ({currentIndex + 1} / {allPeriods.length})
          </span>
        </div>

        <Button
          variant="ghost"
          size="sm"
          disabled={currentIndex >= allPeriods.length - 1}
          onClick={() => setSelectedPeriod(allPeriods[currentIndex + 1])}
        >
          Next <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {/* Jump to any period */}
      {allPeriods.length > 1 && (
        <div className="flex gap-1.5 flex-wrap">
          {allPeriods.map((p) => (
            <button
              key={p}
              onClick={() => setSelectedPeriod(p)}
              className={cn(
                'px-2 py-1 text-xs rounded border transition-colors',
                p === selectedPeriod
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'hover:bg-accent border-transparent'
              )}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Summary cards for selected period */}
      <div className="grid grid-cols-3 gap-4">
        {(Object.entries(statusConfig) as Array<[keyof typeof statusConfig, typeof statusConfig[keyof typeof statusConfig]]>).map(([key, cfg]) => {
          const count = statusCounts[key];
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          const Icon = cfg.icon;
          return (
            <Card key={key}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className={cn('p-2 rounded-full', cfg.bg)}>
                    <Icon className={cn('h-5 w-5', cfg.color)} />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{count}</div>
                    <div className="text-sm text-muted-foreground">{cfg.label} ({pct}%)</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Budget vs Actual trend chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Budget vs Actual — Full Year Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData}>
                <XAxis dataKey="period" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Legend />
                <Bar dataKey="budgeted" name="Budgeted" fill="hsl(var(--primary))" opacity={0.5} />
                <Bar dataKey="actual" name="Actual" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Per-item table for selected period */}
      {rows.length > 0 ? (
        <div className="overflow-x-auto rounded-md border">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-muted/50">
                <th className="text-left px-3 py-2 font-medium">Item</th>
                <th className="text-left px-3 py-2 font-medium">Type</th>
                <th className="text-right px-3 py-2 font-medium">Budget</th>
                <th className="text-right px-3 py-2 font-medium">Actual</th>
                <th className="text-right px-3 py-2 font-medium">Variance</th>
                <th className="text-center px-3 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const cfg = statusConfig[row.status];
                const Icon = cfg.icon;
                const isGoodVariance = row.streamType === 'revenue' ? row.variance >= 0 : row.variance <= 0;
                return (
                  <tr key={row.itemId} className="border-t hover:bg-accent/20">
                    <td className="px-3 py-2 font-medium">{row.itemName}</td>
                    <td className="px-3 py-2">
                      <span className={cn(
                        'text-xs px-1.5 py-0.5 rounded-full',
                        row.streamType === 'revenue' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      )}>
                        {row.streamType}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">{formatCurrency(row.budgeted)}</td>
                    <td className="px-3 py-2 text-right">{formatCurrency(row.actual)}</td>
                    <td className={cn('px-3 py-2 text-right', isGoodVariance ? 'text-green-600' : 'text-red-600')}>
                      {row.variance >= 0 ? '+' : ''}{formatCurrency(row.variance)}
                      {row.variancePct !== null && (
                        <span className="text-xs block opacity-75">{row.variancePct.toFixed(1)}%</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <div className={cn('flex items-center justify-center gap-1.5 text-xs font-medium', cfg.color)}>
                        <Icon className="h-4 w-4" />
                        {cfg.label}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            {/* Period totals */}
            <tfoot>
              <tr className="border-t bg-muted/30 font-semibold">
                <td className="px-3 py-2" colSpan={2}>Total</td>
                <td className="px-3 py-2 text-right">{formatCurrency(rows.reduce((s, r) => s + r.budgeted, 0))}</td>
                <td className="px-3 py-2 text-right">{formatCurrency(rows.reduce((s, r) => s + r.actual, 0))}</td>
                <td className="px-3 py-2 text-right">{formatCurrency(rows.reduce((s, r) => s + r.variance, 0))}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          No tracking data for this period. Link items to income/expense categories and ensure actuals exist.
        </div>
      )}
    </div>
  );
}
