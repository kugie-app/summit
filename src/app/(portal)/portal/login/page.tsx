import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getClientSession } from '@/lib/auth/client/utils';
import LoginForm from './login-form';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Client Portal Login',
  description: 'Login to your client portal to view invoices and more',
};

interface PageProps {
  searchParams: Promise<{ callbackUrl?: string }>;
}

export default async function LoginPage({
  searchParams,
}: PageProps) {
  // Resolve the searchParams promise
  const resolvedSearchParams = await searchParams;

  // Check if already logged in
  const session = await getClientSession();

  if (session) {
    // Redirect to the callback URL if provided, otherwise to the dashboard
    const callbackUrl = resolvedSearchParams.callbackUrl || '/portal/dashboard';
    redirect(callbackUrl);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Summit Finance Client Portal
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to access your invoices and quotes
          </p>
        </div>

        <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 flex flex-col gap-4 justify-center items-center">
          <LoginForm />
          <Button variant="ghost">
            <Link href="/auth/signin" className="text-sm text-gray-600 hover:text-gray-900">
              Internal User? Login to Summit Finance
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
} 