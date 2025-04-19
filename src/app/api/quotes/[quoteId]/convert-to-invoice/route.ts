import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { db } from '@/lib/db';
import { quotes, quoteItems, invoices, invoiceItems } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { format } from 'date-fns';
import { generateInvoiceNumber } from '@/lib/utils';

// POST /api/quotes/[quoteId]/convert-to-invoice - Convert quote to invoice
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ quoteId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !session.user.companyId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { quoteId } = await params; 
    const companyId = session.user.companyId;
    
    if (isNaN(Number(quoteId))) {
      return NextResponse.json(
        { error: 'Invalid quote ID' },
        { status: 400 }
      );
    }
    
    // Find the quote and check if it belongs to the user's company
    const quote = await db.select().from(quotes).where(
      and(
        eq(quotes.id, Number(quoteId)),
        eq(quotes.companyId, Number(companyId)),
        eq(quotes.softDelete, false)
      )
    );
    
    if (!quote) {
      return NextResponse.json(
        { error: 'Quote not found' },
        { status: 404 }
      );
    }
    
    // Check if the quote is already converted to an invoice
    if (quote[0].convertedToInvoiceId) {
      return NextResponse.json(
        { error: 'Quote already converted to invoice', invoiceId: quote[0].convertedToInvoiceId },
        { status: 400 }
      );
    }
    
    // Check if the quote is in a valid state to be converted (e.g., accepted)
    if (quote[0].status !== 'accepted') {
      return NextResponse.json(
        { error: 'Only accepted quotes can be converted to invoices' },
        { status: 400 }
      );
    }
    
    // Get the quote items
    const quoteItemsList = await db.select().from(quoteItems).where(eq(quoteItems.quoteId, Number(quoteId)));
    
    // Generate a new invoice number
    const invoiceNumber = generateInvoiceNumber();
    
    // Start a transaction to create the invoice
    const result = await db.transaction(async (tx) => {
      // Create the invoice
      const [newInvoice] = await tx.insert(invoices)
        .values({
          companyId: Number(companyId),
          clientId: quote[0].clientId,
          invoiceNumber,
          status: 'draft', // Start as draft
          issueDate: format(new Date(), 'yyyy-MM-dd'),
          dueDate: format(new Date(new Date().setDate(new Date().getDate() + 30)), 'yyyy-MM-dd'), // Due in 30 days
          subtotal: quote[0].subtotal,
          tax: quote[0].tax,
          total: quote[0].total,
          notes: quote[0].notes,
          currency: 'USD',
          recurring: 'none',
          createdAt: new Date(),
          updatedAt: new Date(),
          softDelete: false,
        })
        .returning();
      
      // Create the invoice items
      const invoiceItemsData = quoteItemsList.map(item => ({
        invoiceId: newInvoice.id,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        amount: item.amount,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));
      
      await tx.insert(invoiceItems).values(invoiceItemsData);
      
      // Update the quote with the invoice ID reference
      await tx.update(quotes)
        .set({
          convertedToInvoiceId: newInvoice.id,
          updatedAt: new Date(),
        })
        .where(eq(quotes.id, Number(quoteId)));
      
      return newInvoice;
    });
    
    return NextResponse.json({
      message: 'Quote successfully converted to invoice',
      invoiceId: result.id,
    });
    
  } catch (error) {
    console.error('Error converting quote to invoice:', error);
    return NextResponse.json(
      { error: 'Failed to convert quote to invoice' },
      { status: 500 }
    );
  }
} 