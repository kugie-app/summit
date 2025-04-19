import { NextRequest, NextResponse } from 'next/server';
import { processAllRecurringItems } from '@/lib/cron/recurring-items';

// POST /api/cron/process-recurring - Process all recurring items (invoices, expenses, income)
export async function POST(request: NextRequest) {
  try {
    // Verify cron job authentication using a secret header
    const authHeader = request.headers.get('x-cron-api-key');
    const expectedApiKey = process.env.CRON_API_KEY;
    
    // Simple auth check to prevent unauthorized access
    if (!authHeader || authHeader !== expectedApiKey) {
      console.error('Unauthorized cron job request attempt');
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    // Process all recurring items
    const result = await processAllRecurringItems();
    
    return NextResponse.json({
      message: 'Recurring items processed successfully',
      result,
    });
    
  } catch (error) {
    console.error('Error in recurring items processing cron job:', error);
    return NextResponse.json(
      { message: 'Failed to process recurring items' },
      { status: 500 }
    );
  }
}

// GET /api/cron/process-recurring - Alternative endpoint for testing
export async function GET(request: NextRequest) {
  // Only allow GET requests in development environment for testing
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ message: 'Method not allowed in production' }, { status: 405 });
  }
  
  try {
    const result = await processAllRecurringItems();
    
    return NextResponse.json({
      message: 'Recurring items processed successfully',
      result,
    });
  } catch (error) {
    console.error('Error in recurring items processing test:', error);
    return NextResponse.json(
      { message: 'Failed to process recurring items' },
      { status: 500 }
    );
  }
} 