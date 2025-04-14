import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { db } from '@/lib/db';
import { quotes, quoteItems, clients, companies } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { renderToBuffer } from '@/lib/pdf';
import { QuotePDF } from '@/components/quotes/QuotePDF';

// GET /api/quotes/[quoteId]/pdf - Generate PDF for a specific quote
export async function GET(
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

    // Get quote with client and company data
    const [quoteData] = await db
      .select({
        quote: quotes,
        client: clients,
        company: companies,
      })
      .from(quotes)
      .leftJoin(clients, eq(quotes.clientId, clients.id))
      .leftJoin(companies, eq(quotes.companyId, companies.id))
      .where(
        and(
          eq(quotes.id, parseInt(quoteId)),
          eq(quotes.companyId, companyId),
          eq(quotes.softDelete, false)
        )
      );

    if (!quoteData) {
      return NextResponse.json({ message: 'Quote not found' }, { status: 404 });
    }

    // Get quote items
    const items = await db
      .select()
      .from(quoteItems)
      .where(eq(quoteItems.quoteId, id));

    // Format data for PDF generation
    const quote = {
      ...quoteData.quote,
      client: quoteData.client,
      items,
      companyName: quoteData.company?.name || 'Your Company',
      companyAddress: quoteData.company?.address || undefined,
    };

    // Generate PDF using React PDF renderer
    try {
      const pdfBuffer = await renderToBuffer(QuotePDF, { quote });
      
      // Set headers for PDF download
      const headers = new Headers();
      headers.set('Content-Type', 'application/pdf');
      headers.set('Content-Disposition', `attachment; filename="quote-${quote.quoteNumber}.pdf"`);
      
      return new NextResponse(pdfBuffer, { 
        status: 200, 
        headers 
      });
    } catch (pdfError) {
      console.error('Error generating PDF:', pdfError);
      return NextResponse.json(
        { message: 'Failed to generate PDF' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error fetching quote data for PDF:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 