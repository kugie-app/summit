import { z } from 'zod';

// Expense Category Schema
export const expenseCategorySchema = z.object({
  id: z.number().optional(), // Optional for creation, required for updates
  name: z.string().min(1, 'Category name is required'),
});

export type ExpenseCategoryFormValues = z.infer<typeof expenseCategorySchema>;

// Expense Status Enum
export const expenseStatusEnum = z.enum(['pending', 'approved', 'rejected']);
export type ExpenseStatus = z.infer<typeof expenseStatusEnum>;

// Recurring Options Enum
export const recurringOptionEnum = z.enum(['none', 'daily', 'weekly', 'monthly', 'yearly']);
export type RecurringOption = z.infer<typeof recurringOptionEnum>;

// Expense Schema
export const expenseSchema = z.object({
  id: z.number().optional(), // Optional for creation, required for updates
  categoryId: z.number().optional(),
  vendorId: z.number().optional(),
  vendor: z.string().min(1, 'Vendor name is required').optional(),
  description: z.string().optional(),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Amount must be a valid currency value'),
  currency: z.string().default('IDR'),
  expenseDate: z.coerce.date({
    errorMap: () => ({ message: 'Please select a valid date' }),
  }),
  receiptUrl: z.string().optional().nullable(),
  status: expenseStatusEnum.default('pending'),
  recurring: recurringOptionEnum.default('none'),
  nextDueDate: z.coerce.date().optional().nullable(),
}).refine(
  (data) => {
    // Either vendorId or vendor must be provided
    return !!data.vendorId || !!data.vendor;
  },
  {
    message: 'Either vendor name or vendor selection is required',
    path: ['vendor'],
  }
);

export type ExpenseFormValues = z.infer<typeof expenseSchema>;

// Expense Params Schema for routes
export const expenseParamsSchema = z.object({
  expenseId: z.string().min(1),
});

export type ExpenseParams = z.infer<typeof expenseParamsSchema>;

// Expense Category Params Schema for routes
export const expenseCategoryParamsSchema = z.object({
  categoryId: z.string().min(1),
});

export type ExpenseCategoryParams = z.infer<typeof expenseCategoryParamsSchema>; 