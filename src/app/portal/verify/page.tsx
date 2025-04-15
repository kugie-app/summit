'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function VerifyPage() {
  const [status, setStatus] = useState<'loading' | 'error' | 'success'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setStatus('error');
      setErrorMessage('Invalid verification link. Please request a new one.');
      return;
    }

    const verifyToken = async () => {
      try {
        const response = await fetch('/api/portal/auth/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Verification failed');
        }

        setStatus('success');
        
        // Redirect to dashboard after successful verification
        setTimeout(() => {
          router.push('/portal/dashboard');
        }, 2000);
      } catch (error) {
        console.error('Error verifying token:', error);
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'Verification failed');
      }
    };

    verifyToken();
  }, [searchParams, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Client Portal
          </h2>

          <div className="mt-8 bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 text-center">
            {status === 'loading' && (
              <div className="flex flex-col items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="mt-4 text-gray-600">Verifying your access...</p>
              </div>
            )}

            {status === 'success' && (
              <div>
                <h3 className="text-lg font-medium text-green-600">Verification successful!</h3>
                <p className="mt-2 text-gray-600">
                  You&apos;re now signed in. Redirecting to your dashboard...
                </p>
              </div>
            )}

            {status === 'error' && (
              <div>
                <h3 className="text-lg font-medium text-red-600">Verification failed</h3>
                <p className="mt-2 text-gray-600">{errorMessage}</p>
                <a
                  href="/portal/login"
                  className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
                >
                  Return to login
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 