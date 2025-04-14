'use client';

import { QuoteForm } from '@/components/quotes/QuoteForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function NewQuotePage() {
  const router = useRouter();
  
  const handleCancel = () => {
    router.push('/quotes');
  };
  
  const handleSuccess = (quote: any) => {
    toast.success('Quote created successfully');
    router.push(`/quotes/${quote.id}`);
  };
  
  // Create initial form data with defaults
  const initialData = {
    quoteNumber: `QUO-${format(new Date(), 'yyyyMMdd')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
    status: 'draft' as 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired',
    issueDate: format(new Date(), 'yyyy-MM-dd'),
    expiryDate: format(new Date(new Date().setDate(new Date().getDate() + 30)), 'yyyy-MM-dd'),
    items: [],
  };
  
  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.push('/quotes')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New Quote</h1>
          <p className="text-muted-foreground">Create a new quote for your client</p>
        </div>
      </div>
      
      <QuoteForm 
        initialData={initialData} 
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
} 