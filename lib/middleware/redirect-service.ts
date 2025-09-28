import { NextRequest, NextResponse } from 'next/server';
import { UserRole } from '../types/index';
import { DEFAULT_ROLE_REDIRECTS, SPECIAL_PATHS } from './constants';

export interface RedirectDecision {
  shouldRedirect: boolean;
  targetUrl?: string;
  reason?: string;
}

export class RedirectService {
  /**
   * Determine redirect for root path based on user role
   * Following Single Responsibility Principle
   */
  public determineRootRedirect(userRole: UserRole): RedirectDecision {
    const redirectMap: Record<UserRole, string> = {
      super_admin: SPECIAL_PATHS.ADMIN,
      admin: SPECIAL_PATHS.ADMIN_DASHBOARD,
      lawyer: SPECIAL_PATHS.LAWYER,
      teacher: SPECIAL_PATHS.ROOT // Teachers stay on root
    };

    const targetUrl = redirectMap[userRole];

    return {
      shouldRedirect: targetUrl !== SPECIAL_PATHS.ROOT,
      targetUrl: targetUrl !== SPECIAL_PATHS.ROOT ? targetUrl : undefined,
      reason: `Role-based redirect for ${userRole}`
    };
  }

  /**
   * Determine redirect for admin path based on user role
   * Following Single Responsibility Principle
   */
  public determineAdminRedirect(userRole: UserRole): RedirectDecision {
    // Only regular admins get redirected to dashboard
    // Super admins stay at /admin
    if (userRole === 'admin') {
      return {
        shouldRedirect: true,
        targetUrl: SPECIAL_PATHS.ADMIN_DASHBOARD,
        reason: 'Admin users should use dashboard'
      };
    }

    return {
      shouldRedirect: false,
      reason: `${userRole} can access admin root`
    };
  }

  /**
   * Determine redirect for access denied scenarios
   * Following DRY principle
   */
  public determineAccessDeniedRedirect(userRole: UserRole): RedirectDecision {
    const targetUrl = DEFAULT_ROLE_REDIRECTS[userRole];

    return {
      shouldRedirect: true,
      targetUrl,
      reason: `Access denied, redirecting to role-appropriate page`
    };
  }

  /**
   * Create redirect response
   * Following Factory pattern
   */
  public createRedirectResponse(
    request: NextRequest,
    targetUrl: string,
    reason?: string
  ): NextResponse {
    if (reason) {
      console.log(`[MIDDLEWARE] ${reason}: redirecting to ${targetUrl}`);
    }

    return NextResponse.redirect(new URL(targetUrl, request.url));
  }

  /**
   * Handle authentication page access for logged-in users
   * Following Single Responsibility Principle
   */
  public handleAuthPageAccess(
    request: NextRequest,
    clearCookies: (response: NextResponse) => NextResponse
  ): NextResponse {
    console.log(`[MIDDLEWARE] Server-client auth mismatch detected, clearing orphaned cookie`);
    const response = NextResponse.next();
    return clearCookies(response);
  }

  /**
   * Handle invalid token scenarios
   * Following Single Responsibility Principle
   */
  public handleInvalidToken(
    request: NextRequest,
    pathname: string,
    clearCookies: (response: NextResponse) => NextResponse
  ): NextResponse {
    console.log(`[MIDDLEWARE] Invalid token found, clearing and allowing access to ${pathname}`);
    const response = NextResponse.next();
    return clearCookies(response);
  }

  /**
   * Check if redirect is needed for specific scenarios
   */
  public shouldRedirectFromAuthPages(isAuthenticated: boolean): boolean {
    // Don't redirect if user is trying to access auth pages while authenticated
    // This allows for proper session cleanup
    return false;
  }

  /**
   * Get appropriate redirect URL for user role
   * Following DRY principle
   */
  public getDefaultRedirectForRole(userRole: UserRole): string {
    return DEFAULT_ROLE_REDIRECTS[userRole];
  }

  /**
   * Log redirect action for debugging
   * Following Single Responsibility Principle
   */
  public logRedirect(
    userRole: UserRole,
    fromPath: string,
    toPath: string,
    reason: string
  ): void {
    console.log(`[MIDDLEWARE] Redirecting ${userRole} from ${fromPath} to ${toPath}: ${reason}`);
  }
}