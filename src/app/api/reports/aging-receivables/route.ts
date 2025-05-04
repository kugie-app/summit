import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { getAgingReceivables } from '@/lib/reports/invoice-reports';

// GET /api/reports/aging-receivables - Get aging receivables report
export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !session.user.companyId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    const companyId = parseInt(session.user.companyId);
    
    // Get date range parameters
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    
    // Get the aging receivables report
    const report = await getAgingReceivables(companyId, startDate, endDate);
    
    return NextResponse.json(report);
    
  } catch (error) {
    console.error('Error fetching aging receivables report:', error);
    return NextResponse.json(
      { message: 'Failed to fetch aging receivables report' },
      { status: 500 }
    );
  }
} 