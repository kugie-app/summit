'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ArrowLeft, Plus, Upload } from 'lucide-react';
import { ForecastGrid, GridItem, PeriodValue } from './ForecastGrid';
import { StreamTree, ForecastStream, ForecastItem } from './StreamTree';
import { AssumptionsPanel } from './AssumptionsPanel';

interface Forecast {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  currency: string;
  streams: ForecastStream[];
  items: ForecastItem[];
}

interface FullForecastItem extends ForecastItem {
  incomeCategoryId: number | null;
  expenseCategoryId: number | null;
}

interface Category {
  id: number;
  name: string;
}

interface ForecastEditorPageProps {
  forecastId: number;
}

function generatePeriods(startDate: string, endDate: string): string[] {
  const periods: string[] = [];
  const [sy, sm] = startDate.split('-').map(Number);
  const [ey, em] = endDate.split('-').map(Number);
  let y = sy, m = sm;
  while (y < ey || (y === ey && m <= em)) {
    periods.push(`${y}-${String(m).padStart(2, '0')}`);
    m++;
    if (m > 12) { m = 1; y++; }
  }
  return periods;
}

export default function ForecastEditorPage({ forecastId }: ForecastEditorPageProps) {
  const [forecast, setForecast] = useState<Forecast | null>(null);
  const [streams, setStreams] = useState<ForecastStream[]>([]);
  const [items, setItems] = useState<ForecastItem[]>([]);
  const [periodValues, setPeriodValues] = useState<PeriodValue[]>([]);
  const [assumptions, setAssumptions] = useState<any>({ variables: [], growthRules: [], seasonalityWeights: [] });
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  // Item edit dialog
  const [editItem, setEditItem] = useState<FullForecastItem | null>(null);
  const [incomeCategories, setIncomeCategories] = useState<Category[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<Category[]>([]);
  const [editItemSaving, setEditItemSaving] = useState(false);

  // Add stream dialog
  const [addStreamOpen, setAddStreamOpen] = useState(false);
  const [newStreamName, setNewStreamName] = useState('');
  const [newStreamType, setNewStreamType] = useState<'revenue' | 'expense'>('revenue');

  // Add item dialog
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [addItemStreamId, setAddItemStreamId] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      const [forecastRes, assumptionsRes, incCatRes, expCatRes] = await Promise.all([
        fetch(`/api/forecasts/${forecastId}`),
        fetch(`/api/forecasts/${forecastId}/assumptions`),
        fetch(`/api/income-categories`),
        fetch(`/api/expense-categories`),
      ]);
      const forecastData = await forecastRes.json();
      const assumptionsData = await assumptionsRes.json();
      const incCatData = await incCatRes.json();
      const expCatData = await expCatRes.json();

      setForecast(forecastData);
      setStreams(forecastData.streams ?? []);
      setItems(forecastData.items ?? []);
      setAssumptions(assumptionsData);
      setIncomeCategories(incCatData?.data ?? incCatData ?? []);
      setExpenseCategories(expCatData?.data ?? expCatData ?? []);

      // Determine initial year
      const startYear = parseInt(forecastData.startDate.substring(0, 4));
      setSelectedYear(startYear);

      // Load period values (no per-stream endpoint needed, load all via comparison or separate call)
      // We'll fetch via the bulk endpoint by reading period values from items
      // For now, fetch them by loading from the comparison endpoint (which includes budgeted values)
      // Actually, there's no direct GET for period values. We'll fetch them through the forecast items.
      // Let's call a simple periods fetch.
      await loadPeriodValues(forecastData.items ?? [], forecastData.startDate, forecastData.endDate);

      setLoading(false);
    }
    load();
  }, [forecastId]);

  async function loadPeriodValues(forecastItems: ForecastItem[], startDate: string, endDate: string) {
    if (forecastItems.length === 0) return;
    // Fetch comparison data (has budgeted values per item per period)
    const res = await fetch(`/api/forecasts/${forecastId}/comparison`);
    if (!res.ok) return;
    const rows: any[] = await res.json();
    const pvs: PeriodValue[] = rows.map((r) => ({
      itemId: r.itemId,
      period: r.period,
      amount: r.budgeted,
    }));
    setPeriodValues(pvs);
  }

  const periods = forecast ? generatePeriods(forecast.startDate, forecast.endDate) : [];
  const years = [...new Set(periods.map((p) => parseInt(p.substring(0, 4))))];
  const visiblePeriods = selectedYear
    ? periods.filter((p) => p.startsWith(String(selectedYear)))
    : periods;

  const gridItems: GridItem[] = items.map((item) => {
    const stream = streams.find((s) => s.id === item.streamId);
    return {
      id: item.id,
      name: item.name,
      streamId: item.streamId,
      streamName: stream?.name ?? 'Unknown',
      streamType: stream?.type ?? 'revenue',
    };
  });

  async function handleAddStream() {
    const res = await fetch(`/api/forecasts/${forecastId}/streams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newStreamName, type: newStreamType, order: streams.length }),
    });
    if (res.ok) {
      const stream = await res.json();
      setStreams((prev) => [...prev, stream]);
      setNewStreamName('');
      setAddStreamOpen(false);
    }
  }

  async function handleAddItem(streamId: number) {
    setAddItemStreamId(streamId);
    setAddItemOpen(true);
  }

  async function handleCreateItem() {
    if (!addItemStreamId) return;
    const res = await fetch(`/api/forecasts/${forecastId}/items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ streamId: addItemStreamId, name: newItemName, order: items.length }),
    });
    if (res.ok) {
      const item = await res.json();
      setItems((prev) => [...prev, item]);
      setNewItemName('');
      setAddItemOpen(false);
    }
  }

  async function handleDeleteStream(streamId: number) {
    await fetch(`/api/forecasts/${forecastId}/streams?streamId=${streamId}`, { method: 'DELETE' });
    setStreams((prev) => prev.filter((s) => s.id !== streamId));
    setItems((prev) => prev.filter((i) => i.streamId !== streamId));
  }

  async function handleDeleteItem(itemId: number) {
    await fetch(`/api/forecasts/${forecastId}/items?itemId=${itemId}`, { method: 'DELETE' });
    setItems((prev) => prev.filter((i) => i.id !== itemId));
    setPeriodValues((prev) => prev.filter((v) => v.itemId !== itemId));
  }

  function handleCellChange(itemId: number, period: string, amount: number) {
    setPeriodValues((prev) => {
      const filtered = prev.filter((v) => !(v.itemId === itemId && v.period === period));
      return [...filtered, { itemId, period, amount }];
    });
  }

  async function handleBulkSave(changes: PeriodValue[]) {
    const body = { values: changes.map((c) => ({ itemId: c.itemId, period: c.period, amount: c.amount.toFixed(2) })) };
    await fetch(`/api/forecasts/${forecastId}/revenue-periods/bulk`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  async function handleSaveAssumptions(data: any) {
    await fetch(`/api/forecasts/${forecastId}/assumptions`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    setAssumptions(data);
  }

  function handleSelectItem(itemId: number) {
    const item = items.find((i) => i.id === itemId) as FullForecastItem | undefined;
    if (item) setEditItem({ ...item });
  }

  async function handleSaveItemCategory() {
    if (!editItem) return;
    setEditItemSaving(true);
    try {
      const res = await fetch(`/api/forecasts/${forecastId}/items`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: editItem.id,
          incomeCategoryId: editItem.incomeCategoryId ?? null,
          expenseCategoryId: editItem.expenseCategoryId ?? null,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
        setEditItem(null);
      }
    } finally {
      setEditItemSaving(false);
    }
  }

  async function handleApplyAssumptions() {
    await fetch(`/api/forecasts/${forecastId}/apply-assumptions`, { method: 'POST' });
    // Reload period values
    if (forecast) await loadPeriodValues(items, forecast.startDate, forecast.endDate);
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!forecast) {
    return <div className="p-8 text-center text-muted-foreground">Forecast not found</div>;
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b bg-background shrink-0">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/forecasts"><ArrowLeft className="h-4 w-4 mr-1" /> Forecasts</Link>
          </Button>
          <div>
            <h1 className="font-bold text-lg leading-tight">{forecast.name}</h1>
            <p className="text-xs text-muted-foreground">{forecast.startDate} → {forecast.endDate} · {forecast.currency}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {years.map((y) => (
            <Button
              key={y}
              size="sm"
              variant={selectedYear === y ? 'default' : 'outline'}
              onClick={() => setSelectedYear(y)}
            >
              {y}
            </Button>
          ))}
          <Button size="sm" variant="outline" onClick={() => setSelectedYear(null)}>All</Button>
          <AssumptionsPanel
            forecastId={forecastId}
            streams={streams.map((s) => ({ id: s.id, name: s.name }))}
            items={items.map((item) => ({ id: item.id, name: item.name }))}
            variables={assumptions.variables ?? []}
            growthRules={assumptions.growthRules ?? []}
            seasonalityWeights={assumptions.seasonalityWeights ?? []}
            onSave={handleSaveAssumptions}
            onApply={handleApplyAssumptions}
          />
          <Button asChild size="sm" variant="outline">
            <Link href={`/forecasts/${forecastId}/comparison`}>Compare</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href={`/forecasts/${forecastId}/tracking`}>Tracking</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link href={`/forecasts/${forecastId}/import`}>
              <Upload className="h-4 w-4 mr-1" /> Import CSV
            </Link>
          </Button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-64 border-r overflow-y-auto p-4 shrink-0">
          <StreamTree
            streams={streams}
            items={items}
            selectedItemId={editItem?.id}
            onSelectItem={handleSelectItem}
            onAddStream={() => setAddStreamOpen(true)}
            onAddItem={handleAddItem}
            onDeleteStream={handleDeleteStream}
            onDeleteItem={handleDeleteItem}
          />
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-auto p-4">
          {gridItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
              <p className="mb-3">No streams or items yet.</p>
              <Button onClick={() => setAddStreamOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> Add Stream
              </Button>
            </div>
          ) : (
            <ForecastGrid
              items={gridItems}
              periods={visiblePeriods}
              values={periodValues}
              onCellChange={handleCellChange}
              onBulkSave={handleBulkSave}
              currency={forecast.currency}
            />
          )}
        </div>
      </div>

      {/* Add Stream Dialog */}
      <Dialog open={addStreamOpen} onOpenChange={setAddStreamOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Stream</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input value={newStreamName} onChange={(e) => setNewStreamName(e.target.value)} placeholder="e.g. Product Revenue" />
            </div>
            <div>
              <Label>Type</Label>
              <select
                className="w-full border rounded px-3 py-2 text-sm mt-1"
                value={newStreamType}
                onChange={(e) => setNewStreamType(e.target.value as 'revenue' | 'expense')}
              >
                <option value="revenue">Revenue</option>
                <option value="expense">Expense</option>
              </select>
            </div>
            <Button onClick={handleAddStream} disabled={!newStreamName.trim()} className="w-full">Add Stream</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog — category mapping */}
      <Dialog open={!!editItem} onOpenChange={(open) => { if (!open) setEditItem(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Item: {editItem?.name}</DialogTitle>
          </DialogHeader>
          {editItem && (
            <div className="space-y-4">
              <div>
                <Label>Income Category</Label>
                <p className="text-xs text-muted-foreground mb-1">
                  Link to an income category so actuals flow into comparison/tracking.
                </p>
                <select
                  className="w-full border rounded px-3 py-2 text-sm"
                  value={editItem.incomeCategoryId ?? ''}
                  onChange={(e) =>
                    setEditItem({ ...editItem, incomeCategoryId: e.target.value ? parseInt(e.target.value) : null })
                  }
                >
                  <option value="">— none —</option>
                  {incomeCategories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Expense Category</Label>
                <p className="text-xs text-muted-foreground mb-1">
                  Link to an expense category for expense items.
                </p>
                <select
                  className="w-full border rounded px-3 py-2 text-sm"
                  value={editItem.expenseCategoryId ?? ''}
                  onChange={(e) =>
                    setEditItem({ ...editItem, expenseCategoryId: e.target.value ? parseInt(e.target.value) : null })
                  }
                >
                  <option value="">— none —</option>
                  {expenseCategories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <Button onClick={handleSaveItemCategory} disabled={editItemSaving} className="w-full">
                {editItemSaving ? 'Saving…' : 'Save'}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Item Dialog */}
      <Dialog open={addItemOpen} onOpenChange={setAddItemOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Line Item</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input value={newItemName} onChange={(e) => setNewItemName(e.target.value)} placeholder="e.g. SaaS Subscriptions" />
            </div>
            <Button onClick={handleCreateItem} disabled={!newItemName.trim()} className="w-full">Add Item</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
