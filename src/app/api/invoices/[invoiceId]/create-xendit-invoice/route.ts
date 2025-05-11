import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { invoices, clients } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { createXenditInvoice } from '@/lib/xendit';
import { withAuth } from '@/lib/auth/getAuthInfo';

// Define response types
type InvoiceResponse = {
  id: number;
  companyId: number;
  clientId: number;
  invoiceNumber: string;
  status: string;
  issueDate: Date;
  dueDate: Date | null;
  total: string;
  subtotal: string;
  taxAmount: string;
  currency: string;
  notes: string | null;
  xenditInvoiceId: string | null;
  xenditInvoiceUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  softDelete: boolean;
}

type XenditSuccessResponse = {
  message: string;
  xenditInvoiceUrl: string;
  invoice: InvoiceResponse;
}

type ErrorResponse = {
  message: string;
  errors?: any;
  xenditInvoiceUrl?: string;
}

// Parameter validation schema
const paramsSchema = z.object({
  invoiceId: z.string().refine((val) => !isNaN(parseInt(val)), {
    message: 'Invoice ID must be a number',
  }),
});

// Request body schema
const requestSchema = z.object({
  regenerate: z.boolean().optional(),
});

// POST /api/invoices/[invoiceId]/create-xendit-invoice - Create Xendit payment link
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  return withAuth<XenditSuccessResponse | ErrorResponse>(request, async (authInfo) => {
    try {
      // Validate parameters
      const validatedParams = paramsSchema.parse(await params);
      const invoiceId = parseInt(validatedParams.invoiceId);
      const { companyId } = authInfo;

      // Parse request body with fallback for empty bodies
      let body = {};
      try {
        // Only try to parse if content-length is not 0
        if (request.headers.get('content-length') !== '0') {
          body = await request.json();
        }
      } catch (e) {
        // If JSON parsing fails, use empty object
        console.warn('Error parsing request body, using empty object instead:', e);
      }
      
      const { regenerate = false } = requestSchema.parse(body);

      // Get invoice with client data
      const [invoiceData] = await db
        .select({
          invoice: invoices,
          client: {
            id: clients.id,
            name: clients.name,
            email: clients.email,
          },
        })
        .from(invoices)
        .leftJoin(clients, eq(invoices.clientId, clients.id))
        .where(
          and(
            eq(invoices.id, invoiceId),
            eq(invoices.companyId, companyId),
            eq(invoices.softDelete, false)
          )
        );

      if (!invoiceData) {
        return NextResponse.json({ message: 'Invoice not found' }, { status: 404 });
      }

      const { invoice, client } = invoiceData;

      // Check if the invoice already has a Xendit payment link and is not being regenerated
      if (invoice.xenditInvoiceId && invoice.xenditInvoiceUrl && !regenerate) {
        return NextResponse.json({
          message: 'Xendit payment link already exists for this invoice',
          xenditInvoiceUrl: invoice.xenditInvoiceUrl,
        });
      }

      // Parse the due date string to a Date object
      const dueDate = invoice.dueDate ? new Date(invoice.dueDate) : undefined;

      // Calculate the invoice duration in seconds (if dueDate is provided)
      let invoiceDuration;
      if (dueDate) {
        // Calculate difference between current time and due date in seconds
        const currentTime = new Date();
        const durationInMs = dueDate.getTime() - currentTime.getTime();
        invoiceDuration = Math.max(Math.floor(durationInMs / 1000), 0); // Convert to seconds, ensure not negative
      }

      // Create the payment link via Xendit
      const xenditInvoice = await createXenditInvoice({
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        amount: parseFloat(invoice.total),
        currency: invoice.currency,
        customerEmail: client?.email || '',
        customerName: client?.name || '',
        description: `Payment for Invoice #${invoice.invoiceNumber}`,
        successRedirectUrl: `${process.env.NEXT_PUBLIC_URL}/payment/success`,
        failureRedirectUrl: `${process.env.NEXT_PUBLIC_URL}/payment/failure`,
        invoiceDuration: invoiceDuration, // Set the duration instead of expiry date
      });

      // Update the invoice with Xendit details
      const [updatedInvoice] = await db
        .update(invoices)
        .set({
          xenditInvoiceId: xenditInvoice.id,
          xenditInvoiceUrl: xenditInvoice.invoiceUrl,
          updatedAt: new Date(),
        })
        .where(eq(invoices.id, invoiceId))
        .returning();

      return NextResponse.json({
        message: regenerate ? 'Payment link regenerated successfully' : 'Xendit payment link created successfully',
        xenditInvoiceUrl: xenditInvoice.invoiceUrl,
        invoice: updatedInvoice,
      });
    } catch (error) {
      console.error('Error creating Xendit invoice:', error);
      
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { message: 'Validation error', errors: error.errors },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { message: 'Failed to create Xendit invoice' },
        { status: 500 }
      );
    }
  });
} 