import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { forecasts, forecastStreams } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { forecastStreamSchema } from '@/lib/validations/forecast';
import { withAuth } from '@/lib/auth/getAuthInfo';

async function verifyForecast(forecastId: number, companyId: number) {
  const [forecast] = await db
    .select()
    .from(forecasts)
    .where(and(eq(forecasts.id, forecastId), eq(forecasts.companyId, companyId), eq(forecasts.softDelete, false)));
  return forecast ?? null;
}

// POST /api/forecasts/[id]/streams – Create a stream
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth<any>(request, async (authInfo) => {
    const { companyId } = authInfo;
    const { id } = await params;
    const forecastId = parseInt(id);

    if (!await verifyForecast(forecastId, companyId)) {
      return NextResponse.json({ message: 'Forecast not found' }, { status: 404 });
    }

    const body = await request.json();
    const parsed = forecastStreamSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: 'Validation failed', errors: parsed.error.format() }, { status: 400 });
    }

    const [created] = await db
      .insert(forecastStreams)
      .values({ forecastId, ...parsed.data, createdAt: new Date(), updatedAt: new Date() })
      .returning();

    return NextResponse.json(created, { status: 201 });
  });
}

// PUT /api/forecasts/[id]/streams – Update a stream (requires streamId in body)
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth<any>(request, async (authInfo) => {
    const { companyId } = authInfo;
    const { id } = await params;
    const forecastId = parseInt(id);

    if (!await verifyForecast(forecastId, companyId)) {
      return NextResponse.json({ message: 'Forecast not found' }, { status: 404 });
    }

    const body = await request.json();
    const { streamId, ...rest } = body;
    if (!streamId) {
      return NextResponse.json({ message: 'streamId is required' }, { status: 400 });
    }

    const parsed = forecastStreamSchema.partial().safeParse(rest);
    if (!parsed.success) {
      return NextResponse.json({ message: 'Validation failed', errors: parsed.error.format() }, { status: 400 });
    }

    const [updated] = await db
      .update(forecastStreams)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(and(eq(forecastStreams.id, streamId), eq(forecastStreams.forecastId, forecastId)))
      .returning();

    if (!updated) return NextResponse.json({ message: 'Stream not found' }, { status: 404 });
    return NextResponse.json(updated);
  });
}

// DELETE /api/forecasts/[id]/streams – Delete a stream (requires streamId query param)
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth<any>(request, async (authInfo) => {
    const { companyId } = authInfo;
    const { id } = await params;
    const forecastId = parseInt(id);

    if (!await verifyForecast(forecastId, companyId)) {
      return NextResponse.json({ message: 'Forecast not found' }, { status: 404 });
    }

    const streamId = parseInt(request.nextUrl.searchParams.get('streamId') ?? '');
    if (isNaN(streamId)) {
      return NextResponse.json({ message: 'streamId query param required' }, { status: 400 });
    }

    await db
      .delete(forecastStreams)
      .where(and(eq(forecastStreams.id, streamId), eq(forecastStreams.forecastId, forecastId)));

    return NextResponse.json({ message: 'Stream deleted' });
  });
}
