import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { db } from "@/lib/db";
import { income, incomeCategories, clients } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

// Income update validation schema
const updateIncomeSchema = z.object({
  categoryId: z.number().nullable().optional(),
  clientId: z.number().nullable().optional(),
  invoiceId: z.number().nullable().optional(),
  source: z.string().min(1, "Source is required"),
  description: z.string().optional(),
  amount: z.string().min(1, "Amount is required"),
  currency: z.string().default("USD"),
  incomeDate: z.coerce.date(),
  recurring: z.enum(["none", "daily", "weekly", "monthly", "yearly"]).default("none"),
  nextDueDate: z.coerce.date().optional().nullable(),
});

// GET: Fetch a specific income entry by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ incomeId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !session.user.companyId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const companyId = parseInt(session.user.companyId as string);
    const { incomeId } = await params;
    
    if (isNaN(parseInt(incomeId))) {
      return NextResponse.json(
        { error: "Invalid income ID" },
        { status: 400 }
      );
    }
    
    // Fetch the income entry with related data
    const result = await db
      .select({
        income: income,
        category: incomeCategories,
        client: clients,
      })
      .from(income)
      .leftJoin(incomeCategories, eq(income.categoryId, incomeCategories.id))
      .leftJoin(clients, eq(income.clientId, clients.id))
      .where(
        and(
          eq(income.id, parseInt(incomeId)),
          eq(income.companyId, companyId),
          eq(income.softDelete, false)
        )
      )
      .limit(1);
    
    if (result.length === 0) {
      return NextResponse.json(
        { error: "Income entry not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(result[0]);
  } catch (error) {
    console.error("Error fetching income entry:", error);
    return NextResponse.json(
      { error: "Failed to fetch income entry" },
      { status: 500 }
    );
  }
}

// PUT: Update an income entry
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ incomeId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !session.user.companyId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const companyId = parseInt(session.user.companyId as string);
    const { incomeId } = await params;
    
    if (isNaN(parseInt(incomeId))) {
      return NextResponse.json(
        { error: "Invalid income ID" },
        { status: 400 }
      );
    }
    
    // Check if income entry exists
    const existingIncome = await db
      .select()
      .from(income)
      .where(
        and(
          eq(income.id, parseInt(incomeId)),
          eq(income.companyId, companyId),
          eq(income.softDelete, false)
        )
      )
      .limit(1);
    
    if (existingIncome.length === 0) {
      return NextResponse.json(
        { error: "Income entry not found" },
        { status: 404 }
      );
    }
    
    const body = await req.json();
    
    // Validate request body
    const validatedData = updateIncomeSchema.safeParse(body);
    
    if (!validatedData.success) {
      return NextResponse.json(
        { error: validatedData.error.format() },
        { status: 400 }
      );
    }
    
    const {
      categoryId,
      clientId,
      invoiceId,
      source,
      description,
      amount,
      currency,
      incomeDate,
      recurring,
      nextDueDate,
    } = validatedData.data;
    
    // Calculate next due date for recurring income
    let calculatedNextDueDate = null;
    if (recurring !== "none") {
      calculatedNextDueDate = nextDueDate || calculateNextDueDate(incomeDate, recurring);
    }
    
    // Update the income entry
    const [updatedIncome] = await db
      .update(income)
      .set({
        categoryId: categoryId || null,
        clientId: clientId || null,
        invoiceId: invoiceId || null,
        source,
        description: description || null,
        amount,
        currency,
        incomeDate: incomeDate.toISOString().split('T')[0],
        recurring,
        nextDueDate: calculatedNextDueDate ? calculatedNextDueDate.toISOString().split('T')[0] : null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(income.id, parseInt(incomeId)),
          eq(income.companyId, companyId)
        )
      )
      .returning();
    
    // Fetch related data for response
    let category = null;
    if (updatedIncome.categoryId) {
      const categoryResult = await db
        .select()
        .from(incomeCategories)
        .where(eq(incomeCategories.id, updatedIncome.categoryId))
        .limit(1);
      
      if (categoryResult.length > 0) {
        category = categoryResult[0];
      }
    }
    
    let client = null;
    if (updatedIncome.clientId) {
      const clientResult = await db
        .select()
        .from(clients)
        .where(eq(clients.id, updatedIncome.clientId))
        .limit(1);
      
      if (clientResult.length > 0) {
        client = clientResult[0];
      }
    }
    
    return NextResponse.json({
      income: updatedIncome,
      category,
      client,
    });
  } catch (error) {
    console.error("Error updating income entry:", error);
    return NextResponse.json(
      { error: "Failed to update income entry" },
      { status: 500 }
    );
  }
}

// DELETE: Soft-delete an income entry
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ incomeId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !session.user.companyId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const companyId = parseInt(session.user.companyId as string);
    const { incomeId } = await params;
    
    if (isNaN(parseInt(incomeId))) {
      return NextResponse.json(
        { error: "Invalid income ID" },
        { status: 400 }
      );
    }
    
    // Check if income entry exists
    const existingIncome = await db
      .select()
      .from(income)
      .where(
        and(
          eq(income.id, parseInt(incomeId)),
          eq(income.companyId, companyId),
          eq(income.softDelete, false)
        )
      )
      .limit(1);
    
    if (existingIncome.length === 0) {
      return NextResponse.json(
        { error: "Income entry not found" },
        { status: 404 }
      );
    }
    
    // Soft delete the income entry
    const [deletedIncome] = await db
      .update(income)
      .set({
        softDelete: true,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(income.id, parseInt(incomeId)),
          eq(income.companyId, companyId)
        )
      )
      .returning();
    
    return NextResponse.json(deletedIncome);
  } catch (error) {
    console.error("Error deleting income entry:", error);
    return NextResponse.json(
      { error: "Failed to delete income entry" },
      { status: 500 }
    );
  }
}

// Helper function to calculate next due date based on recurring type
function calculateNextDueDate(currentDate: Date, recurring: string): Date {
  const nextDate = new Date(currentDate);
  
  switch (recurring) {
    case "daily":
      nextDate.setDate(nextDate.getDate() + 1);
      break;
    case "weekly":
      nextDate.setDate(nextDate.getDate() + 7);
      break;
    case "monthly":
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case "yearly":
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
  }
  
  return nextDate;
} 