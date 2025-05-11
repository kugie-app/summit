import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { incomeCategories } from "@/lib/db/schema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { and, eq, count } from "drizzle-orm";
import { withAuth } from "@/lib/auth/getAuthInfo";

// Validation schema for creating a category
const createCategorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
});

type IncomeCategoryResponse = {
  data: IncomeCategoryData[];
  total: number;
};

type IncomeCategoryData = {
  id: number;
  companyId: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  softDelete: boolean;
}

type CreateIncomeCategoryResponse = {
  id: number;
  companyId: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

type ErrorResponse = {
  message?: string;
  error?: any;
};

// GET: Fetch all income categories for the user's company
export async function GET(req: NextRequest) {
  return withAuth<IncomeCategoryResponse | ErrorResponse>(req, async (authInfo) => {
    try {
      const { companyId } = authInfo;
      
      // Fetch categories belonging to the user's company
      const categories = await db
        .select()
        .from(incomeCategories)
        .where(
          and(
            eq(incomeCategories.companyId, companyId),
            eq(incomeCategories.softDelete, false)
          )
        )
        .orderBy(incomeCategories.name);
      
      return NextResponse.json({
        data: categories,
        total: categories.length,
      });
    } catch (error) {
      console.error("Error fetching income categories:", error);
      return NextResponse.json(
        { error: "Failed to fetch income categories" },
        { status: 500 }
      );
    }
  });
}

// POST: Create a new income category
export async function POST(req: NextRequest) {
  return withAuth<CreateIncomeCategoryResponse | ErrorResponse>(req, async (authInfo) => {
    try {
      const { companyId } = authInfo;
      const body = await req.json();
      
      // Validate request body
      const validatedData = createCategorySchema.safeParse(body);
      
      if (!validatedData.success) {
        return NextResponse.json(
          { error: validatedData.error.format() },
          { status: 400 }
        );
      }
      
      const { name } = validatedData.data;
      
      // Check if category with the same name already exists for this company
      const existingCategory = await db
        .select({ count: count() })
        .from(incomeCategories)
        .where(
          and(
            eq(incomeCategories.companyId, companyId),
            eq(incomeCategories.name, name),
            eq(incomeCategories.softDelete, false)
          )
        );
      
      if (existingCategory[0].count > 0) {
        return NextResponse.json(
          { error: "A category with this name already exists" },
          { status: 400 }
        );
      }
      
      // Create the new category
      const now = new Date();
      const [newCategory] = await db
        .insert(incomeCategories)
        .values({
          companyId,
          name,
          createdAt: now,
          updatedAt: now,
          softDelete: false,
        })
        .returning();
      
      return NextResponse.json(newCategory, { status: 201 });
    } catch (error) {
      console.error("Error creating income category:", error);
      return NextResponse.json(
        { error: "Failed to create income category" },
        { status: 500 }
      );
    }
  });
} 