import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// GET /api/users - Get all users in the company
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    // Check authentication and permissions
    if (!session?.user || !session.user.companyId || 
        !session.user.permissions?.['users.view']) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const companyId = parseInt(session.user.companyId);
    
    // Get all active users for the company
    const companyUsers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(
        and(
          eq(users.companyId, companyId),
          eq(users.softDelete, false)
        )
      )
      .orderBy(users.createdAt);
    
    return NextResponse.json(companyUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { message: 'Failed to fetch users' },
      { status: 500 }
    );
  }
} 