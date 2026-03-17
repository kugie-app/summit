import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { forecasts, forecastItems } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { forecastItemSchema } from '@/lib/validations/forecast';
import { withAuth } from '@/lib/auth/getAuthInfo';

async function verifyForecast(forecastId: number, companyId: number) {
  const [f] = await db
    .select()
    .from(forecasts)
    .where(and(eq(forecasts.id, forecastId), eq(forecasts.companyId, companyId), eq(forecasts.softDelete, false)));
  return f ?? null;
}

// POST /api/forecasts/[id]/items
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth<any>(request, async (authInfo) => {
    const { companyId } = authInfo;
    const { id } = await params;
    const forecastId = parseInt(id);

    if (!await verifyForecast(forecastId, companyId)) {
      return NextResponse.json({ message: 'Forecast not found' }, { status: 404 });
    }

    const body = await request.json();
    const parsed = forecastItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: 'Validation failed', errors: parsed.error.format() }, { status: 400 });
    }

    const [created] = await db
      .insert(forecastItems)
      .values({
        forecastId,
        ...parsed.data,
        description: parsed.data.description ?? null,
        incomeCategoryId: parsed.data.incomeCategoryId ?? null,
        expenseCategoryId: parsed.data.expenseCategoryId ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json(created, { status: 201 });
  });
}

// PUT /api/forecasts/[id]/items – requires itemId in body
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth<any>(request, async (authInfo) => {
    const { companyId } = authInfo;
    const { id } = await params;
    const forecastId = parseInt(id);

    if (!await verifyForecast(forecastId, companyId)) {
      return NextResponse.json({ message: 'Forecast not found' }, { status: 404 });
    }

    const body = await request.json();
    const { itemId, ...rest } = body;
    if (!itemId) return NextResponse.json({ message: 'itemId is required' }, { status: 400 });

    const parsed = forecastItemSchema.partial().safeParse(rest);
    if (!parsed.success) {
      return NextResponse.json({ message: 'Validation failed', errors: parsed.error.format() }, { status: 400 });
    }

    const [updated] = await db
      .update(forecastItems)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(and(eq(forecastItems.id, itemId), eq(forecastItems.forecastId, forecastId)))
      .returning();

    if (!updated) return NextResponse.json({ message: 'Item not found' }, { status: 404 });
    return NextResponse.json(updated);
  });
}

// DELETE /api/forecasts/[id]/items?itemId=...
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth<any>(request, async (authInfo) => {
    const { companyId } = authInfo;
    const { id } = await params;
    const forecastId = parseInt(id);

    if (!await verifyForecast(forecastId, companyId)) {
      return NextResponse.json({ message: 'Forecast not found' }, { status: 404 });
    }

    const itemId = parseInt(request.nextUrl.searchParams.get('itemId') ?? '');
    if (isNaN(itemId)) return NextResponse.json({ message: 'itemId query param required' }, { status: 400 });

    await db
      .delete(forecastItems)
      .where(and(eq(forecastItems.id, itemId), eq(forecastItems.forecastId, forecastId)));

    return NextResponse.json({ message: 'Item deleted' });
  });
}
