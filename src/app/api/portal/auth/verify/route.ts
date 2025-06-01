import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { verifyLoginToken, createClientJWT, setClientJWTCookie } from '@/lib/auth/client/utils';
import { db } from '@/lib/db';
import { clientUsers, clients } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';

// Validation schema for the request body
const requestSchema = z.object({
  token: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const result = requestSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 400 }
      );
    }

    const { token } = result.data;

    // Verify the token
    const loginToken = await verifyLoginToken(token);

    if (!loginToken) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 400 }
      );
    }

    // Find or create client user
    const [existingClientUser] = await db
      .select()
      .from(clientUsers)
      .where(
        and(
          eq(clientUsers.clientId, loginToken.clientId),
          eq(clientUsers.email, loginToken.email),
          eq(clientUsers.softDelete, false)
        )
      );

    // Get client info
    const [clientInfo] = await db
      .select({
        id: clients.id,
        name: clients.name,
        email: clients.email,
      })
      .from(clients)
      .where(eq(clients.id, loginToken.clientId));

    if (!clientInfo) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    let clientUser = existingClientUser;

    if (!clientUser) {
      // Create a new client user
      const [newClientUser] = await db
        .insert(clientUsers)
        .values({
          clientId: loginToken.clientId,
          email: loginToken.email,
          name: clientInfo.name,
          tokenVersion: 1,
        })
        .returning();

      clientUser = newClientUser;
    }

    // Update last login timestamp
    await db
      .update(clientUsers)
      .set({
        lastLoginAt: new Date().toISOString(),
      })
      .where(eq(clientUsers.id, clientUser.id));

    // Generate JWT
    const { jwt } = await createClientJWT({
      clientId: clientUser.clientId,
      clientUserId: clientUser.id,
      email: clientUser.email,
      name: clientUser.name || undefined,
      tokenVersion: clientUser.tokenVersion,
    });

    // Set cookie
    await setClientJWTCookie(jwt);

    // Return success
    return NextResponse.json(
      {
        success: true,
        client: {
          name: clientInfo.name,
          email: clientInfo.email,
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error verifying token:', error);
    return NextResponse.json(
      { error: 'An error occurred while verifying your token' },
      { status: 500 }
    );
  }
} 