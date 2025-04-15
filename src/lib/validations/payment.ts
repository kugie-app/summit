import { z } from 'zod';

// Schema for payment params in API routes
export const paymentParamsSchema = z.object({
  paymentId: z.string().refine((val) => !isNaN(parseInt(val)), {
    message: 'Payment ID must be a number',
  }),
});

// Schema for payment data in API requests
export const paymentSchema = z.object({
  invoiceId: z.number().int().positive('Invoice ID is required'),
  clientId: z.number().int().positive('Client ID is required'),
  amount: z.coerce.number().positive('Amount must be positive'),
  currency: z.string().default('IDR'),
  paymentDate: z.coerce.date(),
  paymentMethod: z.enum(['card', 'bank_transfer', 'cash', 'other'], {
    errorMap: () => ({ message: 'Must be a valid payment method: card, bank_transfer, cash, or other' }),
  }),
  notes: z.string().optional().nullable(),
  accountId: z.number().int().optional().nullable(), // Optional - if provided, will create a transaction
});

// Schema for payment list query parameters
export const paymentQuerySchema = z.object({
  page: z.string().optional().transform((val) => (val ? parseInt(val) : 1)),
  limit: z.string().optional().transform((val) => (val ? parseInt(val) : 10)),
  invoiceId: z.string().optional().transform((val) => (val ? parseInt(val) : undefined)),
  clientId: z.string().optional().transform((val) => (val ? parseInt(val) : undefined)),
  status: z.enum(['pending', 'completed', 'failed', 'all']).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  search: z.string().optional(),
}); 