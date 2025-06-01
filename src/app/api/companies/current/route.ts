import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { db } from '@/lib/db';
import { companies } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

// Validation schema for company updates
const companyUpdateSchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters'),
  address: z.string().optional(),
  defaultCurrency: z.string().min(1, 'Currency is required'),
  logoUrl: z.string().optional().nullable(),
  bankAccount: z.string().optional().nullable(),
  email: z.string().email('Invalid email format').optional().nullable(),
  phone: z.string().optional().nullable(),
  website: z.string().url('Invalid URL format').optional().nullable(),
  taxNumber: z.string().optional().nullable(),
});

// GET /api/companies/current - Get the current user's company
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !session.user.companyId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    const companyId = parseInt(session.user.companyId);
    
    const [company] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, companyId));
    
    if (!company) {
      return NextResponse.json({ message: 'Company not found' }, { status: 404 });
    }
    
    return NextResponse.json(company);
  } catch (error) {
    console.error('Error fetching company:', error);
    return NextResponse.json(
      { message: 'Failed to fetch company information' },
      { status: 500 }
    );
  }
}

// PUT /api/companies/current - Update the current user's company
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !session.user.companyId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    const companyId = parseInt(session.user.companyId);
    
    // Parse and validate the request body
    const body = await request.json();
    const validatedData = companyUpdateSchema.parse(body);
    
    // Update the company
    const [updatedCompany] = await db
      .update(companies)
      .set({
        name: validatedData.name,
        address: validatedData.address || null,
        defaultCurrency: validatedData.defaultCurrency,
        logoUrl: validatedData.logoUrl || null,
        bankAccount: validatedData.bankAccount || null,
        email: validatedData.email || null,
        phone: validatedData.phone || null,
        website: validatedData.website || null,
        taxNumber: validatedData.taxNumber || null,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(companies.id, companyId))
      .returning();
    
    if (!updatedCompany) {
      return NextResponse.json({ message: 'Failed to update company' }, { status: 500 });
    }
    
    return NextResponse.json(updatedCompany);
  } catch (error) {
    console.error('Error updating company:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: 'Validation error', errors: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { message: 'Failed to update company information' },
      { status: 500 }
    );
  }
} 