import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { forecasts } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { getForecastSummary } from '@/lib/forecasts/summary';
import { withAuth } from '@/lib/auth/getAuthInfo';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    const summary = await getForecastSummary(forecastId);
    return NextResponse.json(summary);
  });
}
