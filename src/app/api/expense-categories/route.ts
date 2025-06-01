import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { expenseCategories } from '@/lib/db/schema';
import { and, eq, count } from 'drizzle-orm';
import { expenseCategorySchema } from '@/lib/validations/expense';
import { withAuth } from '@/lib/auth/getAuthInfo';

// Define response types for type safety
type ExpenseCategoryListResponse = {
  data: any[];
  total: number;
};

type ExpenseCategoryResponse = any;

type ErrorResponse = {
  message: string;
  errors?: any;
};

// GET /api/expense-categories - List all expense categories
export async function GET(request: NextRequest) {
  return withAuth<ExpenseCategoryListResponse | ErrorResponse>(request, async (authInfo) => {
    try {
      const { companyId } = authInfo;
      
      // Get all categories for the company
      const categories = await db
        .select()
        .from(expenseCategories)
        .where(
          and(
            eq(expenseCategories.companyId, companyId),
            eq(expenseCategories.softDelete, false)
          )
        )
        .orderBy(expenseCategories.name);
      
      return NextResponse.json({
        data: categories,
        total: categories.length,
      });
      
    } catch (error) {
      console.error('Error fetching expense categories:', error);
      return NextResponse.json(
        { message: 'Failed to fetch expense categories' },
        { status: 500 }
      );
    }
  });
}

// POST /api/expense-categories - Create a new expense category
export async function POST(request: NextRequest) {
  return withAuth<ExpenseCategoryResponse | ErrorResponse>(request, async (authInfo) => {
    try {
      const { companyId } = authInfo;
      const body = await request.json();
      
      // Validate input data
      const validationResult = expenseCategorySchema.safeParse(body);
      
      if (!validationResult.success) {
        return NextResponse.json(
          { message: 'Validation failed', errors: validationResult.error.format() },
          { status: 400 }
        );
      }
      
      const { name } = validationResult.data;
      
      // Check if category with same name already exists for this company
      const existingCategory = await db
        .select({ count: count() })
        .from(expenseCategories)
        .where(
          and(
            eq(expenseCategories.companyId, companyId),
            eq(expenseCategories.name, name),
            eq(expenseCategories.softDelete, false)
          )
        );
      
      if (existingCategory[0].count > 0) {
        return NextResponse.json(
          { message: 'A category with this name already exists' },
          { status: 400 }
        );
      }
      
      // Create new category
      const now = new Date().toISOString();
      const [category] = await db
        .insert(expenseCategories)
        .values({
          companyId,
          name,
          createdAt: now,
          updatedAt: now,
          softDelete: false,
        })
        .returning();
      
      return NextResponse.json(category, { status: 201 });
      
    } catch (error) {
      console.error('Error creating expense category:', error);
      
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
  });
} 