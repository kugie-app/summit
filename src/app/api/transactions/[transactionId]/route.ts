import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { db } from '@/lib/db';
import { transactions, accounts, expenses, income, invoices } from '@/lib/db/schema';
import { and, eq, like, desc, asc, between, count, sql, not, isNull } from 'drizzle-orm';
import { transactionSchema, transactionParamsSchema } from '@/lib/validations/transaction';
import { format } from 'date-fns';

// GET /api/transactions/[transactionId] - Get transaction details
export async function GET(
  request: NextRequest,
  { params }: { params: { transactionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !session.user.companyId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    // Validate transaction ID
    const paramsValidation = transactionParamsSchema.safeParse({
      transactionId: params.transactionId,
    });
    
    if (!paramsValidation.success) {
      return NextResponse.json(
        { message: 'Invalid transaction ID', errors: paramsValidation.error.format() },
        { status: 400 }
      );
    }
    
    const { transactionId } = paramsValidation.data;
    const companyId = parseInt(session.user.companyId);
    
    // Fetch transaction with account details
    const transactionResults = await db
      .select({
        transaction: transactions,
        account: accounts,
      })
      .from(transactions)
      .leftJoin(accounts, eq(transactions.accountId, accounts.id))
      .where(
        and(
          eq(transactions.id, parseInt(transactionId)),
          eq(transactions.companyId, companyId),
          eq(transactions.softDelete, false)
        )
      )
      .limit(1);
    
    if (!transactionResults.length) {
      return NextResponse.json({ message: 'Transaction not found' }, { status: 404 });
    }
    
    const { transaction, account } = transactionResults[0];
    
    // Fetch related entity details based on which relatedId is present
    let relatedEntity = null;
    if (transaction.relatedInvoiceId) {
      const [invoice] = await db
        .select()
        .from(invoices)
        .where(eq(invoices.id, transaction.relatedInvoiceId));
      
      if (invoice) {
        relatedEntity = {
          type: 'invoice',
          data: invoice,
        };
      }
    } else if (transaction.relatedExpenseId) {
      const [expense] = await db
        .select()
        .from(expenses)
        .where(eq(expenses.id, transaction.relatedExpenseId));
      
      if (expense) {
        relatedEntity = {
          type: 'expense',
          data: expense,
        };
      }
    } else if (transaction.relatedIncomeId) {
      const [incomeItem] = await db
        .select()
        .from(income)
        .where(eq(income.id, transaction.relatedIncomeId));
      
      if (incomeItem) {
        relatedEntity = {
          type: 'income',
          data: incomeItem,
        };
      }
    }
    
    return NextResponse.json({
      ...transaction,
      account: account ? {
        id: account.id,
        name: account.name,
        type: account.type,
        currentBalance: account.currentBalance,
      } : null,
      relatedEntity,
    });
    
  } catch (error) {
    console.error('Error fetching transaction:', error);
    return NextResponse.json(
      { message: 'Failed to fetch transaction' },
      { status: 500 }
    );
  }
}

// PUT /api/transactions/[transactionId] - Update transaction
export async function PUT(
  request: NextRequest,
  { params }: { params: { transactionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !session.user.companyId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    // Validate transaction ID
    const paramsValidation = transactionParamsSchema.safeParse({
      transactionId: params.transactionId,
    });
    
    if (!paramsValidation.success) {
      return NextResponse.json(
        { message: 'Invalid transaction ID', errors: paramsValidation.error.format() },
        { status: 400 }
      );
    }
    
    // Parse and validate request body
    const body = await request.json();
    const validation = transactionSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { message: 'Validation failed', errors: validation.error.format() },
        { status: 400 }
      );
    }
    
    const { transactionId } = paramsValidation.data;
    const companyId = parseInt(session.user.companyId);
    
    const {
      accountId,
      type,
      description,
      amount,
      currency,
      transactionDate,
      categoryId,
      relatedInvoiceId,
      relatedExpenseId,
      relatedIncomeId,
      reconciled,
    } = validation.data;
    
    // Check if transaction exists and belongs to company
    const existingTransaction = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.id, parseInt(transactionId)),
          eq(transactions.companyId, companyId),
          eq(transactions.softDelete, false)
        )
      )
      .limit(1);
    
    if (!existingTransaction.length) {
      return NextResponse.json({ message: 'Transaction not found' }, { status: 404 });
    }
    
    // Verify account belongs to company
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
    
    // Start a transaction to ensure database consistency
    const [updatedTransaction, updatedAccount] = await db.transaction(async (tx) => {
      // Reverse the effect of the original transaction on the account balance
      let originalBalance = parseFloat(account[0].currentBalance);
      const originalAmount = parseFloat(existingTransaction[0].amount);
      const originalType = existingTransaction[0].type;
      
      if (originalType === 'credit') {
        originalBalance -= originalAmount;
      } else if (originalType === 'debit') {
        originalBalance += originalAmount;
      }
      
      // Apply the new transaction to the account balance
      let newBalance = originalBalance;
      if (type === 'credit') {
        newBalance += amount;
      } else if (type === 'debit') {
        newBalance -= amount;
      }
      
      // Update the transaction
      const [transaction] = await tx
        .update(transactions)
        .set({
          accountId,
          type,
          description,
          amount: amount.toString(),
          currency,
          transactionDate: format(transactionDate, 'yyyy-MM-dd'),
          categoryId: categoryId || null,
          relatedInvoiceId: relatedInvoiceId || null,
          relatedExpenseId: relatedExpenseId || null,
          relatedIncomeId: relatedIncomeId || null,
          reconciled: !!reconciled,
          updatedAt: new Date(),
        })
        .where(eq(transactions.id, parseInt(transactionId)))
        .returning();
      
      // Update the account balance
      const [updatedAcc] = await tx
        .update(accounts)
        .set({
          currentBalance: newBalance.toString(),
          updatedAt: new Date(),
        })
        .where(eq(accounts.id, accountId))
        .returning();
      
      return [transaction, updatedAcc];
    });
    
    return NextResponse.json({
      ...updatedTransaction,
      account: {
        id: updatedAccount.id,
        name: updatedAccount.name,
        type: updatedAccount.type,
        currentBalance: updatedAccount.currentBalance,
      },
    });
    
  } catch (error) {
    console.error('Error updating transaction:', error);
    return NextResponse.json(
      { message: 'Failed to update transaction' },
      { status: 500 }
    );
  }
}

// DELETE /api/transactions/[transactionId] - Delete transaction
export async function DELETE(
  request: NextRequest,
  { params }: { params: { transactionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !session.user.companyId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    // Validate transaction ID
    const paramsValidation = transactionParamsSchema.safeParse({
      transactionId: params.transactionId,
    });
    
    if (!paramsValidation.success) {
      return NextResponse.json(
        { message: 'Invalid transaction ID', errors: paramsValidation.error.format() },
        { status: 400 }
      );
    }
    
    const { transactionId } = paramsValidation.data;
    const companyId = parseInt(session.user.companyId);
    
    // Check if transaction exists and belongs to company
    const existingTransaction = await db
      .select()
      .from(transactions)
      .leftJoin(accounts, eq(transactions.accountId, accounts.id))
      .where(
        and(
          eq(transactions.id, parseInt(transactionId)),
          eq(transactions.companyId, companyId),
          eq(transactions.softDelete, false)
        )
      )
      .limit(1);
    
    if (!existingTransaction.length) {
      return NextResponse.json({ message: 'Transaction not found' }, { status: 404 });
    }
    
    const transaction = existingTransaction[0].transactions;
    const account = existingTransaction[0].accounts;
    
    if (!account) {
      return NextResponse.json({ message: 'Associated account not found' }, { status: 404 });
    }
    
    // Start a transaction to ensure database consistency
    await db.transaction(async (tx) => {
      // Reverse the effect of the transaction on the account balance
      let currentBalance = parseFloat(account.currentBalance);
      const transactionAmount = parseFloat(transaction.amount);
      
      if (transaction.type === 'credit') {
        currentBalance -= transactionAmount;
      } else if (transaction.type === 'debit') {
        currentBalance += transactionAmount;
      }
      
      // Soft delete the transaction
      await tx
        .update(transactions)
        .set({
          softDelete: true,
          updatedAt: new Date(),
        })
        .where(eq(transactions.id, parseInt(transactionId)));
      
      // Update the account balance
      await tx
        .update(accounts)
        .set({
          currentBalance: currentBalance.toString(),
          updatedAt: new Date(),
        })
        .where(eq(accounts.id, account.id));
    });
    
    return NextResponse.json({ message: 'Transaction deleted successfully' });
    
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return NextResponse.json(
      { message: 'Failed to delete transaction' },
      { status: 500 }
    );
  }
} 