import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { verifyTokenSecret, API_TOKEN_PREFIX } from '@/lib/auth/apiTokenUtils';
import { apiTokens, users as dbUsers } from '@/lib/db/schema';
import { db } from '@/lib/db';
import { eq, and, isNull, or } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

const publicPaths = [
  '/auth/signin',
  '/auth/signup',
  '/auth/signout',
  '/api/auth',
  // Add all paths related to accepting invitations
  '/accept-invitation',
  '/api/invitations/verify',
  '/api/invitations/accept',
  // Client portal public paths
  '/portal/login',
  '/portal/verify',
  '/api/portal/auth',
  '/api/webhooks/xendit/payment',
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Block access to signup when disabled
  if (process.env.NEXT_PUBLIC_DISABLE_SIGNUP === '1') {
    // Block access to signup page
    if (pathname === '/auth/signup') {
      return NextResponse.redirect(new URL('/auth/signin', request.url));
    }
    
    // Block access to registration API
    if (pathname === '/api/auth/register') {
      return NextResponse.json(
        { message: 'Signups are currently disabled' },
        { status: 403 }
      );
    }
  }
  
  // Check if the path is public or starts with one of the public paths
  if (publicPaths.some(path => pathname === path || pathname.startsWith(path))) {
    return NextResponse.next();
  }
  
  // Special explicit handling for the accept-invitation path with query parameters
  if (pathname === '/accept-invitation') {
    return NextResponse.next();
  }
  
  // Special case for the root path - redirect to dashboard if authenticated
  if (pathname === '/') {
    return NextResponse.next();
  }
  
  // For client portal routes
  if (pathname.startsWith('/portal')) {
    // Check client JWT cookie
    const clientToken = request.cookies.get('client_token')?.value;
    
    if (!clientToken) {
      const url = new URL('/portal/login', request.url);
      url.searchParams.set('callbackUrl', encodeURI(request.url));
      return NextResponse.redirect(url);
    }
    
    // Allow client to continue to portal route
    return NextResponse.next();
  }
  
  // For API portal routes, check client token and return 401 if not present
  if (pathname.startsWith('/api/portal') && !pathname.startsWith('/api/portal/auth')) {
    const clientToken = request.cookies.get('client_token')?.value;
    
    if (!clientToken) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    return NextResponse.next();
  }
  
  // Enhanced API route handling
  if (pathname.startsWith('/api/')) {
    const skipAuthPaths = ['/api/auth', '/api/portal/auth', '/api/webhooks', '/api/debug'];
    if (skipAuthPaths.some(path => pathname.startsWith(path))) {
      return NextResponse.next();
    }
    const authHeader = request.headers.get('Authorization');
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const fullToken = authHeader.substring(7);
      if (fullToken.startsWith(API_TOKEN_PREFIX) && fullToken.includes('_')) {
        const parts = fullToken.split('_');
        if (parts.length >= 2) {
          const tokenPrefix = parts[0] + '_' + parts[1];
          const secretPart = parts.slice(2).join('_');
          if (tokenPrefix && secretPart) {
            try {
              const tokenRecords = await db
                .select()
                .from(apiTokens)
                .where(
                  and(
                    eq(apiTokens.tokenPrefix, tokenPrefix),
                    isNull(apiTokens.revokedAt),
                    or(isNull(apiTokens.expiresAt), sql`${apiTokens.expiresAt} > NOW()`)
                  )
                );
              
              const tokenRecord = tokenRecords[0];
              
              if (tokenRecord) {
                const isValid = await verifyTokenSecret(secretPart, tokenRecord.tokenHash);
                
                if (isValid) {
                  // Token is valid - update last used timestamp
                  await db.update(apiTokens)
                    .set({ lastUsedAt: new Date() })
                    .where(eq(apiTokens.id, tokenRecord.id));
                  
                  // Add user and company info to request headers
                  const requestHeaders = new Headers(request.headers);
                  requestHeaders.set('x-api-token-user-id', tokenRecord.userId.toString());
                  requestHeaders.set('x-api-token-company-id', tokenRecord.companyId.toString());
                  
                  // Get user role for permissions
                  const [apiUser] = await db
                    .select({ role: dbUsers.role })
                    .from(dbUsers)
                    .where(eq(dbUsers.id, tokenRecord.userId));
                    
                  if (apiUser) {
                    requestHeaders.set('x-api-token-user-role', apiUser.role);
                  }

                  return NextResponse.next({
                    request: {
                      headers: requestHeaders,
                    },
                  });
                }
              }
            } catch (error) {
              console.error('API token validation error:', error);
              // Continue to regular auth check if token validation fails
            }
          }
        }
      }
    }
    
    // Fall back to session-based authentication if no API token or invalid token
    const token = await getToken({ req: request });
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    return NextResponse.next();
  }
  
  // For all other routes, check for authentication and redirect to signin if not authenticated
  const token = await getToken({ req: request });
  
  if (!token) {
    const url = new URL('/auth/signin', request.url);
    // Use a simpler callbackUrl to avoid potential encoding issues
    url.searchParams.set('callbackUrl', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images (image files)
     * - public files
     */
    '/((?!_next/static|_next/image|favicon.ico|images|public).*)',
  ]
}; 