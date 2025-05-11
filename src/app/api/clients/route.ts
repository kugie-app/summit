import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { db } from '@/lib/db';
import { clients } from '@/lib/db/schema';
import { and, asc, desc, eq, sql } from 'drizzle-orm';
import { clientSchema } from '@/lib/validations/client';
import { ZodError } from 'zod';
import { withAuth } from '@/lib/auth/getAuthInfo';

// Define response types
type ClientResponse = {
  id: number;
  companyId: number;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  paymentTerms: number | null;
  createdAt: Date;
  updatedAt: Date;
  softDelete: boolean;
}

type ClientListResponse = {
  data: ClientResponse[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pageCount: number;
  };
}

type ErrorResponse = {
  message: string;
  errors?: any;
}

// GET /api/clients - Get all clients for the company
export async function GET(request: NextRequest) {
  return withAuth<ClientListResponse | ErrorResponse>(request, async (authInfo) => {
    try {
      const { companyId } = authInfo;
      
      // Get query parameters
      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '10');
      const order = searchParams.get('order') || 'asc';
      const offset = (page - 1) * limit;

      // Count total records for pagination
      const countResult = await db
        .select({ count: sql`COUNT(*)` })
        .from(clients)
        .where(and(eq(clients.companyId, companyId), eq(clients.softDelete, false)));
      
      const total = Number(countResult[0].count);

      // Get clients with pagination
      const clientList = await db
        .select()
        .from(clients)
        .where(and(eq(clients.companyId, companyId), eq(clients.softDelete, false)))
        .orderBy(order === 'asc' ? asc(clients.name) : desc(clients.name))
        .limit(limit)
        .offset(offset);

      return NextResponse.json({
        data: clientList,
        meta: {
          total,
          page,
          limit,
          pageCount: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error('Error fetching clients:', error);
      return NextResponse.json(
        { message: 'Internal server error' },
        { status: 500 }
      );
    }
  });
}

// POST /api/clients - Create a new client
export async function POST(request: NextRequest) {
  return withAuth<ClientResponse | ErrorResponse>(request, async (authInfo) => {
    try {
      const { companyId } = authInfo;
      const body = await request.json();

      // Validate client data
      const validatedData = clientSchema.parse(body);

      // Check if client with same email already exists for this company
      if (validatedData.email) {
        const existingClient = await db
          .select({ id: clients.id })
          .from(clients)
          .where(and(eq(clients.companyId, companyId), eq(clients.email, validatedData.email), eq(clients.softDelete, false)));

        if (existingClient.length > 0) {
          return NextResponse.json(
            { message: 'Client with this email already exists' },
            { status: 409 }
          );
        }
      }

      // Create client
      const [newClient] = await db
        .insert(clients)
        .values({
          companyId,
          name: validatedData.name,
          email: validatedData.email || null,
          phone: validatedData.phone || null,
          address: validatedData.address || null,
          paymentTerms: validatedData.paymentTerms,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      return NextResponse.json(newClient, { status: 201 });
    } catch (error) {
      console.error('Error creating client:', error);
      
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