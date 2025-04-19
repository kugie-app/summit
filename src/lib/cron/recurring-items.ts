import { db } from '@/lib/db';
import { invoices, expenses, income, invoiceItems } from '@/lib/db/schema';
import { eq, and, lte, isNull, or } from 'drizzle-orm';
import { add, format, parseISO } from 'date-fns';

// Calculate the next due date based on the recurring frequency
export const calculateNextDueDate = (
  currentDate: Date,
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
): Date => {
  switch (frequency) {
    case 'daily':
      return add(currentDate, { days: 1 });
    case 'weekly':
      return add(currentDate, { weeks: 1 });
    case 'monthly':
      return add(currentDate, { months: 1 });
    case 'yearly':
      return add(currentDate, { years: 1 });
    default:
      return currentDate;
  }
};

// Process recurring invoices
export const processRecurringInvoices = async () => {
  const today = new Date();
  const formattedToday = format(today, 'yyyy-MM-dd');
  
  try {
    // Find all recurring invoices that are due today or earlier
    const dueInvoices = await db
      .select({
        invoice: invoices,
        items: invoiceItems,
      })
      .from(invoices)
      .leftJoin(invoiceItems, eq(invoices.id, invoiceItems.invoiceId))
      .where(
        and(
          eq(invoices.softDelete, false),
          lte(invoices.nextDueDate!, formattedToday),
          or(
            eq(invoices.recurring, 'daily'),
            eq(invoices.recurring, 'weekly'),
            eq(invoices.recurring, 'monthly'),
            eq(invoices.recurring, 'yearly')
          )
        )
      );
    
    // Group invoice items by invoice ID
    const invoiceMap = new Map();
    dueInvoices.forEach(result => {
      const { invoice, items } = result;
      if (!invoiceMap.has(invoice.id)) {
        invoiceMap.set(invoice.id, {
          invoice,
          items: [],
        });
      }
      
      if (items) {
        invoiceMap.get(invoice.id).items.push(items);
      }
    });
    
    const invoicesToProcess = Array.from(invoiceMap.values());
    
    let processed = 0;
    
    // Process each due invoice
    for (const { invoice, items } of invoicesToProcess) {
      try {
        await db.transaction(async (tx) => {
          // Generate a new invoice number
          const invoiceNumber = `INV-${Date.now().toString().slice(-8)}-${processed + 1}`;
          
          // Create a new invoice instance
          const [newInvoice] = await tx
            .insert(invoices)
            .values({
              companyId: invoice.companyId,
              clientId: invoice.clientId,
              invoiceNumber,
              status: 'draft',
              issueDate: formattedToday,
              dueDate: format(add(today, { days: 30 }), 'yyyy-MM-dd'), // Default to 30 days from today
              subtotal: invoice.subtotal,
              tax: invoice.tax,
              total: invoice.total,
              currency: invoice.currency,
              notes: invoice.notes ? `${invoice.notes} (Recurring)` : 'Recurring Invoice',
              recurring: 'none', // Non-recurring instance
              createdAt: new Date(),
              updatedAt: new Date(),
              softDelete: false,
            })
            .returning();
          
          // Create invoice items for the new invoice
          for (const item of items) {
            await tx
              .insert(invoiceItems)
              .values({
                invoiceId: newInvoice.id,
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                amount: item.amount,
                createdAt: new Date(),
                updatedAt: new Date(),
              });
          }
          
          // Calculate next due date for the recurring invoice
          const nextDueDate = calculateNextDueDate(
            parseISO(invoice.nextDueDate!),
            invoice.recurring as 'daily' | 'weekly' | 'monthly' | 'yearly'
          );
          
          // Update the original recurring invoice with the new next due date
          await tx
            .update(invoices)
            .set({
              nextDueDate: format(nextDueDate, 'yyyy-MM-dd'),
              updatedAt: new Date(),
            })
            .where(eq(invoices.id, invoice.id));
          
          processed++;
        });
      } catch (error) {
        console.error(`Error processing recurring invoice ID ${invoice.id}:`, error);
      }
    }
    
    return { processed };
  } catch (error) {
    console.error('Error processing recurring invoices:', error);
    return { processed: 0 };
  }
};

// Process recurring expenses
export const processRecurringExpenses = async () => {
  const today = new Date();
  const formattedToday = format(today, 'yyyy-MM-dd');
  
  try {
    // Find all recurring expenses that are due today or earlier
    const dueExpenses = await db
      .select()
      .from(expenses)
      .where(
        and(
          eq(expenses.softDelete, false),
          lte(expenses.nextDueDate!, formattedToday),
          or(
            eq(expenses.recurring, 'daily'),
            eq(expenses.recurring, 'weekly'),
            eq(expenses.recurring, 'monthly'),
            eq(expenses.recurring, 'yearly')
          )
        )
      );
    
    
    let processed = 0;
    
    // Process each due expense
    for (const expense of dueExpenses) {
      try {
        await db.transaction(async (tx) => {
          // Create a new expense instance
          const [newExpense] = await tx.insert(expenses).values({
            companyId: expense.companyId,
            categoryId: expense.categoryId,
            vendor: expense.vendor,
            description: expense.description ? `${expense.description} (Recurring)` : 'Recurring Expense',
            amount: expense.amount,
            currency: expense.currency,
            expenseDate: formattedToday,
            status: 'pending',
            recurring: 'none', // Non-recurring instance
            createdAt: new Date(),
            updatedAt: new Date(),
            softDelete: false,
          }).returning();
          
          // Calculate next due date for the recurring expense
          const nextDueDate = calculateNextDueDate(
            parseISO(expense.nextDueDate!),
            expense.recurring as 'daily' | 'weekly' | 'monthly' | 'yearly'
          );
          
          // Update the original recurring expense with the new next due date
          await tx.update(expenses)
            .set({
              nextDueDate: format(nextDueDate, 'yyyy-MM-dd'),
              updatedAt: new Date(),
            })
            .where(eq(expenses.id, expense.id));
          
          processed++;
        });
      } catch (error) {
        console.error(`Error processing recurring expense ID ${expense.id}:`, error);
      }
    }
    
    return { processed };
  } catch (error) {
    console.error('Error processing recurring expenses:', error);
    throw error;
  }
};

// Process recurring income
export const processRecurringIncome = async () => {
  const today = new Date();
  const formattedToday = format(today, 'yyyy-MM-dd');
  
  try {
    // Find all recurring income that is due today or earlier
    const dueIncome = await db
      .select()
      .from(income)
      .where(
        and(
          eq(income.softDelete, false),
          lte(income.nextDueDate!, formattedToday),
          or(
            eq(income.recurring, 'daily'),
            eq(income.recurring, 'weekly'),
            eq(income.recurring, 'monthly'),
            eq(income.recurring, 'yearly')
          )
        )
      );
    
    
    let processed = 0;
    
    // Process each due income
    for (const incomeItem of dueIncome) {
      try {
        await db.transaction(async (tx) => {
          // Create a new income instance
          const [newIncome] = await tx.insert(income).values({
            companyId: incomeItem.companyId,
            categoryId: incomeItem.categoryId,
            clientId: incomeItem.clientId,
            invoiceId: incomeItem.invoiceId,
            source: incomeItem.source,
            description: incomeItem.description ? `${incomeItem.description} (Recurring)` : 'Recurring Income',
            amount: incomeItem.amount,
            currency: incomeItem.currency,
            incomeDate: formattedToday,
            recurring: 'none', // Non-recurring instance
            createdAt: new Date(),
            updatedAt: new Date(),
            softDelete: false,
          }).returning();
          
          // Calculate next due date for the recurring income
          const nextDueDate = calculateNextDueDate(
            parseISO(incomeItem.nextDueDate!),
            incomeItem.recurring as 'daily' | 'weekly' | 'monthly' | 'yearly'
          );
          
          // Update the original recurring income with the new next due date
          await tx.update(income)
            .set({
              nextDueDate: format(nextDueDate, 'yyyy-MM-dd'),
              updatedAt: new Date(),
            })
            .where(eq(income.id, incomeItem.id));
          
          processed++;
        });
      } catch (error) {
        console.error(`Error processing recurring income ID ${incomeItem.id}:`, error);
      }
    }
    
    return { processed };
  } catch (error) {
    console.error('Error processing recurring income:', error);
    throw error;
  }
};

// Main function to process all recurring items
export const processAllRecurringItems = async () => {
  try {
    const [invoiceResult, expenseResult, incomeResult] = await Promise.all([
      processRecurringInvoices(),
      processRecurringExpenses(),
      processRecurringIncome(),
    ]);
    
    return {
      invoices: invoiceResult.processed,
      expenses: expenseResult.processed,
      income: incomeResult.processed,
      total: invoiceResult.processed + expenseResult.processed + incomeResult.processed,
    };
  } catch (error) {
    console.error('Error processing recurring items:', error);
    throw error;
  }
}; 