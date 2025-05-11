import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { apiTokens } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// GET /api/debug/tokens - Check if a token exists in the database
export async function GET(request: NextRequest) {
  try {
    // Only allow in development
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ message: 'Not available in production' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const prefix = searchParams.get('prefix');

    if (!prefix) {
      return NextResponse.json({ message: 'Missing token prefix' }, { status: 400 });
    }

    const tokens = await db
      .select({
        id: apiTokens.id,
        tokenPrefix: apiTokens.tokenPrefix,
        name: apiTokens.name,
        userId: apiTokens.userId,
        companyId: apiTokens.companyId,
        createdAt: apiTokens.createdAt,
        lastUsedAt: apiTokens.lastUsedAt,
        expiresAt: apiTokens.expiresAt,
        revokedAt: apiTokens.revokedAt,
      })
      .from(apiTokens)
      .where(eq(apiTokens.tokenPrefix, prefix));

    return NextResponse.json({
      found: tokens.length > 0,
      count: tokens.length,
      tokens: tokens.map(token => ({
        ...token,
        // Don't expose the hash
        tokenHash: undefined
      }))
    });
  } catch (error) {
    console.error('Error checking tokens:', error);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
} 