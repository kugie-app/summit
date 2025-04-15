import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

const publicPaths = [
  '/auth/signin',
  '/auth/signup',
  '/api/auth',
  // Client portal public paths
  '/portal/login',
  '/portal/verify',
  '/api/portal/auth',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if the path is public
  if (publicPaths.some(path => pathname.startsWith(path))) {
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
  
  // For API routes other than auth, check for authentication
  if (pathname.startsWith('/api/')) {
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
    url.searchParams.set('callbackUrl', encodeURI(request.url));
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
  ],
}; 