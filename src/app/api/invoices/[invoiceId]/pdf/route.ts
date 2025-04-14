import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { db } from '@/lib/db';
import { invoices, invoiceItems, clients, companies } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { InvoicePDF } from '@/components/pdf/InvoicePDF';
import { renderToBuffer } from '@/lib/pdf';

// GET /api/invoices/[invoiceId]/pdf - Generate PDF for a specific invoice
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  try {
    const { invoiceId } = await params;
    const id = parseInt(invoiceId);

    // Check authorization
    const session = await getServerSession(authOptions);
    if (!session?.user || !session.user.companyId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const companyId = parseInt(session.user.companyId);

    // Get invoice with client and company data
    const [invoiceData] = await db
      .select({
        invoice: invoices,
        client: clients,
        company: companies,
      })
      .from(invoices)
      .leftJoin(clients, eq(invoices.clientId, clients.id))
      .leftJoin(companies, eq(invoices.companyId, companies.id))
      .where(
        and(
          eq(invoices.id, parseInt(invoiceId)),
          eq(invoices.companyId, companyId),
          eq(invoices.softDelete, false)
        )
      );

    if (!invoiceData) {
      return NextResponse.json({ message: 'Invoice not found' }, { status: 404 });
    }

    // Get invoice items
    const items = await db
      .select()
      .from(invoiceItems)
      .where(eq(invoiceItems.invoiceId, id));

    // Format data for PDF generation
    const invoice = {
      ...invoiceData.invoice,
      client: invoiceData.client,
      company: invoiceData.company,
      items,
    };

    // Generate PDF
    const pdfBuffer = await renderToBuffer(InvoicePDF, { invoice });

    // Set response headers for PDF download
    const headers = new Headers();
    headers.set('Content-Type', 'application/pdf');
    headers.set('Content-Disposition', `inline; filename="invoice-${invoiceId}.pdf"`);

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Error generating invoice PDF:', error);
    return NextResponse.json(
      { message: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
} 