import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/lib/db';
import { expenses, expenseCategories } from '@/lib/db/schema';
import { and, eq, sql, gte, lte } from 'drizzle-orm';
import { authOptions } from '@/lib/auth/options';
import { subMonths, startOfMonth, endOfMonth } from 'date-fns';

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
    
    // Query for expenses by category
    const expensesByCategoryQuery = sql`
      SELECT 
        ec.name as category_name,
        COALESCE(SUM(CAST(e.amount AS NUMERIC)), 0) as total_amount
      FROM expense_categories ec
      LEFT JOIN expenses e ON ec.id = e.category_id 
        AND e.company_id = ${companyId}
        AND e.soft_delete = false
        AND e.expense_date >= ${startDate}
        AND e.expense_date <= ${endDate}
      WHERE 
        ec.company_id = ${companyId}
        AND ec.soft_delete = false
      GROUP BY ec.id, ec.name
      ORDER BY total_amount DESC
    `;
    
    const expensesByCategoryResult = await db.execute(expensesByCategoryQuery);
    
    // Query for expenses by month
    const expensesByMonthQuery = sql`
      SELECT 
        date_trunc('month', e.expense_date) as month,
        COALESCE(SUM(CAST(e.amount AS NUMERIC)), 0) as total_amount
      FROM expenses e
      WHERE 
        e.company_id = ${companyId}
        AND e.soft_delete = false
        AND e.expense_date >= ${startDate}
        AND e.expense_date <= ${endDate}
      GROUP BY month
      ORDER BY month ASC
    `;
    
    const expensesByMonthResult = await db.execute(expensesByMonthQuery);
    
    // Format the data for the frontend
    const expensesByCategory = expensesByCategoryResult.rows.map(row => ({
      category: row.category_name as string,
      amount: parseFloat(row.total_amount as string),
    }));
    
    const expensesByMonth = expensesByMonthResult.rows.map(row => ({
      month: new Date(row.month as string).toLocaleDateString('en-US', { 
        month: 'short', 
        year: 'numeric' 
      }),
      amount: parseFloat(row.total_amount as string),
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