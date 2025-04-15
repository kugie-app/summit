import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { getProfitLossSummary, getLast6MonthsProfitLoss } from '@/lib/reports/profit-loss';
import { z } from 'zod';
import { format, subMonths } from 'date-fns';

// Query parameter validation schema
const querySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  period: z.enum(['last6months', 'custom']).default('last6months'),
});

// GET /api/reports/profit-loss - Get profit & loss report
export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !session.user.companyId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    const companyId = parseInt(session.user.companyId);
    
    // Extract and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || 'last6months';
    let startDate = searchParams.get('startDate');
    let endDate = searchParams.get('endDate');
    
    // For 'last6months' period, ignore provided dates and use last 6 months
    if (period === 'last6months') {
      return NextResponse.json(await getLast6MonthsProfitLoss(companyId));
    }
    
    // For custom period, validate dates
    if (!startDate || !endDate) {
      // Default to current month if no dates provided
      const today = new Date();
      endDate = format(today, 'yyyy-MM-dd');
      startDate = format(subMonths(today, 1), 'yyyy-MM-dd');
    }
    
    // Get profit & loss summary for the specified period
    const summary = await getProfitLossSummary(companyId, startDate, endDate);
    
    return NextResponse.json(summary);
    
  } catch (error) {
    console.error('Error fetching profit & loss report:', error);
    return NextResponse.json(
      { message: 'Failed to fetch profit & loss report' },
      { status: 500 }
    );
  }
} 