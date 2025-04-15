import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/lib/db';
import { invoices, invoiceStatusEnum } from '@/lib/db/schema';
import { and, eq, sql, gte, lte } from 'drizzle-orm';
import { authOptions } from '@/lib/auth/options';
import { subMonths, startOfMonth, endOfMonth, format } from 'date-fns';

// GET /api/reports/revenue-overview
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !session.user.companyId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const companyId = parseInt(session.user.companyId);
    
    // Parse query parameters (defaults to last 6 months)
    const searchParams = request.nextUrl.searchParams;
    const months = parseInt(searchParams.get('months') || '6');
    const endDate = searchParams.get('endDate') 
      ? new Date(searchParams.get('endDate') as string) 
      : new Date();
    const startDate = subMonths(startOfMonth(endDate), months - 1);
    
    // Get monthly revenue from paid invoices using Drizzle query builder
    const monthlyRevenueResult = await db
      .select({
        month: sql<string>`TO_CHAR(DATE_TRUNC('month', ${invoices.paidAt}), 'YYYY-MM')`,
        revenue: sql<number>`SUM(${invoices.total})`
      })
      .from(invoices)
      .where(
        and(
          eq(invoices.companyId, companyId),
          eq(invoices.status, 'paid'),
          eq(invoices.softDelete, false),
          gte(invoices.paidAt, sql`${startDate}::timestamp`),
          lte(invoices.paidAt, sql`${endOfMonth(endDate)}::timestamp`)
        )
      )
      .groupBy(sql`DATE_TRUNC('month', ${invoices.paidAt})`)
      .orderBy(sql`DATE_TRUNC('month', ${invoices.paidAt})`);
    
    // Get count of invoices by status
    const invoiceStatusCountResult = await db
      .select({
        status: invoices.status,
        count: sql<number>`COUNT(*)`
      })
      .from(invoices)
      .where(
        and(
          eq(invoices.companyId, companyId),
          eq(invoices.softDelete, false),
          gte(invoices.createdAt, sql`${startDate}::timestamp`),
          lte(invoices.createdAt, sql`${endOfMonth(endDate)}::timestamp`)
        )
      )
      .groupBy(invoices.status);
    
    // Format months with zero values where no revenue
    const monthlyRevenue: { month: string; revenue: number }[] = [];
    let currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const monthStr = format(currentDate, 'yyyy-MM');
      const found = monthlyRevenueResult.find(item => item.month === monthStr);
      
      monthlyRevenue.push({
        month: monthStr,
        revenue: found ? parseFloat(found.revenue.toString()) : 0
      });
      
      currentDate = new Date(currentDate.setMonth(currentDate.getMonth() + 1));
    }
    
    // Calculate totals and format status summary
    const totalRevenue = monthlyRevenue.reduce((sum, item) => sum + item.revenue, 0);
    const averageMonthlyRevenue = totalRevenue / months;
    
    // Create a properly typed status counts object
    const statusCounts: Record<string, number> = {};
    invoiceStatusCountResult.forEach(item => {
      statusCounts[item.status] = parseInt(item.count.toString());
    });
    
    return NextResponse.json({
      monthlyRevenue,
      summary: {
        totalRevenue,
        averageMonthlyRevenue,
        invoicesByStatus: statusCounts
      }
    });
    
  } catch (error) {
    console.error('Error generating revenue overview:', error);
    return NextResponse.json(
      { message: 'Failed to generate revenue overview' },
      { status: 500 }
    );
  }
} 