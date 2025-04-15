import { z } from 'zod';
import { recurringOptionEnum } from './expense';

// Income Category Schema
export const incomeCategorySchema = z.object({
  id: z.number().optional(), // Optional for creation, required for updates
  name: z.string().min(1, 'Category name is required'),
});

export type IncomeCategoryFormValues = z.infer<typeof incomeCategorySchema>;

// Income Schema
export const incomeSchema = z.object({
  id: z.number().optional(), // Optional for creation, required for updates
  categoryId: z.number().optional(),
  clientId: z.number().optional(),
  invoiceId: z.number().optional(),
  source: z.string().min(1, 'Source is required'),
  description: z.string().optional(),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Amount must be a valid currency value'),
  currency: z.string().default('IDR'),
  incomeDate: z.coerce.date({
    errorMap: () => ({ message: 'Please select a valid date' }),
  }),
  recurring: recurringOptionEnum.default('none'),
  nextDueDate: z.coerce.date().optional().nullable(),
});

export type IncomeFormValues = z.infer<typeof incomeSchema>;

// Income Params Schema for routes
export const incomeParamsSchema = z.object({
  incomeId: z.string().min(1),
});

export type IncomeParams = z.infer<typeof incomeParamsSchema>;

// Income Category Params Schema for routes
export const incomeCategoryParamsSchema = z.object({
  categoryId: z.string().min(1),
});

export type IncomeCategoryParams = z.infer<typeof incomeCategoryParamsSchema>; 