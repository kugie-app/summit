import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { db } from '@/lib/db';
import { invoices, clients, companies } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { ZodError } from 'zod';
import { Resend } from 'resend';
import { InvoiceEmail } from '@/emails/InvoiceEmail';

// Initialize Resend with API key
const resend = new Resend(process.env.RESEND_API_KEY);

// POST /api/invoices/[invoiceId]/send-email - Send an invoice via email
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  try {
    // Validate invoiceId parameter
    const { invoiceId } = await params;
    const id = parseInt(invoiceId);

    // Check authorization
    const session = await getServerSession(authOptions);
    if (!session?.user || !session.user.companyId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const companyId = parseInt(session.user.companyId);

    // Get invoice data with client and company information
    const invoiceResult = await db
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
          eq(invoices.id, id),
          eq(invoices.companyId, companyId),
          eq(invoices.softDelete, false)
        )
      );

    if (!invoiceResult.length) {
      return NextResponse.json({ message: 'Invoice not found' }, { status: 404 });
    }

    const invoiceData = invoiceResult[0];
    
    // Check if client data exists and has an email address
    if (!invoiceData.client || !invoiceData.client.email) {
      return NextResponse.json(
        { message: 'Client does not have an email address' },
        { status: 400 }
      );
    }
    
    // Construct the view URL for the invoice
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const viewUrl = `${baseUrl}/invoices/${id}`;
    
    // Prepare email data
    const emailProps = {
      invoiceNumber: invoiceData.invoice.invoiceNumber,
      clientName: invoiceData.client.name,
      issueDate: invoiceData.invoice.issueDate,
      dueDate: invoiceData.invoice.dueDate,
      total: invoiceData.invoice.total,
      status: invoiceData.invoice.status,
      viewUrl: viewUrl,
      companyName: invoiceData.company?.name || 'Your Company',
    };
    
    // Generate PDF for attachment (implementation depends on your PDF strategy)
    // This example redirects to the PDF endpoint which would need to be modified to return a buffer
    const pdfUrl = `${baseUrl}/api/invoices/${id}/pdf`;
    
    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: `${invoiceData.company?.name || 'Your Company'} <invoices@${process.env.RESEND_DOMAIN || 'example.com'}>`,
      to: invoiceData.client.email,
      subject: `Invoice ${invoiceData.invoice.invoiceNumber} from ${invoiceData.company?.name || 'Your Company'}`,
      react: InvoiceEmail(emailProps),
      text: `Invoice ${invoiceData.invoice.invoiceNumber} from ${invoiceData.company?.name || 'Your Company'}\n\nView your invoice at: ${viewUrl}`,
      // Uncomment when PDF attachment is ready
      // attachments: [
      //   {
      //     filename: `invoice-${invoiceData.invoice.invoiceNumber}.pdf`,
      //     content: pdfBuffer,
      //   },
      // ],
    });
    
    if (error) {
      console.error('Resend API error:', error);
      return NextResponse.json(
        { message: 'Failed to send email', error: error.message },
        { status: 500 }
      );
    }
    
    // Update invoice status to 'sent' if it's in 'draft' state
    if (invoiceData.invoice.status === 'draft') {
      await db
        .update(invoices)
        .set({
          status: 'sent',
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(invoices.id, id),
            eq(invoices.companyId, companyId)
          )
        );
    }
    
    return NextResponse.json({
      message: 'Email sent successfully',
      data: {
        emailId: data?.id,
        to: invoiceData.client.email,
      },
    });
  } catch (error) {
    console.error('Error sending invoice email:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { message: 'Invalid invoice ID' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'Failed to send email', error: (error as Error).message },
      { status: 500 }
    );
  }
} 