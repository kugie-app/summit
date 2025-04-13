import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { db } from '@/lib/db';
import { invoices, invoiceItems, clients, companies } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { invoiceParamsSchema } from '@/lib/validations/invoice';
import { ZodError } from 'zod';

// GET /api/invoices/[invoiceId]/pdf - Redirect to a client-side PDF generation page
export async function GET(
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

    // Check if invoice exists and belongs to user's company
    const invoiceCheck = await db
      .select({ id: invoices.id })
      .from(invoices)
      .where(
        and(
          eq(invoices.id, id),
          eq(invoices.companyId, companyId),
          eq(invoices.softDelete, false)
        )
      );

    if (!invoiceCheck.length) {
      return NextResponse.json({ message: 'Invoice not found' }, { status: 404 });
    }

    // Instead of trying to render PDFs on the server, redirect to a client-side PDF viewer
    // This avoids issues with server-side JSX rendering and provides a better user experience
    return NextResponse.redirect(new URL(`/invoices/${invoiceId}/print`, request.url));
  } catch (error) {
    console.error('Error processing PDF request:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { message: 'Invalid invoice ID' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'Failed to process PDF request' },
      { status: 500 }
    );
  }
} 