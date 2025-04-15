'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { RefreshCw } from 'lucide-react';
import { useSession } from 'next-auth/react';

interface ProcessingResults {
  expensesProcessed: number;
  incomeProcessed: number;
  timestamp: string;
}

export default function RecurringTransactionsButton() {
  const [isProcessing, setIsProcessing] = useState(false);
  const { data: session } = useSession();

  // Only admins should see this button
  if (!session?.user || session.user.role !== 'admin') {
    return null;
  }

  const processRecurringTransactions = async () => {
    setIsProcessing(true);
    
    try {
      const response = await fetch('/api/jobs/recurring-transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to process recurring transactions');
      }
      
      const data = await response.json();
      const results = data.data as ProcessingResults;
      
      toast.success(
        `Successfully processed recurring transactions: ${results.expensesProcessed} expenses and ${results.incomeProcessed} income entries created.`
      );
    } catch (error) {
      console.error('Error processing recurring transactions:', error);
      toast.error(error instanceof Error ? error.message : 'An unknown error occurred');
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={processRecurringTransactions}
      disabled={isProcessing}
      className="gap-2"
    >
      <RefreshCw className={`h-4 w-4 ${isProcessing ? 'animate-spin' : ''}`} />
      {isProcessing ? 'Processing...' : 'Process Recurring Transactions'}
    </Button>
  );
} 