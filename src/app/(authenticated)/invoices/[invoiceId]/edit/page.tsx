'use client';

import { useState, useEffect } from 'react';
import { InvoiceForm } from '@/components/invoices/InvoiceForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function EditInvoicePage({ params }: { params: Promise<{ invoiceId: string }> }) {
  const router = useRouter();
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchInvoice = async () => {
      setLoading(true);
      try {
        const { invoiceId } = await params;
        const response = await fetch(`/api/invoices/${invoiceId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch invoice');
        }
        
        const data = await response.json();
        setInvoice(data);
      } catch (error) {
        console.error('Error fetching invoice:', error);
        toast.error('Failed to load invoice details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchInvoice();
  }, [params]);
  
  const handleCancel = async () => {
    const { invoiceId } = await params;
    router.push(`/invoices/${invoiceId}`);
  };
  
  const handleSuccess = async() => {
    toast.success('Invoice updated successfully');
    const { invoiceId } = await params;
    router.push(`/invoices/${invoiceId}`);
  };
  
  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-center items-center h-64">
          <p>Loading invoice details...</p>
        </div>
      </div>
    );
  }
  
  if (!invoice) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-center items-center h-64">
          <p>Invoice not found or you don&apos;t have permission to edit it.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.push(`/invoices/${params}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Invoice</h1>
          <p className="text-muted-foreground">Modify invoice {invoice.invoiceNumber}</p>
        </div>
      </div>
      
      <InvoiceForm 
        initialData={invoice} 
        onSuccess={handleSuccess}
        onCancel={handleCancel}
      />
    </div>
  );
} 