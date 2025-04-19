import { db } from '@/lib/db';
import { expenses, income } from '@/lib/db/schema';
import { and, eq, lte, ne } from 'drizzle-orm';
import { format, addDays, addWeeks, addMonths, addYears } from 'date-fns';

// Type for recurring frequency
type RecurringFrequency = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';

/**
 * Calculate the next due date based on the current date and recurring frequency
 */
function calculateNextDueDate(currentDate: Date, recurring: RecurringFrequency): Date {
  const date = new Date(currentDate);
  
  switch (recurring) {
    case 'daily':
      return addDays(date, 1);
    case 'weekly':
      return addWeeks(date, 1);
    case 'monthly':
      return addMonths(date, 1);
    case 'yearly':
      return addYears(date, 1);
    default:
      return date; // Should never happen for recurring transactions
  }
}

/**
 * Process recurring expenses
 * Find all expenses that are recurring and due, create new instances, and update nextDueDate
 */
async function processRecurringExpenses(): Promise<number> {
  const today = new Date();
  const formattedToday = format(today, 'yyyy-MM-dd');
  
  // Find all recurring expenses where nextDueDate is less than or equal to today
  const dueExpenses = await db
    .select()
    .from(expenses)
    .where(
      and(
        ne(expenses.recurring, 'none'),
        lte(expenses.nextDueDate, formattedToday),
        eq(expenses.softDelete, false)
      )
    );
  
  let processedCount = 0;
  
  // Process each due expense
  for (const expense of dueExpenses) {
    try {
      // Calculate the new expense date and next due date
      // Make sure nextDueDate is not null before proceeding
      if (!expense.nextDueDate) {
        console.error(`Expense ID ${expense.id} has null nextDueDate`);
        continue;
      }
      
      const expenseDate = new Date(expense.nextDueDate);
      const nextDueDate = calculateNextDueDate(expenseDate, expense.recurring as RecurringFrequency);
      
      // Create a new expense record based on the original
      await db.insert(expenses).values({
        companyId: expense.companyId,
        categoryId: expense.categoryId,
        vendor: expense.vendor,
        description: expense.description,
        amount: expense.amount,
        currency: expense.currency,
        expenseDate: format(expenseDate, 'yyyy-MM-dd'),
        receiptUrl: null, // Don't copy the receipt URL to the new expense
        status: 'pending', // New recurring expenses start as pending
        recurring: 'none', // The new expense is not recurring itself
        nextDueDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        softDelete: false,
      });
      
      // Update the original expense's nextDueDate
      await db
        .update(expenses)
        .set({
          nextDueDate: format(nextDueDate, 'yyyy-MM-dd'),
          updatedAt: new Date(),
        })
        .where(eq(expenses.id, expense.id));
      
      processedCount++;
    } catch (error) {
      console.error(`Error processing recurring expense ID ${expense.id}:`, error);
    }
  }
  
  return processedCount;
}

/**
 * Process recurring income
 * Find all income entries that are recurring and due, create new instances, and update nextDueDate
 */
async function processRecurringIncome(): Promise<number> {
  const today = new Date();
  const formattedToday = format(today, 'yyyy-MM-dd');
  
  // Find all recurring income where nextDueDate is less than or equal to today
  const dueIncome = await db
    .select()
    .from(income)
    .where(
      and(
        ne(income.recurring, 'none'),
        lte(income.nextDueDate, formattedToday),
        eq(income.softDelete, false)
      )
    );
  
  let processedCount = 0;
  
  // Process each due income entry
  for (const incomeEntry of dueIncome) {
    try {
      // Calculate the new income date and next due date
      // Make sure nextDueDate is not null before proceeding
      if (!incomeEntry.nextDueDate) {
        console.error(`Income ID ${incomeEntry.id} has null nextDueDate`);
        continue;
      }
      
      const incomeDate = new Date(incomeEntry.nextDueDate);
      const nextDueDate = calculateNextDueDate(incomeDate, incomeEntry.recurring as RecurringFrequency);
      
      // Create a new income record based on the original
      await db.insert(income).values({
        companyId: incomeEntry.companyId,
        categoryId: incomeEntry.categoryId,
        clientId: incomeEntry.clientId,
        invoiceId: null, // Don't link to the same invoice
        source: incomeEntry.source,
        description: incomeEntry.description,
        amount: incomeEntry.amount,
        currency: incomeEntry.currency,
        incomeDate: format(incomeDate, 'yyyy-MM-dd'),
        recurring: 'none', // The new income is not recurring itself
        nextDueDate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        softDelete: false,
      });
      
      // Update the original income's nextDueDate
      await db
        .update(income)
        .set({
          nextDueDate: format(nextDueDate, 'yyyy-MM-dd'),
          updatedAt: new Date(),
        })
        .where(eq(income.id, incomeEntry.id));
      
      processedCount++;
    } catch (error) {
      console.error(`Error processing recurring income ID ${incomeEntry.id}:`, error);
    }
  }
  
  return processedCount;
}

/**
 * Main function to process all recurring transactions
 * Returns a summary of the processed transactions
 */
export async function processRecurringTransactions(): Promise<{
  expensesProcessed: number;
  incomeProcessed: number;
  timestamp: string;
}> {
  const startTime = new Date();
  
  try {
    // Process recurring expenses and income
    const expensesProcessed = await processRecurringExpenses();
    const incomeProcessed = await processRecurringIncome();
    
    const endTime = new Date();
    
    return {
      expensesProcessed,
      incomeProcessed,
      timestamp: format(endTime, 'yyyy-MM-dd HH:mm:ss'),
    };
  } catch (error) {
    const errorTime = new Date();
    console.error(`[${format(errorTime, 'yyyy-MM-dd HH:mm:ss')}] Error in recurring transactions job:`, error);
    throw error;
  }
} 