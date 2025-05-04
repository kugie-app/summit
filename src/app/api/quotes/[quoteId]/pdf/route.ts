import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { db } from '@/lib/db';
import { quotes, quoteItems, clients, companies } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { renderToBuffer } from '@/lib/pdf';
import { QuotePDF } from '@/components/pdf/QuotePDF';
import { getPresignedUrl } from '@/lib/minio';

// GET /api/quotes/[quoteId]/pdf - Generate PDF for a quote
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ quoteId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !session.user.companyId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const companyId = parseInt(session.user.companyId);
    const { quoteId } = await params;

    // Get quote data
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

    // Get quote items
    const items = await db
      .select()
      .from(quoteItems)
      .where(eq(quoteItems.quoteId, parseInt(quoteId)));

    // Get client details
    const [client] = await db
      .select()
      .from(clients)
      .where(eq(clients.id, quote.clientId));

    // Get company details
    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, companyId));

    // Prepare data for PDF
    const pdfData = {
      id: quote.id,
      quoteNumber: quote.quoteNumber,
      status: quote.status,
      issueDate: quote.issueDate,
      expiryDate: quote.expiryDate,
      subtotal: quote.subtotal,
      tax: quote.tax,
      total: quote.total,
      notes: quote.notes,
      currency: company.defaultCurrency,
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
    const pdfBuffer = await renderToBuffer(QuotePDF, { quote: pdfData });

    // Send PDF as response
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="quote-${quote.quoteNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Error generating quote PDF:', error);
    return NextResponse.json(
      { message: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
} 