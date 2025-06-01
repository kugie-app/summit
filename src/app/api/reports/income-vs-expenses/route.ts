import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/lib/db';
import { income, expenses } from '@/lib/db/schema';
import { sql, and, eq, gte, lte } from 'drizzle-orm';
import { authOptions } from '@/lib/auth/options';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { castDecimalSql, dateTruncSql} from '@/lib/db/util/formatter';

// GET /api/reports/income-vs-expenses
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
    
    // Query to get monthly income using Drizzle's query builder
    const monthlyIncomeResult = await db
      .select({
        month: dateTruncSql(expenses.expenseDate).as('month'),
        total: sql`COALESCE(SUM(${castDecimalSql(expenses.amount)}), 0)`.as('total'),
      })
      .from(income)
      .where(
        and(
          eq(income.companyId, companyId),
          eq(income.softDelete, false),
          gte(income.incomeDate, startDateStr),
          lte(income.incomeDate, endDateStr)
        )
      )
      .groupBy(sql`month`)
      .orderBy(sql`month asc`);
    
    // Query to get monthly expenses using Drizzle's query builder
    const monthlyExpensesResult = await db
      .select({
        month: dateTruncSql(expenses.expenseDate).as('month'),
        total: sql`COALESCE(SUM(${castDecimalSql(expenses.amount)})), 0)`.as('total'),
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
      .orderBy(sql`month asc`);
    
    // Create a map of months for easier comparison
    const monthsData: Record<string, { income: number; expenses: number; profit: number }> = {};
    
    // Generate all months in the range
    let currentMonth = new Date(startDate);
    while (currentMonth <= endDate) {
      const monthKey = format(currentMonth, 'yyyy-MM');
      monthsData[monthKey] = { income: 0, expenses: 0, profit: 0 };
      currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    }
    
    // Fill in income data
    monthlyIncomeResult.forEach(row => {
      const date = new Date(row.month as string);
      const monthKey = format(date, 'yyyy-MM');
      const amount = parseFloat(row.total as string);
      
      if (monthsData[monthKey]) {
        monthsData[monthKey].income = amount;
        monthsData[monthKey].profit = amount - monthsData[monthKey].expenses;
      }
    });
    
    // Fill in expense data
    monthlyExpensesResult.forEach(row => {
      const date = new Date(row.month as string);
      const monthKey = format(date, 'yyyy-MM');
      const amount = parseFloat(row.total as string);
      
      if (monthsData[monthKey]) {
        monthsData[monthKey].expenses = amount;
        monthsData[monthKey].profit = monthsData[monthKey].income - amount;
      }
    });
    
    // Convert to array format for charts
    const comparisonData = Object.entries(monthsData).map(([key, data]) => {
      const date = new Date(key + '-01'); // Add day for proper date parsing
      return {
        month: format(date, 'MMM yyyy'),
        income: data.income,
        expenses: data.expenses,
        profit: data.profit
      };
    });
    
    // Calculate totals
    const totalIncome = comparisonData.reduce((sum, item) => sum + item.income, 0);
    const totalExpenses = comparisonData.reduce((sum, item) => sum + item.expenses, 0);
    const totalProfit = totalIncome - totalExpenses;
    
    return NextResponse.json({
      comparisonData,
      summary: {
        totalIncome,
        totalExpenses,
        totalProfit,
        profitMargin: totalIncome > 0 ? (totalProfit / totalIncome) * 100 : 0
      }
    });
    
  } catch (error) {
    console.error('Error generating income vs expenses report:', error);
    return NextResponse.json(
      { message: 'Failed to generate income vs expenses report' },
      { status: 500 }
    );
  }
} 