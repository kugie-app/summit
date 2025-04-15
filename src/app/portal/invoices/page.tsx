import { Metadata } from 'next';
import { requireClientAuth } from '@/lib/auth/client/utils';
import { db } from '@/lib/db';
import { invoices, payments } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Invoices',
  description: 'View and manage your invoices',
};

export default async function InvoicesPage() {
  // This function redirects to login if not authenticated
  const session = await requireClientAuth();
  
  // Get all client invoices
  const clientInvoices = await db
    .select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      status: invoices.status,
      issueDate: invoices.issueDate,
      dueDate: invoices.dueDate,
      total: invoices.total,
      currency: invoices.currency,
      xenditInvoiceUrl: invoices.xenditInvoiceUrl,
      paidAt: invoices.paidAt,
    })
    .from(invoices)
    .where(
      and(
        eq(invoices.clientId, session.clientId),
        eq(invoices.softDelete, false)
      )
    )
    .orderBy(invoices.dueDate);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Invoices</h1>
      
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {clientInvoices.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {clientInvoices.map((invoice) => (
              <li key={invoice.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col sm:flex-row sm:items-center">
                      <p className="text-sm font-medium text-primary truncate">
                        Invoice #{invoice.invoiceNumber}
                      </p>
                      <p className="mt-1 sm:mt-0 sm:ml-6 flex-shrink-0 text-sm text-gray-500">
                        {new Date(invoice.issueDate).toLocaleDateString()} - {new Date(invoice.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="ml-2 flex-shrink-0 flex">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                        invoice.status === 'overdue' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {invoice.status}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-gray-500">
                        Amount: {invoice.total} {invoice.currency}
                      </p>
                      {invoice.paidAt && (
                        <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                          Paid on {new Date(invoice.paidAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                      <Link 
                        href={`/portal/invoices/${invoice.id}`}
                        className="text-primary font-medium hover:text-primary/80"
                      >
                        View details
                      </Link>
                      {invoice.xenditInvoiceUrl && invoice.status !== 'paid' && (
                        <a
                          href={invoice.xenditInvoiceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-6 text-primary font-medium hover:text-primary/80"
                        >
                          Pay now
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="px-4 py-5 sm:p-6 text-center">
            <p className="text-gray-500">No invoices found.</p>
          </div>
        )}
      </div>
    </div>
  );
} 