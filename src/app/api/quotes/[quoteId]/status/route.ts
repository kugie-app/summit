import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { db } from '@/lib/db';
import { quotes } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { quoteStatusUpdateSchema } from '@/lib/validations/quote';

// PATCH /api/quotes/[quoteId]/status - Update a quote's status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ quoteId: string }> }
) {
  try {
    // Check authorization
    const session = await getServerSession(authOptions);
    if (!session?.user || !session.user.companyId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const companyId = parseInt(session.user.companyId);
    const { quoteId } = await params;
    const id = parseInt(quoteId);

    // Validate request body
    const body = await request.json();
    const validatedData = quoteStatusUpdateSchema.parse(body);

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

    // Determine if we need to set acceptedAt date
    const updates: any = {
      status: validatedData.status,
      updatedAt: new Date().toISOString(),
    };

    // If status is changing to accepted, set acceptedAt
    if (validatedData.status === 'accepted' && existingQuote[0].status !== 'accepted') {
      updates.acceptedAt = new Date().toISOString();
    }

    // Update the quote status
    const [updatedQuote] = await db
      .update(quotes)
      .set(updates)
      .where(
        and(
          eq(quotes.id, parseInt(quoteId)),
          eq(quotes.companyId, companyId)
        )
      )
      .returning();

    return NextResponse.json(updatedQuote);
  } catch (error: any) {
    console.error('Error updating quote status:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { message: 'Invalid status value' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: 'Failed to update quote status' },
      { status: 500 }
    );
  }
} 