import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { db } from '@/lib/db';
import { invoices, invoiceItems, clients, companies } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { renderToBuffer } from '@/lib/pdf';
import { InvoicePDF } from '@/components/pdf/InvoicePDF';
import { getPresignedUrl } from '@/lib/minio';

// GET /api/invoices/[invoiceId]/pdf - Generate PDF for an invoice
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !session.user.companyId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const companyId = parseInt(session.user.companyId);
    const { invoiceId } = await params;

    // Get invoice data
    const [invoice] = await db
      .select()
      .from(invoices)
      .where(
        and(
          eq(invoices.id, parseInt(invoiceId)),
          eq(invoices.companyId, companyId),
          eq(invoices.softDelete, false)
        )
      );

    if (!invoice) {
      return NextResponse.json({ message: 'Invoice not found' }, { status: 404 });
    }

    // Get invoice items
    const items = await db
      .select()
      .from(invoiceItems)
      .where(eq(invoiceItems.invoiceId, parseInt(invoiceId)));

    // Get client details
    const [client] = await db
      .select()
      .from(clients)
      .where(eq(clients.id, invoice.clientId));

    // Get company details
    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, companyId));

    // Prepare data for PDF
    const pdfData = {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.status,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      subtotal: invoice.subtotal,
      tax: invoice.tax,
      total: invoice.total,
      notes: invoice.notes,
      currency: invoice.currency || company.defaultCurrency,
      items: items.map(item => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        amount: item.amount
      })),
      client: {
        id: client.id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        address: client.address
      },
      company: {
        name: company.name,
        address: company.address,
        defaultCurrency: company.defaultCurrency,
        logoUrl: company.logoUrl ? await getPresignedUrl(company.logoUrl) : null,
        bankAccount: company.bankAccount
      }
    };

    // Generate PDF
    const pdfBuffer = await renderToBuffer(InvoicePDF, { invoice: pdfData });

    // Send PDF as response
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    return NextResponse.json(
      { message: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
} 