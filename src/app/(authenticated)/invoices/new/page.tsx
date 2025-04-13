'use client';

import { InvoiceForm } from '@/components/invoices/InvoiceForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function NewInvoicePage() {
  const router = useRouter();
  
  const handleCancel = () => {
    router.push('/invoices');
  };
  
  const handleSuccess = (invoice: any) => {
    toast.success('Invoice created successfully');
    router.push(`/invoices/${invoice.id}`);
  };
  
  // Create initial form data with defaults
  const initialData = {
    invoiceNumber: `INV-${format(new Date(), 'yyyyMMdd')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
    status: 'draft' as 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled',
    issueDate: format(new Date(), 'yyyy-MM-dd'),
    dueDate: format(new Date(new Date().setDate(new Date().getDate() + 30)), 'yyyy-MM-dd'),
    items: [],
  };
  
  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.push('/invoices')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New Invoice</h1>
          <p className="text-muted-foreground">Create a new invoice for your client</p>
        </div>
      </div>
      
      <InvoiceForm 
        initialData={initialData} 
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
} 