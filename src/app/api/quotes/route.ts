import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { db } from '@/lib/db';
import { clients, quotes, quoteItems } from '@/lib/db/schema';
import { and, eq, desc, asc, like, or, count, inArray, sql } from 'drizzle-orm';
import { authOptions } from '@/lib/auth/options';
import { quoteSchema, quoteItemSchema } from '@/lib/validations/quote';
import { withAuth } from '@/lib/auth/getAuthInfo';

// GET /api/quotes - List all quotes with pagination, sorting, and filtering
export async function GET(request: NextRequest) {
  return withAuth(request, async (authInfo) => {
    try {
      const { companyId } = authInfo;

      // Parse query parameters
      const searchParams = request.nextUrl.searchParams;
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '10');
      const sortBy = searchParams.get('sortBy') || 'createdAt';
      const sortOrder = searchParams.get('sortOrder') || 'desc';
      const status = searchParams.get('status');
      const search = searchParams.get('search') || '';
      
      const offset = (page - 1) * limit;
      
      // Build the base conditions
      let conditions = and(
        eq(quotes.companyId, companyId),
        eq(quotes.softDelete, false)
      );
      
      // Add status filter if provided
      if (status && status !== 'all') {
        if (['draft', 'sent', 'accepted', 'rejected', 'expired'].includes(status)) {
          conditions = and(
            conditions,
            eq(quotes.status, status as 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired')
          );
        }
      }
      
      // Add search filter
      if (search) {
        conditions = and(
          conditions,
          or(
            like(quotes.quoteNumber, `%${search}%`),
            like(clients.name, `%${search}%`)
          )
        );
      }
      
      // Count total records for pagination
      const totalCountResult = await db
        .select({ count: count() })
        .from(quotes)
        .leftJoin(clients, eq(quotes.clientId, clients.id))
        .where(conditions);
      
      const totalCount = Number(totalCountResult[0]?.count || 0);
      
      // Execute the query with sorting, limit and offset
      const quoteResults = await db
        .select({
          quote: quotes,
          client: {
            id: clients.id,
            name: clients.name,
            email: clients.email,
          },
        })
        .from(quotes)
        .leftJoin(clients, eq(quotes.clientId, clients.id))
        .where(conditions)
        .orderBy(
          sortOrder === 'asc'
            ? asc(quotes[sortBy as keyof typeof quotes] as any)
            : desc(quotes[sortBy as keyof typeof quotes] as any)
        )
        .limit(limit)
        .offset(offset);
      
      if (quoteResults.length === 0) {
        return NextResponse.json({
          data: [],
          total: 0,
          page,
          limit,
          totalPages: 0,
        });
      }
      
      // Get all quote IDs
      const quoteIds = quoteResults.map(result => result.quote.id);
      
      // Get items for all quotes
      const items = await db
        .select()
        .from(quoteItems)
        .where(inArray(quoteItems.quoteId, quoteIds));
      
      // Group items by quote ID
      const itemsByQuoteId: Record<number, any[]> = {};
      
      for (const item of items) {
        if (!itemsByQuoteId[item.quoteId]) {
          itemsByQuoteId[item.quoteId] = [];
        }
        itemsByQuoteId[item.quoteId].push(item);
      }
      
      // Format quote results
      const formattedQuotes = quoteResults.map(result => {
        const { quote, client } = result;
        
        return {
          ...quote,
          client,
          items: itemsByQuoteId[quote.id] || [],
        };
      });
      
      return NextResponse.json({
        data: formattedQuotes,
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      });
      
    } catch (error) {
      console.error('Error fetching quotes:', error);
      return NextResponse.json(
        { message: 'Failed to fetch quotes' },
        { status: 500 }
      );
    }
  });
}

// POST /api/quotes - Create a new quote
export async function POST(request: NextRequest) {
  return withAuth(request, async (authInfo) => {
    try {
      const { companyId } = authInfo;
      
      const body = await request.json();
      
      // Validate input data
      const validationResult = quoteSchema.safeParse(body);
      
      if (!validationResult.success) {
        return NextResponse.json(
          { message: 'Validation failed', errors: validationResult.error.format() },
          { status: 400 }
        );
      }
      
      const { clientId, quoteNumber, status, issueDate, expiryDate, taxRate, notes, items } = validationResult.data;
      
      // Check if client exists and belongs to the company
      const existingClient = await db
        .select()
        .from(clients)
        .where(
          and(
            eq(clients.id, clientId),
            eq(clients.companyId, companyId),
            eq(clients.softDelete, false)
          )
        )
        .limit(1);
      
      if (existingClient.length === 0) {
        return NextResponse.json(
          { message: 'Client not found or does not belong to your company' },
          { status: 404 }
        );
      }
      
      // Check if quote number already exists for this company
      const existingQuote = await db
        .select()
        .from(quotes)
        .where(
          and(
            eq(quotes.quoteNumber, quoteNumber),
            eq(quotes.companyId, companyId),
            eq(quotes.softDelete, false)
          )
        )
        .limit(1);
      
      if (existingQuote.length > 0) {
        return NextResponse.json(
          { message: 'Quote number already exists' },
          { status: 400 }
        );
      }
      
      // Calculate subtotal, tax and total
      const subtotal = items.reduce((sum, item) => sum + item.quantity * parseFloat(item.unitPrice), 0);
      const tax = taxRate ? subtotal * (taxRate / 100) : 0;
      const total = subtotal + tax;
      
      // Insert quote using a simple query approach
      const now = new Date();
      
      // Create raw SQL statement to insert quote
      const newQuote: typeof quotes.$inferInsert = {
        companyId,
        clientId,
        quoteNumber,
        status,
        issueDate,
        expiryDate,
        subtotal: subtotal.toString(),
        tax: tax.toString(),
        total: total.toString(),
        notes,
        createdAt: now,
        updatedAt: now,
        softDelete: false
      };
      
      const quoteResult = await db.insert(quotes).values(newQuote).returning();
      
      // Create quote items
      const createdItems = [];
      
      for (const item of items) {
        const amount = item.quantity * parseFloat(item.unitPrice);

        const newItem: typeof quoteItems.$inferInsert = {
          quoteId: quoteResult[0].id,
          description: item.description,
          quantity: item.quantity.toString(),
          unitPrice: item.unitPrice,
          amount: amount.toString(),
        };
        
        const itemResult = await db.insert(quoteItems).values(newItem).returning();
        createdItems.push(itemResult[0]);
      }
      
      // Format response
      const client = existingClient[0];
      
      return NextResponse.json({
        id: quoteResult[0].id,
        companyId: quoteResult[0].companyId,
        clientId: quoteResult[0].clientId,
        quoteNumber: quoteResult[0].quoteNumber,
        status: quoteResult[0].status,
        issueDate: quoteResult[0].issueDate,
        expiryDate: quoteResult[0].expiryDate,
        subtotal: quoteResult[0].subtotal,
        tax: quoteResult[0].tax,
        total: quoteResult[0].total,
        notes: quoteResult[0].notes,
        createdAt: quoteResult[0].createdAt,
        client: {
          id: client.id,
          name: client.name,
          email: client.email,
        },
        items: createdItems.map(item => ({
          id: item.id,
          quoteId: item.quoteId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          amount: item.amount,
        })),
      });
      
    } catch (error) {
      console.error('Error creating quote:', error);
      
      if (error instanceof z.ZodError) {
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