import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Access Denied',
  description: 'You do not have permission to access this resource',
};

export default function AccessDeniedPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Access Denied
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            You do not have permission to access this resource.
          </p>
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            If you believe you should have access to this page, please contact your administrator.
          </p>
          <div className="mt-6">
            <Link
              href="/dashboard"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 