import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/lib/db';
import { expenses, expenseCategories, vendors } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { authOptions } from '@/lib/auth/options';
import { expenseSchema, expenseParamsSchema } from '@/lib/validations/expense';
import { format } from 'date-fns';

// GET /api/expenses/[expenseId] - Get a specific expense
export async function GET(
  request: NextRequest, 
  { params }: { params: Promise<{ expenseId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !session.user.companyId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    // Validate and parse the expense ID
    const { expenseId } = await params;
    const validationResult = expenseParamsSchema.safeParse({ expenseId });
    
    if (!validationResult.success) {
      return NextResponse.json(
        { message: 'Invalid expense ID' },
        { status: 400 }
      );
    }
    
    const companyId = parseInt(session.user.companyId);
    const id = parseInt(expenseId);
    
    // Get the expense with its category
    const expenseResult = await db
      .select({
        expense: expenses,
        category: {
          id: expenseCategories.id,
          name: expenseCategories.name,
        },
      })
      .from(expenses)
      .leftJoin(expenseCategories, eq(expenses.categoryId, expenseCategories.id))
      .where(
        and(
          eq(expenses.id, id),
          eq(expenses.companyId, companyId),
          eq(expenses.softDelete, false)
        )
      )
      .limit(1);
    
    if (expenseResult.length === 0) {
      return NextResponse.json(
        { message: 'Expense not found' },
        { status: 404 }
      );
    }
    
    // Get vendor information if vendorId is provided
    const { expense, category } = expenseResult[0];
    let vendorInfo = null;
    
    if (expense.vendorId) {
      const vendorResult = await db
        .select()
        .from(vendors)
        .where(eq(vendors.id, expense.vendorId))
        .limit(1);
      
      if (vendorResult.length > 0) {
        vendorInfo = {
          id: vendorResult[0].id,
          name: vendorResult[0].name,
        };
      }
    }
    
    return NextResponse.json({
      ...expense,
      category: category && category.id ? category : null,
      vendorDetails: vendorInfo,
    });
    
  } catch (error) {
    console.error('Error fetching expense:', error);
    return NextResponse.json(
      { message: 'Failed to fetch expense' },
      { status: 500 }
    );
  }
}

// PUT /api/expenses/[expenseId] - Update an expense
export async function PUT(
  request: NextRequest, 
  { params }: { params: Promise<{ expenseId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !session.user.companyId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    // Validate and parse the expense ID
    const { expenseId } = await params;
    const validationResult = expenseParamsSchema.safeParse({ expenseId });
    
    if (!validationResult.success) {
      return NextResponse.json(
        { message: 'Invalid expense ID' },
        { status: 400 }
      );
    }
    
    const companyId = parseInt(session.user.companyId);
    const id = parseInt(expenseId);
    
    // Check if the expense exists and belongs to the company
    const existingExpense = await db
      .select()
      .from(expenses)
      .where(
        and(
          eq(expenses.id, id),
          eq(expenses.companyId, companyId),
          eq(expenses.softDelete, false)
        )
      )
      .limit(1);
    
    if (existingExpense.length === 0) {
      return NextResponse.json(
        { message: 'Expense not found' },
        { status: 404 }
      );
    }
    
    // Validate and parse the request body
    const body = await request.json();
    
    // The expenseSchema will automatically coerce string dates to Date objects
    const bodyValidation = expenseSchema.safeParse(body);
    
    if (!bodyValidation.success) {
      return NextResponse.json(
        { message: 'Validation failed', errors: bodyValidation.error.format() },
        { status: 400 }
      );
    }
    
    const { 
      categoryId, 
      vendorId,
      vendor, 
      description, 
      amount, 
      currency, 
      expenseDate, 
      receiptUrl, 
      status, 
      recurring, 
      nextDueDate 
    } = bodyValidation.data;
    
    // Check if category exists and belongs to the company (if provided)
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
    
    // Check if vendor exists and belongs to the company (if provided)
    let existingVendor = null;
    if (vendorId) {
      existingVendor = await db
        .select()
        .from(vendors)
        .where(
          and(
            eq(vendors.id, vendorId),
            eq(vendors.companyId, companyId),
            eq(vendors.softDelete, false)
          )
        )
        .limit(1);
      
      if (existingVendor.length === 0) {
        return NextResponse.json(
          { message: 'Vendor not found or does not belong to your company' },
          { status: 404 }
        );
      }
    }
    
    // Update the expense - format dates for database
    const [updatedExpense] = await db
      .update(expenses)
      .set({
        categoryId: categoryId || null,
        vendorId: vendorId || null,
        vendor: existingVendor ? existingVendor[0].name : vendor,
        description: description || null,
        amount: amount.toString(),
        currency,
        expenseDate: format(expenseDate, 'yyyy-MM-dd'),
        receiptUrl: receiptUrl || null,
        status,
        recurring,
        nextDueDate: nextDueDate ? format(nextDueDate, 'yyyy-MM-dd') : null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(expenses.id, id),
          eq(expenses.companyId, companyId)
        )
      )
      .returning();
    
    // Get category for response
    let category = null;
    if (updatedExpense.categoryId) {
      const categoryResult = await db
        .select()
        .from(expenseCategories)
        .where(eq(expenseCategories.id, updatedExpense.categoryId))
        .limit(1);
      
      if (categoryResult.length > 0) {
        category = {
          id: categoryResult[0].id,
          name: categoryResult[0].name,
        };
      }
    }
    
    // Get vendor for response if vendorId is provided
    let vendorInfo = null;
    if (updatedExpense.vendorId) {
      const vendorResult = await db
        .select()
        .from(vendors)
        .where(eq(vendors.id, updatedExpense.vendorId))
        .limit(1);
      
      if (vendorResult.length > 0) {
        vendorInfo = {
          id: vendorResult[0].id,
          name: vendorResult[0].name,
        };
      }
    }
    
    return NextResponse.json({
      ...updatedExpense,
      category,
      vendor: updatedExpense.vendor || (vendorInfo ? vendorInfo.name : null),
      vendorDetails: vendorInfo,
    });
  } catch (error) {
    console.error('Error updating expense:', error);
    return NextResponse.json(
      { message: 'Failed to update expense' },
      { status: 500 }
    );
  }
}

// DELETE /api/expenses/[expenseId] - Delete an expense
export async function DELETE(
  request: NextRequest, 
  { params }: { params: Promise<{ expenseId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !session.user.companyId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    // Validate and parse the expense ID
    const { expenseId } = await params;
    const validationResult = expenseParamsSchema.safeParse({ expenseId });
    
    if (!validationResult.success) {
      return NextResponse.json(
        { message: 'Invalid expense ID' },
        { status: 400 }
      );
    }
    
    const companyId = parseInt(session.user.companyId);
    const id = parseInt(expenseId);
    
    // Check if the expense exists and belongs to the company
    const existingExpense = await db
      .select()
      .from(expenses)
      .where(
        and(
          eq(expenses.id, id),
          eq(expenses.companyId, companyId),
          eq(expenses.softDelete, false)
        )
      )
      .limit(1);
    
    if (existingExpense.length === 0) {
      return NextResponse.json(
        { message: 'Expense not found' },
        { status: 404 }
      );
    }
    
    // Soft delete the expense
    await db
      .update(expenses)
      .set({
        softDelete: true,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(expenses.id, id),
          eq(expenses.companyId, companyId)
        )
      );
    
    return NextResponse.json({ message: 'Expense deleted successfully' });
    
  } catch (error) {
    console.error('Error deleting expense:', error);
    return NextResponse.json(
      { message: 'Failed to delete expense' },
      { status: 500 }
    );
  }
} 