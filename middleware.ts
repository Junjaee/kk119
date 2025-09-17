import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Public paths that don't require authentication
const publicPaths = [
  '/',
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/privacy',
  '/terms',
  '/api/auth/login',
  '/api/auth/signup',
  '/api/auth/forgot-password',
  '/api/auth/reset-password',
  '/api/health'
];

// Admin only paths
const adminPaths = [
  '/admin'
];

// Protected paths that require authentication
const protectedPaths = [
  '/reports',
  '/community/new',
  '/lawyer',
  '/consult'
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if path is public
  const isPublicPath = publicPaths.some(path => 
    pathname === path || pathname.startsWith(`${path}/`)
  );
  
  // Check if path is protected
  const isProtectedPath = protectedPaths.some(path => 
    pathname === path || pathname.startsWith(`${path}/`)
  );
  
  // Check if path is admin only
  const isAdminPath = adminPaths.some(path => 
    pathname === path || pathname.startsWith(`${path}/`)
  );
  
  // Get auth token from cookie
  const token = request.cookies.get('auth-token')?.value;
  
  // Redirect to login if accessing protected path without token
  if ((isProtectedPath || isAdminPath) && !token) {
    const loginUrl = new URL('/login', request.url);
    // Store the original URL to redirect after login
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // Redirect to home if accessing login/signup with token (temporarily disabled for testing)
  // if ((pathname === '/login' || pathname === '/signup') && token) {
  //   return NextResponse.redirect(new URL('/', request.url));
  // }
  
  // For admin paths, we'll need to verify admin status
  // This would require decoding the JWT or checking the session
  // For now, we'll let it pass and check in the page component
  
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$|.*\\.ico$).*)',
  ],
};