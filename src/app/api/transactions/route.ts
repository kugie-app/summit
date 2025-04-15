import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { db } from '@/lib/db';
import { transactions, accounts, expenses, income, invoices } from '@/lib/db/schema';
import { and, eq, like, desc, asc, between, count, sql, not, isNull } from 'drizzle-orm';
import { transactionSchema, transactionQuerySchema } from '@/lib/validations/transaction';
import { format } from 'date-fns';

// GET /api/transactions - List all transactions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !session.user.companyId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const queryValidation = transactionQuerySchema.safeParse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
      type: searchParams.get('type'),
      startDate: searchParams.get('startDate'),
      endDate: searchParams.get('endDate'),
      reconciled: searchParams.get('reconciled'),
      search: searchParams.get('search'),
    });
    
    if (!queryValidation.success) {
      return NextResponse.json(
        { message: 'Invalid query parameters', errors: queryValidation.error.format() },
        { status: 400 }
      );
    }
    
    const { page, limit, type, startDate, endDate, reconciled, search } = queryValidation.data;
    const offset = (page - 1) * limit;
    const companyId = parseInt(session.user.companyId);
    
    // Build query conditions
    let conditions = and(
      eq(transactions.companyId, companyId),
      eq(transactions.softDelete, false)
    );
    
    // Add type filter if provided and not 'all'
    if (type && type !== 'all') {
      conditions = and(conditions, eq(transactions.type, type));
    }
    
    // Add date range filters if provided
    if (startDate && endDate) {
      conditions = and(
        conditions,
        between(transactions.transactionDate, startDate, endDate)
      );
    } else if (startDate) {
      conditions = and(
        conditions,
        sql`${transactions.transactionDate} >= ${startDate}`
      );
    } else if (endDate) {
      conditions = and(
        conditions,
        sql`${transactions.transactionDate} <= ${endDate}`
      );
    }
    
    // Add reconciled filter if provided
    if (reconciled && reconciled !== 'all') {
      conditions = and(
        conditions,
        eq(transactions.reconciled, reconciled === 'true')
      );
    }
    
    // Add search filter if provided
    if (search) {
      conditions = and(
        conditions,
        like(transactions.description, `%${search}%`)
      );
    }
    
    // Count total matching transactions
    const [{ value: total }] = await db
      .select({ value: count() })
      .from(transactions)
      .where(conditions);
    
    // Get account ID if filter exists
    const accountId = searchParams.get('accountId');
    if (accountId && !isNaN(parseInt(accountId))) {
      conditions = and(
        conditions,
        eq(transactions.accountId, parseInt(accountId))
      );
    }
    
    // Retrieve transactions with related accounts
    const transactionResults = await db
      .select({
        transaction: transactions,
        account: accounts,
      })
      .from(transactions)
      .leftJoin(accounts, eq(transactions.accountId, accounts.id))
      .where(conditions)
      .orderBy(desc(transactions.transactionDate))
      .limit(limit)
      .offset(offset);
    
    // Format the response
    const formattedTransactions = await Promise.all(
      transactionResults.map(async (result) => {
        const { transaction, account } = result;
        
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
        
        return {
          ...transaction,
          account: account ? { id: account.id, name: account.name, type: account.type } : null,
          relatedEntity,
        };
      })
    );
    
    return NextResponse.json({
      data: formattedTransactions,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
    
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { message: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}

// POST /api/transactions - Create a new transaction
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !session.user.companyId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
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
    
    const companyId = parseInt(session.user.companyId);
    
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
    const [newTransaction, updatedAccount] = await db.transaction(async (tx) => {
      // Create the transaction
      const [transaction] = await tx
        .insert(transactions)
        .values({
          companyId,
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
          createdAt: new Date(),
          updatedAt: new Date(),
          softDelete: false,
        })
        .returning();
      
      // Update account balance based on transaction type
      const currentBalance = parseFloat(account[0].currentBalance);
      let newBalance = currentBalance;
      
      if (type === 'credit') {
        newBalance += amount;
      } else if (type === 'debit') {
        newBalance -= amount;
      }
      
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
      ...newTransaction,
      account: {
        id: updatedAccount.id,
        name: updatedAccount.name,
        type: updatedAccount.type,
        currentBalance: updatedAccount.currentBalance,
      },
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating transaction:', error);
    return NextResponse.json(
      { message: 'Failed to create transaction' },
      { status: 500 }
    );
  }
} 