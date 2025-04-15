import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { and, eq, gte, lte } from "drizzle-orm/expressions";
import { db } from "@/lib/db";
import { transactions, accounts } from "@/lib/db/schema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

export async function GET(request: NextRequest) {
  try {
    // Get the current user and check if they are authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user || !session.user.companyId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const companyId = parseInt(session.user.companyId);

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const accountId = searchParams.get("accountId");
    
    // Build query conditions as an array
    const conditionsArray = [eq(transactions.companyId, companyId)];
    
    if (startDate) {
      conditionsArray.push(gte(transactions.transactionDate, startDate));
    }
    
    if (endDate) {
      conditionsArray.push(lte(transactions.transactionDate, endDate));
    }
    
    if (accountId) {
      conditionsArray.push(eq(transactions.accountId, parseInt(accountId, 10)));
    }

    // Get total income (credit transactions)
    const totalIncome = await db
      .select({ total: sql<number>`COALESCE(SUM(${transactions.amount}), 0)` })
      .from(transactions)
      .where(and(
        ...conditionsArray,
        eq(transactions.type, "credit"), 
        eq(transactions.softDelete, false)
      ))
      .execute()
      .then(result => result[0]?.total || 0);

    // Get total expenses (debit transactions)
    const totalExpenses = await db
      .select({ total: sql<number>`COALESCE(SUM(${transactions.amount}), 0)` })
      .from(transactions)
      .where(and(
        ...conditionsArray,
        eq(transactions.type, "debit"), 
        eq(transactions.softDelete, false)
      ))
      .execute()
      .then(result => result[0]?.total || 0);

    // Get transaction count by type
    const transactionsByType = await db
      .select({
        type: transactions.type,
        count: sql<number>`COUNT(*)`,
      })
      .from(transactions)
      .where(and(
        ...conditionsArray, 
        eq(transactions.softDelete, false)
      ))
      .groupBy(transactions.type)
      .execute();

    // Get transaction count by category
    const transactionsByCategory = await db
      .select({
        categoryId: transactions.categoryId,
        count: sql<number>`COUNT(*)`,
        sum: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`,
      })
      .from(transactions)
      .where(and(
        ...conditionsArray, 
        eq(transactions.softDelete, false)
      ))
      .groupBy(transactions.categoryId)
      .execute();

    // Get transactions by account
    const transactionsByAccount = await db
      .select({
        accountId: transactions.accountId,
        accountName: accounts.name,
        count: sql<number>`COUNT(*)`,
        sum: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.type} = 'credit' THEN ${transactions.amount} ELSE -${transactions.amount} END), 0)`,
      })
      .from(transactions)
      .leftJoin(accounts, eq(transactions.accountId, accounts.id))
      .where(and(
        ...conditionsArray, 
        eq(transactions.softDelete, false)
      ))
      .groupBy(transactions.accountId, accounts.name)
      .execute();

    return NextResponse.json({
      totalIncome,
      totalExpenses,
      netCashflow: totalIncome - totalExpenses,
      transactionsByType,
      transactionsByCategory,
      transactionsByAccount
    });
  } catch (error) {
    console.error("Error fetching transaction metrics:", error);
    return NextResponse.json(
      { error: "Failed to fetch transaction metrics" },
      { status: 500 }
    );
  }
} 