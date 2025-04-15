import { Metadata } from 'next';
import { requireClientAuth } from '@/lib/auth/client/utils';
import { db } from '@/lib/db';
import { quotes } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Quotes',
  description: 'View and manage your quotes',
};

export default async function QuotesPage() {
  // This function redirects to login if not authenticated
  const session = await requireClientAuth();
  
  // Get all client quotes
  const clientQuotes = await db
    .select({
      id: quotes.id,
      quoteNumber: quotes.quoteNumber,
      status: quotes.status,
      issueDate: quotes.issueDate,
      expiryDate: quotes.expiryDate,
      total: quotes.total,
      acceptedAt: quotes.acceptedAt,
    })
    .from(quotes)
    .where(
      and(
        eq(quotes.clientId, session.clientId),
        eq(quotes.softDelete, false)
      )
    )
    .orderBy(quotes.expiryDate);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Quotes</h1>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {clientQuotes.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {clientQuotes.map((quote) => (
              <li key={quote.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col sm:flex-row sm:items-center">
                      <p className="text-sm font-medium text-primary truncate">
                        Quote #{quote.quoteNumber}
                      </p>
                      <p className="mt-1 sm:mt-0 sm:ml-6 flex-shrink-0 text-sm text-gray-500">
                        Valid until: {new Date(quote.expiryDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="ml-2 flex-shrink-0 flex">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        quote.status === 'accepted' ? 'bg-green-100 text-green-800' :
                        quote.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        quote.status === 'expired' ? 'bg-gray-100 text-gray-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {quote.status}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-gray-500">
                        Created: {new Date(quote.issueDate).toLocaleDateString()}
                      </p>
                      {quote.acceptedAt && (
                        <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                          Accepted on: {new Date(quote.acceptedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                      <Link 
                        href={`/portal/quotes/${quote.id}`}
                        className="text-primary font-medium hover:text-primary/80"
                      >
                        View details
                      </Link>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="px-4 py-5 sm:p-6 text-center">
            <p className="text-gray-500">No quotes found.</p>
          </div>
        )}
      </div>
    </div>
  );
} 