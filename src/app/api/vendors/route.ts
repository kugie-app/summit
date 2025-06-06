import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { vendors } from '@/lib/db/schema';
import { and, eq, ilike, desc } from 'drizzle-orm';
import { withAuth } from '@/lib/auth/getAuthInfo';

type VendorResponse = {
  data: VendorData[];
  count: number;
}

type VendorData = {
  id: number;
  companyId: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

type ErrorResponse = {
  message?: string;
  error?: any;
}


// GET /api/vendors - Get all vendors for the current company
export async function GET(req: NextRequest) {
  return withAuth<VendorResponse | ErrorResponse>(req, async (authInfo) => {
    try {
      const { companyId } = authInfo;
      const url = new URL(req.url);
      const search = url.searchParams.get('search') || '';
      
      const vendorsList = await db.select().from(vendors).where(
        and(
          eq(vendors.companyId, companyId),
          eq(vendors.softDelete, false),
          search ? ilike(vendors.name, `%${search}%`) : undefined
        )
      ).orderBy(desc(vendors.updatedAt));
      
      return NextResponse.json({
        data: vendorsList,
        count: vendorsList.length,
      });
    } catch (error) {
      console.error('Error fetching vendors:', error);
      return NextResponse.json(
        { error: 'Failed to fetch vendors' },
        { status: 500 }
      );
    }
  });
}

// POST /api/vendors - Create a new vendor
export async function POST(req: NextRequest) {
  return withAuth<VendorResponse | ErrorResponse>(req, async (authInfo) => {
    try {
      const { companyId } = authInfo;
      const data = await req.json();
      
      // Validate required fields
      if (!data.name) {
        return NextResponse.json(
          { error: 'Vendor name is required' },
          { status: 400 }
        );
      }
      
      const newVendor = await db.insert(vendors)
        .values({
          companyId: companyId,
          name: data.name,
          contactName: data.contactName || null,
          email: data.email || null,
          phone: data.phone || null,
          address: data.address || null,
          website: data.website || null,
          notes: data.notes || null,
        })
        .returning();
      
      return NextResponse.json(
        { message: 'Vendor created successfully', data: newVendor[0] },
        { status: 201 }
      );
    } catch (error) {
      console.error('Error creating vendor:', error);
      return NextResponse.json(
        { error: 'Failed to create vendor' },
        { status: 500 }
      );
    }
  });
} 