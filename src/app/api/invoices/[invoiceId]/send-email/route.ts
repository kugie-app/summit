import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { db } from '@/lib/db';
import { invoices, invoiceItems, clients, companies, users } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { Resend } from 'resend';

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

// POST /api/invoices/[invoiceId]/send-email - Send invoice via email
export async function POST(
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
    const userId = parseInt(session.user.id);

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

    // Get sender information
    const [sender] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));

    if (!sender) {
      return NextResponse.json({ message: 'Sender information not found' }, { status: 404 });
    }

    // Check if client has an email
    if (!invoiceData.client?.email) {
      return NextResponse.json(
        { message: 'Client has no email address' },
        { status: 400 }
      );
    }

    // Build URLs for the email
    const baseUrl = `${request.nextUrl.protocol}//${request.nextUrl.host}`;
    const viewUrl = `${baseUrl}/invoices/${invoiceId}`;
    const downloadUrl = `${baseUrl}/api/invoices/${invoiceId}/pdf`;
    const paymentUrl = `${baseUrl}/invoices/${invoiceId}/pay`; // If you implement payment functionality

    // Create a simple HTML email template
    const formattedDate = (date: string | Date) => {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    };

    const formatCurrency = (amount: string | number) => {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
      }).format(Number(amount));
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
            .footer { margin-top: 30px; text-align: center; font-size: 14px; color: #666; }
            .button { display: inline-block; background-color: #10B981; color: white; padding: 10px 20px; 
                     text-decoration: none; border-radius: 4px; margin: 0 10px; }
            .button.secondary { background-color: #34D399; }
            .button.tertiary { background-color: #3B82F6; }
            .buttons { text-align: center; margin: 25px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Invoice ${invoiceData.invoice.invoiceNumber}</h1>
            </div>
            
            <p>Dear ${invoiceData.client.name},</p>
            
            <p>We hope this email finds you well. Please find attached your invoice 
               <strong>${invoiceData.invoice.invoiceNumber}</strong> for the amount of 
               <strong>${formatCurrency(invoiceData.invoice.total)}</strong>.
            </p>
            
            <div class="details">
              <div class="row">
                <div>Issue Date:</div>
                <div>${formattedDate(invoiceData.invoice.issueDate)}</div>
              </div>
              <div class="row">
                <div>Due Date:</div>
                <div>${formattedDate(invoiceData.invoice.dueDate)}</div>
              </div>
              <div class="row" style="font-weight: bold; border-top: 1px solid #e5e7eb; padding-top: 10px;">
                <div>Total Amount:</div>
                <div>${formatCurrency(invoiceData.invoice.total)}</div>
              </div>
            </div>
            
            <div class="buttons">
              <a href="${viewUrl}" class="button">View Invoice</a>
              <a href="${downloadUrl}" class="button secondary">Download PDF</a>
              ${paymentUrl ? `<a href="${paymentUrl}" class="button tertiary">Pay Now</a>` : ''}
            </div>
            
            <p>If you have any questions regarding this invoice, please don't hesitate to contact us.</p>
            
            <p>Thank you for your business!</p>
            
            <div class="footer">
              ${invoiceData.company?.name || 'Your Company'} - ${new Date().getFullYear()}
            </div>
          </div>
        </body>
      </html>
    `;

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: `${sender.name} <${process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'}>`,
      to: [invoiceData.client.email],
      subject: `Invoice ${invoiceData.invoice.invoiceNumber} from ${invoiceData.company?.name || 'Your Company'}`,
      html: htmlContent,
      replyTo: sender.email,
    });

    if (error) {
      console.error('Error sending invoice email:', JSON.stringify(error));
      console.error('Error data:', JSON.stringify(data));
      return NextResponse.json(
        { message: 'Failed to send email', error: error.message },
        { status: 500 }
      );
    }

    // Update invoice status to 'sent' if it was in 'draft'
    if (invoiceData.invoice.status === 'draft') {
      await db
        .update(invoices)
        .set({
          status: 'sent',
          updatedAt: new Date(),
        })
        .where(eq(invoices.id, id));
    }

    return NextResponse.json({
      message: 'Email sent successfully',
      data,
    });
  } catch (error) {
    console.error('Error sending invoice email:', error);
    return NextResponse.json(
      { message: 'Failed to send email', error: (error as Error).message },
      { status: 500 }
    );
  }
} 