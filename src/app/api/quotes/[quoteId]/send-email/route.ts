import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { db } from '@/lib/db';
import { quotes, quoteItems, clients, companies, users } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { Resend } from 'resend';

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

// POST /api/quotes/[quoteId]/send-email - Send quote via email
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
    const userId = parseInt(session.user.id);

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
          eq(quotes.id, id),
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

    // Get sender information
    const [sender] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    if (!sender) {
      return NextResponse.json({ message: 'Sender information not found' }, { status: 404 });
    }

    // Check if client has an email
    if (!quoteData.client?.email) {
      return NextResponse.json(
        { message: 'Client has no email address' },
        { status: 400 }
      );
    }

    // Build URLs for the email
    const baseUrl = process.env.NEXT_PUBLIC_URL || 'https://summitfinance.app';
    const viewUrl = `${baseUrl}/quotes/${quoteId}`;
    const downloadUrl = `${baseUrl}/api/quotes/${quoteId}/pdf`;

    // Create a simple HTML email template
    const formattedDate = (date: string | Date) => {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    };

    const formatCurrency = (amount: string | number) => {
      return `$${parseFloat(amount.toString()).toFixed(2)}`;
    };

    // Create a simple HTML email
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { margin-bottom: 20px; }
            .details { background-color: #f9fafb; padding: 15px; border-radius: 4px; margin-bottom: 20px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 10px; }
            .total { font-weight: bold; border-top: 1px solid #e5e7eb; padding-top: 10px; }
            .button { display: inline-block; background-color: #10B981; color: white; padding: 10px 20px; 
                     text-decoration: none; border-radius: 4px; margin: 0 10px; }
            .button.secondary { background-color: #34D399; }
            .buttons { text-align: center; margin: 25px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Quote ${quoteData.quote.quoteNumber}</h1>
            </div>
            
            <p>Dear ${quoteData.client.name},</p>
            
            <p>We hope this email finds you well. Please find attached your quote 
               <strong>${quoteData.quote.quoteNumber}</strong> for the amount of 
               <strong>${formatCurrency(quoteData.quote.total)}</strong>.
            </p>
            
            <div class="details">
              <div class="row">
                <div>Issue Date:</div>
                <div>${formattedDate(quoteData.quote.issueDate)}</div>
              </div>
              <div class="row">
                <div>Expiry Date:</div>
                <div>${formattedDate(quoteData.quote.expiryDate)}</div>
              </div>
              <div class="row total">
                <div>Total Amount:</div>
                <div>${formatCurrency(quoteData.quote.total)}</div>
              </div>
            </div>
            
            <div class="buttons">
              <a href="${viewUrl}" class="button">View Quote</a>
              <a href="${downloadUrl}" class="button secondary">Download PDF</a>
            </div>
            
            <p>This quote is valid until ${formattedDate(quoteData.quote.expiryDate)}. 
               If you have any questions or would like to discuss any aspect of this quote, 
               please don't hesitate to contact us.</p>
            
            <p>Thank you for your consideration.</p>
            
            <p>Best regards,<br />
               ${sender.name}<br />
               ${quoteData.company?.name || 'Your Company'}</p>
          </div>
        </body>
      </html>
    `;

    // Send the email using Resend
    const { data, error } = await resend.emails.send({
      from: `${process.env.RESEND_FROM_NAME} <${process.env.RESEND_FROM_EMAIL || 'kugie@summitfinance.app'}>`,
      to: [quoteData.client.email],
      subject: `Quote ${quoteData.quote.quoteNumber} from ${quoteData.company?.name || 'Summit Finance'}`,
      html: htmlContent,
    });

    if (error) {
      console.error('Error sending email:', error);
      return NextResponse.json(
        { message: 'Failed to send email', error },
        { status: 500 }
      );
    }

    // If the quote is in draft status, update it to 'sent'
    if (quoteData.quote.status === 'draft') {
      await db
        .update(quotes)
        .set({
          status: 'sent',
          updatedAt: new Date().toISOString(),
        })
        .where(eq(quotes.id, id));
    }

    return NextResponse.json({
      message: 'Email sent successfully',
      emailId: data?.id
    });
  } catch (error) {
    console.error('Error sending quote email:', error);
    return NextResponse.json(
      { message: 'Failed to send email', error },
      { status: 500 }
    );
  }
} 