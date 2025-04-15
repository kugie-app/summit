import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { processRecurringTransactions } from '@/lib/jobs/recurring-transactions';

// Secret for simple API key auth when called by external scheduler
const API_KEY = process.env.RECURRING_TRANSACTIONS_API_KEY;

/**
 * API route to trigger the recurring transactions job
 * Can be called:
 * 1. By a logged-in admin user through the UI
 * 2. By an external scheduler using API key authentication
 */
export async function POST(request: NextRequest) {
  // Check for API key authentication first (for external schedulers)
  const authHeader = request.headers.get('Authorization');
  const isApiKeyValid = authHeader && authHeader.startsWith('Bearer ') && 
    authHeader.slice(7) === API_KEY && API_KEY;
  
  // If not using API key, verify user session is authenticated and has admin role
  if (!isApiKeyValid) {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !session.user.companyId || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Only administrators can run this job manually.' },
        { status: 401 }
      );
    }
  }
  
  try {
    // Process recurring transactions
    const results = await processRecurringTransactions();
    
    return NextResponse.json({
      success: true,
      message: 'Recurring transactions processed successfully',
      data: results
    });
  } catch (error) {
    console.error('Error processing recurring transactions:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to process recurring transactions',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * API route to get the status of the recurring transactions job
 * Can be used to check when the job was last run
 */
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || !session.user.companyId) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }
  
  // In a real implementation, we would store and retrieve the job history
  // For this example, we just return a placeholder response
  return NextResponse.json({
    message: 'Recurring transactions job status',
    lastRun: 'Not available - job history not implemented yet',
    nextScheduledRun: 'Not available - job scheduling not implemented yet',
  });
} 