import { db } from '@/lib/db';
import { transactions, accounts, expenseCategories, incomeCategories } from '@/lib/db/schema';
import { and, eq, gte, lte, sql, sum, isNull, or } from 'drizzle-orm';
import { format, subMonths, startOfMonth, endOfMonth, parseISO } from 'date-fns';

// Get cash inflows for a specific date range grouped by month
export const getMonthlyCashInflows = async (
  companyId: number,
  startDate: string,
  endDate: string
) => {
  const query = db
    .select({
      month: sql<string>`TO_CHAR(${transactions.transactionDate}, 'YYYY-MM')`,
      total: sum(sql<number>`${transactions.amount}`),
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.companyId, companyId),
        eq(transactions.type, 'credit'), // Credits represent money coming in
        gte(transactions.transactionDate, startDate),
        lte(transactions.transactionDate, endDate),
        eq(transactions.softDelete, false)
      )
    )
    .groupBy(sql`TO_CHAR(${transactions.transactionDate}, 'YYYY-MM')`)
    .orderBy(sql`TO_CHAR(${transactions.transactionDate}, 'YYYY-MM')`);

  return query;
};

// Get cash outflows for a specific date range grouped by month
export const getMonthlyCashOutflows = async (
  companyId: number,
  startDate: string,
  endDate: string
) => {
  const query = db
    .select({
      month: sql<string>`TO_CHAR(${transactions.transactionDate}, 'YYYY-MM')`,
      total: sum(sql<number>`${transactions.amount}`),
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.companyId, companyId),
        eq(transactions.type, 'debit'), // Debits represent money going out
        gte(transactions.transactionDate, startDate),
        lte(transactions.transactionDate, endDate),
        eq(transactions.softDelete, false)
      )
    )
    .groupBy(sql`TO_CHAR(${transactions.transactionDate}, 'YYYY-MM')`)
    .orderBy(sql`TO_CHAR(${transactions.transactionDate}, 'YYYY-MM')`);

  return query;
};

// Get account balances at a specific date
export const getAccountBalances = async (
  companyId: number,
  date: string
) => {
  // Get all accounts with their current balances
  const accountsData = await db
    .select({
      id: accounts.id,
      name: accounts.name,
      type: accounts.type,
      currentBalance: accounts.currentBalance,
    })
    .from(accounts)
    .where(
      and(
        eq(accounts.companyId, companyId),
        eq(accounts.softDelete, false)
      )
    );

  return accountsData;
};

// Categorize transactions by source (operating, investing, financing)
export const getCashFlowByCategory = async (
  companyId: number,
  startDate: string,
  endDate: string
) => {
  // Operating activities categories (day-to-day business operations)
  // Typically include payments from customers and to suppliers, employee salaries, rent, etc.
  const operatingCategoryIds = await db
    .select({
      id: sql<number>`id`,
    })
    .from(sql`(
      SELECT id FROM expense_categories 
      WHERE company_id = ${companyId}
      AND name ILIKE ANY(ARRAY['%salary%', '%rent%', '%utility%', '%office%', '%supplies%', '%marketing%', '%sales%', '%service%'])
      UNION
      SELECT id FROM income_categories
      WHERE company_id = ${companyId}
      AND name ILIKE ANY(ARRAY['%sales%', '%service%', '%revenue%', '%fee%', '%subscription%'])
    ) AS operating_categories`);

  // Convert to array of IDs
  const operatingIds = operatingCategoryIds.map(category => category.id);

  // Get operating cash flows
  const [operatingResult] = await db
    .select({
      inflows: sum(sql<number>`CASE WHEN ${transactions.type} = 'credit' THEN ${transactions.amount} ELSE 0 END`),
      outflows: sum(sql<number>`CASE WHEN ${transactions.type} = 'debit' THEN ${transactions.amount} ELSE 0 END`),
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.companyId, companyId),
        gte(transactions.transactionDate, startDate),
        lte(transactions.transactionDate, endDate),
        eq(transactions.softDelete, false),
        or(
          // Related to invoices or general income that isn't investment/financing
          sql`${transactions.relatedInvoiceId} IS NOT NULL`,
          // Income or expense categories linked to operating activities
          sql`${transactions.categoryId} IN (${operatingIds.length > 0 ? operatingIds.join(', ') : 0})`,
          // Default to operating for uncategorized transactions
          sql`${transactions.categoryId} IS NULL`
        )
      )
    );

  // Investing activities (buying/selling long-term assets)
  // Typically include purchases of property, equipment, investments
  const investingCategoryIds = await db
    .select({
      id: sql<number>`id`,
    })
    .from(sql`(
      SELECT id FROM expense_categories 
      WHERE company_id = ${companyId}
      AND name ILIKE ANY(ARRAY['%equipment%', '%asset%', '%property%', '%investment%', '%capital%'])
      UNION
      SELECT id FROM income_categories
      WHERE company_id = ${companyId}
      AND name ILIKE ANY(ARRAY['%investment%', '%sale of asset%', '%property sale%', '%interest%', '%dividend%'])
    ) AS investing_categories`);

  // Convert to array of IDs
  const investingIds = investingCategoryIds.map(category => category.id);

  // Get investing cash flows
  const [investingResult] = await db
    .select({
      inflows: sum(sql<number>`CASE WHEN ${transactions.type} = 'credit' THEN ${transactions.amount} ELSE 0 END`),
      outflows: sum(sql<number>`CASE WHEN ${transactions.type} = 'debit' THEN ${transactions.amount} ELSE 0 END`),
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.companyId, companyId),
        gte(transactions.transactionDate, startDate),
        lte(transactions.transactionDate, endDate),
        eq(transactions.softDelete, false),
        sql`${transactions.categoryId} IN (${investingIds.length > 0 ? investingIds.join(', ') : 0})`
      )
    );

  // Financing activities (changes in debt, loans, owner's equity)
  // Typically include loan receipts/payments, share issuances, dividends
  const financingCategoryIds = await db
    .select({
      id: sql<number>`id`,
    })
    .from(sql`(
      SELECT id FROM expense_categories 
      WHERE company_id = ${companyId}
      AND name ILIKE ANY(ARRAY['%loan%', '%interest payment%', '%debt%', '%dividend%', '%share%', '%equity%'])
      UNION
      SELECT id FROM income_categories
      WHERE company_id = ${companyId}
      AND name ILIKE ANY(ARRAY['%loan%', '%debt%', '%capital%', '%investment%', '%share%', '%equity%'])
    ) AS financing_categories`);

  // Convert to array of IDs
  const financingIds = financingCategoryIds.map(category => category.id);

  // Get financing cash flows
  const [financingResult] = await db
    .select({
      inflows: sum(sql<number>`CASE WHEN ${transactions.type} = 'credit' THEN ${transactions.amount} ELSE 0 END`),
      outflows: sum(sql<number>`CASE WHEN ${transactions.type} = 'debit' THEN ${transactions.amount} ELSE 0 END`),
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.companyId, companyId),
        gte(transactions.transactionDate, startDate),
        lte(transactions.transactionDate, endDate),
        eq(transactions.softDelete, false),
        sql`${transactions.categoryId} IN (${financingIds.length > 0 ? financingIds.join(', ') : 0})`
      )
    );

  const operatingInflows = Number(operatingResult?.inflows || 0);
  const operatingOutflows = Number(operatingResult?.outflows || 0);
  const operatingNet = operatingInflows - operatingOutflows;

  const investingInflows = Number(investingResult?.inflows || 0);
  const investingOutflows = Number(investingResult?.outflows || 0);
  const investingNet = investingInflows - investingOutflows;

  const financingInflows = Number(financingResult?.inflows || 0);
  const financingOutflows = Number(financingResult?.outflows || 0);
  const financingNet = financingInflows - financingOutflows;

  return {
    operating: {
      inflows: operatingInflows,
      outflows: operatingOutflows,
      net: operatingNet
    },
    investing: {
      inflows: investingInflows,
      outflows: investingOutflows,
      net: investingNet
    },
    financing: {
      inflows: financingInflows,
      outflows: financingOutflows,
      net: financingNet
    },
    total: {
      inflows: operatingInflows + investingInflows + financingInflows,
      outflows: operatingOutflows + investingOutflows + financingOutflows,
      net: operatingNet + investingNet + financingNet
    }
  };
};

// Get cash flow summary for a date range
export const getCashFlowSummary = async (
  companyId: number,
  startDate: string,
  endDate: string
) => {
  // Get total inflows
  const [inflowsResult] = await db
    .select({
      total: sum(sql<number>`${transactions.amount}`),
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.companyId, companyId),
        eq(transactions.type, 'credit'),
        gte(transactions.transactionDate, startDate),
        lte(transactions.transactionDate, endDate),
        eq(transactions.softDelete, false)
      )
    );

  // Get total outflows
  const [outflowsResult] = await db
    .select({
      total: sum(sql<number>`${transactions.amount}`),
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.companyId, companyId),
        eq(transactions.type, 'debit'),
        gte(transactions.transactionDate, startDate),
        lte(transactions.transactionDate, endDate),
        eq(transactions.softDelete, false)
      )
    );

  // Get starting balance (sum of all account balances at the start date)
  // For simplicity, we'll use the current balance and adjust based on transactions
  const [startingBalanceResult] = await db
    .select({
      total: sum(sql<number>`${accounts.currentBalance}`),
    })
    .from(accounts)
    .where(
      and(
        eq(accounts.companyId, companyId),
        eq(accounts.softDelete, false)
      )
    );

  // Get transaction totals since the end date to subtract from current balance
  const [transactionsSinceEndResult] = await db
    .select({
      credits: sum(sql<number>`CASE WHEN ${transactions.type} = 'credit' THEN ${transactions.amount} ELSE 0 END`),
      debits: sum(sql<number>`CASE WHEN ${transactions.type} = 'debit' THEN ${transactions.amount} ELSE 0 END`),
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.companyId, companyId),
        gte(transactions.transactionDate, endDate),
        eq(transactions.softDelete, false)
      )
    );

  // Get transaction totals before the start date to add to current balance
  const [transactionsBeforeStartResult] = await db
    .select({
      credits: sum(sql<number>`CASE WHEN ${transactions.type} = 'credit' THEN ${transactions.amount} ELSE 0 END`),
      debits: sum(sql<number>`CASE WHEN ${transactions.type} = 'debit' THEN ${transactions.amount} ELSE 0 END`),
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.companyId, companyId),
        lte(transactions.transactionDate, startDate),
        eq(transactions.softDelete, false)
      )
    );

  const totalInflows = Number(inflowsResult?.total || 0);
  const totalOutflows = Number(outflowsResult?.total || 0);
  const netCashFlow = totalInflows - totalOutflows;
  
  // Calculate starting balance by adjusting the current balance
  const currentBalance = Number(startingBalanceResult?.total || 0);
  const creditsSinceEnd = Number(transactionsSinceEndResult?.credits || 0);
  const debitsSinceEnd = Number(transactionsSinceEndResult?.debits || 0);
  const creditsBeforeStart = Number(transactionsBeforeStartResult?.credits || 0);
  const debitsBeforeStart = Number(transactionsBeforeStartResult?.debits || 0);
  
  // Current balance - (credits since end - debits since end) + (debits before start - credits before start)
  const startingBalance = currentBalance - (creditsSinceEnd - debitsSinceEnd) + (debitsBeforeStart - creditsBeforeStart);
  const endingBalance = startingBalance + netCashFlow;

  // Get cash flow breakdown by category (operating, investing, financing)
  const cashFlowByCategory = await getCashFlowByCategory(companyId, startDate, endDate);

  return {
    startingBalance,
    totalInflows,
    totalOutflows,
    netCashFlow,
    endingBalance,
    startDate,
    endDate,
    cashFlowByCategory
  };
};

// Get cash flow data for the last n months
export const getMonthsCashFlow = async (companyId: number, months: number = 6) => {
  const today = new Date();
  const endDate = format(today, 'yyyy-MM-dd');
  const startDate = format(subMonths(today, months - 1), 'yyyy-MM-dd');

  // Get monthly inflows
  const monthlyInflows = await getMonthlyCashInflows(companyId, startDate, endDate);
  
  // Get monthly outflows
  const monthlyOutflows = await getMonthlyCashOutflows(companyId, startDate, endDate);

  // Calculate cash flow summary
  const summary = await getCashFlowSummary(companyId, startDate, endDate);

  // Transform the data to get an array of months from startDate to endDate
  const months_data = [];
  let currentDate = startOfMonth(parseISO(startDate));
  const endDateParsed = endOfMonth(parseISO(endDate));

  // Track running balance
  let runningBalance = summary.startingBalance;

  while (currentDate <= endDateParsed) {
    const monthStr = format(currentDate, 'yyyy-MM');
    const inflowData = monthlyInflows.find((i) => i.month === monthStr);
    const outflowData = monthlyOutflows.find((e) => e.month === monthStr);
    
    const inflowAmount = Number(inflowData?.total || 0);
    const outflowAmount = Number(outflowData?.total || 0);
    const netFlow = inflowAmount - outflowAmount;
    
    // Update running balance
    runningBalance += netFlow;
    
    months_data.push({
      month: monthStr,
      inflows: inflowAmount,
      outflows: outflowAmount,
      netFlow: netFlow,
      balance: runningBalance,
    });
    
    currentDate = startOfMonth(subMonths(currentDate, -1)); // Move to next month
  }

  return {
    months: months_data,
    summary,
    startDate,
    endDate,
  };
}; 