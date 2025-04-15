import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { db } from '@/lib/db';
import { invoices } from '@/lib/db/schema';
import { and, eq, sql, gte, lte } from 'drizzle-orm';
import { authOptions } from '@/lib/auth/options';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';

// GET /api/reports/revenue-overview
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !session.user.companyId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const companyId = parseInt(session.user.companyId);
    
    // Parse query parameters for date range
    const searchParams = request.nextUrl.searchParams;
    const months = parseInt(searchParams.get('months') || '12'); // Default to last 12 months
    
    // Calculate date range
    const endDate = new Date();
    const startDate = subMonths(startOfMonth(endDate), months - 1);
    
    // Query to get monthly revenue from paid invoices
    const monthlyRevenueQuery = sql`
      SELECT 
        date_trunc('month', invoices.paid_at) as month,
        SUM(CAST(invoices.total AS NUMERIC)) as revenue
      FROM invoices
      WHERE 
        invoices.company_id = ${companyId}
        AND invoices.status = 'paid'
        AND invoices.soft_delete = false
        AND invoices.paid_at >= ${startDate}
        AND invoices.paid_at <= ${endDate}
      GROUP BY date_trunc('month', invoices.paid_at)
      ORDER BY month ASC
    `;
    
    const monthlyRevenueResult = await db.execute(monthlyRevenueQuery);
    
    // Count total paid and unpaid invoices
    const invoiceStatusQuery = sql`
      SELECT 
        invoices.status,
        COUNT(*) as count,
        SUM(CAST(invoices.total AS NUMERIC)) as amount
      FROM invoices
      WHERE 
        invoices.company_id = ${companyId}
        AND invoices.soft_delete = false
      GROUP BY invoices.status
    `;
    
    const invoiceStatusResult = await db.execute(invoiceStatusQuery);
    
    // Format the data for the frontend
    const formattedMonthlyRevenue = monthlyRevenueResult.rows.map(row => ({
      month: format(new Date(row.month as string), 'MMM yyyy'),
      revenue: parseFloat(row.revenue as string || '0'),
    }));
    
    // Format invoice status data
    const invoiceStatusSummary = invoiceStatusResult.rows.reduce((acc, row) => {
      acc[row.status as string] = {
        count: parseInt(row.count as string),
        amount: parseFloat(row.amount as string || '0'),
      };
      return acc;
    }, {} as Record<string, { count: number; amount: number }>);
    
    return NextResponse.json({
      monthlyRevenue: formattedMonthlyRevenue,
      invoiceStatusSummary,
    });
    
  } catch (error) {
    console.error('Error generating revenue overview report:', error);
    return NextResponse.json(
      { message: 'Failed to generate revenue overview report' },
      { status: 500 }
    );
  }
} 