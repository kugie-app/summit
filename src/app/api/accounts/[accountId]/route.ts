import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { db } from '@/lib/db';
import { accounts, transactions } from '@/lib/db/schema';
import { and, eq, desc } from 'drizzle-orm';
import { accountSchema, accountParamsSchema } from '@/lib/validations/account';

// GET /api/accounts/[accountId] - Get a specific account
export async function GET(
  request: NextRequest,
  { params }: { params: { accountId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !session.user.companyId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    // Validate account ID
    const paramValidation = accountParamsSchema.safeParse({ accountId: params.accountId });
    
    if (!paramValidation.success) {
      return NextResponse.json(
        { message: 'Invalid account ID', errors: paramValidation.error.format() },
        { status: 400 }
      );
    }
    
    const accountId = parseInt(params.accountId);
    const companyId = parseInt(session.user.companyId);
    
    // Fetch the account
    const account = await db
      .select()
      .from(accounts)
      .where(
        and(
          eq(accounts.id, accountId),
          eq(accounts.companyId, companyId),
          eq(accounts.softDelete, false)
        )
      )
      .limit(1);
    
    if (!account.length) {
      return NextResponse.json({ message: 'Account not found' }, { status: 404 });
    }
    
    // Get recent transactions for the account
    const recentTransactions = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.accountId, accountId),
          eq(transactions.softDelete, false)
        )
      )
      .orderBy(desc(transactions.transactionDate))
      .limit(5);
    
    return NextResponse.json({
      ...account[0],
      recentTransactions: recentTransactions,
    });
    
  } catch (error) {
    console.error('Error fetching account:', error);
    return NextResponse.json(
      { message: 'Failed to fetch account' },
      { status: 500 }
    );
  }
}

// PUT /api/accounts/[accountId] - Update an account
export async function PUT(
  request: NextRequest,
  { params }: { params: { accountId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !session.user.companyId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    // Validate account ID
    const paramValidation = accountParamsSchema.safeParse({ accountId: params.accountId });
    
    if (!paramValidation.success) {
      return NextResponse.json(
        { message: 'Invalid account ID', errors: paramValidation.error.format() },
        { status: 400 }
      );
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
    
    const accountId = parseInt(params.accountId);
    const companyId = parseInt(session.user.companyId);
    
    // Check if account exists and belongs to the company
    const existingAccount = await db
      .select()
      .from(accounts)
      .where(
        and(
          eq(accounts.id, accountId),
          eq(accounts.companyId, companyId),
          eq(accounts.softDelete, false)
        )
      )
      .limit(1);
    
    if (!existingAccount.length) {
      return NextResponse.json({ message: 'Account not found' }, { status: 404 });
    }
    
    const { name, type, currency, accountNumber } = validation.data;
    
    // Update account (don't update initialBalance or currentBalance through this endpoint)
    const [updatedAccount] = await db
      .update(accounts)
      .set({
        name,
        type,
        currency,
        accountNumber: accountNumber || null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(accounts.id, accountId),
          eq(accounts.companyId, companyId)
        )
      )
      .returning();
    
    return NextResponse.json(updatedAccount);
    
  } catch (error) {
    console.error('Error updating account:', error);
    return NextResponse.json(
      { message: 'Failed to update account' },
      { status: 500 }
    );
  }
}

// DELETE /api/accounts/[accountId] - Soft delete an account
export async function DELETE(
  request: NextRequest,
  { params }: { params: { accountId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !session.user.companyId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    // Validate account ID
    const paramValidation = accountParamsSchema.safeParse({ accountId: params.accountId });
    
    if (!paramValidation.success) {
      return NextResponse.json(
        { message: 'Invalid account ID', errors: paramValidation.error.format() },
        { status: 400 }
      );
    }
    
    const accountId = parseInt(params.accountId);
    const companyId = parseInt(session.user.companyId);
    
    // Check if account exists and belongs to the company
    const existingAccount = await db
      .select()
      .from(accounts)
      .where(
        and(
          eq(accounts.id, accountId),
          eq(accounts.companyId, companyId),
          eq(accounts.softDelete, false)
        )
      )
      .limit(1);
    
    if (!existingAccount.length) {
      return NextResponse.json({ message: 'Account not found' }, { status: 404 });
    }
    
    // Check if account has any active transactions
    const transactionCount = await db
      .select({ count: transactions.id })
      .from(transactions)
      .where(
        and(
          eq(transactions.accountId, accountId),
          eq(transactions.softDelete, false)
        )
      )
      .limit(1);
    
    if (transactionCount.length > 0) {
      return NextResponse.json(
        { message: 'Cannot delete account with active transactions. Archive transactions first.' },
        { status: 400 }
      );
    }
    
    // Soft delete the account
    await db
      .update(accounts)
      .set({
        softDelete: true,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(accounts.id, accountId),
          eq(accounts.companyId, companyId)
        )
      );
    
    return NextResponse.json({ message: 'Account deleted successfully' });
    
  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json(
      { message: 'Failed to delete account' },
      { status: 500 }
    );
  }
} 