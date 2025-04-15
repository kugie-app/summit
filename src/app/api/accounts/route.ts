import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { db } from '@/lib/db';
import { accounts } from '@/lib/db/schema';
import { and, eq, like, desc, count, sql } from 'drizzle-orm';
import { accountSchema, accountQuerySchema } from '@/lib/validations/account';

// GET /api/accounts - List all accounts
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !session.user.companyId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryValidation = accountQuerySchema.safeParse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      type: searchParams.get('type'),
      search: searchParams.get('search'),
    });
    
    if (!queryValidation.success) {
      return NextResponse.json(
        { message: 'Invalid query parameters', errors: queryValidation.error.format() },
        { status: 400 }
      );
    }
    
    const { page, limit, type, search } = queryValidation.data;
    const offset = (page - 1) * limit;
    const companyId = parseInt(session.user.companyId);
    
    // Build query conditions
    let conditions = and(
      eq(accounts.companyId, companyId),
      eq(accounts.softDelete, false)
    );
    
    // Add type filter if provided and not 'all'
    if (type && type !== 'all') {
      conditions = and(conditions, eq(accounts.type, type));
    }
    
    // Add search filter if provided
    if (search) {
      conditions = and(
        conditions,
        like(accounts.name, `%${search}%`)
      );
    }
    
    // Count total matching accounts
    const [{ value: total }] = await db
      .select({ value: count() })
      .from(accounts)
      .where(conditions);
    
    // Retrieve accounts with pagination
    const accountsList = await db
      .select()
      .from(accounts)
      .where(conditions)
      .orderBy(desc(accounts.createdAt))
      .limit(limit)
      .offset(offset);
    
    return NextResponse.json({
      data: accountsList,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
    
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return NextResponse.json(
      { message: 'Failed to fetch accounts' },
      { status: 500 }
    );
  }
}

// POST /api/accounts - Create a new account
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !session.user.companyId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse and validate request body
    const body = await request.json();
    const validation = accountSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { message: 'Validation failed', errors: validation.error.format() },
        { status: 400 }
      );
    }
    
    const { name, type, currency, accountNumber, initialBalance } = validation.data;
    const companyId = parseInt(session.user.companyId);
    
    // Create new account
    const [newAccount] = await db
      .insert(accounts)
      .values({
        companyId,
        name,
        type,
        currency,
        accountNumber: accountNumber || null,
        initialBalance: initialBalance.toString(),
        currentBalance: initialBalance.toString(), // Initially set to the same as initialBalance
        createdAt: new Date(),
        updatedAt: new Date(),
        softDelete: false,
      })
      .returning();
    
    return NextResponse.json(newAccount, { status: 201 });
    
  } catch (error) {
    console.error('Error creating account:', error);
    return NextResponse.json(
      { message: 'Failed to create account' },
      { status: 500 }
    );
  }
} 