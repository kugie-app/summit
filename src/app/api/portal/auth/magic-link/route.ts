import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { saveLoginToken } from '@/lib/auth/client/utils';
import { db } from '@/lib/db';
import { clients } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { Resend } from 'resend';
import { MagicLinkEmail } from '@/emails/MagicLinkEmail';

const resend = new Resend(process.env.RESEND_API_KEY);

// Validation schema for the request body
const requestSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const result = requestSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    const { email } = result.data;

    // Find client by email
    const [clientData] = await db
      .select({
        id: clients.id,
        name: clients.name,
        email: clients.email,
        companyId: clients.companyId,
      })
      .from(clients)
      .where(eq(clients.email, email));

    if (!clientData) {
      // Don't reveal that the client doesn't exist
      return NextResponse.json(
        { message: 'If you exist as a client, a magic link has been sent to your email' },
        { status: 200 }
      );
    }

    // Generate a login token
    const token = await saveLoginToken(clientData.id, email);

    // Create verification URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const verificationUrl = `${baseUrl}/portal/verify?token=${token}`;

    // Send email
    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@example.com',
      to: email,
      subject: 'Sign in to Your Client Portal',
      react: MagicLinkEmail({
        clientName: clientData.name || 'Valued Client',
        magicLink: verificationUrl,
      }),
    });

    return NextResponse.json(
      { message: 'Magic link sent to your email' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error generating magic link:', error);
    return NextResponse.json(
      { error: 'An error occurred while generating your magic link' },
      { status: 500 }
    );
  }
} 