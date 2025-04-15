'use client';

import { ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { Role } from '@/lib/auth/permissions/roles';

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: Role[];
  fallback?: ReactNode;
}

/**
 * Client component that conditionally renders children based on user role
 */
export function RoleGuard({ children, allowedRoles, fallback = null }: RoleGuardProps) {
  const { data: session, status } = useSession();

  // While loading, show nothing
  if (status === 'loading') {
    return null;
  }

  // If not authenticated, show fallback
  if (status !== 'authenticated' || !session?.user) {
    return fallback;
  }

  // Check if user has an allowed role
  const userRole = session.user.role as Role;
  if (!allowedRoles.includes(userRole)) {
    return fallback;
  }

  return <>{children}</>;
}

/**
 * Guard that only shows content to admins
 */
export function AdminOnly({ children, fallback = null }: Omit<RoleGuardProps, 'allowedRoles'>) {
  return (
    <RoleGuard allowedRoles={['admin']} fallback={fallback}>
      {children}
    </RoleGuard>
  );
}

/**
 * Guard that only shows content to users with financial access
 */
export function FinancialAccessOnly({ children, fallback = null }: Omit<RoleGuardProps, 'allowedRoles'>) {
  return (
    <RoleGuard allowedRoles={['admin', 'accountant']} fallback={fallback}>
      {children}
    </RoleGuard>
  );
} 