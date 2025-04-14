import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { db } from '@/lib/db';
import { quotes, quoteItems, clients } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { quoteSchema, quoteParamsSchema } from '@/lib/validations/quote';
import { ZodError } from 'zod';

// GET /api/quotes/[quoteId] - Get a specific quote
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ quoteId: string }> }
) {
  try {
    // Validate quoteId parameter
    const { quoteId } = await params;
    const id = parseInt(quoteId);

    // Check authorization
    const session = await getServerSession(authOptions);
    if (!session?.user || !session.user.companyId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const companyId = parseInt(session.user.companyId);

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
          eq(quotes.id, parseInt(quoteId)),
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

    // Format response
    const response = {
      ...quoteWithClient.quote,
      client: quoteWithClient.client,
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
}

// PUT /api/quotes/[quoteId] - Update a quote
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ quoteId: string }> }
) {
  try {
    // Validate quoteId parameter
    const { quoteId } = await params;
    const id = parseInt(quoteId);

    // Check authorization
    const session = await getServerSession(authOptions);
    if (!session?.user || !session.user.companyId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const companyId = parseInt(session.user.companyId);

    // Check if quote exists and belongs to the company
    const existingQuote = await db
      .select()
      .from(quotes)
      .where(
        and(
          eq(quotes.id, parseInt(quoteId)),
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
          subtotal: validatedData.subtotal.toString(),
          tax: validatedData.tax.toString(),
          total: validatedData.total.toString(),
          notes: validatedData.notes || null,
          updatedAt: new Date(),
          // Set acceptedAt if status is changed to accepted
          acceptedAt: validatedData.status === 'accepted' && existingQuote[0].status !== 'accepted'
            ? new Date()
            : existingQuote[0].acceptedAt,
        })
        .where(
          and(
            eq(quotes.id, parseInt(quoteId)),
            eq(quotes.companyId, companyId)
          )
        )
        .returning();

      // Delete existing items
      await tx
        .delete(quoteItems)
        .where(eq(quoteItems.quoteId, id));

      // Insert new items
      const itemsToInsert = validatedData.items.map((item) => ({
        quoteId: id,
        description: item.description,
        quantity: item.quantity.toString(),
        unitPrice: item.unitPrice.toString(),
        amount: item.amount.toString(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

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
}

// DELETE /api/quotes/[quoteId] - Soft delete a quote
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ quoteId: string }> }
) {
  try {
    // Validate quoteId parameter
    const { quoteId } = await params;
    const id = parseInt(quoteId);

    // Check authorization
    const session = await getServerSession(authOptions);
    if (!session?.user || !session.user.companyId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const companyId = parseInt(session.user.companyId);

    // Check if quote exists
    const existingQuote = await db
      .select({ id: quotes.id })
      .from(quotes)
      .where(
        and(
          eq(quotes.id, parseInt(quoteId)),
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
          eq(quotes.id, parseInt(quoteId)),
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
} 