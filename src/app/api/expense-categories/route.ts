import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { db } from '@/lib/db';
import { expenseCategories } from '@/lib/db/schema';
import { and, eq, count } from 'drizzle-orm';
import { authOptions } from '@/lib/auth/options';
import { expenseCategorySchema } from '@/lib/validations/expense';

// GET /api/expense-categories - List all expense categories
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !session.user.companyId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    const companyId = parseInt(session.user.companyId);
    
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
}

// POST /api/expense-categories - Create a new expense category
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !session.user.companyId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    const companyId = parseInt(session.user.companyId);
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
    const now = new Date();
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
} 