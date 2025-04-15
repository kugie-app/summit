import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { getInvoiceSummary } from '@/lib/reports/invoice-reports';

// GET /api/reports/invoice-summary - Get invoice summary for the company
export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !session.user.companyId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    const companyId = parseInt(session.user.companyId);
    
    // Get the invoice summary
    const summary = await getInvoiceSummary(companyId);
    
    return NextResponse.json(summary);
    
  } catch (error) {
    console.error('Error fetching invoice summary:', error);
    return NextResponse.json(
      { message: 'Failed to fetch invoice summary' },
      { status: 500 }
    );
  }
} 