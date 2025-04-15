import { z } from 'zod';
import { recurringOptionEnum } from './expense';

// Invoice item schema
export const invoiceItemSchema = z.object({
  id: z.number().optional(), // For updates
  description: z.string().min(1, 'Description is required'),
  quantity: z.coerce.number().positive('Quantity must be positive'),
  unitPrice: z.coerce.number().min(0, 'Unit price cannot be negative'),
  amount: z.coerce.number().min(0, 'Amount cannot be negative'),
});

export type InvoiceItemFormValues = z.infer<typeof invoiceItemSchema>;

// Invoice schema
export const invoiceSchema = z.object({
  clientId: z.coerce.number().positive('Client is required'),
  invoiceNumber: z.string().min(1, 'Invoice number is required'),
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']).default('draft'),
  issueDate: z.coerce.date(),
  dueDate: z.coerce.date(),
  subtotal: z.coerce.number().min(0, 'Subtotal cannot be negative'),
  tax: z.coerce.number().min(0, 'Tax cannot be negative').default(0),
  total: z.coerce.number().min(0, 'Total cannot be negative'),
  currency: z.string().default('IDR'),
  notes: z.string().optional(),
  recurring: recurringOptionEnum.default('none'),
  nextDueDate: z.coerce.date().optional().nullable(),
  items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
});

export type InvoiceFormValues = z.infer<typeof invoiceSchema>;

// Invoice params schema for routes
export const invoiceParamsSchema = z.object({
  invoiceId: z.string().min(1),
});

export type InvoiceParams = z.infer<typeof invoiceParamsSchema>; 