import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/lib/db';
import { expenses, expenseCategories } from '@/lib/db/schema';
import { and, eq, sql, gte, lte, sum, desc, asc } from 'drizzle-orm';
import { authOptions } from '@/lib/auth/options';
import { subMonths, startOfMonth, endOfMonth, format } from 'date-fns';

// GET /api/reports/expense-breakdown
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !session.user.companyId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const companyId = parseInt(session.user.companyId);
    
    // Parse query parameters for date range
    const searchParams = request.nextUrl.searchParams;
    const months = parseInt(searchParams.get('months') || '12'); // Default to last 12 months
    
    // Calculate date range
    const endDate = new Date();
    const startDate = subMonths(startOfMonth(endDate), months - 1);
    
    // Convert dates to ISO strings for SQL
    const startDateStr = startDate.toISOString();
    const endDateStr = endDate.toISOString();
    
    // First, get all categories for the company
    const categoriesResult = await db
      .select({
        id: expenseCategories.id,
        name: expenseCategories.name,
      })
      .from(expenseCategories)
      .where(
        and(
          eq(expenseCategories.companyId, companyId),
          eq(expenseCategories.softDelete, false)
        )
      );
    
    // Now get expense totals by category using Drizzle's query builder with SQL functions
    const expensesByCategoryPromises = categoriesResult.map(async (category) => {
      const result = await db
        .select({
          totalAmount: sql`COALESCE(SUM(CAST(${expenses.amount} AS NUMERIC)), 0)`.as('total_amount'),
        })
        .from(expenses)
        .where(
          and(
            eq(expenses.categoryId, category.id),
            eq(expenses.companyId, companyId),
            eq(expenses.softDelete, false),
            gte(expenses.expenseDate, startDateStr),
            lte(expenses.expenseDate, endDateStr)
          )
        );
      
      return {
        category: category.name,
        amount: parseFloat(result[0].totalAmount as string),
      };
    });
    
    const expensesByCategory = await Promise.all(expensesByCategoryPromises);
    // Sort by amount descending
    expensesByCategory.sort((a, b) => b.amount - a.amount);
    
    // For expenses by month, use Drizzle's query builder with SQL fragments
    // for PostgreSQL-specific functions
    const expensesByMonthResult = await db
      .select({
        month: sql`date_trunc('month', ${expenses.expenseDate})`.as('month'),
        totalAmount: sql`COALESCE(SUM(CAST(${expenses.amount} AS NUMERIC)), 0)`.as('total_amount'),
      })
      .from(expenses)
      .where(
        and(
          eq(expenses.companyId, companyId),
          eq(expenses.softDelete, false),
          gte(expenses.expenseDate, startDateStr),
          lte(expenses.expenseDate, endDateStr)
        )
      )
      .groupBy(sql`month`)
      .orderBy(sql`month`);
    
    // Format the data for the frontend
    const expensesByMonth = expensesByMonthResult.map(row => ({
      month: new Date(row.month as string).toLocaleDateString('en-US', { 
        month: 'short', 
        year: 'numeric' 
      }),
      amount: parseFloat(row.totalAmount as string),
    }));
    
    return NextResponse.json({
      expensesByCategory,
      expensesByMonth,
      totalExpenses: expensesByCategory.reduce((sum, item) => sum + item.amount, 0),
    });
    
  } catch (error) {
    console.error('Error generating expense breakdown report:', error);
    return NextResponse.json(
      { message: 'Failed to generate expense breakdown report' },
      { status: 500 }
    );
  }
} 