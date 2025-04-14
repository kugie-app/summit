import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { db } from '@/lib/db';
import { quotes, quoteItems, invoices, invoiceItems, clients } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { format } from 'date-fns';

// POST /api/quotes/[quoteId]/convert-to-invoice - Convert quote to invoice
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ quoteId: string }> }
) {
  try {
    const { quoteId } = await params;
    const id = parseInt(quoteId);

    // Check authorization
    const session = await getServerSession(authOptions);
    if (!session?.user || !session.user.companyId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const companyId = parseInt(session.user.companyId);

    // Get quote with items
    const [quote] = await db
      .select()
      .from(quotes)
      .where(
        and(
          eq(quotes.id, parseInt(quoteId)),
          eq(quotes.companyId, companyId),
          eq(quotes.softDelete, false)
        )
      );

    if (!quote) {
      return NextResponse.json({ message: 'Quote not found' }, { status: 404 });
    }

    // Check if quote is accepted
    if (quote.status !== 'accepted') {
      return NextResponse.json(
        { message: 'Only accepted quotes can be converted to invoices' },
        { status: 400 }
      );
    }

    // Get quote items
    const quoteItemsList = await db
      .select()
      .from(quoteItems)
      .where(eq(quoteItems.quoteId, id));

    // Generate a new invoice number
    const today = new Date();
    const invoiceNumber = `INV-${format(today, 'yyyyMMdd')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
    
    // Due date will be 30 days from today
    const dueDate = new Date(today);
    dueDate.setDate(today.getDate() + 30);

    // Create the invoice
    const [newInvoice] = await db
      .insert(invoices)
      .values({
        companyId: quote.companyId,
        clientId: quote.clientId,
        invoiceNumber,
        status: 'draft',
        issueDate: today.toISOString().split('T')[0],
        dueDate: dueDate.toISOString().split('T')[0],
        subtotal: quote.subtotal,
        tax: quote.tax,
        total: quote.total,
        notes: quote.notes,
        createdAt: new Date(),
        updatedAt: new Date(),
        softDelete: false,
      })
      .returning();

    // Create the invoice items
    const invoiceItemsToCreate = quoteItemsList.map((item) => ({
      invoiceId: newInvoice.id,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      amount: item.amount,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    await db
      .insert(invoiceItems)
      .values(invoiceItemsToCreate);

    // Get client details for response
    const [client] = await db
      .select()
      .from(clients)
      .where(eq(clients.id, quote.clientId));

    // Return the new invoice ID and details
    return NextResponse.json({
      message: 'Quote successfully converted to invoice',
      invoiceId: newInvoice.id,
      invoiceNumber: newInvoice.invoiceNumber,
      clientName: client?.name || 'Unknown Client',
    });
  } catch (error) {
    console.error('Error converting quote to invoice:', error);
    return NextResponse.json(
      { message: 'Failed to convert quote to invoice' },
      { status: 500 }
    );
  }
} 