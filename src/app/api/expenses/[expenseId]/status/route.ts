import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { db } from "@/lib/db";
import { expenses } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

// Validate the status update request
const updateStatusSchema = z.object({
  status: z.enum(["pending", "approved", "rejected"]),
});

// PUT: Update the status of an expense
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ expenseId: string }> }
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
    const { expenseId } = await params;
    
    if (isNaN(parseInt(expenseId))) {
      return NextResponse.json(
        { error: "Invalid expense ID" },
        { status: 400 }
      );
    }
    
    // Validate request body
    const body = await req.json();
    const validatedData = updateStatusSchema.safeParse(body);
    
    if (!validatedData.success) {
      return NextResponse.json(
        { error: "Invalid status value. Status must be 'pending', 'approved', or 'rejected'." },
        { status: 400 }
      );
    }
    
    const { status } = validatedData.data;
    
    // Check if the expense exists and belongs to the company
    const existingExpense = await db
      .select()
      .from(expenses)
      .where(
        and(
          eq(expenses.id, parseInt(expenseId)),
          eq(expenses.companyId, companyId),
          eq(expenses.softDelete, false)
        )
      )
      .limit(1);
    
    if (existingExpense.length === 0) {
      return NextResponse.json(
        { error: "Expense not found" },
        { status: 404 }
      );
    }
    
    // Update the expense status
    const [updatedExpense] = await db
      .update(expenses)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(expenses.id, parseInt(expenseId)),
          eq(expenses.companyId, companyId)
        )
      )
      .returning();
    
    return NextResponse.json({
      message: `Expense has been ${status}`,
      expense: updatedExpense,
    });
  } catch (error) {
    console.error("Error updating expense status:", error);
    return NextResponse.json(
      { error: "Failed to update expense status" },
      { status: 500 }
    );
  }
} 