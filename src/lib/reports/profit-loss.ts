import { db } from '@/lib/db';
import { expenses, income, payments, invoices } from '@/lib/db/schema';
import { and, eq, gte, lte, sql, sum } from 'drizzle-orm';
import { format, subMonths, startOfMonth, endOfMonth, parseISO } from 'date-fns';

// Get income for a specific date range grouped by month
export const getMonthlyIncome = async (
  companyId: number,
  startDate: string,
  endDate: string
) => {
  const query = db
    .select({
      month: sql<string>`TO_CHAR(${income.incomeDate}, 'YYYY-MM')`,
      total: sum(sql<number>`CAST(${income.amount} AS DECIMAL)`),
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
    .groupBy(sql`TO_CHAR(${income.incomeDate}, 'YYYY-MM')`)
    .orderBy(sql`TO_CHAR(${income.incomeDate}, 'YYYY-MM')`);

  return query;
};

// Get expenses for a specific date range grouped by month
export const getMonthlyExpenses = async (
  companyId: number,
  startDate: string,
  endDate: string
) => {
  const query = db
    .select({
      month: sql<string>`TO_CHAR(${expenses.expenseDate}, 'YYYY-MM')`,
      total: sum(sql<number>`CAST(${expenses.amount} AS DECIMAL)`),
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
    .groupBy(sql`TO_CHAR(${expenses.expenseDate}, 'YYYY-MM')`)
    .orderBy(sql`TO_CHAR(${expenses.expenseDate}, 'YYYY-MM')`);

  return query;
};

// Get expenses by category
export const getExpensesByCategory = async (
  companyId: number,
  startDate: string,
  endDate: string
) => {
  const query = db
    .select({
      categoryId: expenses.categoryId,
      categoryName: sql<string>`COALESCE((SELECT name FROM expense_categories WHERE id = ${expenses.categoryId}), 'Uncategorized')`,
      total: sum(sql<number>`CAST(${expenses.amount} AS DECIMAL)`),
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
    .groupBy(expenses.categoryId, sql`COALESCE((SELECT name FROM expense_categories WHERE id = ${expenses.categoryId}), 'Uncategorized')`)
    .orderBy(sql`total DESC`);

  return query;
};

// Get income by category
export const getIncomeByCategory = async (
  companyId: number,
  startDate: string,
  endDate: string
) => {
  const query = db
    .select({
      categoryId: income.categoryId,
      categoryName: sql<string>`COALESCE((SELECT name FROM income_categories WHERE id = ${income.categoryId}), 'Uncategorized')`,
      total: sum(sql<number>`CAST(${income.amount} AS DECIMAL)`),
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
    .groupBy(income.categoryId, sql`COALESCE((SELECT name FROM income_categories WHERE id = ${income.categoryId}), 'Uncategorized')`)
    .orderBy(sql`total DESC`);

  return query;
};

// Get profit & loss summary for a date range
export const getProfitLossSummary = async (
  companyId: number,
  startDate: string,
  endDate: string
) => {
  // Get total income
  const [incomeResult] = await db
    .select({
      total: sum(sql<number>`CAST(${income.amount} AS DECIMAL)`),
    })
    .from(income)
    .where(
      and(
        eq(income.companyId, companyId),
        gte(income.incomeDate, startDate),
        lte(income.incomeDate, endDate),
        eq(income.softDelete, false)
      )
    );

  // Get total expenses
  const [expensesResult] = await db
    .select({
      total: sum(sql<number>`CAST(${expenses.amount} AS DECIMAL)`),
    })
    .from(expenses)
    .where(
      and(
        eq(expenses.companyId, companyId),
        gte(expenses.expenseDate, startDate),
        lte(expenses.expenseDate, endDate),
        eq(expenses.softDelete, false)
      )
    );

  const totalIncome = Number(incomeResult?.total || 0);
  const totalExpenses = Number(expensesResult?.total || 0);
  const profit = totalIncome - totalExpenses;
  const profitMargin = totalIncome > 0 ? (profit / totalIncome) * 100 : 0;

  return {
    totalIncome,
    totalExpenses,
    profit,
    profitMargin,
    startDate,
    endDate,
  };
};

// Get last 6 months profit & loss data
export const getLast6MonthsProfitLoss = async (companyId: number) => {
  const today = new Date();
  const endDate = format(today, 'yyyy-MM-dd');
  const startDate = format(subMonths(today, 6), 'yyyy-MM-dd');

  // Get monthly income
  const monthlyIncome = await getMonthlyIncome(companyId, startDate, endDate);
  
  // Get monthly expenses
  const monthlyExpenses = await getMonthlyExpenses(companyId, startDate, endDate);

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

  return {
    months,
    startDate,
    endDate,
  };
}; 