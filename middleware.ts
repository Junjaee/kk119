import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const token = request.cookies.get('auth-token');

  // Public paths that don't require authentication
  const publicPaths = ['/', '/login', '/signup', '/api/auth/login', '/api/auth/logout', '/api/auth/signup'];
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));

  // Static files and Next.js internals
  if (pathname.startsWith('/_next') || pathname.startsWith('/api/_next') || pathname.includes('.')) {
    return NextResponse.next();
  }

  // Allow public paths
  if (isPublicPath) {
    // If already logged in and trying to access login/signup, redirect to home
    if (token && (pathname === '/login' || pathname === '/signup')) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    return NextResponse.next();
  }

  // Teacher-only routes (Task 34) - require authentication
  if (pathname.startsWith('/teacher')) {
    if (!token) {
      // Redirect to login if not authenticated
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Task 38: Resources route - restrict to teachers and admins only (block lawyers)
    if (pathname.startsWith('/teacher/resources')) {
      try {
        // Decode JWT to check user role
        const payload = JSON.parse(atob(token.value.split('.')[1]));
        const userRole = payload.role;

        // Block lawyer access to resources
        if (userRole === 'lawyer') {
          // Redirect lawyers back to their dashboard
          return NextResponse.redirect(new URL('/lawyer', request.url));
        }
        // Allow teacher, admin
      } catch (error) {
        console.error('Failed to decode token:', error);
        // If token is invalid, redirect to login
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('from', pathname);
        return NextResponse.redirect(loginUrl);
      }
    }

    return NextResponse.next();
  }

  // Lawyer-only routes (Task 37) - require authentication
  if (pathname.startsWith('/lawyer')) {
    if (!token) {
      // Redirect to login if not authenticated
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // Check for authentication for other protected routes
  if (!token) {
    // Redirect to login if not authenticated
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Continue with the request
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
    '/((?!_next/static|_next/image|favicon.ico|.*\.png$|.*\.jpg$|.*\.jpeg$|.*\.gif$|.*\.svg$|.*\.ico$).*)',
  ],
};
