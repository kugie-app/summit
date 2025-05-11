import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { db } from '@/lib/db';
import { apiTokens } from '@/lib/db/schema';
import { and, eq, desc, isNull } from 'drizzle-orm';
import { authOptions } from '@/lib/auth/options';
import { generateApiTokenParts, hashTokenSecret } from '@/lib/auth/apiTokenUtils';

const createTokenSchema = z.object({
  name: z.string().min(3, 'Token name must be at least 3 characters').max(50),
  expiresAt: z.string().datetime().optional().nullable(),
});

// GET /api/api-tokens - List active API tokens for the user
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.companyId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const companyId = parseInt(session.user.companyId);

    const tokens = await db
      .select({
        id: apiTokens.id,
        name: apiTokens.name,
        tokenPrefix: apiTokens.tokenPrefix,
        createdAt: apiTokens.createdAt,
        lastUsedAt: apiTokens.lastUsedAt,
        expiresAt: apiTokens.expiresAt,
      })
      .from(apiTokens)
      .where(
        and(
          eq(apiTokens.userId, userId),
          eq(apiTokens.companyId, companyId),
          isNull(apiTokens.revokedAt) // Only active tokens
        )
      )
      .orderBy(desc(apiTokens.createdAt));

    return NextResponse.json(tokens);
  } catch (error) {
    console.error('Error fetching API tokens:', error);
    return NextResponse.json({ message: 'Failed to fetch API tokens' }, { status: 500 });
  }
}

// POST /api/api-tokens - Create a new API token
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !session.user.companyId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const companyId = parseInt(session.user.companyId);

    const body = await request.json();
    const validation = createTokenSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { message: 'Validation failed', errors: validation.error.format() },
        { status: 400 }
      );
    }

    const { name, expiresAt } = validation.data;
    const { prefix, secret, fullToken } = generateApiTokenParts();
    const tokenHash = await hashTokenSecret(secret);

    const [newApiToken] = await db
      .insert(apiTokens)
      .values({
        userId,
        companyId,
        name,
        tokenPrefix: prefix,
        tokenHash,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        createdAt: new Date(),
      })
      .returning({
        id: apiTokens.id,
        name: apiTokens.name,
        tokenPrefix: apiTokens.tokenPrefix,
        expiresAt: apiTokens.expiresAt,
        createdAt: apiTokens.createdAt,
      });

    return NextResponse.json({
      ...newApiToken,
      fullToken, // Return the full token to the user ONCE
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating API token:', error);
    // Handle potential unique constraint violation for tokenPrefix if not handled by generateApiTokenParts
    if (error instanceof Error && error.message.includes('duplicate key value violates unique constraint')) {
        return NextResponse.json({ message: 'Failed to generate a unique token prefix. Please try again.' }, { status: 500 });
    }
    return NextResponse.json({ message: 'Failed to create API token' }, { status: 500 });
  }
} 