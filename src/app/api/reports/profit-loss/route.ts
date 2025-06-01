import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { getProfitLossSummary } from '@/lib/reports/profit-loss';
import { z } from 'zod';
import { format, subMonths, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { db } from '@/lib/db';
import { expenses, income } from '@/lib/db/schema';
import { and, eq, gte, lte, sql, sum } from 'drizzle-orm';
import { castDecimalSql, formatMonthSql } from '@/lib/db/util/formatter';

// Query parameter validation schema
const querySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

// GET /api/reports/profit-loss - Get profit & loss report
export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !session.user.companyId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    const companyId = parseInt(session.user.companyId);
    
    // Extract query parameters
    const searchParams = request.nextUrl.searchParams;
    let startDate = searchParams.get('startDate');
    let endDate = searchParams.get('endDate');
    
    // If no dates provided, default to last 6 months
    if (!startDate || !endDate) {
      const today = new Date();
      endDate = format(today, 'yyyy-MM-dd');
      startDate = format(subMonths(today, 6), 'yyyy-MM-dd');
    }
    
    // Get profit & loss summary for the specified period
    const summary = await getProfitLossSummary(companyId, startDate, endDate);
    
    // Get monthly breakdown for the chart
    const months = await getMonthlyBreakdown(companyId, startDate, endDate);
    
    return NextResponse.json({
      ...summary,
      months
    });
    
  } catch (error) {
    console.error('Error fetching profit & loss report:', error);
    return NextResponse.json(
      { message: 'Failed to fetch profit & loss report' },
      { status: 500 }
    );
  }
}

// Helper function to get monthly breakdown of income and expenses
async function getMonthlyBreakdown(companyId: number, startDate: string, endDate: string) {
  // Get monthly income
  const monthlyIncome = await db
    .select({
      month: formatMonthSql(income.incomeDate),
      total: sum(castDecimalSql(income.amount)),
    })
    .from(income)
    .where(
      and(
        eq(income.companyId, companyId),
        gte(income.incomeDate, startDate),
        lte(income.incomeDate, endDate),
        eq(income.softDelete, false)
      )
    )
    .groupBy(formatMonthSql(income.incomeDate))
    .orderBy(formatMonthSql(income.incomeDate));
  
  // Get monthly expenses
  const monthlyExpenses = await db
    .select({
      month: formatMonthSql(expenses.expenseDate),
      total: sum(castDecimalSql(expenses.amount)),
    })
    .from(expenses)
    .where(
      and(
        eq(expenses.companyId, companyId),
        gte(expenses.expenseDate, startDate),
        lte(expenses.expenseDate, endDate),
        eq(expenses.softDelete, false)
      )
    )
    .groupBy(formatMonthSql(expenses.expenseDate))
    .orderBy(formatMonthSql(expenses.expenseDate));

  // Transform the data to get an array of months from startDate to endDate
  const months = [];
  let currentDate = startOfMonth(parseISO(startDate));
  const endDateParsed = endOfMonth(parseISO(endDate));

  while (currentDate <= endDateParsed) {
    const monthStr = format(currentDate, 'yyyy-MM');
    const incomeData = monthlyIncome.find((i) => i.month === monthStr);
    const expenseData = monthlyExpenses.find((e) => e.month === monthStr);
    
    const incomeAmount = Number(incomeData?.total || 0);
    const expenseAmount = Number(expenseData?.total || 0);
    
    months.push({
      month: monthStr,
      income: incomeAmount,
      expenses: expenseAmount,
      profit: incomeAmount - expenseAmount,
    });
    
    currentDate = startOfMonth(subMonths(currentDate, -1)); // Move to next month
  }

  return months;
} 