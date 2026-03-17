import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { forecasts, forecastStreams, forecastItems, forecastPeriodValues } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { withAuth } from '@/lib/auth/getAuthInfo';

/**
 * Parse a simple CSV string into rows of objects.
 * Expected header: stream,item,category,YYYY-MM,YYYY-MM,...
 */
function parseCsv(text: string): Array<Record<string, string>> {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const values = line.split(',').map((v) => v.trim());
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? '']));
  });
}

// POST /api/forecasts/[id]/import
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth<any>(request, async (authInfo) => {
    const { companyId } = authInfo;
    const { id } = await params;
    const forecastId = parseInt(id);

    const [forecast] = await db
      .select()
      .from(forecasts)
      .where(and(eq(forecasts.id, forecastId), eq(forecasts.companyId, companyId), eq(forecasts.softDelete, false)));

    if (!forecast) {
      return NextResponse.json({ message: 'Forecast not found' }, { status: 404 });
    }

    const contentType = request.headers.get('content-type') ?? '';
    let csvText: string;

    if (contentType.includes('multipart/form-data')) {
      const form = await request.formData();
      const file = form.get('file');
      if (!file || typeof file === 'string') {
        return NextResponse.json({ message: 'file field required' }, { status: 400 });
      }
      csvText = await (file as File).text();
    } else {
      csvText = await request.text();
    }

    const rows = parseCsv(csvText);
    if (rows.length === 0) {
      return NextResponse.json({ message: 'No data rows found in CSV' }, { status: 400 });
    }

    const headers = Object.keys(rows[0]);
    const periodHeaders = headers.filter((h) => /^\d{4}-\d{2}$/.test(h));

    if (periodHeaders.length === 0) {
      return NextResponse.json({ message: 'No YYYY-MM period columns found' }, { status: 400 });
    }

    // Load existing streams for this forecast
    const existingStreams = await db
      .select()
      .from(forecastStreams)
      .where(eq(forecastStreams.forecastId, forecastId));

    const streamCache: Map<string, number> = new Map(existingStreams.map((s) => [s.name, s.id]));

    const existingItems = await db
      .select()
      .from(forecastItems)
      .where(eq(forecastItems.forecastId, forecastId));

    const itemCache: Map<string, number> = new Map(existingItems.map((i) => [`${i.streamId}__${i.name}`, i.id]));

    const now = new Date();
    let upsertCount = 0;

    for (const row of rows) {
      const streamName = row['stream'];
      const itemName = row['item'];

      if (!streamName || !itemName) continue;

      // Get or create stream
      let streamId = streamCache.get(streamName);
      if (!streamId) {
        const inferredType = /expense/i.test(streamName) ? 'expense' : 'revenue';
        const [newStream] = await db
          .insert(forecastStreams)
          .values({ forecastId, name: streamName, type: inferredType, order: 0, createdAt: now, updatedAt: now })
          .returning();
        streamId = newStream.id;
        streamCache.set(streamName, streamId);
      }

      // Get or create item
      const itemKey = `${streamId}__${itemName}`;
      let itemId = itemCache.get(itemKey);
      if (!itemId) {
        const [newItem] = await db
          .insert(forecastItems)
          .values({
            forecastId,
            streamId,
            name: itemName,
            description: null,
            order: 0,
            incomeCategoryId: null,
            expenseCategoryId: null,
            createdAt: now,
            updatedAt: now,
          })
          .returning();
        itemId = newItem.id;
        itemCache.set(itemKey, itemId);
      }

      // Upsert period values
      for (const period of periodHeaders) {
        const rawAmount = row[period];
        if (!rawAmount || rawAmount.trim() === '') continue;
        const amount = parseFloat(rawAmount.replace(/[^0-9.-]/g, ''));
        if (isNaN(amount)) continue;

        await db
          .insert(forecastPeriodValues)
          .values({
            forecastId,
            itemId,
            period,
            amount: amount.toFixed(2),
            createdAt: now,
            updatedAt: now,
          })
          .onConflictDoUpdate({
            target: [forecastPeriodValues.itemId, forecastPeriodValues.period],
            set: { amount: amount.toFixed(2), updatedAt: now },
          });

        upsertCount++;
      }
    }

    return NextResponse.json({ message: 'Import complete', rowsProcessed: rows.length, valuesUpserted: upsertCount });
  });
}
