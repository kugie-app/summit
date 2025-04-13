import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { db } from '@/lib/db';
import { invoices, invoiceItems, clients } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { invoiceSchema, invoiceParamsSchema } from '@/lib/validations/invoice';
import { ZodError } from 'zod';

// GET /api/invoices/[invoiceId] - Get a specific invoice
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

    // Get invoice with client data
    const [invoiceWithClient] = await db
      .select({
        invoice: invoices,
        client: clients,
      })
      .from(invoices)
      .leftJoin(clients, eq(invoices.clientId, clients.id))
      .where(
        and(
          eq(invoices.id, id),
          eq(invoices.companyId, companyId),
          eq(invoices.softDelete, false)
        )
      );

    if (!invoiceWithClient) {
      return NextResponse.json({ message: 'Invoice not found' }, { status: 404 });
    }

    // Get invoice items
    const items = await db
      .select()
      .from(invoiceItems)
      .where(eq(invoiceItems.invoiceId, id));

    // Format response
    const response = {
      ...invoiceWithClient.invoice,
      client: invoiceWithClient.client,
      items,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching invoice:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { message: 'Invalid invoice ID' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/invoices/[invoiceId] - Update an invoice
export async function PUT(
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

    // Check if invoice exists and belongs to the company
    const existingInvoice = await db
      .select()
      .from(invoices)
      .where(
        and(
          eq(invoices.id, id),
          eq(invoices.companyId, companyId),
          eq(invoices.softDelete, false)
        )
      )
      .limit(1);

    if (existingInvoice.length === 0) {
      return NextResponse.json({ message: 'Invoice not found' }, { status: 404 });
    }

    // Validate request body
    const body = await request.json();
    const validatedData = invoiceSchema.parse(body);

    // Start a transaction for updating invoice and items
    return await db.transaction(async (tx) => {
      // Update invoice
      const [updatedInvoice] = await tx
        .update(invoices)
        .set({
          clientId: validatedData.clientId,
          invoiceNumber: validatedData.invoiceNumber,
          status: validatedData.status,
          issueDate: validatedData.issueDate.toISOString(),
          dueDate: validatedData.dueDate.toISOString(),
          subtotal: validatedData.subtotal.toString(),
          tax: validatedData.tax.toString(),
          total: validatedData.total.toString(),
          notes: validatedData.notes || null,
          updatedAt: new Date(),
          // Set paidAt if status is changed to paid
          paidAt: validatedData.status === 'paid' && existingInvoice[0].status !== 'paid'
            ? new Date()
            : existingInvoice[0].paidAt,
        })
        .where(
          and(
            eq(invoices.id, id),
            eq(invoices.companyId, companyId)
          )
        )
        .returning();

      // Delete existing items
      await tx
        .delete(invoiceItems)
        .where(eq(invoiceItems.invoiceId, id));

      // Insert new items
      const itemsToInsert = validatedData.items.map((item) => ({
        invoiceId: id,
        description: item.description,
        quantity: item.quantity.toString(),
        unitPrice: item.unitPrice.toString(),
        amount: item.amount.toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      const items = await tx
        .insert(invoiceItems)
        .values(itemsToInsert)
        .returning();

      return NextResponse.json({ ...updatedInvoice, items });
    });
  } catch (error) {
    console.error('Error updating invoice:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { message: 'Validation error', errors: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/invoices/[invoiceId] - Soft delete an invoice
export async function DELETE(
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

    // Check if invoice exists
    const existingInvoice = await db
      .select({ id: invoices.id })
      .from(invoices)
      .where(
        and(
          eq(invoices.id, id),
          eq(invoices.companyId, companyId),
          eq(invoices.softDelete, false)
        )
      )
      .limit(1);

    if (existingInvoice.length === 0) {
      return NextResponse.json({ message: 'Invoice not found' }, { status: 404 });
    }

    // Soft delete invoice
    const [deletedInvoice] = await db
      .update(invoices)
      .set({
        softDelete: true,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(invoices.id, id),
          eq(invoices.companyId, companyId)
        )
      )
      .returning();

    return NextResponse.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Error deleting invoice:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { message: 'Invalid invoice ID' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 