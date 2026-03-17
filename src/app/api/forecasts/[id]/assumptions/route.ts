import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  forecasts,
  forecastVariables,
  forecastGrowthRules,
  forecastSeasonalityWeights,
} from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { forecastAssumptionsSchema } from '@/lib/validations/forecast';
import { withAuth } from '@/lib/auth/getAuthInfo';

async function verifyForecast(forecastId: number, companyId: number) {
  const [f] = await db
    .select()
    .from(forecasts)
    .where(and(eq(forecasts.id, forecastId), eq(forecasts.companyId, companyId), eq(forecasts.softDelete, false)));
  return f ?? null;
}

// GET /api/forecasts/[id]/assumptions
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth<any>(request, async (authInfo) => {
    const { companyId } = authInfo;
    const { id } = await params;
    const forecastId = parseInt(id);

    if (!await verifyForecast(forecastId, companyId)) {
      return NextResponse.json({ message: 'Forecast not found' }, { status: 404 });
    }

    const [variables, growthRules, seasonalityWeights] = await Promise.all([
      db.select().from(forecastVariables).where(eq(forecastVariables.forecastId, forecastId)),
      db.select().from(forecastGrowthRules).where(eq(forecastGrowthRules.forecastId, forecastId)),
      db.select().from(forecastSeasonalityWeights).where(eq(forecastSeasonalityWeights.forecastId, forecastId)),
    ]);

    return NextResponse.json({ variables, growthRules, seasonalityWeights });
  });
}

// PUT /api/forecasts/[id]/assumptions – Replace all assumptions
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return withAuth<any>(request, async (authInfo) => {
    const { companyId } = authInfo;
    const { id } = await params;
    const forecastId = parseInt(id);

    if (!await verifyForecast(forecastId, companyId)) {
      return NextResponse.json({ message: 'Forecast not found' }, { status: 404 });
    }

    const body = await request.json();
    const parsed = forecastAssumptionsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: 'Validation failed', errors: parsed.error.format() }, { status: 400 });
    }

    const { variables, growthRules, seasonalityWeights } = parsed.data;
    const now = new Date();

    // Replace variables
    if (variables !== undefined) {
      await db.delete(forecastVariables).where(eq(forecastVariables.forecastId, forecastId));
      if (variables.length > 0) {
        await db.insert(forecastVariables).values(
          variables.map((v) => ({ forecastId, ...v, createdAt: now, updatedAt: now }))
        );
      }
    }

    // Replace growth rules
    if (growthRules !== undefined) {
      await db.delete(forecastGrowthRules).where(eq(forecastGrowthRules.forecastId, forecastId));
      if (growthRules.length > 0) {
        await db.insert(forecastGrowthRules).values(
          growthRules.map((r) => ({
            forecastId,
            scopeType: r.scopeType,
            scopeId: r.scopeId ?? null,
            year: r.year,
            growthRate: r.growthRate,
            createdAt: now,
            updatedAt: now,
          }))
        );
      }
    }

    // Replace seasonality weights
    if (seasonalityWeights !== undefined) {
      await db.delete(forecastSeasonalityWeights).where(eq(forecastSeasonalityWeights.forecastId, forecastId));
      if (seasonalityWeights.length > 0) {
        await db.insert(forecastSeasonalityWeights).values(
          seasonalityWeights.map((w) => ({
            forecastId,
            scopeType: w.scopeType,
            scopeId: w.scopeId ?? null,
            month: w.month,
            weight: w.weight,
            createdAt: now,
            updatedAt: now,
          }))
        );
      }
    }

    return NextResponse.json({ message: 'Assumptions updated' });
  });
}
