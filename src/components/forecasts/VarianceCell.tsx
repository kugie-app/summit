'use client';

import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export type TrackingStatus = 'on_track' | 'at_risk' | 'off_track';

interface VarianceCellProps {
  variance: number;
  variancePct: number | null;
  status?: TrackingStatus;
  currency?: string;
}

const statusConfig: Record<TrackingStatus, { label: string; className: string }> = {
  on_track: { label: 'On Track', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  at_risk: { label: 'At Risk', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' },
  off_track: { label: 'Off Track', className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
};

export function VarianceCell({ variance, variancePct, status, currency = 'IDR' }: VarianceCellProps) {
  const isPositive = variance >= 0;
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(Math.abs(variance));

  return (
    <div className="flex flex-col items-end gap-1">
      <span className={cn('text-sm font-medium', isPositive ? 'text-green-600' : 'text-red-600')}>
        {isPositive ? '+' : '-'}{formatted}
      </span>
      {variancePct !== null && (
        <span className={cn('text-xs', isPositive ? 'text-green-500' : 'text-red-500')}>
          {isPositive ? '+' : ''}{variancePct.toFixed(1)}%
        </span>
      )}
      {status && (
        <Badge className={cn('text-xs px-1.5 py-0.5', statusConfig[status].className)} variant="outline">
          {statusConfig[status].label}
        </Badge>
      )}
    </div>
  );
}
