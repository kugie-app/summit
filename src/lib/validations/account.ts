import { z } from 'zod';

// Schema for account params in API routes
export const accountParamsSchema = z.object({
  accountId: z.string().refine((val) => !isNaN(parseInt(val)), {
    message: 'Account ID must be a number',
  }),
});

// Schema for account data in API requests
export const accountSchema = z.object({
  name: z.string().min(1, 'Account name is required').max(255),
  type: z.enum(['bank', 'credit_card', 'cash'], {
    errorMap: () => ({ message: 'Must be a valid account type: bank, credit_card, or cash' }),
  }),
  currency: z.string().default('IDR'),
  accountNumber: z.string().optional().nullable(),
  initialBalance: z.coerce.number().default(0),
  currentBalance: z.coerce.number().optional(),
});

// Schema for account list query parameters
export const accountQuerySchema = z.object({
  page: z.string().optional().transform((val) => (val ? parseInt(val) : 1)),
  limit: z.string().optional().transform((val) => (val ? parseInt(val) : 10)),
  type: z.enum(['bank', 'credit_card', 'cash', 'all']).optional(),
  search: z.string().optional(),
}); 