import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { db } from '@/lib/db';
import { vendors } from '@/lib/db/schema';
import { and, eq } from 'drizzle-orm';

// GET /api/vendors/[vendorId] - Get a specific vendor
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ vendorId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !session.user.companyId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const companyId = session.user.companyId;
    const { vendorId } = await params;
    
    if (isNaN(Number(vendorId))) {
      return NextResponse.json(
        { error: 'Invalid vendor ID' },
        { status: 400 }
      );
    }
    
    const vendor = await db.select().from(vendors).where(
      and(
        eq(vendors.id, Number(vendorId)),
        eq(vendors.companyId, Number(companyId)),
        eq(vendors.softDelete, false)
      )
    );
    
    if (!vendor) {
      return NextResponse.json(
        { error: 'Vendor not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ data: vendor });
  } catch (error) {
    console.error('Error fetching vendor:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vendor' },
      { status: 500 }
    );
  }
}

// PUT /api/vendors/[vendorId] - Update a vendor
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ vendorId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !session.user.companyId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const companyId = session.user.companyId;
    const { vendorId } = await params;
    
    if (isNaN(Number(vendorId))) {
      return NextResponse.json(
        { error: 'Invalid vendor ID' },
        { status: 400 }
      );
    }
    
    const data = await req.json();
    
    // Validate required fields
    if (!data.name) {
      return NextResponse.json(
        { error: 'Vendor name is required' },
        { status: 400 }
      );
    }
    
    // Check if vendor exists and belongs to the company
    const existingVendor = await db.select().from(vendors).where(
      and(
        eq(vendors.id, Number(vendorId)),
        eq(vendors.companyId, Number(companyId)),
        eq(vendors.softDelete, false)
      )
    );
    
    if (!existingVendor) {
      return NextResponse.json(
        { error: 'Vendor not found' },
        { status: 404 }
      );
    }
    
    const updatedVendor = await db.update(vendors)
      .set({
        name: data.name,
        contactName: data.contactName || null,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
        website: data.website || null,
        notes: data.notes || null,
        updatedAt: new Date(),
      })
      .where(and(
        eq(vendors.id, Number(vendorId)),
        eq(vendors.companyId, Number(companyId))
      ))
      .returning();
    
    return NextResponse.json({
      message: 'Vendor updated successfully',
      data: updatedVendor[0],
    });
  } catch (error) {
    console.error('Error updating vendor:', error);
    return NextResponse.json(
      { error: 'Failed to update vendor' },
      { status: 500 }
    );
  }
}

// DELETE /api/vendors/[vendorId] - Delete a vendor (soft delete)
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ vendorId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !session.user.companyId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const companyId = session.user.companyId;
    const { vendorId } = await params;
    
    if (isNaN(Number(vendorId))) {
      return NextResponse.json(
        { error: 'Invalid vendor ID' },
        { status: 400 }
      );
    }
    
    // Check if vendor exists and belongs to the company
    const existingVendor = await db.select().from(vendors).where(
      and(
        eq(vendors.id, Number(vendorId)),
        eq(vendors.companyId, Number(companyId)),
        eq(vendors.softDelete, false)
      )
    );
    
    if (!existingVendor) {
      return NextResponse.json(
        { error: 'Vendor not found' },
        { status: 404 }
      );
    }
    
    // Soft delete the vendor
    await db.update(vendors)
      .set({
        softDelete: true,
        updatedAt: new Date(),
      })
      .where(and(
        eq(vendors.id, Number(vendorId)),
        eq(vendors.companyId, Number(companyId))
      ));
    
    return NextResponse.json({
      message: 'Vendor deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting vendor:', error);
    return NextResponse.json(
      { error: 'Failed to delete vendor' },
      { status: 500 }
    );
  }
} 