import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { forecasts } from '@/lib/db/schema';
import { and, eq, desc } from 'drizzle-orm';
import { forecastSchema } from '@/lib/validations/forecast';
import { withAuth } from '@/lib/auth/getAuthInfo';

// GET /api/forecasts – List all forecasts for the company
export async function GET(request: NextRequest) {
  return withAuth<any>(request, async (authInfo) => {
    const { companyId } = authInfo;

    const results = await db
      .select()
      .from(forecasts)
      .where(and(eq(forecasts.companyId, companyId), eq(forecasts.softDelete, false)))
      .orderBy(desc(forecasts.createdAt));

    return NextResponse.json(results);
  });
}

// POST /api/forecasts – Create a new forecast
export async function POST(request: NextRequest) {
  return withAuth<any>(request, async (authInfo) => {
    const { companyId } = authInfo;
    const body = await request.json();

    const parsed = forecastSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: 'Validation failed', errors: parsed.error.format() },
        { status: 400 }
      );
    }

    const { name, description, startDate, endDate, currency } = parsed.data;

    const [created] = await db
      .insert(forecasts)
      .values({
        companyId,
        name,
        description: description ?? null,
        startDate,
        endDate,
        currency,
        softDelete: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json(created, { status: 201 });
  });
}
