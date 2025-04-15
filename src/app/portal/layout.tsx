import type { Metadata } from 'next';
import Link from 'next/link';
import { getClientSession } from '@/lib/auth/client/utils';

export const metadata: Metadata = {
  title: {
    template: '%s | Client Portal',
    default: 'Client Portal',
  },
  description: 'Access your invoices, quotes, and more',
};

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getClientSession();
  const isLoggedIn = !!session;

  return (
    <div className="min-h-screen bg-gray-50">
      {isLoggedIn && (
        <header className="bg-primary">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <div className="text-white font-bold text-xl">Client Portal</div>
                <nav className="ml-10 flex items-baseline space-x-4">
                  <Link
                    href="/portal/dashboard"
                    className="text-white hover:bg-primary-dark hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/portal/invoices"
                    className="text-gray-100 hover:bg-primary-dark hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Invoices
                  </Link>
                  <Link
                    href="/portal/quotes"
                    className="text-gray-100 hover:bg-primary-dark hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Quotes
                  </Link>
                </nav>
              </div>
              {session?.name && (
                <div className="text-white text-sm">
                  Welcome, {session.name}
                </div>
              )}
            </div>
          </div>
        </header>
      )}
      <main className="flex-1">{children}</main>
    </div>
  );
} 