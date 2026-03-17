import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { forecasts, forecastPeriodValues } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { forecastBulkPeriodValuesSchema } from '@/lib/validations/forecast';
import { withAuth } from '@/lib/auth/getAuthInfo';

// PUT /api/forecasts/[id]/expense-periods/bulk – Upsert monthly expense period values
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const body = await request.json();
    const parsed = forecastBulkPeriodValuesSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: 'Validation failed', errors: parsed.error.format() }, { status: 400 });
    }

    for (const v of parsed.data.values) {
      await db
        .insert(forecastPeriodValues)
        .values({
          forecastId,
          itemId: v.itemId,
          period: v.period,
          amount: v.amount,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [forecastPeriodValues.itemId, forecastPeriodValues.period],
          set: { amount: v.amount, updatedAt: new Date() },
        });
    }

    return NextResponse.json({ message: 'Values upserted', count: parsed.data.values.length });
  });
}
