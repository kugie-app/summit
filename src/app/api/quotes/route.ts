import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { db } from '@/lib/db';
import { clients, quotes, quoteItems } from '@/lib/db/schema';
import { and, eq, desc, asc, like, or, count, inArray, sql } from 'drizzle-orm';
import { authOptions } from '@/lib/auth/options';

// Schema for quote creation
const quoteItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  unitPrice: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Unit price must be a valid amount'),
});

const quoteSchema = z.object({
  clientId: z.number().int().positive('Client ID is required'),
  quoteNumber: z.string().min(1, 'Quote number is required'),
  status: z.enum(['draft', 'sent', 'accepted', 'rejected', 'expired']),
  issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Issue date must be in YYYY-MM-DD format'),
  expiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expiry date must be in YYYY-MM-DD format'),
  taxRate: z.number().min(0, 'Tax rate cannot be negative').max(100, 'Tax rate cannot exceed 100%').optional(),
  notes: z.string().optional(),
  items: z.array(quoteItemSchema).min(1, 'At least one item is required'),
});

// GET /api/quotes - List all quotes with pagination, sorting, and filtering
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !session.user.companyId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const status = searchParams.get('status');
    const search = searchParams.get('search') || '';
    
    const companyId = parseInt(session.user.companyId);
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
}

// POST /api/quotes - Create a new quote
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !session.user.companyId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    const companyId = parseInt(session.user.companyId);
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
    const insertQuote = sql`
      INSERT INTO quotes (
        company_id, client_id, quote_number, status, 
        issue_date, expiry_date, subtotal, tax, total, 
        notes, created_at, updated_at, soft_delete
      )
      VALUES (
        ${companyId}, ${clientId}, ${quoteNumber}, ${status},
        ${new Date(issueDate)}, ${new Date(expiryDate)}, ${subtotal.toFixed(2)}, ${tax.toFixed(2)}, ${total.toFixed(2)},
        ${notes || null}, ${now}, ${now}, false
      )
      RETURNING *
    `;
    
    const quoteResult = await db.execute(insertQuote);
    const newQuote = quoteResult.rows[0];
    
    // Create quote items
    const createdItems = [];
    
    for (const item of items) {
      const amount = item.quantity * parseFloat(item.unitPrice);
      
      const insertItem = sql`
        INSERT INTO quote_items (
          quote_id, description, quantity, unit_price, 
          amount, created_at, updated_at
        )
        VALUES (
          ${newQuote.id}, ${item.description}, ${item.quantity.toString()}, ${item.unitPrice},
          ${amount.toFixed(2)}, ${now}, ${now}
        )
        RETURNING *
      `;
      
      const itemResult = await db.execute(insertItem);
      createdItems.push(itemResult.rows[0]);
    }
    
    // Format response
    const client = existingClient[0];
    
    return NextResponse.json({
      id: newQuote.id,
      companyId: newQuote.company_id,
      clientId: newQuote.client_id,
      quoteNumber: newQuote.quote_number,
      status: newQuote.status,
      issueDate: newQuote.issue_date,
      expiryDate: newQuote.expiry_date,
      subtotal: newQuote.subtotal,
      tax: newQuote.tax,
      total: newQuote.total,
      notes: newQuote.notes,
      createdAt: newQuote.created_at,
      client: {
        id: client.id,
        name: client.name,
        email: client.email,
      },
      items: createdItems.map(item => ({
        id: item.id,
        quoteId: item.quote_id,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        amount: item.amount,
      })),
    });
    
  } catch (error) {
    console.error('Error creating quote:', error);
    return NextResponse.json(
      { message: 'Failed to create quote' },
      { status: 500 }
    );
  }
} 