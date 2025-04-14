import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/lib/db';
import { expenses, expenseCategories } from '@/lib/db/schema';
import { and, eq, desc, asc, like, or, count, sql } from 'drizzle-orm';
import { authOptions } from '@/lib/auth/options';
import { expenseSchema } from '@/lib/validations/expense';
import { format } from 'date-fns';

// Schema for expense creation in API
const createExpenseSchema = expenseSchema;

// GET /api/expenses - List all expenses with pagination, sorting, and filtering
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !session.user.companyId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortBy = searchParams.get('sortBy') || 'expenseDate';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search') || '';
    
    const companyId = parseInt(session.user.companyId);
    const offset = (page - 1) * limit;
    
    // Build the base conditions
    let conditions = and(
      eq(expenses.companyId, companyId),
      eq(expenses.softDelete, false)
    );
    
    // Add status filter if provided
    if (status && status !== 'all') {
      if (['pending', 'approved', 'rejected'].includes(status)) {
        conditions = and(
          conditions,
          eq(expenses.status, status as 'pending' | 'approved' | 'rejected')
        );
      }
    }
    
    // Add category filter if provided
    if (category && category !== 'all') {
      const categoryId = parseInt(category);
      if (!isNaN(categoryId)) {
        conditions = and(
          conditions,
          eq(expenses.categoryId, categoryId)
        );
      }
    }
    
    // Add date range filters if provided
    if (startDate) {
      conditions = and(
        conditions,
        sql`${expenses.expenseDate} >= ${startDate}`
      );
    }
    
    if (endDate) {
      conditions = and(
        conditions,
        sql`${expenses.expenseDate} <= ${endDate}`
      );
    }
    
    // Add search filter
    if (search) {
      conditions = and(
        conditions,
        or(
          like(expenses.vendor, `%${search}%`),
          like(expenses.description, `%${search}%`)
        )
      );
    }
    
    // Count total records for pagination
    const totalCountResult = await db
      .select({ count: count() })
      .from(expenses)
      .leftJoin(expenseCategories, eq(expenses.categoryId, expenseCategories.id))
      .where(conditions);
    
    const totalCount = Number(totalCountResult[0]?.count || 0);
    
    // Execute the query with sorting, limit and offset
    const expenseResults = await db
      .select({
        expense: expenses,
        category: {
          id: expenseCategories.id,
          name: expenseCategories.name,
        },
      })
      .from(expenses)
      .leftJoin(expenseCategories, eq(expenses.categoryId, expenseCategories.id))
      .where(conditions)
      .orderBy(
        sortOrder === 'asc'
          ? asc(expenses[sortBy as keyof typeof expenses] as any)
          : desc(expenses[sortBy as keyof typeof expenses] as any)
      )
      .limit(limit)
      .offset(offset);
    
    if (expenseResults.length === 0) {
      return NextResponse.json({
        data: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      });
    }
    
    // Format expense results
    const formattedExpenses = expenseResults.map(result => ({
      ...result.expense,
      category: result.category && result.category.id ? result.category : null,
    }));
    
    return NextResponse.json({
      data: formattedExpenses,
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    });
    
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json(
      { message: 'Failed to fetch expenses' },
      { status: 500 }
    );
  }
}

// POST /api/expenses - Create a new expense
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !session.user.companyId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    
    // Validate and parse the request body
    const bodyValidation = createExpenseSchema.safeParse(body);
    
    if (!bodyValidation.success) {
      return NextResponse.json(
        { message: 'Validation failed', errors: bodyValidation.error.format() },
        { status: 400 }
      );
    }
    
    const {
      categoryId,
      vendor,
      description,
      amount,
      currency,
      expenseDate,
      receiptUrl,
      status,
      recurring,
      nextDueDate,
    } = bodyValidation.data;
    
    const companyId = parseInt(session.user.companyId);
    
    // Check if category exists and belongs to the company
    if (categoryId) {
      const existingCategory = await db
        .select()
        .from(expenseCategories)
        .where(
          and(
            eq(expenseCategories.id, categoryId),
            eq(expenseCategories.companyId, companyId),
            eq(expenseCategories.softDelete, false)
          )
        )
        .limit(1);
      
      if (existingCategory.length === 0) {
        return NextResponse.json(
          { message: 'Category not found or does not belong to your company' },
          { status: 404 }
        );
      }
    }
    
    // Insert the new expense
    const [newExpense] = await db
      .insert(expenses)
      .values({
        companyId,
        categoryId: categoryId || null,
        vendor,
        description: description || null,
        amount: amount.toString(),
        currency,
        expenseDate: format(expenseDate, 'yyyy-MM-dd'),
        receiptUrl: receiptUrl || null,
        status,
        recurring,
        nextDueDate: nextDueDate ? format(nextDueDate, 'yyyy-MM-dd') : null,
        createdAt: new Date(),
        updatedAt: new Date(),
        softDelete: false,
      })
      .returning();
    
    // Get category for response
    let category = null;
    if (newExpense.categoryId) {
      const categoryResult = await db
        .select()
        .from(expenseCategories)
        .where(eq(expenseCategories.id, newExpense.categoryId))
        .limit(1);
      
      if (categoryResult.length > 0) {
        category = {
          id: categoryResult[0].id,
          name: categoryResult[0].name,
        };
      }
    }
    
    return NextResponse.json({
      ...newExpense,
      category,
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating expense:', error);
    
    if (error instanceof Error) {
      if (error.name === 'ZodError') {
        return NextResponse.json(
          { message: 'Validation error', errors: (error as any).errors },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { message: error.message || 'Internal server error' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 