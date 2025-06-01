import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { incomeCategories } from "@/lib/db/schema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { and, eq } from "drizzle-orm";
import { withAuth } from "@/lib/auth/getAuthInfo";

// Validation schema for updating a category
const updateCategorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
});

type IncomeCategoryResponse = {
  id: number;
  companyId: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  softDelete: boolean;
}

type ErrorResponse = {
  message?: string;
  error?: any;
};

// GET: Fetch a specific income category by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  
  return withAuth<IncomeCategoryResponse | ErrorResponse>(req, async (authInfo) => {
    try {
      const { companyId } = authInfo;
      const { categoryId } = await params;
      
      if (isNaN(parseInt(categoryId))) {
        return NextResponse.json(
          { error: "Invalid category ID" },
          { status: 400 }
        );
      }
      
      // Fetch the category
      const [category] = await db
        .select()
        .from(incomeCategories)
        .where(
          and(
            eq(incomeCategories.id, parseInt(categoryId)),
            eq(incomeCategories.companyId, companyId),
            eq(incomeCategories.softDelete, false)
          )
        );
      
      if (!category) {
        return NextResponse.json(
          { error: "Category not found" },
          { status: 404 }
        );
      }
      
      return NextResponse.json(category);
    } catch (error) {
      console.error("Error fetching income category:", error);
      return NextResponse.json(
        { error: "Failed to fetch income category" },
        { status: 500 }
      );
    }
  });
}

// PUT: Update an income category
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  return withAuth<IncomeCategoryResponse | ErrorResponse>(req, async (authInfo) => {
    try {
      const { companyId } = authInfo;
      const { categoryId } = await params;
      
      if (isNaN(parseInt(categoryId))) {
        return NextResponse.json(
          { error: "Invalid category ID" },
          { status: 400 }
        );
      }
      
      const body = await req.json();
      
      // Validate request body
      const validatedData = updateCategorySchema.safeParse(body);
      
      if (!validatedData.success) {
        return NextResponse.json(
          { error: validatedData.error.format() },
          { status: 400 }
        );
      }
      
      const { name } = validatedData.data;
      
      // Check if category exists
      const [existingCategory] = await db
        .select()
        .from(incomeCategories)
        .where(
          and(
            eq(incomeCategories.id, parseInt(categoryId)),
            eq(incomeCategories.companyId, companyId),
            eq(incomeCategories.softDelete, false)
          )
        );
      
      if (!existingCategory) {
        return NextResponse.json(
          { error: "Category not found" },
          { status: 404 }
        );
      }
      
      // Check if there is already another category with the same name
      const duplicateCategories = await db
        .select()
        .from(incomeCategories)
        .where(
          and(
            eq(incomeCategories.name, name),
            eq(incomeCategories.companyId, companyId),
            eq(incomeCategories.softDelete, false)
          )
        );
      
      if (duplicateCategories.length > 0 && duplicateCategories[0].id !== parseInt(categoryId)) {
        return NextResponse.json(
          { error: "A category with this name already exists" },
          { status: 400 }
        );
      }
      
      // Update the category
      const [updatedCategory] = await db
        .update(incomeCategories)
        .set({
          name,
          updatedAt: new Date().toISOString(),
        })
        .where(
          and(
            eq(incomeCategories.id, parseInt(categoryId)),
            eq(incomeCategories.companyId, companyId)
          )
        )
        .returning();
      
      return NextResponse.json(updatedCategory);
    } catch (error) {
      console.error("Error updating income category:", error);
      return NextResponse.json(
        { error: "Failed to update income category" },
        { status: 500 }
      );
    }
  });
}

// DELETE: Soft-delete an income category
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  return withAuth<IncomeCategoryResponse | ErrorResponse>(req, async (authInfo) => {
    try {
      const { companyId } = authInfo;
      const { categoryId } = await params;
      
      if (isNaN(parseInt(categoryId))) {
        return NextResponse.json(
          { error: "Invalid category ID" },
          { status: 400 }
        );
      }
      
      // Check if category exists
      const [existingCategory] = await db
        .select()
        .from(incomeCategories)
        .where(
          and(
            eq(incomeCategories.id, parseInt(categoryId)),
            eq(incomeCategories.companyId, companyId),
            eq(incomeCategories.softDelete, false)
          )
        );
      
      if (!existingCategory) {
        return NextResponse.json(
          { error: "Category not found" },
          { status: 404 }
        );
      }
      
      // Check if the category is being used
      // You would need to check any tables that reference this category
      // and decide whether to allow deletion or not
      
      // Soft delete the category
      await db
        .update(incomeCategories)
        .set({
          softDelete: true,
          updatedAt: new Date().toISOString(),
        })
        .where(
          and(
            eq(incomeCategories.id, parseInt(categoryId)),
            eq(incomeCategories.companyId, companyId)
          )
        );
      
      return NextResponse.json({
        message: "Category deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting income category:", error);
      return NextResponse.json(
        { error: "Failed to delete income category" },
        { status: 500 }
      );
    }
  });
} 