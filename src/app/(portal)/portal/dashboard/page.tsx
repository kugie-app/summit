import { Metadata } from 'next';
import { requireClientAuth } from '@/lib/auth/client/utils';
import { db } from '@/lib/db';
import { invoices, quotes } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Client Portal Dashboard',
  description: 'Access your invoices and quotes',
};

export default async function DashboardPage() {
  // This function redirects to login if not authenticated
  const session = await requireClientAuth();
  
  // Get client invoices
  const clientInvoices = await db
    .select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      status: invoices.status,
      issueDate: invoices.issueDate,
      dueDate: invoices.dueDate,
      total: invoices.total,
      xenditInvoiceUrl: invoices.xenditInvoiceUrl,
    })
    .from(invoices)
    .where(
      and(
        eq(invoices.clientId, session.clientId),
        eq(invoices.softDelete, false)
      )
    )
    .orderBy(invoices.dueDate)
    .limit(5);
  
  // Get client quotes
  const clientQuotes = await db
    .select({
      id: quotes.id,
      quoteNumber: quotes.quoteNumber,
      status: quotes.status,
      issueDate: quotes.issueDate,
      expiryDate: quotes.expiryDate,
      total: quotes.total,
    })
    .from(quotes)
    .where(
      and(
        eq(quotes.clientId, session.clientId),
        eq(quotes.softDelete, false)
      )
    )
    .orderBy(quotes.expiryDate)
    .limit(5);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        {/* <button
          onClick={async () => {
            await fetch('/api/portal/auth/logout', { method: 'POST' });
            window.location.href = '/portal/login';
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          Sign Out
        </button> */}
      </div>

      <div className="grid grid-cols-1 gap-6 mb-8 lg:grid-cols-2">
        {/* Recent Invoices */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-medium text-gray-900">Recent Invoices</h2>
              <p className="mt-1 text-sm text-gray-500">Your most recent invoices</p>
            </div>
            <Link
              href="/portal/invoices"
              className="text-sm font-medium text-primary hover:text-primary/90"
            >
              View all
            </Link>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            {clientInvoices.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {clientInvoices.map((invoice) => (
                  <li key={invoice.id} className="py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Invoice #{invoice.invoiceNumber}
                        </p>
                        <p className="text-sm text-gray-500">
                          Due: {new Date(invoice.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                          invoice.status === 'overdue' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {invoice.status}
                        </span>
                        <div className="ml-4 flex-shrink-0">
                          <Link
                            href={`/portal/invoices/${invoice.id}`}
                            className="text-sm font-medium text-primary hover:text-primary/90"
                          >
                            View
                          </Link>
                          {invoice.xenditInvoiceUrl && (
                            <a 
                              href={invoice.xenditInvoiceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-4 text-sm font-medium text-primary hover:text-primary/90"
                            >
                              Pay Now
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No invoices found.</p>
            )}
          </div>
        </div>

        {/* Recent Quotes */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
            <div>
              <h2 className="text-lg font-medium text-gray-900">Recent Quotes</h2>
              <p className="mt-1 text-sm text-gray-500">Your most recent quotes</p>
            </div>
            <Link
              href="/portal/quotes"
              className="text-sm font-medium text-primary hover:text-primary/90"
            >
              View all
            </Link>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
            {clientQuotes.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {clientQuotes.map((quote) => (
                  <li key={quote.id} className="py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Quote #{quote.quoteNumber}
                        </p>
                        <p className="text-sm text-gray-500">
                          Expires: {new Date(quote.expiryDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          quote.status === 'accepted' ? 'bg-green-100 text-green-800' :
                          quote.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          quote.status === 'expired' ? 'bg-gray-100 text-gray-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {quote.status}
                        </span>
                        <div className="ml-4 flex-shrink-0">
                          <Link
                            href={`/portal/quotes/${quote.id}`}
                            className="text-sm font-medium text-primary hover:text-primary/90"
                          >
                            View
                          </Link>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No quotes found.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 