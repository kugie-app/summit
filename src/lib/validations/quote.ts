import { z } from 'zod';

// Quote item schema
export const quoteItemSchema = z.object({
  id: z.number().optional(), // For updates
  description: z.string().min(1, 'Description is required'),
  quantity: z.coerce.number().positive('Quantity must be positive'),
  unitPrice: z.coerce.number().min(0, 'Unit price cannot be negative'),
  amount: z.coerce.number().min(0, 'Amount cannot be negative').optional(),
});

export type QuoteItemFormValues = z.infer<typeof quoteItemSchema>;

// Quote schema
export const quoteSchema = z.object({
  clientId: z.coerce.number().positive('Client is required'),
  quoteNumber: z.string().min(1, 'Quote number is required'),
  status: z.enum(['draft', 'sent', 'accepted', 'rejected', 'expired']).default('draft'),
  issueDate: z.coerce.date(),
  expiryDate: z.coerce.date(),
  subtotal: z.coerce.number().min(0, 'Subtotal cannot be negative').optional(),
  tax: z.coerce.number().min(0, 'Tax cannot be negative').default(0),
  taxRate: z.coerce.number().min(0, 'Tax rate cannot be negative').default(0),
  total: z.coerce.number().min(0, 'Total cannot be negative').optional(),
  currency: z.string().default('IDR'),
  notes: z.string().optional(),
  items: z.array(quoteItemSchema).min(1, 'At least one item is required'),
});

export type QuoteFormValues = z.infer<typeof quoteSchema>;

// Quote params schema for routes
export const quoteParamsSchema = z.object({
  quoteId: z.string().min(1),
});

export type QuoteParams = z.infer<typeof quoteParamsSchema>;

// Schema for quote status updates
export const quoteStatusUpdateSchema = z.object({
  status: z.enum(['draft', 'sent', 'accepted', 'rejected', 'expired']),
});

// Schema for converting a quote to invoice
export const quoteToInvoiceSchema = z.object({
  dueDate: z.coerce.date(),
}); 