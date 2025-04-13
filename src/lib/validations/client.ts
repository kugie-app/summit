import { z } from 'zod';

export const clientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email').nullish().or(z.literal('')),
  phone: z.string().nullish().or(z.literal('')),
  address: z.string().nullish().or(z.literal('')),
  paymentTerms: z.number().int().min(0).default(30),
});

export type ClientFormValues = z.infer<typeof clientSchema>;

export const clientParamsSchema = z.object({
  clientId: z.string().min(1),
});

export type ClientParams = z.infer<typeof clientParamsSchema>; 