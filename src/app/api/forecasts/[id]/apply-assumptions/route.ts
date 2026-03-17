import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { forecasts } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { applyAssumptions } from '@/lib/forecasts/assumptions';
import { withAuth } from '@/lib/auth/getAuthInfo';

// POST /api/forecasts/[id]/apply-assumptions
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

    await applyAssumptions(forecastId, companyId);

    return NextResponse.json({ message: 'Assumptions applied successfully' });
  });
}
