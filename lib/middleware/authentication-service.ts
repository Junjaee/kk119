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
   */
  public extractToken(request: NextRequest): TokenExtractionResult {
    // Try cookie first
    const cookieToken = request.cookies.get(AUTH_CONSTANTS.COOKIE_NAMES.AUTH_TOKEN)?.value;
    if (cookieToken) {
      return { token: cookieToken, source: 'cookie' };
    }

    // Try authorization header
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith(AUTH_CONSTANTS.BEARER_PREFIX)) {
      const headerToken = authHeader.substring(AUTH_CONSTANTS.BEARER_PREFIX_LENGTH);
      return { token: headerToken, source: 'header' };
    }

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