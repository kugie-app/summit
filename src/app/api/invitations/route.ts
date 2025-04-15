import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { hash } from 'bcrypt';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { db } from '@/lib/db';
import { companyInvitations, users, companies } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { Resend } from 'resend';
import { Role } from '@/lib/auth/permissions/roles';
import { InvitationEmail } from '@/emails/InvitationEmail';

const resend = new Resend(process.env.RESEND_API_KEY);

// Validation schema for the invitation request
const inviteSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  role: z.enum(['admin', 'accountant', 'staff']),
  name: z.string().optional(),
});

// GET /api/invitations - Get all pending invitations for the company
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    // Check authentication and permissions
    if (!session?.user || !session.user.companyId || 
        !session.user.permissions?.['users.invite']) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const companyId = parseInt(session.user.companyId);
    
    // Get all pending invitations for the company
    const invitations = await db
      .select({
        id: companyInvitations.id,
        email: companyInvitations.email,
        name: companyInvitations.name,
        role: companyInvitations.role,
        status: companyInvitations.status,
        createdAt: companyInvitations.createdAt,
        expires: companyInvitations.expires,
      })
      .from(companyInvitations)
      .where(
        and(
          eq(companyInvitations.companyId, companyId),
          eq(companyInvitations.status, 'pending')
        )
      )
      .orderBy(companyInvitations.createdAt);
    
    return NextResponse.json(invitations);
  } catch (error) {
    console.error('Error fetching invitations:', error);
    return NextResponse.json(
      { message: 'Failed to fetch invitations' },
      { status: 500 }
    );
  }
}

// POST /api/invitations - Create a new team member invitation
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check authentication and permissions
    if (!session?.user || !session.user.companyId || 
        !session.user.permissions?.['users.invite']) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const companyId = parseInt(session.user.companyId);
    
    // Parse and validate request body
    const body = await request.json();
    const { email, role, name } = inviteSchema.parse(body);
    
    // Check if user already exists in the company
    const existingUser = await db
      .select({ id: users.id })
      .from(users)
      .where(
        and(
          eq(users.email, email),
          eq(users.companyId, companyId),
          eq(users.softDelete, false)
        )
      );
    
    if (existingUser.length > 0) {
      return NextResponse.json(
        { message: 'A user with this email already exists in your company' },
        { status: 409 }
      );
    }
    
    // Check if there's a pending invitation for this email
    const existingInvitation = await db
      .select({ id: companyInvitations.id })
      .from(companyInvitations)
      .where(
        and(
          eq(companyInvitations.email, email),
          eq(companyInvitations.companyId, companyId),
          eq(companyInvitations.status, 'pending')
        )
      );
    
    if (existingInvitation.length > 0) {
      return NextResponse.json(
        { message: 'An invitation has already been sent to this email' },
        { status: 409 }
      );
    }
    
    // Generate invitation token and expiration date (48 hours from now)
    const token = uuidv4();
    const expires = new Date();
    expires.setHours(expires.getHours() + 48);
    
    // Create invitation record
    const [invitation] = await db
      .insert(companyInvitations)
      .values({
        companyId,
        email,
        name: name || null,
        role: role as Role,
        token,
        status: 'pending',
        expires,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    
    if (!invitation) {
      throw new Error('Failed to create invitation');
    }
    
    // Get company information
    const [company] = await db
      .select({ name: companies.name })
      .from(companies)
      .where(eq(companies.id, companyId));
    
    // Send invitation email
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const acceptUrl = `${baseUrl}/accept-invitation?token=${token}`;

    const fromEmail = `${company?.name || 'Kugie Summit'} <${process.env.RESEND_FROM_EMAIL || 'summit@kugie.app'}>`;
    const toEmail = email;

    console.log(fromEmail, toEmail);
    
    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: `Kugie Summit <${process.env.RESEND_FROM_EMAIL || 'summit@kugie.app'}>`,
      to: email,
      subject: `You've been invited to join ${company?.name || 'Kugie Summit'}`,
      react: InvitationEmail({
        inviterName: session.user.name || 'Team Admin',
        companyName: company?.name || 'Kugie Summit',
        recipientName: name || undefined,
        role,
        acceptUrl,
      }),
    });

    if (error) {
      console.error('Error sending invitation email:', error);
      // We still created the invitation, so we'll return success but log the email error
    }
    
    return NextResponse.json({
      message: 'Invitation sent successfully',
      id: invitation.id,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating invitation:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Validation error', errors: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { message: 'Failed to create invitation' },
      { status: 500 }
    );
  }
} 