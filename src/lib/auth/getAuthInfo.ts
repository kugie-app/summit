import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from './options';

export type AuthInfo = {
  userId: number;
  companyId: number;
  role?: string;
};

/**
 * Extracts authentication information from either API token headers or session
 * @param request The NextRequest object
 * @returns Object with userId and companyId if authenticated, null otherwise
 */
export async function getAuthInfo(request: NextRequest): Promise<AuthInfo | null> {
  // Check for API token headers first (set by middleware)
  const apiTokenUserId = request.headers.get('x-api-token-user-id');
  const apiTokenCompanyId = request.headers.get('x-api-token-company-id');
  const apiTokenUserRole = request.headers.get('x-api-token-user-role');
  
  // If API token headers exist, use them
  if (apiTokenUserId && apiTokenCompanyId) {
    return {
      userId: parseInt(apiTokenUserId),
      companyId: parseInt(apiTokenCompanyId),
      role: apiTokenUserRole || undefined,
    };
  }
  
  // Otherwise, try session authentication
  const session = await getServerSession(authOptions);
  
  if (!session?.user || !session.user.id || !session.user.companyId) {
    return null;
  }
  
  return {
    userId: parseInt(session.user.id),
    companyId: parseInt(session.user.companyId),
    role: session.user.role,
  };
}

/**
 * Authentication middleware for API routes
 * @param request The NextRequest object
 * @param handler The handler function to call if authentication succeeds
 * @returns NextResponse
 */
export async function withAuth<T>(
  request: NextRequest, 
  handler: (authInfo: AuthInfo) => Promise<NextResponse<T>>
): Promise<NextResponse<T | { message: string }>> {
  const authInfo = await getAuthInfo(request);
  
  if (!authInfo) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }
  
  return handler(authInfo);
} 