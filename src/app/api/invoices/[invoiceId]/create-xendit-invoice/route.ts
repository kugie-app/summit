import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { db } from '@/lib/db';
import { invoices, clients } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { createXenditInvoice } from '@/lib/xendit';
import { z } from 'zod';
import { parse } from 'date-fns';

// Parameter validation schema
const paramsSchema = z.object({
  invoiceId: z.string().refine((val) => !isNaN(parseInt(val)), {
    message: 'Invoice ID must be a number',
  }),
});

// POST /api/invoices/[invoiceId]/create-xendit-invoice - Create Xendit payment link
export async function POST(
  request: NextRequest,
  { params }: { params: { invoiceId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !session.user.companyId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    // Validate parameters
    const paramValidation = paramsSchema.safeParse(params);
    if (!paramValidation.success) {
      return NextResponse.json(
        { message: 'Invalid invoice ID', errors: paramValidation.error.format() },
        { status: 400 }
      );
    }
    
    const invoiceId = parseInt(params.invoiceId);
    const companyId = parseInt(session.user.companyId);
    
    // Fetch the invoice and related client
    const result = await db
      .select({
        invoice: invoices,
        client: clients,
      })
      .from(invoices)
      .leftJoin(clients, eq(invoices.clientId, clients.id))
      .where(
        and(
          eq(invoices.id, invoiceId),
          eq(invoices.companyId, companyId),
          eq(invoices.softDelete, false)
        )
      )
      .limit(1);
    
    if (!result.length) {
      return NextResponse.json({ message: 'Invoice not found' }, { status: 404 });
    }
    
    const { invoice, client } = result[0];
    
    // Check if the invoice already has a Xendit payment link
    if (invoice.xenditInvoiceId && invoice.xenditInvoiceUrl) {
      return NextResponse.json({
        message: 'Xendit payment link already exists for this invoice',
        xenditInvoiceUrl: invoice.xenditInvoiceUrl,
      });
    }
    
    // Parse the due date string to a Date object
    const dueDate = invoice.dueDate ? new Date(invoice.dueDate) : undefined;
    
    // Create the payment link via Xendit
    const xenditInvoice = await createXenditInvoice({
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      amount: parseFloat(invoice.total),
      currency: invoice.currency,
      customerEmail: client?.email || '',
      customerName: client?.name || '',
      description: `Payment for Invoice #${invoice.invoiceNumber}`,
      successRedirectUrl: `${process.env.NEXT_PUBLIC_URL}/invoices/${invoiceId}?payment=success`,
      failureRedirectUrl: `${process.env.NEXT_PUBLIC_URL}/invoices/${invoiceId}?payment=failure`,
      expiryDate: dueDate,
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
      message: 'Xendit payment link created successfully',
      xenditInvoiceUrl: xenditInvoice.invoiceUrl,
      invoice: updatedInvoice,
    });
    
  } catch (error) {
    console.error('Error creating Xendit payment link:', error);
    return NextResponse.json(
      { message: 'Failed to create Xendit payment link' },
      { status: 500 }
    );
  }
} 