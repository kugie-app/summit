import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { db } from '@/lib/db';
import { companyInvitations, companies } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// DELETE /api/invitations/[invitationId] - Cancel an invitation
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ invitationId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { invitationId } = await params;
    // Check authentication and permissions
    if (!session?.user || !session.user.companyId || 
        !session.user.permissions?.['users.invite']) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const companyId = parseInt(session.user.companyId);
    
    if (isNaN(parseInt(invitationId))) {
      return NextResponse.json(
        { message: 'Invalid invitation ID' },
        { status: 400 }
      );
    }
    
    // Get invitation details before updating
    const [invitation] = await db
      .select({
        id: companyInvitations.id,
        email: companyInvitations.email,
        name: companyInvitations.name,
      })
      .from(companyInvitations)
      .where(
        and(
          eq(companyInvitations.id, parseInt(invitationId)),
          eq(companyInvitations.companyId, companyId),
          eq(companyInvitations.status, 'pending')
        )
      );
    
    if (!invitation) {
      return NextResponse.json(
        { message: 'Invitation not found or already used/cancelled' },
        { status: 404 }
      );
    }
    
    // Update invitation status to cancelled
    await db
      .update(companyInvitations)
      .set({
        status: 'cancelled',
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(companyInvitations.id, parseInt(invitationId)),
          eq(companyInvitations.companyId, companyId),
          eq(companyInvitations.status, 'pending')
        )
      );
    
    // Get company information
    const [company] = await db
      .select({ name: companies.name })
      .from(companies)
      .where(eq(companies.id, companyId));
    
    // Send cancellation email
    const { error } = await resend.emails.send({
      from: `${process.env.RESEND_FROM_NAME} <${process.env.RESEND_FROM_EMAIL || 'kugie@summitfinance.app'}>`,
      to: invitation.email,
      subject: `Invitation to ${company?.name || 'Our Company'} cancelled`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Invitation Cancelled</h2>
          <p>Hello ${invitation.name || 'there'},</p>
          <p>This is to inform you that your invitation to join ${company?.name || 'Our Company'} has been cancelled.</p>
          <p>If you believe this was done in error, please contact the person who sent you the invitation.</p>
          <p>Thank you for your understanding.</p>
          <p>Best regards,<br>${company?.name || 'Our Company'} Team</p>
        </div>
      `,
    });
    
    if (error) {
      console.error('Error sending cancellation email:', error);
      // We still cancelled the invitation, so we'll return success but log the email error
    }
    
    return NextResponse.json({ 
      message: 'Invitation cancelled successfully' 
    });
  } catch (error) {
    console.error('Error cancelling invitation:', error);
    return NextResponse.json(
      { message: 'Failed to cancel invitation' },
      { status: 500 }
    );
  }
} 