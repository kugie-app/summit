'use client';

import { ReactNode } from 'react';
import { useSession } from 'next-auth/react';

interface PermissionGuardProps {
  children: ReactNode;
  permission: string;
  fallback?: ReactNode;
}

/**
 * Client component that conditionally renders children based on user permissions
 */
export function PermissionGuard({
  children,
  permission,
  fallback = null,
}: PermissionGuardProps) {
  const { data: session, status } = useSession();

  // While loading, show nothing
  if (status === 'loading') {
    return null;
  }

  // If not authenticated, show fallback
  if (status !== 'authenticated' || !session?.user) {
    return fallback;
  }

  // Check if user has the required permission
  const hasPermission = session.user.permissions?.[permission];
  if (!hasPermission) {
    return fallback;
  }

  return <>{children}</>;
}

/**
 * Guard that only shows content to users with company management permission
 */
export function CompanyManagerOnly({
  children,
  fallback = null,
}: Omit<PermissionGuardProps, 'permission'>) {
  return (
    <PermissionGuard permission="company.manage" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

/**
 * Guard that only shows content to users with invoice creation permission
 */
export function InvoiceCreatorOnly({
  children,
  fallback = null,
}: Omit<PermissionGuardProps, 'permission'>) {
  return (
    <PermissionGuard permission="invoices.create" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
}

/**
 * Guard that only shows content to users with financial access
 */
export function FinancialAccessOnly({
  children,
  fallback = null,
}: Omit<PermissionGuardProps, 'permission'>) {
  return (
    <PermissionGuard permission="finance.manageAccounts" fallback={fallback}>
      {children}
    </PermissionGuard>
  );
} 