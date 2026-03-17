'use client';

import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

export interface GridItem {
  id: number;
  name: string;
  streamId: number;
  streamName: string;
  streamType: 'revenue' | 'expense';
}

export interface PeriodValue {
  itemId: number;
  period: string;
  amount: number;
}

interface ForecastGridProps {
  items: GridItem[];
  periods: string[];   // sorted YYYY-MM strings
  values: PeriodValue[];
  onCellChange: (itemId: number, period: string, amount: number) => void;
  onBulkSave: (changes: PeriodValue[]) => Promise<void>;
  currency?: string;
}

function formatAmount(amount: number, currency: string) {
  if (amount === 0) return '';
  return new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function ForecastGrid({
  items,
  periods,
  values,
  onCellChange,
  onBulkSave,
  currency = 'IDR',
}: ForecastGridProps) {
  const [editingCell, setEditingCell] = useState<{ itemId: number; period: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [pendingChanges, setPendingChanges] = useState<PeriodValue[]>([]);
  const [saving, setSaving] = useState(false);

  function getValue(itemId: number, period: string): number {
    // Check pending changes first
    const pending = pendingChanges.find((c) => c.itemId === itemId && c.period === period);
    if (pending !== undefined) return pending.amount;
    return values.find((v) => v.itemId === itemId && v.period === period)?.amount ?? 0;
  }

  function startEdit(itemId: number, period: string) {
    setEditingCell({ itemId, period });
    setEditValue(String(getValue(itemId, period) || ''));
  }

  function commitEdit(itemId: number, period: string) {
    const amount = parseFloat(editValue.replace(/[^0-9.-]/g, '')) || 0;
    setEditingCell(null);
    onCellChange(itemId, period, amount);
    setPendingChanges((prev) => {
      const filtered = prev.filter((c) => !(c.itemId === itemId && c.period === period));
      return [...filtered, { itemId, period, amount }];
    });
  }

  async function handleSave() {
    if (pendingChanges.length === 0) return;
    setSaving(true);
    try {
      await onBulkSave(pendingChanges);
      setPendingChanges([]);
    } finally {
      setSaving(false);
    }
  }

  // Group items by stream
  const streamGroups = items.reduce<Map<string, GridItem[]>>((map, item) => {
    const key = `${item.streamId}__${item.streamName}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
    return map;
  }, new Map());

  // Column totals per period per stream
  function getStreamTotal(streamId: number, period: string): number {
    return items.filter((i) => i.streamId === streamId).reduce((sum, i) => sum + getValue(i.id, period), 0);
  }

  return (
    <div className="space-y-2">
      {pendingChanges.length > 0 && (
        <div className="flex items-center justify-between bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 rounded px-3 py-2 text-sm">
          <span>{pendingChanges.length} unsaved change{pendingChanges.length !== 1 ? 's' : ''}</span>
          <button
            onClick={handleSave}
            disabled={saving}
            className="text-xs font-medium text-yellow-700 dark:text-yellow-300 hover:underline"
          >
            {saving ? 'Saving…' : 'Save all'}
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-md border">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-muted/50">
              <th className="sticky left-0 bg-muted/50 text-left px-3 py-2 font-medium min-w-[200px]">
                Line Item
              </th>
              {periods.map((p) => (
                <th key={p} className="px-2 py-2 text-right font-medium min-w-[90px] whitespace-nowrap">
                  {p}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from(streamGroups.entries()).map(([streamKey, streamItems]) => {
              const firstItem = streamItems[0];
              return (
                <React.Fragment key={streamKey}>
                  {/* Stream header row */}
                  <tr key={`stream-${streamKey}`} className="bg-muted/30 border-t">
                    <td
                      colSpan={1}
                      className="sticky left-0 bg-muted/30 px-3 py-1.5 font-semibold text-xs uppercase tracking-wide"
                    >
                      <span className={cn(
                        'inline-flex items-center gap-1.5',
                        firstItem.streamType === 'revenue' ? 'text-green-700' : 'text-red-700'
                      )}>
                        {firstItem.streamName}
                      </span>
                    </td>
                    {periods.map((p) => (
                      <td key={p} className="px-2 py-1.5 text-right text-xs font-medium text-muted-foreground">
                        {formatAmount(getStreamTotal(firstItem.streamId, p), currency)}
                      </td>
                    ))}
                  </tr>

                  {/* Item rows */}
                  {streamItems.map((item) => (
                    <tr key={item.id} className="border-t hover:bg-accent/30 transition-colors">
                      <td className="sticky left-0 bg-background px-6 py-1.5 text-sm">
                        {item.name}
                      </td>
                      {periods.map((p) => {
                        const isEditing = editingCell?.itemId === item.id && editingCell?.period === p;
                        const val = getValue(item.id, p);
                        const isPending = pendingChanges.some((c) => c.itemId === item.id && c.period === p);

                        return (
                          <td
                            key={p}
                            className={cn(
                              'px-2 py-1 text-right cursor-pointer',
                              isPending && 'bg-yellow-50 dark:bg-yellow-900/20'
                            )}
                            onClick={() => !isEditing && startEdit(item.id, p)}
                          >
                            {isEditing ? (
                              <input
                                autoFocus
                                className="w-full text-right bg-transparent outline-none border-b border-primary"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onBlur={() => commitEdit(item.id, p)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === 'Tab') commitEdit(item.id, p);
                                  if (e.key === 'Escape') setEditingCell(null);
                                }}
                              />
                            ) : (
                              <span className={cn(val === 0 ? 'text-muted-foreground/40' : '')}>
                                {formatAmount(val, currency)}
                              </span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
