import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { db } from '@/lib/db';
import { clients } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { clientSchema, clientParamsSchema } from '@/lib/validations/client';
import { ZodError } from 'zod';
import { withAuth } from '@/lib/auth/getAuthInfo';

// Define client response type to help with type checking
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

type ErrorResponse = {
  message: string;
  errors?: any;
}

// GET /api/clients/[clientId] - Get a specific client
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  return withAuth<ClientResponse | ErrorResponse>(request, async (authInfo) => {
    try {
      // Validate clientId parameter
      const { clientId } = await params;
      const id = parseInt(clientId);
      const { companyId } = authInfo;

      // Get client with company scope
      const client = await db
        .select()
        .from(clients)
        .where(
          and(
            eq(clients.id, id),
            eq(clients.companyId, companyId),
            eq(clients.softDelete, false)
          )
        )
        .limit(1);

      if (client.length === 0) {
        return NextResponse.json({ message: 'Client not found' }, { status: 404 });
      }

      return NextResponse.json(client[0]);
    } catch (error) {
      console.error('Error fetching client:', error);

      if (error instanceof ZodError) {
        return NextResponse.json(
          { message: 'Invalid client ID' },
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

// PUT /api/clients/[clientId] - Update a client
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  return withAuth<ClientResponse | ErrorResponse>(request, async (authInfo) => {
    try {
      // Validate clientId parameter
      const { clientId } = await params;
      const id = parseInt(clientId);
      const { companyId } = authInfo;

      // Check if client exists
      const existingClient = await db
        .select()
        .from(clients)
        .where(
          and(
            eq(clients.id, id),
            eq(clients.companyId, companyId),
            eq(clients.softDelete, false)
          )
        )
        .limit(1);

      if (existingClient.length === 0) {
        return NextResponse.json({ message: 'Client not found' }, { status: 404 });
      }

      // Validate request body
      const body = await request.json();
      const validatedData = clientSchema.parse(body);

      // Check if email is being changed and if it conflicts
      if (
        validatedData.email &&
        validatedData.email !== existingClient[0].email
      ) {
        const emailConflict = await db
          .select({ id: clients.id })
          .from(clients)
          .where(
            and(
              eq(clients.email, validatedData.email),
              eq(clients.companyId, companyId),
              eq(clients.softDelete, false)
            )
          )
          .limit(1);

        if (emailConflict.length > 0 && emailConflict[0].id !== id) {
          return NextResponse.json(
            { message: 'Client with this email already exists' },
            { status: 409 }
          );
        }
      }

      // Update client
      const updateClientLut = new Date().toISOString();
      const [updatedClient] = await db
        .update(clients)
        .set({
          name: validatedData.name,
          email: validatedData.email || null,
          phone: validatedData.phone || null,
          address: validatedData.address || null,
          paymentTerms: validatedData.paymentTerms,
          updatedAt: updateClientLut,
        })
        .where(
          and(
            eq(clients.id, id),
            eq(clients.companyId, companyId)
          )
        )
        .returning();

      return NextResponse.json(updatedClient);
    } catch (error) {
      console.error('Error updating client:', error);

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

// DELETE /api/clients/[clientId] - Soft delete a client
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ clientId: string }> }
) {
  return withAuth<ClientResponse | ErrorResponse>(request, async (authInfo) => {
    try {
      // Validate clientId parameter
      const { clientId } = await params;
      const id = parseInt(clientId);
      const { companyId } = authInfo;

      // Check if client exists
      const existingClient = await db
        .select({ id: clients.id })
        .from(clients)
        .where(
          and(
            eq(clients.id, id),
            eq(clients.companyId, companyId),
            eq(clients.softDelete, false)
          )
        )
        .limit(1);

      if (existingClient.length === 0) {
        return NextResponse.json({ message: 'Client not found' }, { status: 404 });
      }

      // Soft delete client
      const [deletedClient] = await db
        .update(clients)
        .set({
          softDelete: true,
          updatedAt: new Date().toISOString(),
        })
        .where(
          and(
            eq(clients.id, id),
            eq(clients.companyId, companyId)
          )
        )
        .returning();

      return NextResponse.json(deletedClient);
    } catch (error) {
      console.error('Error deleting client:', error);

      if (error instanceof ZodError) {
        return NextResponse.json(
          { message: 'Invalid client ID' },
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