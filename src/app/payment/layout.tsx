import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Payment Status | Summit',
  description: 'Payment status for your invoice',
};

export default function PaymentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={`min-h-screen bg-slate-50 ${inter.className}`}>
      <div className="min-h-screen flex flex-col">
        <header className="border-b bg-white">
          <div className="container mx-auto py-4 px-4 md:px-6">
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">Summit</div>
            </div>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t bg-white">
          <div className="container mx-auto py-4 px-4 md:px-6 text-center text-sm text-gray-500">
            &copy; {new Date().getFullYear()} Summit. All rights reserved.
          </div>
        </footer>
      </div>
    </div>
  );
} 