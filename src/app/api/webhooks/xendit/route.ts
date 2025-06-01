import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { invoices, payments, accounts, transactions } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { verifyWebhookSignature } from '@/lib/xendit';
import { format } from 'date-fns';

// POST /api/webhooks/xendit - Handle Xendit payment callbacks
export async function POST(request: NextRequest) {
  try {
    // Verify the Xendit webhook signature
    const callbackToken = request.headers.get('x-callback-token');
    const expectedToken = process.env.XENDIT_CALLBACK_VERIFICATION_TOKEN;

    if (!verifyWebhookSignature(callbackToken, expectedToken)) {
      console.error('Invalid Xendit callback signature');
      return NextResponse.json({ message: 'Invalid signature' }, { status: 401 });
    }

    // Parse the request body
    const payload = await request.json();

    // Only process invoice.paid events
    if (payload.event !== 'invoice.paid') {
      return NextResponse.json({ message: 'Event type not handled' }, { status: 200 });
    }

    // Extract the external_id which should be in the format 'inv-{invoiceId}-{invoiceNumber}'
    const externalId = payload.data.external_id;
    
    // Extract invoice ID from the external_id pattern (inv-{invoiceId}-{invoiceNumber})
    const invoiceIdMatch = externalId.match(/^inv-(\d+)-/);
    if (!invoiceIdMatch || !invoiceIdMatch[1]) {
      console.error('Invalid external_id format:', externalId);
      return NextResponse.json({ message: 'Invalid external_id format' }, { status: 400 });
    }
    
    const invoiceId = parseInt(invoiceIdMatch[1]);
    
    // Fetch the invoice
    const [invoice] = await db
      .select()
      .from(invoices)
      .where(
        and(
          eq(invoices.id, invoiceId),
          eq(invoices.softDelete, false)
        )
      )
      .limit(1);
    
    if (!invoice) {
      console.error('Invoice not found for ID:', invoiceId);
      return NextResponse.json({ message: 'Invoice not found' }, { status: 404 });
    }
    
    // Check if payment for this Xendit invoice already processed
    const existingPayment = await db
      .select()
      .from(payments)
      .where(
        and(
          eq(payments.invoiceId, invoiceId),
          eq(payments.paymentProcessorReference, payload.data.id),
          eq(payments.softDelete, false)
        )
      )
      .limit(1);
    
    if (existingPayment.length > 0) {
      return NextResponse.json({ message: 'Payment already processed' }, { status: 200 });
    }
    
    // Find a default account to record the transaction (optional)
    const [account] = await db
      .select()
      .from(accounts)
      .where(
        and(
          eq(accounts.companyId, invoice.companyId),
          eq(accounts.softDelete, false)
        )
      )
      .limit(1);
      
    // Format the payment date
    const paidAtDate = new Date(payload.data.paid_at);
    const formattedPaymentDate = format(paidAtDate, 'yyyy-MM-dd');
    
    // Process the payment in a transaction to ensure database consistency
    await db.transaction(async (tx) => {
      // 1. Create the payment record
      const [payment] = await tx
        .insert(payments)
        .values({
          companyId: invoice.companyId,
          invoiceId: invoice.id,
          clientId: invoice.clientId,
          amount: payload.data.amount.toString(),
          currency: payload.data.currency,
          paymentDate: formattedPaymentDate,
          paymentMethod: 'card', // Using 'card' as it's the closest match in our enum
          paymentProcessorReference: payload.data.id,
          status: 'completed',
          notes: `Paid via Xendit (${payload.data.payment_method})`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          softDelete: false,
        })
        .returning();
      
      // 2. Update the invoice status
      await tx
        .update(invoices)
        .set({
          status: 'paid',
          paidAt: paidAtDate.toISOString(),
          updatedAt: new Date().toISOString(),
        })
        .where(eq(invoices.id, invoice.id));
      
      // 3. Create a transaction record if we have an account
      if (account) {
        const [transaction] = await tx
          .insert(transactions)
          .values({
            companyId: invoice.companyId,
            accountId: account.id,
            type: 'credit', // It's income, so credit
            description: `Payment received for Invoice #${invoice.invoiceNumber}`,
            amount: payload.data.amount.toString(),
            currency: payload.data.currency,
            transactionDate: formattedPaymentDate,
            relatedInvoiceId: invoice.id,
            reconciled: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            softDelete: false,
          })
          .returning();
        
        // 4. Update the payment with the transaction link
        await tx
          .update(payments)
          .set({
            transactionId: transaction.id,
          })
          .where(eq(payments.id, payment.id));
        
        // 5. Update the account balance
        const currentBalance = parseFloat(account.currentBalance);
        const paymentAmount = parseFloat(payload.data.amount);
        const newBalance = currentBalance + paymentAmount;
        
        await tx
          .update(accounts)
          .set({
            currentBalance: newBalance.toString(),
            updatedAt: new Date().toISOString(),
          })
          .where(eq(accounts.id, account.id));
      }
    });
    
    return NextResponse.json({ message: 'Payment processed successfully' }, { status: 200 });
    
  } catch (error) {
    console.error('Error processing Xendit webhook:', error);
    return NextResponse.json(
      { message: 'Failed to process webhook' },
      { status: 500 }
    );
  }
} 