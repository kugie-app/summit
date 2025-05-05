'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { XCircle } from 'lucide-react';

export default function PaymentFailurePage() {
  const router = useRouter();
  
  return (
    <div className="container mx-auto py-20 flex flex-col items-center justify-center">
      <div className="bg-white p-10 rounded-xl shadow-md max-w-lg w-full text-center space-y-6">
        <div className="flex justify-center">
          <XCircle className="h-20 w-20 text-red-500" />
        </div>
        <h1 className="text-3xl font-bold">Payment Failed</h1>
        <p className="text-gray-600">
          We&apos;re sorry, but there was a problem processing your payment. Please try again or contact support if the issue persists.
        </p>
        <div className="pt-6 space-y-4">
          <Button 
            onClick={() => router.push('/invoices')}
            className="w-full"
          >
            Back to Invoices
          </Button>
          <Button 
            variant="outline"
            onClick={() => router.push('/contact')}
            className="w-full"
          >
            Contact Support
          </Button>
        </div>
      </div>
    </div>
  );
} 