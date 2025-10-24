import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { AuthenticationService } from './lib/middleware/authentication-service';
import { PathClassificationService } from './lib/middleware/path-classification-service';
import { RedirectService } from './lib/middleware/redirect-service';

/**
 * Refactored middleware following SOLID principles
 *
 * Single Responsibility: Each service handles one concern
 * Open/Closed: Easy to extend with new auth providers or path rules
 * Liskov Substitution: Services implement clear interfaces
 * Interface Segregation: Services expose only needed methods
 * Dependency Inversion: Depends on abstractions, not concretions
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Initialize services (Dependency Injection pattern)
  const authService = new AuthenticationService();
  const pathService = new PathClassificationService();
  const redirectService = new RedirectService();

  console.log(`[MIDDLEWARE] Request: ${request.method} ${pathname}`);

  // 1. Extract authentication token
  const { token } = authService.extractToken(request);

  // 2. Classify the current path
  const pathClassification = pathService.classifyPath(pathname);

  // 3. Handle special path scenarios first

  // 3a. Root path redirect for authenticated users
  if (pathService.isRootPath(pathname) && token) {
    const authResult = await authService.verifyToken(token);
    if (authResult.success && authResult.payload) {
      const redirect = redirectService.determineRootRedirect(authResult.payload.role);
      if (redirect.shouldRedirect && redirect.targetUrl) {
        redirectService.logRedirect(
          authResult.payload.role,
          pathname,
          redirect.targetUrl,
          redirect.reason || 'Root redirect'
        );
        return redirectService.createRedirectResponse(request, redirect.targetUrl);
      }
    }
  }

  // 3b. Admin path redirect for regular admins
  if (pathService.isAdminRoot(pathname) && token) {
    const authResult = await authService.verifyToken(token);
    if (authResult.success && authResult.payload) {
      const redirect = redirectService.determineAdminRedirect(authResult.payload.role);
      if (redirect.shouldRedirect && redirect.targetUrl) {
        redirectService.logRedirect(
          authResult.payload.role,
          pathname,
          redirect.targetUrl,
          redirect.reason || 'Admin redirect'
        );
        return redirectService.createRedirectResponse(request, redirect.targetUrl);
      }
    }
  }

  // 4. Handle authentication requirements

  // 4a. Redirect to login if accessing protected path without token
  if (pathClassification.requiresAuth && !token) {
    console.log(`[MIDDLEWARE] Redirecting to login from protected path: ${pathname}`);
    return authService.createLoginRedirect(request, pathname);
  }

  // 4b. Handle auth pages with existing token (server-client mismatch)
  if (pathService.isAuthPage(pathname) && token) {
    const authResult = await authService.verifyToken(token);
    if (authResult.success) {
      return redirectService.handleAuthPageAccess(
        request,
        (response) => authService.clearAuthCookies(response)
      );
    } else {
      return redirectService.handleInvalidToken(
        request,
        pathname,
        (response) => authService.clearAuthCookies(response)
      );
    }
  }

  // 5. Role-based access control for authenticated requests
  if (token) {
    const authResult = await authService.verifyToken(token);

    if (!authResult.success) {
      console.log(`[MIDDLEWARE] Invalid token, redirecting to login`);
      return authService.createLoginRedirect(request, pathname);
    }

    const { payload } = authResult;

    // Check if user has access to the requested path
    const accessResult = pathService.checkAccess(payload.role, pathname);

    if (!accessResult.hasAccess) {
      console.log(accessResult.reason);
      const redirect = redirectService.determineAccessDeniedRedirect(payload.role);
      return redirectService.createRedirectResponse(
        request,
        redirect.targetUrl!,
        redirect.reason
      );
    }

    // Add user info to headers for downstream components
    const requestHeaders = authService.addUserHeaders(request, payload);

    return NextResponse.next({
      request: {
        headers: requestHeaders
      }
    });
  }

  // 6. Continue for public paths without token
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