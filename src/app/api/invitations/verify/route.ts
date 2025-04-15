import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { companyInvitations, companies } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// Validation schema for the token verification
const verifySchema = z.object({
  token: z.string(),
});

// GET /api/invitations/verify - Verify an invitation token
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { message: 'Token is required' },
        { status: 400 }
      );
    }

    // Find the invitation by token
    const [invitation] = await db
      .select({
        id: companyInvitations.id,
        email: companyInvitations.email,
        name: companyInvitations.name,
        role: companyInvitations.role,
        companyId: companyInvitations.companyId,
        expires: companyInvitations.expires,
      })
      .from(companyInvitations)
      .where(
        and(
          eq(companyInvitations.token, token),
          eq(companyInvitations.status, 'pending')
        )
      );

    if (!invitation) {
      return NextResponse.json(
        { message: 'Invalid or expired invitation token' },
        { status: 404 }
      );
    }

    // Check if invitation has expired
    if (new Date() > invitation.expires) {
      // Mark invitation as expired
      await db
        .update(companyInvitations)
        .set({
          status: 'expired',
          updatedAt: new Date(),
        })
        .where(eq(companyInvitations.id, invitation.id));

      return NextResponse.json(
        { message: 'Invitation has expired' },
        { status: 400 }
      );
    }

    // Get company details
    const [company] = await db
      .select({
        name: companies.name,
      })
      .from(companies)
      .where(eq(companies.id, invitation.companyId));

    if (!company) {
      return NextResponse.json(
        { message: 'Company not found' },
        { status: 404 }
      );
    }

    // Return invitation details for the acceptance form
    return NextResponse.json({
      email: invitation.email,
      name: invitation.name || '',
      role: invitation.role,
      companyName: company.name,
      isValid: true,
    });
  } catch (error) {
    console.error('Error verifying invitation:', error);
    return NextResponse.json(
      { message: 'Failed to verify invitation' },
      { status: 500 }
    );
  }
} 