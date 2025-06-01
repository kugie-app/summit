import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { invoices } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';

// POST /api/webhooks/xendit/payment - Handle Xendit payment callbacks
export async function POST(request: NextRequest) {
  try {
    // Verify the Xendit webhook using token verification
    const callbackToken = request.headers.get('x-callback-token');
    const expectedToken = process.env.XENDIT_CALLBACK_VERIFICATION_TOKEN;

    if (callbackToken !== expectedToken) {
      console.error('Invalid Xendit callback token');
      return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
    }

    // Parse the request body
    const payload = await request.json();

    // Ensure status is PAID
    if (payload.status !== 'PAID') {
      return NextResponse.json({ message: 'Not a paid event' }, { status: 200 });
    }

    // Extract invoice number from the description or external_id
    let invoiceNumber: string | null = null;

    // Try to extract from description first: "Payment for Invoice #INV-20250506-523"
    if (payload.description && payload.description.includes('Payment for Invoice #')) {
      invoiceNumber = payload.description.split('Payment for Invoice #')[1].trim();
    } 
    // If description parsing fails, try external_id: "inv-32-INV20250506523"
    else if (payload.external_id && payload.external_id.includes('inv-')) {
      // Extract the part after "inv-XX-"
      const match = payload.external_id.match(/^inv-\d+-(.+)$/);
      if (match && match[1]) {
        // Format the extracted part to include hyphens (INV20250506523 -> INV-20250506-523)
        const extracted = match[1];
        if (extracted.startsWith('INV')) {
          // Add hyphens in the expected positions for the invoice number format
          invoiceNumber = extracted.replace(/^(INV)(\d{8})(\d+)$/, '$1-$2-$3');
        } else {
          invoiceNumber = extracted;
        }
      }
    }

    if (!invoiceNumber) {
      console.error('Could not extract invoice number from payload', payload);
      return NextResponse.json(
        { message: 'Could not extract invoice number' }, 
        { status: 400 }
      );
    }

    // Find the invoice by invoice number
    const [invoice] = await db
      .select()
      .from(invoices)
      .where(
        and(
          eq(invoices.invoiceNumber, invoiceNumber),
          eq(invoices.softDelete, false)
        )
      )
      .limit(1);
    
    if (!invoice) {
      console.error('Invoice not found with number:', invoiceNumber);
      return NextResponse.json({ message: 'Invoice not found' }, { status: 404 });
    }
    
    // Update the invoice status to paid
    await db
      .update(invoices)
      .set({
        status: 'paid',
        paidAt: new Date(payload.paid_at || payload.updated).toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(invoices.id, invoice.id));
    
    return NextResponse.json({ 
      message: 'Invoice marked as paid successfully',
      invoiceId: invoice.id,
      invoiceNumber: invoiceNumber
    }, { status: 200 });
    
  } catch (error) {
    console.error('Error processing Xendit payment webhook:', error);
    return NextResponse.json(
      { message: 'Failed to process webhook' },
      { status: 500 }
    );
  }
} 