import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { forecasts, forecastStreams, forecastItems } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { forecastSchema } from '@/lib/validations/forecast';
import { withAuth } from '@/lib/auth/getAuthInfo';

// GET /api/forecasts/[id] – Forecast detail with streams + items
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth<any>(request, async (authInfo) => {
    const { companyId } = authInfo;
    const { id } = await params;
    const forecastId = parseInt(id);

    const [forecast] = await db
      .select()
      .from(forecasts)
      .where(
        and(eq(forecasts.id, forecastId), eq(forecasts.companyId, companyId), eq(forecasts.softDelete, false))
      );

    if (!forecast) {
      return NextResponse.json({ message: 'Forecast not found' }, { status: 404 });
    }

    const streams = await db
      .select()
      .from(forecastStreams)
      .where(eq(forecastStreams.forecastId, forecastId))
      .orderBy(forecastStreams.order);

    const items = await db
      .select()
      .from(forecastItems)
      .where(eq(forecastItems.forecastId, forecastId))
      .orderBy(forecastItems.order);

    return NextResponse.json({ ...forecast, streams, items });
  });
}

// PUT /api/forecasts/[id] – Update a forecast
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth<any>(request, async (authInfo) => {
    const { companyId } = authInfo;
    const { id } = await params;
    const forecastId = parseInt(id);

    const [existing] = await db
      .select()
      .from(forecasts)
      .where(and(eq(forecasts.id, forecastId), eq(forecasts.companyId, companyId), eq(forecasts.softDelete, false)));

    if (!existing) {
      return NextResponse.json({ message: 'Forecast not found' }, { status: 404 });
    }

    const body = await request.json();
    const parsed = forecastSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: 'Validation failed', errors: parsed.error.format() },
        { status: 400 }
      );
    }

    const [updated] = await db
      .update(forecasts)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(eq(forecasts.id, forecastId))
      .returning();

    return NextResponse.json(updated);
  });
}

// DELETE /api/forecasts/[id] – Soft delete
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth<any>(request, async (authInfo) => {
    const { companyId } = authInfo;
    const { id } = await params;
    const forecastId = parseInt(id);

    const [existing] = await db
      .select()
      .from(forecasts)
      .where(and(eq(forecasts.id, forecastId), eq(forecasts.companyId, companyId), eq(forecasts.softDelete, false)));

    if (!existing) {
      return NextResponse.json({ message: 'Forecast not found' }, { status: 404 });
    }

    await db
      .update(forecasts)
      .set({ softDelete: true, updatedAt: new Date() })
      .where(eq(forecasts.id, forecastId));

    return NextResponse.json({ message: 'Forecast deleted' });
  });
}
