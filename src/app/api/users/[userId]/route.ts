import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// DELETE /api/users/[userId] - Delete (soft) a user
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check authentication and permissions
    if (!session?.user || !session.user.companyId || 
        !session.user.permissions?.['users.delete']) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { userId } = await params;
    const companyId = parseInt(session.user.companyId);
    
    if (isNaN(parseInt(userId))) {
      return NextResponse.json(
        { message: 'Invalid user ID' },
        { status: 400 }
      );
    }
    
    // Prevent users from deleting themselves
    if (parseInt(session.user.id) === parseInt(userId)) {
      return NextResponse.json(
        { message: 'You cannot delete your own account' },
        { status: 400 }
      );
    }
    
    // Soft delete the user by setting softDelete flag
    const result = await db
      .update(users)
      .set({
        softDelete: true,
        updatedAt: new Date().toISOString(),
      })
      .where(
        and(
          eq(users.id, parseInt(userId)),
          eq(users.companyId, companyId),
          eq(users.softDelete, false)
        )
      )
      .returning({ id: users.id });
    
    if (!result.length) {
      return NextResponse.json(
        { message: 'User not found or already deleted' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ 
      message: 'User deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { message: 'Failed to delete user' },
      { status: 500 }
    );
  }
} 