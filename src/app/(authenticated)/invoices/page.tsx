import { InvoiceList } from '@/components/invoices/InvoiceList';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Invoices | Summit',
  description: 'Manage your business invoices',
};

export default function InvoicesPage() {
  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Invoices</h1>
          <p className="text-muted-foreground">Manage your client invoices</p>
        </div>
      </div>
      
      <InvoiceList className="mt-6" />
    </div>
  );
} 