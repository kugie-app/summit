import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { db } from '@/lib/db';
import { clients, invoices, invoiceItems } from '@/lib/db/schema';
import { and, eq, desc, asc, like, or, count, inArray, sql } from 'drizzle-orm';
import { authOptions } from '@/lib/auth/options';

// Schema for invoice creation
const invoiceItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  unitPrice: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Unit price must be a valid amount'),
});

const invoiceSchema = z.object({
  clientId: z.number().int().positive('Client ID is required'),
  invoiceNumber: z.string().min(1, 'Invoice number is required'),
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled']),
  issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Issue date must be in YYYY-MM-DD format'),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Due date must be in YYYY-MM-DD format'),
  taxRate: z.number().min(0, 'Tax rate cannot be negative').max(100, 'Tax rate cannot exceed 100%').optional(),
  notes: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
});

// GET /api/invoices - List all invoices with pagination, sorting, and filtering
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
      eq(invoices.companyId, companyId),
      eq(invoices.softDelete, false)
    );
    
    // Add status filter if provided
    if (status && status !== 'all') {
      if (['draft', 'sent', 'paid', 'overdue', 'cancelled'].includes(status)) {
        conditions = and(
          conditions,
          eq(invoices.status, status as 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled')
        );
      }
    }
    
    // Add search filter
    if (search) {
      conditions = and(
        conditions,
        or(
          like(invoices.invoiceNumber, `%${search}%`),
          like(clients.name, `%${search}%`)
        )
      );
    }
    
    // Count total records for pagination
    const totalCountResult = await db
      .select({ count: count() })
      .from(invoices)
      .leftJoin(clients, eq(invoices.clientId, clients.id))
      .where(conditions);
    
    const totalCount = Number(totalCountResult[0]?.count || 0);
    
    // Execute the query with sorting, limit and offset
    const invoiceResults = await db
      .select({
        invoice: invoices,
        client: {
          id: clients.id,
          name: clients.name,
          email: clients.email,
        },
      })
      .from(invoices)
      .leftJoin(clients, eq(invoices.clientId, clients.id))
      .where(conditions)
      .orderBy(
        sortOrder === 'asc'
          ? asc(invoices[sortBy as keyof typeof invoices] as any)
          : desc(invoices[sortBy as keyof typeof invoices] as any)
      )
      .limit(limit)
      .offset(offset);
    
    if (invoiceResults.length === 0) {
      return NextResponse.json({
        data: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      });
    }
    
    // Get all invoice IDs
    const invoiceIds = invoiceResults.map(result => result.invoice.id);
    
    // Get items for all invoices
    const items = await db
      .select()
      .from(invoiceItems)
      .where(inArray(invoiceItems.invoiceId, invoiceIds));
    
    // Group items by invoice ID
    const itemsByInvoiceId: Record<number, any[]> = {};
    
    for (const item of items) {
      if (!itemsByInvoiceId[item.invoiceId]) {
        itemsByInvoiceId[item.invoiceId] = [];
      }
      itemsByInvoiceId[item.invoiceId].push(item);
    }
    
    // Format invoice results
    const formattedInvoices = invoiceResults.map(result => {
      const { invoice, client } = result;
      
      return {
        ...invoice,
        client,
        items: itemsByInvoiceId[invoice.id] || [],
      };
    });
    
    return NextResponse.json({
      data: formattedInvoices,
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    });
    
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { message: 'Failed to fetch invoices' },
      { status: 500 }
    );
  }
}

// POST /api/invoices - Create a new invoice
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !session.user.companyId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    const companyId = parseInt(session.user.companyId);
    const body = await request.json();
    
    // Validate input data
    const validationResult = invoiceSchema.safeParse(body);
    
    if (!validationResult.success) {
      return NextResponse.json(
        { message: 'Validation failed', errors: validationResult.error.format() },
        { status: 400 }
      );
    }
    
    const { clientId, invoiceNumber, status, issueDate, dueDate, taxRate, notes, items } = validationResult.data;
    
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
    
    // Check if invoice number already exists for this company
    const existingInvoice = await db
      .select()
      .from(invoices)
      .where(
        and(
          eq(invoices.invoiceNumber, invoiceNumber),
          eq(invoices.companyId, companyId),
          eq(invoices.softDelete, false)
        )
      )
      .limit(1);
    
    if (existingInvoice.length > 0) {
      return NextResponse.json(
        { message: 'Invoice number already exists' },
        { status: 400 }
      );
    }
    
    // Calculate subtotal, tax and total
    const subtotal = items.reduce((sum, item) => sum + item.quantity * parseFloat(item.unitPrice), 0);
    const tax = taxRate ? subtotal * (taxRate / 100) : 0;
    const total = subtotal + tax;
    
    // Insert invoice using a simple query approach to avoid schema issues
    const now = new Date();
    
    // Create raw SQL statement to insert invoice
    const insertInvoice = sql`
      INSERT INTO invoices (
        company_id, client_id, invoice_number, status, 
        issue_date, due_date, subtotal, tax, total, 
        notes, created_at, updated_at, soft_delete
      )
      VALUES (
        ${companyId}, ${clientId}, ${invoiceNumber}, ${status},
        ${new Date(issueDate)}, ${new Date(dueDate)}, ${subtotal.toFixed(2)}, ${tax.toFixed(2)}, ${total.toFixed(2)},
        ${notes || null}, ${now}, ${now}, false
      )
      RETURNING *
    `;
    
    const invoiceResult = await db.execute(insertInvoice);
    const newInvoice = invoiceResult.rows[0];
    
    // Create invoice items
    const createdItems = [];
    
    for (const item of items) {
      const amount = item.quantity * parseFloat(item.unitPrice);
      
      const insertItem = sql`
        INSERT INTO invoice_items (
          invoice_id, description, quantity, unit_price, 
          amount, created_at, updated_at
        )
        VALUES (
          ${newInvoice.id}, ${item.description}, ${item.quantity.toString()}, ${item.unitPrice},
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
      ...newInvoice,
      client: {
        id: client.id,
        name: client.name,
        email: client.email,
      },
      items: createdItems.map(item => ({
        id: item.id,
        invoiceId: item.invoice_id,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        amount: item.amount,
      })),
    }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating invoice:', error);
    
    if (error instanceof Error) {
      if (error.name === 'ZodError') {
        return NextResponse.json(
          { message: 'Validation error', errors: (error as any).errors },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { message: error.message || 'Internal server error' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
} 