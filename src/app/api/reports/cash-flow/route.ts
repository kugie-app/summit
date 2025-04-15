import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { getCashFlowSummary, getMonthsCashFlow, getAccountBalances } from '@/lib/reports/cash-flow';
import { format, parseISO, isValid } from 'date-fns';

// GET /api/reports/cash-flow
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !session.user.companyId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const companyId = parseInt(session.user.companyId);
    
    // Parse query parameters for date range or months
    const searchParams = request.nextUrl.searchParams;
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const monthsParam = searchParams.get('months');
    
    // If start and end dates are provided, generate a custom date range report
    if (startDateParam && endDateParam) {
      const startDate = parseISO(startDateParam);
      const endDate = parseISO(endDateParam);
      
      // Validate dates
      if (!isValid(startDate) || !isValid(endDate)) {
        return NextResponse.json(
          { message: 'Invalid date format. Please use YYYY-MM-DD.' },
          { status: 400 }
        );
      }
      
      if (startDate > endDate) {
        return NextResponse.json(
          { message: 'Start date must be before end date.' },
          { status: 400 }
        );
      }
      
      // Get cash flow summary for the custom date range
      const cashFlowSummary = await getCashFlowSummary(
        companyId,
        format(startDate, 'yyyy-MM-dd'),
        format(endDate, 'yyyy-MM-dd')
      );
      
      // Get account balances
      const accountBalances = await getAccountBalances(
        companyId,
        format(endDate, 'yyyy-MM-dd')
      );
      
      // Group accounts by type
      const accountsByType = accountBalances.reduce((acc, account) => {
        const type = account.type;
        if (!acc[type]) {
          acc[type] = [];
        }
        acc[type].push(account);
        return acc;
      }, {} as Record<string, typeof accountBalances>);
      
      // Calculate total balance by account type
      const balanceByType = Object.entries(accountsByType).reduce((acc, [type, accounts]) => {
        acc[type] = accounts.reduce((sum, account) => sum + Number(account.currentBalance), 0);
        return acc;
      }, {} as Record<string, number>);
      
      return NextResponse.json({
        summary: cashFlowSummary,
        accounts: {
          list: accountBalances,
          byType: accountsByType,
          balanceByType
        },
        customDateRange: true
      });
    } 
    // Otherwise, return data for the last n months (default: 6)
    else {
      const months = monthsParam ? parseInt(monthsParam) : 6;
      
      if (isNaN(months) || months < 1 || months > 48) {
        return NextResponse.json(
          { message: 'Invalid months parameter. Please provide a number between 1 and 48.' },
          { status: 400 }
        );
      }
      
      // Get cash flow data for the specified number of months
      const cashFlowData = await getMonthsCashFlow(companyId, months);
      
      // Get account balances
      const accountBalances = await getAccountBalances(
        companyId,
        format(new Date(), 'yyyy-MM-dd')
      );
      
      // Group accounts by type
      const accountsByType = accountBalances.reduce((acc, account) => {
        const type = account.type;
        if (!acc[type]) {
          acc[type] = [];
        }
        acc[type].push(account);
        return acc;
      }, {} as Record<string, typeof accountBalances>);
      
      // Calculate total balance by account type
      const balanceByType = Object.entries(accountsByType).reduce((acc, [type, accounts]) => {
        acc[type] = accounts.reduce((sum, account) => sum + Number(account.currentBalance), 0);
        return acc;
      }, {} as Record<string, number>);
      
      return NextResponse.json({
        cashFlowData,
        accounts: {
          list: accountBalances,
          byType: accountsByType,
          balanceByType
        },
        customDateRange: false
      });
    }
    
  } catch (error) {
    console.error('Error generating cash flow report:', error);
    return NextResponse.json(
      { message: 'Failed to generate cash flow report' },
      { status: 500 }
    );
  }
} 