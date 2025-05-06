import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { hash } from 'bcrypt';
import { db } from '@/lib/db';
import { companyInvitations, users, companies } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUserPermissions } from '@/lib/auth/permissions/utils';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Validation schema for the accept invitation request
const acceptSchema = z.object({
  token: z.string(),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// POST /api/invitations/accept - Accept an invitation and create a user account
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const { token, name, password } = acceptSchema.parse(body);
    
    // Find the invitation by token
    const [invitation] = await db
      .select({
        id: companyInvitations.id,
        email: companyInvitations.email,
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
        id: companies.id,
        name: companies.name 
      })
      .from(companies)
      .where(eq(companies.id, invitation.companyId));
    
    // Check if user already exists
    const existingUser = await db
      .select({ id: users.id, softDelete: users.softDelete })
      .from(users)
      .where(eq(users.email, invitation.email));
    
    // Hash the password
    const hashedPassword = await hash(password, 10);
    
    let userId;
    
    if (existingUser.length > 0) {
      // If the user exists but is soft deleted, reactivate it
      if (existingUser[0].softDelete) {
        const [updatedUser] = await db
          .update(users)
          .set({
            name,
            password: hashedPassword,
            role: invitation.role,
            companyId: invitation.companyId,
            softDelete: false,
            updatedAt: new Date(),
          })
          .where(eq(users.id, existingUser[0].id))
          .returning({ id: users.id });
        
        userId = updatedUser.id;
      } else {
        return NextResponse.json(
          { message: 'A user with this email already exists' },
          { status: 409 }
        );
      }
    } else {
      // Create a new user
      const [newUser] = await db
        .insert(users)
        .values({
          name,
          email: invitation.email,
          password: hashedPassword,
          role: invitation.role,
          companyId: invitation.companyId,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning({ id: users.id });
      
      userId = newUser.id;
    }
    
    // Update invitation status to accepted
    await db
      .update(companyInvitations)
      .set({
        status: 'accepted',
        updatedAt: new Date(),
        usedAt: new Date(),
      })
      .where(eq(companyInvitations.id, invitation.id));
    
    // Generate the permissions for the user's role (for the response)
    const permissions = getUserPermissions(invitation.role);
    
    // Get the base URL for the app
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://summitfinance.app';
    
    // Send welcome email
    const { error } = await resend.emails.send({
      from: `${process.env.RESEND_FROM_NAME} <${process.env.RESEND_FROM_EMAIL || 'kugie@summitfinance.app'}>`,
      to: invitation.email,
      subject: `Welcome to ${company?.name || 'Our Company'}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to ${company?.name || 'Our Company'}!</h2>
          <p>Hello ${name},</p>
          <p>Your account has been successfully created. You can now sign in to access your dashboard.</p>
          <p><a href="${baseUrl}/auth/signin" style="background-color: #5469d4; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px; display: inline-block; margin: 10px 0;">Sign In Now</a></p>
          <p>If you have any questions, please don't hesitate to reach out to your team administrator.</p>
          <p>Best regards,<br>${company?.name || 'Our Company'} Team</p>
        </div>
      `,
    });
    
    if (error) {
      console.error('Error sending welcome email:', error);
      // We still created the account, so we'll return success but log the email error
    }
    
    return NextResponse.json({
      message: 'Account created successfully',
      user: {
        id: userId,
        email: invitation.email,
        name,
        role: invitation.role,
        permissions,
      },
    });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Validation error', errors: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { message: 'Failed to accept invitation' },
      { status: 500 }
    );
  }
} 