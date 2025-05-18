import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { expenseCategories, expenses } from '@/lib/db/schema';
import { and, eq, count } from 'drizzle-orm';
import { expenseCategorySchema, expenseCategoryParamsSchema } from '@/lib/validations/expense';
import { withAuth } from '@/lib/auth/getAuthInfo';

// Define response types for type safety
type ExpenseCategoryResponse = any;

type ErrorResponse = {
  message: string;
  errors?: any;
};

// GET /api/expense-categories/[categoryId] - Get a specific expense category
export async function GET(
  request: NextRequest, 
  { params }: { params: Promise<{ categoryId: string }> }
) {
  return withAuth<ExpenseCategoryResponse | ErrorResponse>(request, async (authInfo) => {
    try {
      const { companyId } = authInfo;
      
      // Validate and parse the category ID
      const { categoryId } = await params;
      const validationResult = expenseCategoryParamsSchema.safeParse({ categoryId });
      
      if (!validationResult.success) {
        return NextResponse.json(
          { message: 'Invalid category ID' },
          { status: 400 }
        );
      }
      
      const id = parseInt(categoryId);
      
      // Get the category
      const category = await db
        .select()
        .from(expenseCategories)
        .where(
          and(
            eq(expenseCategories.id, id),
            eq(expenseCategories.companyId, companyId),
            eq(expenseCategories.softDelete, false)
          )
        )
        .limit(1);
      
      if (category.length === 0) {
        return NextResponse.json(
          { message: 'Category not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json(category[0]);
      
    } catch (error) {
      console.error('Error fetching expense category:', error);
      return NextResponse.json(
        { message: 'Failed to fetch expense category' },
        { status: 500 }
      );
    }
  });
}

// PUT /api/expense-categories/[categoryId] - Update an expense category
export async function PUT(
  request: NextRequest, 
  { params }: { params: Promise<{ categoryId: string }> }
) {
  return withAuth<ExpenseCategoryResponse | ErrorResponse>(request, async (authInfo) => {
    try {
      const { companyId } = authInfo;
      
      // Validate and parse the category ID
      const { categoryId } = await params;
      const validationResult = expenseCategoryParamsSchema.safeParse({ categoryId });
      
      if (!validationResult.success) {
        return NextResponse.json(
          { message: 'Invalid category ID' },
          { status: 400 }
        );
      }
      
      const id = parseInt(categoryId);
      
      // Check if the category exists and belongs to the company
      const existingCategory = await db
        .select()
        .from(expenseCategories)
        .where(
          and(
            eq(expenseCategories.id, id),
            eq(expenseCategories.companyId, companyId),
            eq(expenseCategories.softDelete, false)
          )
        )
        .limit(1);
      
      if (existingCategory.length === 0) {
        return NextResponse.json(
          { message: 'Category not found' },
          { status: 404 }
        );
      }
      
      // Validate and parse the request body
      const body = await request.json();
      const bodyValidation = expenseCategorySchema.safeParse(body);
      
      if (!bodyValidation.success) {
        return NextResponse.json(
          { message: 'Validation failed', errors: bodyValidation.error.format() },
          { status: 400 }
        );
      }
      
      const { name } = bodyValidation.data;
      
      // Check if another category with the same name exists
      const duplicateCheck = await db
        .select({ count: count() })
        .from(expenseCategories)
        .where(
          and(
            eq(expenseCategories.companyId, companyId),
            eq(expenseCategories.name, name),
            eq(expenseCategories.softDelete, false)
          )
        );
      
      if (duplicateCheck[0].count > 0 && existingCategory[0].name !== name) {
        return NextResponse.json(
          { message: 'A category with this name already exists' },
          { status: 400 }
        );
      }
      
      // Update the category
      const now = new Date();
      const [updatedCategory] = await db
        .update(expenseCategories)
        .set({
          name,
          updatedAt: now,
        })
        .where(
          and(
            eq(expenseCategories.id, id),
            eq(expenseCategories.companyId, companyId)
          )
        )
        .returning();
      
      return NextResponse.json(updatedCategory);
      
    } catch (error) {
      console.error('Error updating expense category:', error);
      return NextResponse.json(
        { message: 'Failed to update expense category' },
        { status: 500 }
      );
    }
  });
}

// DELETE /api/expense-categories/[categoryId] - Delete an expense category
export async function DELETE(
  request: NextRequest, 
  { params }: { params: Promise<{ categoryId: string }> }
) {
  return withAuth<{ message: string } | ErrorResponse>(request, async (authInfo) => {
    try {
      const { companyId } = authInfo;
      
      // Validate and parse the category ID
      const { categoryId } = await params;
      const validationResult = expenseCategoryParamsSchema.safeParse({ categoryId });
      
      if (!validationResult.success) {
        return NextResponse.json(
          { message: 'Invalid category ID' },
          { status: 400 }
        );
      }
      
      const id = parseInt(categoryId);
      
      // Check if the category exists and belongs to the company
      const existingCategory = await db
        .select()
        .from(expenseCategories)
        .where(
          and(
            eq(expenseCategories.id, id),
            eq(expenseCategories.companyId, companyId),
            eq(expenseCategories.softDelete, false)
          )
        )
        .limit(1);
      
      if (existingCategory.length === 0) {
        return NextResponse.json(
          { message: 'Category not found' },
          { status: 404 }
        );
      }
      
      // Check if there are expenses using this category
      const expenseCount = await db
        .select({ count: count() })
        .from(expenses)
        .where(
          and(
            eq(expenses.categoryId, id),
            eq(expenses.softDelete, false)
          )
        );
      
      if (expenseCount[0].count > 0) {
        return NextResponse.json(
          { message: 'This category is in use by one or more expenses and cannot be deleted' },
          { status: 400 }
        );
      }
      
      // Soft delete the category
      const [deletedCategory] = await db
        .update(expenseCategories)
        .set({
          softDelete: true,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(expenseCategories.id, id),
            eq(expenseCategories.companyId, companyId)
          )
        )
        .returning();
      
      return NextResponse.json({ message: 'Category deleted successfully' });
      
    } catch (error) {
      console.error('Error deleting expense category:', error);
      return NextResponse.json(
        { message: 'Failed to delete expense category' },
        { status: 500 }
      );
    }
  });
} 