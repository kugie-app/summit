import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { Role, UserSession, checkPermission } from './roles';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';

/**
 * Require specific roles for API routes
 */
export async function requireRoles(req: NextRequest, allowedRoles: Role[]) {
  const token = await getToken({ req });
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userRole = token.role as Role;
  if (!allowedRoles.includes(userRole)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return null; // No error, can proceed
}

/**
 * Require specific permission for API routes
 */
export async function requirePermission(req: NextRequest, permission: string) {
  const token = await getToken({ req });
  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const permissions = token.permissions as Record<string, boolean> | undefined;
  if (!permissions || !permissions[permission]) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return null; // No error, can proceed
}

/**
 * Get session and validate role in server components or server actions
 * Redirects to access denied page if unauthorized
 */
export async function getSessionWithRole(allowedRoles: Role[]): Promise<UserSession> {
  const session = await getServerSession(authOptions) as UserSession;
  
  if (!session?.user) {
    redirect('/auth/signin');
  }
  
  if (!allowedRoles.includes(session.user.role)) {
    redirect('/access-denied');
  }
  
  return session;
}

/**
 * Get session and validate permission in server components or server actions
 * Redirects to access denied page if unauthorized
 */
export async function getSessionWithPermission(permission: string): Promise<UserSession> {
  const session = await getServerSession(authOptions) as UserSession;
  
  if (!session?.user) {
    redirect('/auth/signin');
  }
  
  if (!checkPermission(session, permission)) {
    redirect('/access-denied');
  }
  
  return session;
}

/**
 * Check company access in server components or server actions
 * Redirects to access denied page if unauthorized
 */
export async function checkCompanyAccess(companyId: string | number): Promise<UserSession> {
  const session = await getServerSession(authOptions) as UserSession;
  
  if (!session?.user) {
    redirect('/auth/signin');
  }
  
  if (session.user.companyId !== companyId.toString()) {
    redirect('/access-denied');
  }
  
  return session;
} 