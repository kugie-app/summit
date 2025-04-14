import { QuoteList } from '@/components/quotes/QuoteList';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Quotes | Summit',
  description: 'Manage your business quotes',
};

export default function QuotesPage() {
  return (
    <div className="container mx-auto py-6 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quotes</h1>
          <p className="text-muted-foreground">Manage your client quotes</p>
        </div>
      </div>
      
      <QuoteList className="mt-6" />
    </div>
  );
} 