'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewForecastPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    currency: 'IDR',
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/forecasts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          description: form.description || null,
          startDate: form.startDate,
          endDate: form.endDate,
          currency: form.currency,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.message ?? 'Failed to create forecast');
        return;
      }

      const created = await res.json();
      router.push(`/forecasts/${created.id}`);
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-8 space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/forecasts">
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">New Forecast</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Forecast Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. FY2026 P&L Forecast"
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Optional description"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Month *</Label>
                <Input
                  id="startDate"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  placeholder="YYYY-MM"
                  pattern="\d{4}-\d{2}"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">Format: YYYY-MM</p>
              </div>
              <div>
                <Label htmlFor="endDate">End Month *</Label>
                <Input
                  id="endDate"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  placeholder="YYYY-MM"
                  pattern="\d{4}-\d{2}"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                placeholder="IDR"
              />
            </div>

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 rounded p-3">{error}</div>
            )}

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={submitting} className="flex-1">
                {submitting ? 'Creating…' : 'Create Forecast'}
              </Button>
              <Button asChild variant="outline">
                <Link href="/forecasts">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
