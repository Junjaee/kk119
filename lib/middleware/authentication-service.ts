import { NextRequest, NextResponse } from 'next/server';
import { enhancedAuth } from '../auth/enhanced-auth';
import { AUTH_CONSTANTS } from './constants';

export interface AuthenticationResult {
  success: boolean;
  payload?: any;
  error?: string;
}

export interface TokenExtractionResult {
  token: string | null;
  source: 'cookie' | 'header' | null;
}

export class AuthenticationService {
  /**
   * Extract authentication token from request
   * Following Single Responsibility Principle
   *
   * CRITICAL FIX: Allow cookie authentication for browser navigation but prioritize Authorization header for API calls
   * This ensures browser navigation works while keeping API calls secure with header-only authentication
   */
  public extractToken(request: NextRequest): TokenExtractionResult {
    console.log(`[AUTH-SERVICE] Extracting token from ${request.method} ${request.nextUrl.pathname}`);

    // For API routes, only use Authorization header (security-validator behavior)
    const isApiRoute = request.nextUrl.pathname.startsWith('/api/');

    if (isApiRoute) {
      // API routes: Authorization header only
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith(AUTH_CONSTANTS.BEARER_PREFIX)) {
        const headerToken = authHeader.substring(AUTH_CONSTANTS.BEARER_PREFIX_LENGTH);
        console.log(`[AUTH-SERVICE] API route - found token in Authorization header: ${headerToken.substring(0, 20)}...`);
        return { token: headerToken, source: 'header' };
      }
      console.log(`[AUTH-SERVICE] API route - no Authorization header found`);
      return { token: null, source: null };
    }

    // For browser navigation: Try Authorization header first, then cookies
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith(AUTH_CONSTANTS.BEARER_PREFIX)) {
      const headerToken = authHeader.substring(AUTH_CONSTANTS.BEARER_PREFIX_LENGTH);
      console.log(`[AUTH-SERVICE] Browser navigation - found token in Authorization header: ${headerToken.substring(0, 20)}...`);
      return { token: headerToken, source: 'header' };
    }

    // Fallback to cookie for browser navigation
    const cookieToken = request.cookies.get(AUTH_CONSTANTS.COOKIE_NAMES.AUTH_TOKEN)?.value;
    if (cookieToken) {
      console.log(`[AUTH-SERVICE] Browser navigation - found token in cookie: ${cookieToken.substring(0, 20)}...`);
      return { token: cookieToken, source: 'cookie' };
    }

    console.log(`[AUTH-SERVICE] No token found in request`);
    return { token: null, source: null };
  }

  /**
   * Verify authentication token
   * Following Open/Closed Principle - easily extensible for different auth providers
   */
  public async verifyToken(token: string): Promise<AuthenticationResult> {
    try {
      const verification = await enhancedAuth.verifyAccessToken(token);

      if (!verification.valid || !verification.payload) {
        return {
          success: false,
          error: 'Invalid token verification result'
        };
      }

      return {
        success: true,
        payload: verification.payload
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Token verification failed'
      };
    }
  }

  /**
   * Clear authentication cookies from response
   * Following DRY principle - reusable cookie clearing logic
   */
  public clearAuthCookies(response: NextResponse): NextResponse {
    response.cookies.delete(AUTH_CONSTANTS.COOKIE_NAMES.AUTH_TOKEN);
    response.cookies.delete(AUTH_CONSTANTS.COOKIE_NAMES.REFRESH_TOKEN);
    return response;
  }

  /**
   * Add user information to request headers
   * Following Single Responsibility Principle
   */
  public addUserHeaders(request: NextRequest, payload: any): Headers {
    const requestHeaders = new Headers(request.headers);

    requestHeaders.set(AUTH_CONSTANTS.HEADERS.USER_ID, payload.userId.toString());
    requestHeaders.set(AUTH_CONSTANTS.HEADERS.USER_ROLE, payload.role);
    requestHeaders.set(AUTH_CONSTANTS.HEADERS.USER_EMAIL, payload.email);

    if (payload.association_id) {
      requestHeaders.set(AUTH_CONSTANTS.HEADERS.USER_ASSOCIATION, payload.association_id.toString());
    }

    return requestHeaders;
  }

  /**
   * Create login redirect response with original path preservation
   * Following DRY principle
   */
  public createLoginRedirect(request: NextRequest, pathname: string): NextResponse {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    const response = NextResponse.redirect(loginUrl);
    return this.clearAuthCookies(response);
  }
}