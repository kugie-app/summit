import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { invoices, invoiceItems, clients } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { invoiceSchema } from '@/lib/validations/invoice';
import { ZodError } from 'zod';
import { withAuth } from '@/lib/auth/getAuthInfo';

// Define response types
type InvoiceDetailResponse = {
  id: number;
  companyId: number;
  clientId: number;
  invoiceNumber: string;
  status: string;
  issueDate: string | Date;
  dueDate: string | Date;
  subtotal: string;
  tax: string | null;
  taxRate: string | null;
  total: string;
  notes: string | null;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  softDelete: boolean;
  client?: any;
  items: any[];
};

type ErrorResponse = {
  message: string;
  errors?: any;
};

// GET /api/invoices/[invoiceId] - Get a specific invoice
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  return withAuth<InvoiceDetailResponse | ErrorResponse>(request, async (authInfo) => {
    try {
      // Validate invoiceId parameter
      const { invoiceId } = await params;
      const id = parseInt(invoiceId);
      const { companyId } = authInfo;

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
  });
}

// PUT /api/invoices/[invoiceId] - Update an invoice
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  return withAuth<InvoiceDetailResponse | ErrorResponse>(request, async (authInfo) => {
    try {
      // Validate invoiceId parameter
      const { invoiceId } = await params;
      const id = parseInt(invoiceId);
      const { companyId } = authInfo;

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

      // Calculate values based on items, ignoring any client-provided values
      const subtotal = validatedData.items.reduce(
        (sum, item) => sum + item.quantity * parseFloat(item.unitPrice.toString()), 
        0
      );
      // Ensure tax is a percentage between 0-100, not a multiplier
      const taxPercentage = validatedData.taxRate || validatedData.tax || 0;
      const tax = (subtotal * taxPercentage) / 100;
      const total = subtotal + tax;

      // Start a transaction for updating invoice and items
      const transactionResult =  await db.transaction(async (tx) => {
        // Update invoice
        const [updatedInvoice] = await tx
          .update(invoices)
          .set({
            clientId: validatedData.clientId,
            invoiceNumber: validatedData.invoiceNumber,
            status: validatedData.status,
            issueDate: validatedData.issueDate.toISOString(),
            dueDate: validatedData.dueDate.toISOString(),
            subtotal: subtotal.toString(),
            taxRate: taxPercentage.toString(),
            tax: tax.toString(),
            total: total.toString(),
            notes: validatedData.notes || null,
            updatedAt: new Date().toISOString(),
            // Set paidAt if status is changed to paid
            paidAt: validatedData.status === 'paid' && existingInvoice[0].status !== 'paid'
              ? new Date().toISOString()
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
        const itemsToInsert = validatedData.items.map((item) => {
          // Calculate amount server-side regardless of what client sent
          const amount = item.quantity * parseFloat(item.unitPrice.toString());
          
          return {
            invoiceId: id,
            description: item.description,
            quantity: item.quantity.toString(),
            unitPrice: item.unitPrice.toString(),
            amount: amount.toString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        });

        const items = await tx
          .insert(invoiceItems)
          .values(itemsToInsert)
          .returning();

        return { ...updatedInvoice, items }
      });

      return NextResponse.json(transactionResult);
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
  });
}

// DELETE /api/invoices/[invoiceId] - Soft delete an invoice
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  return withAuth<{ message: string } | ErrorResponse>(request, async (authInfo) => {
    try {
      // Validate invoiceId parameter
      const { invoiceId } = await params;
      const id = parseInt(invoiceId);
      const { companyId } = authInfo;

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
          updatedAt: new Date().toISOString(),
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
  });
} 