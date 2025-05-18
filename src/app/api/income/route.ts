import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { income, incomeCategories, clients } from "@/lib/db/schema";
import { and, eq, desc, sql } from "drizzle-orm";
import { incomeSchema } from "@/lib/validations/income";
import { withAuth } from '@/lib/auth/getAuthInfo';

// Define response types for type safety
type IncomeListResponse = {
  data: any[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
};

type ErrorResponse = {
  error: string;
  errors?: any;
};

// GET: List all income entries
export async function GET(req: NextRequest) {
  return withAuth<IncomeListResponse | ErrorResponse>(req, async (authInfo) => {
    try {
      const { companyId } = authInfo;
      
      // Parse query parameters
      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get("page") || "1");
      const limit = parseInt(searchParams.get("limit") || "10");
      const offset = (page - 1) * limit;
      
      // Filter parameters
      const categoryId = searchParams.get("categoryId");
      const startDate = searchParams.get("startDate");
      const endDate = searchParams.get("endDate");
      
      // Base query conditions
      let conditions = and(
        eq(income.companyId, companyId),
        eq(income.softDelete, false)
      );
      
      // Add filter conditions if provided
      if (categoryId) {
        conditions = and(
          conditions,
          eq(income.categoryId, parseInt(categoryId))
        );
      }
      
      if (startDate) {
        conditions = and(
          conditions,
          sql`${income.incomeDate} >= ${new Date(startDate)}`
        );
      }
      
      if (endDate) {
        conditions = and(
          conditions,
          sql`${income.incomeDate} <= ${new Date(endDate)}`
        );
      }
      
      // Get total count
      const [countResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(income)
        .where(conditions);
      
      const total = countResult.count;
      
      // Get income entries with related data
      const incomeEntries = await db
        .select({
          income: income,
          category: incomeCategories,
          client: clients,
        })
        .from(income)
        .leftJoin(incomeCategories, eq(income.categoryId, incomeCategories.id))
        .leftJoin(clients, eq(income.clientId, clients.id))
        .where(conditions)
        .orderBy(desc(income.incomeDate))
        .limit(limit)
        .offset(offset);
      
      return NextResponse.json({
        data: incomeEntries,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error("Error fetching income entries:", error);
      return NextResponse.json(
        { error: "Failed to fetch income entries" },
        { status: 500 }
      );
    }
  });
}

// POST: Create a new income entry
export async function POST(req: NextRequest) {
  return withAuth<any | ErrorResponse>(req, async (authInfo) => {
    try {
      const { companyId } = authInfo;
      const body = await req.json();
      
      // Validate request body
      const validatedData = incomeSchema.safeParse(body);
      
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
      
      // Create new income entry
      const now = new Date();
      const [newIncome] = await db
        .insert(income)
        .values({
          companyId,
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
          createdAt: now,
          updatedAt: now,
          softDelete: false,
        })
        .returning();
      
      return NextResponse.json(newIncome, { status: 201 });
    } catch (error) {
      console.error("Error creating income entry:", error);
      return NextResponse.json(
        { error: "Failed to create income entry" },
        { status: 500 }
      );
    }
  });
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