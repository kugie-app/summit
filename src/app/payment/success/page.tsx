'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

export default function PaymentSuccessPage() {
  const router = useRouter();
  
  return (
    <div className="container mx-auto py-20 flex flex-col items-center justify-center">
      <div className="bg-white p-10 rounded-xl shadow-md max-w-lg w-full text-center space-y-6">
        <div className="flex justify-center">
          <CheckCircle className="h-20 w-20 text-green-500" />
        </div>
        <h1 className="text-3xl font-bold">Payment Successful!</h1>
        <p className="text-gray-600">
          Thank you for your payment. Your transaction has been completed successfully.
        </p>
        <div className="pt-6">
          <Button 
            onClick={() => router.push('/invoices')}
            className="w-full"
          >
            Back to Invoices
          </Button>
        </div>
      </div>
    </div>
  );
} 