import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { db } from '@/lib/db';
import { clients, invoices, invoiceItems } from '@/lib/db/schema';
import { and, eq, desc, asc, like, or, count, inArray, sql } from 'drizzle-orm';
import { authOptions } from '@/lib/auth/options';
import { invoiceSchema, invoiceItemSchema } from '@/lib/validations/invoice';
import { withAuth, getAuthInfo } from '@/lib/auth/getAuthInfo';

// GET /api/invoices - List all invoices with pagination, sorting, and filtering
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
  });
}

// POST /api/invoices - Create a new invoice
export async function POST(request: NextRequest) {
  return withAuth(request, async (authInfo) => {
    try {
      const { companyId } = authInfo;
      
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
      const nowISO = now.toISOString();
      const issueDateObj = new Date(issueDate);
      const dueDateObj = new Date(dueDate);
      
      // Create raw SQL statement to insert invoice
      const newInvoice: typeof invoices.$inferInsert = {
        companyId: companyId,
        clientId: clientId,
        invoiceNumber: invoiceNumber,
        status: status,
        issueDate: issueDateObj.toISOString(),
        dueDate: dueDateObj.toISOString(),
        subtotal: subtotal.toFixed(2),
        tax: tax.toFixed(2),
        total: total.toFixed(2),
        notes: notes || null,
        createdAt: now,
        updatedAt: now,
        softDelete: false,
      };

      const insertResult = await db.insert(invoices).values(newInvoice).returning();
      
      // Create invoice items
      const createdItems = [];
      
      for (const item of items) {
        const amount = item.quantity * parseFloat(item.unitPrice);

        // Create SQL statement for each item to maintain consistent approach
        const newItem: typeof invoiceItems.$inferInsert = {
          invoiceId: insertResult[0].id,
          description: item.description,
          quantity: item.quantity.toString(),
          unitPrice: item.unitPrice.toString(),
          amount: amount.toString(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        const itemResult = await db.insert(invoiceItems).values(newItem).returning();
        createdItems.push(itemResult[0]);
      }
      
      // Format response
      const client = existingClient[0];
      
      return NextResponse.json({
        ...insertResult[0],
        client: {
          id: client.id,
          name: client.name,
          email: client.email,
        },
        items: createdItems.map(item => ({
          id: item.id,
          invoiceId: item.invoiceId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
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
  });
} 