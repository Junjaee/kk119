import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth, getUserRole, canAccess, isSuperAdmin, isAdminOrHigher } from './lib/auth/auth-utils';
import { UserRole } from './lib/types';

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

// Role-based path configurations
const rolePaths = {
  super_admin: [
    '/super-admin',
    '/admin/associations',
    '/admin/users/manage'
  ],
  admin: [
    '/admin',
    '/admin/members',
    '/admin/reports'
  ],
  lawyer: [
  ],
  teacher: [
    '/reports/new',
    '/community/new'
  ]
};

// Legacy admin paths (backward compatibility)
const adminPaths = [
  '/admin'
];

// Protected paths that require authentication
const protectedPaths = [
  '/reports',
  '/community/new'
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 🔍 DEBUG: Log all requests
  console.log(`[MIDDLEWARE] Request: ${request.method} ${pathname}`);

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
    console.log(`[MIDDLEWARE] Redirecting to login from protected path: ${pathname}`);
    const loginUrl = new URL('/login', request.url);
    // Store the original URL to redirect after login
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Handle auth pages with existing token - check for server-client mismatch
  if ((pathname === '/login' || pathname === '/signup') && token) {
    try {
      const payload = await auth.verifyToken(token);
      if (payload) {
        // Valid token exists but user is trying to access auth pages
        // This suggests a server-client auth state mismatch
        // Clear the orphaned cookie and allow access to auth pages
        console.log(`[MIDDLEWARE] Server-client auth mismatch detected, clearing orphaned cookie`);
        const response = NextResponse.next();
        response.cookies.delete('auth-token');
        return response;
      }
    } catch (error) {
      console.log(`[MIDDLEWARE] Invalid token found, clearing and allowing access to ${pathname}`);
      // Invalid token, clear it and continue to auth page
      const response = NextResponse.next();
      response.cookies.delete('auth-token');
      return response;
    }
  }
  
  // Role-based access control
  if (token) {
    try {
      // Verify token is valid
      const payload = await auth.verifyToken(token);
      if (!payload) {
        // Invalid token, redirect to login
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('from', pathname);
        const response = NextResponse.redirect(loginUrl);
        response.cookies.delete('auth-token');
        return response;
      }

      // Check role-based access
      let hasAccess = true;
      let requiredRole: UserRole | null = null;

      // Check super admin paths
      if (rolePaths.super_admin.some(path => pathname === path || pathname.startsWith(`${path}/`))) {
        hasAccess = await isSuperAdmin(token);
        requiredRole = 'super_admin';
      }
      // Check admin paths (admin or higher)
      else if (rolePaths.admin.some(path => pathname === path || pathname.startsWith(`${path}/`)) ||
               isAdminPath) {
        hasAccess = await isAdminOrHigher(token);
        requiredRole = 'admin';
      }
      // Check lawyer paths (lawyer or higher)
      else if (rolePaths.lawyer.some(path => pathname === path || pathname.startsWith(`${path}/`))) {
        hasAccess = await canAccess(token, 'lawyer');
        requiredRole = 'lawyer';
      }
      // Check teacher paths (teacher or higher)
      else if (rolePaths.teacher.some(path => pathname === path || pathname.startsWith(`${path}/`))) {
        hasAccess = await canAccess(token, 'teacher');
        requiredRole = 'teacher';
      }

      // Deny access if role requirement not met
      if (!hasAccess && requiredRole) {
        const userRole = await getUserRole(token);
        console.log(`Access denied: User role '${userRole}' insufficient for path requiring '${requiredRole}'`);

        // Redirect to appropriate dashboard based on user's role
        let redirectPath = '/';
        if (userRole === 'super_admin') redirectPath = '/super-admin';
        else if (userRole === 'admin') redirectPath = '/admin';
        else if (userRole === 'lawyer') redirectPath = '/reports';
        else if (userRole === 'teacher') redirectPath = '/reports';

        return NextResponse.redirect(new URL(redirectPath, request.url));
      }

      // Add user info to headers for downstream components
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', payload.userId.toString());
      requestHeaders.set('x-user-role', payload.role);
      requestHeaders.set('x-user-email', payload.email);
      if (payload.association_id) {
        requestHeaders.set('x-user-association', payload.association_id.toString());
      }

      return NextResponse.next({
        request: {
          headers: requestHeaders
        }
      });
    } catch (error) {
      console.error('Middleware auth error:', error);
      // Invalid token, clear it and redirect to login
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete('auth-token');
      return response;
    }
  }
  
  // Continue for public paths without token
  console.log(`[MIDDLEWARE] Allowing request to proceed: ${pathname}`);
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