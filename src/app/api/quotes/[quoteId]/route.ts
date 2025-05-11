import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { quotes, quoteItems, clients, companies } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { quoteSchema } from '@/lib/validations/quote';
import { ZodError } from 'zod';
import { withAuth } from '@/lib/auth/getAuthInfo';

// Define response types
type QuoteDetailResponse = {
  id: number;
  companyId: number;
  clientId: number;
  quoteNumber: string;
  status: string;
  issueDate: string | Date;
  expiryDate: string | Date;
  subtotal: string;
  tax: string | null;
  taxRate: string | null;
  total: string;
  notes: string | null;
  acceptedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  softDelete: boolean;
  convertedToInvoiceId: number | null;
  client?: any;
  company?: any;
  items: any[];
};

type ErrorResponse = {
  message: string;
  errors?: any;
};

// GET /api/quotes/[quoteId] - Get a specific quote
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ quoteId: string }> }
) {
  return withAuth<QuoteDetailResponse | ErrorResponse>(request, async (authInfo) => {
    try {
      // Validate quoteId parameter
      const { quoteId } = await params;
      const id = parseInt(quoteId);
      const { companyId } = authInfo;

      // Get quote with client data
      const [quoteWithClient] = await db
        .select({
          quote: quotes,
          client: clients,
        })
        .from(quotes)
        .leftJoin(clients, eq(quotes.clientId, clients.id))
        .where(
          and(
            eq(quotes.id, id),
            eq(quotes.companyId, companyId),
            eq(quotes.softDelete, false)
          )
        );

      if (!quoteWithClient) {
        return NextResponse.json({ message: 'Quote not found' }, { status: 404 });
      }

      // Get quote items
      const items = await db
        .select()
        .from(quoteItems)
        .where(eq(quoteItems.quoteId, id));

      // Get company information
      const companyData = await db
        .select()
        .from(companies)
        .where(eq(companies.id, companyId))
        .limit(1);

      // Format response
      const response = {
        ...quoteWithClient.quote,
        client: quoteWithClient.client,
        company: companyData[0],
        items,
      };

      return NextResponse.json(response);
    } catch (error) {
      console.error('Error fetching quote:', error);

      if (error instanceof ZodError) {
        return NextResponse.json(
          { message: 'Invalid quote ID' },
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

// PUT /api/quotes/[quoteId] - Update a quote
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ quoteId: string }> }
) {
  return withAuth<QuoteDetailResponse | ErrorResponse>(request, async (authInfo) => {
    try {
      // Validate quoteId parameter
      const { quoteId } = await params;
      const id = parseInt(quoteId);
      const { companyId } = authInfo;

      // Check if quote exists and belongs to the company
      const existingQuote = await db
        .select()
        .from(quotes)
        .where(
          and(
            eq(quotes.id, id),
            eq(quotes.companyId, companyId),
            eq(quotes.softDelete, false)
          )
        )
        .limit(1);

      if (existingQuote.length === 0) {
        return NextResponse.json({ message: 'Quote not found' }, { status: 404 });
      }

      // Validate request body
      const body = await request.json();
      const validatedData = quoteSchema.parse(body);

      // Calculate values based on items, ignoring any client-provided values
      const subtotal = validatedData.items.reduce(
        (sum, item) => sum + item.quantity * parseFloat(item.unitPrice.toString()), 
        0
      );
      // Ensure tax is a percentage between 0-100, not a multiplier
      const taxPercentage = validatedData.taxRate || validatedData.tax || 0;
      const tax = (subtotal * taxPercentage) / 100;
      const total = subtotal + tax;

      // Start a transaction for updating quote and items
      return await db.transaction(async (tx) => {
        // Update quote
        const [updatedQuote] = await tx
          .update(quotes)
          .set({
            clientId: validatedData.clientId,
            quoteNumber: validatedData.quoteNumber,
            status: validatedData.status,
            issueDate: validatedData.issueDate.toISOString(),
            expiryDate: validatedData.expiryDate.toISOString(),
            subtotal: subtotal.toString(),
            taxRate: taxPercentage.toString(),
            tax: tax.toString(),
            total: total.toString(),
            notes: validatedData.notes || null,
            updatedAt: new Date(),
            // Set acceptedAt if status is changed to accepted
            acceptedAt: validatedData.status === 'accepted' && existingQuote[0].status !== 'accepted'
              ? new Date()
              : existingQuote[0].acceptedAt,
          })
          .where(
            and(
              eq(quotes.id, id),
              eq(quotes.companyId, companyId)
            )
          )
          .returning();

        // Delete existing items
        await tx
          .delete(quoteItems)
          .where(eq(quoteItems.quoteId, id));

        // Insert new items
        const itemsToInsert = validatedData.items.map((item) => {
          // Calculate amount server-side regardless of what client sent
          const amount = item.quantity * parseFloat(item.unitPrice.toString());
          
          return {
            quoteId: id,
            description: item.description,
            quantity: item.quantity.toString(),
            unitPrice: item.unitPrice.toString(),
            amount: amount.toString(),
            createdAt: new Date(),
            updatedAt: new Date(),
          };
        });

        const items = await tx
          .insert(quoteItems)
          .values(itemsToInsert)
          .returning();

        return NextResponse.json({ ...updatedQuote, items });
      });
    } catch (error) {
      console.error('Error updating quote:', error);

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

// DELETE /api/quotes/[quoteId] - Soft delete a quote
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ quoteId: string }> }
) {
  return withAuth<{ message: string } | ErrorResponse>(request, async (authInfo) => {
    try {
      // Validate quoteId parameter
      const { quoteId } = await params;
      const id = parseInt(quoteId);
      const { companyId } = authInfo;

      // Check if quote exists
      const existingQuote = await db
        .select({ id: quotes.id })
        .from(quotes)
        .where(
          and(
            eq(quotes.id, id),
            eq(quotes.companyId, companyId),
            eq(quotes.softDelete, false)
          )
        )
        .limit(1);

      if (existingQuote.length === 0) {
        return NextResponse.json({ message: 'Quote not found' }, { status: 404 });
      }

      // Soft delete quote
      const [deletedQuote] = await db
        .update(quotes)
        .set({
          softDelete: true,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(quotes.id, id),
            eq(quotes.companyId, companyId)
          )
        )
        .returning();

      return NextResponse.json({ message: 'Quote deleted successfully' });
    } catch (error) {
      console.error('Error deleting quote:', error);

      if (error instanceof ZodError) {
        return NextResponse.json(
          { message: 'Invalid quote ID' },
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