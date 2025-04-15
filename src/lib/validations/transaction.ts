import { z } from 'zod';

// Schema for transaction params in API routes
export const transactionParamsSchema = z.object({
  transactionId: z.string().refine((val) => !isNaN(parseInt(val)), {
    message: 'Transaction ID must be a number',
  }),
});

// Schema for transaction data in API requests
export const transactionSchema = z.object({
  accountId: z.number().int().positive('Account ID is required'),
  type: z.enum(['debit', 'credit'], {
    errorMap: () => ({ message: 'Must be either debit or credit' }),
  }),
  description: z.string().min(1, 'Description is required'),
  amount: z.coerce.number().positive('Amount must be positive'),
  currency: z.string().default('IDR'),
  transactionDate: z.coerce.date(),
  categoryId: z.number().int().optional().nullable(),
  relatedInvoiceId: z.number().int().optional().nullable(),
  relatedExpenseId: z.number().int().optional().nullable(),
  relatedIncomeId: z.number().int().optional().nullable(),
  reconciled: z.boolean().default(false),
});

// Schema for transaction list query parameters
export const transactionQuerySchema = z.object({
  page: z.string().optional().transform((val) => (val ? parseInt(val) : 1)),
  limit: z.string().optional().transform((val) => (val ? parseInt(val) : 10)),
  type: z.enum(['debit', 'credit', 'all']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  reconciled: z.enum(['true', 'false', 'all']).optional(),
  search: z.string().optional(),
}); 