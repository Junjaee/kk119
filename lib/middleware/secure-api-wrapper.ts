import { NextRequest, NextResponse } from 'next/server';
import { securityValidator, ValidationResult } from '@/lib/auth/security-validator';
import { authRateLimit, checkRateLimit, rateLimitConfigs } from './rate-limiter';
import { log } from '@/lib/utils/logger';
import { EnhancedJWTPayload } from '@/lib/auth/enhanced-auth';

// Security levels for different API endpoints
export type SecurityLevel = 'public' | 'low' | 'medium' | 'high' | 'critical';

// API endpoint metadata
export interface APIMetadata {
  securityLevel: SecurityLevel;
  requiresAuth: boolean;
  allowedRoles?: string[];
  rateLimitConfig?: 'auth' | 'api' | 'sensitive' | 'registration';
  requiresFreshToken?: boolean;
  description?: string;
}

// Security headers based on endpoint sensitivity
const getSecurityHeaders = (level: SecurityLevel) => {
  const baseHeaders = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  };

  switch (level) {
    case 'critical':
      return {
        ...baseHeaders,
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'X-Permitted-Cross-Domain-Policies': 'none'
      };

    case 'high':
      return {
        ...baseHeaders,
        'Cache-Control': 'no-cache, must-revalidate, max-age=0',
        'Pragma': 'no-cache'
      };

    case 'medium':
      return {
        ...baseHeaders,
        'Cache-Control': 'private, max-age=300'
      };

    case 'low':
      return {
        ...baseHeaders,
        'Cache-Control': 'private, max-age=3600'
      };

    default: // public
      return baseHeaders;
  }
};

export interface SecureAPIContext {
  user?: EnhancedJWTPayload;
  clientIP: string;
  userAgent: string;
  requestId: string;
  securityFlags?: string[];
  validationResult?: ValidationResult;
}

export type SecureAPIHandler = (
  request: NextRequest,
  context: SecureAPIContext
) => Promise<NextResponse> | NextResponse;

/**
 * Secure API wrapper that applies security validation, rate limiting, and logging
 */
export function secureAPIWrapper(
  handler: SecureAPIHandler,
  metadata: APIMetadata
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const requestId = crypto.randomUUID();
    const startTime = Date.now();

    // Extract basic request info
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                     request.headers.get('x-real-ip') ||
                     request.ip || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const method = request.method;
    const pathname = new URL(request.url).pathname;

    // Create base context
    const context: SecureAPIContext = {
      clientIP,
      userAgent,
      requestId
    };

    try {
      // Log incoming request
      log.debug(`API Request: ${method} ${pathname}`, {
        requestId,
        method,
        pathname,
        clientIP,
        userAgent: userAgent.substring(0, 100),
        securityLevel: metadata.securityLevel
      });

      // 1. Rate limiting (if configured)
      if (metadata.rateLimitConfig) {
        const rateLimitKey = `api:${metadata.rateLimitConfig}:${clientIP}`;
        const rateLimitResult = checkRateLimit(rateLimitKey, rateLimitConfigs[metadata.rateLimitConfig]);

        if (!rateLimitResult.success) {
          log.security('API Rate Limit Exceeded', 'medium', `${method} ${pathname}`, {
            requestId,
            clientIP,
            method,
            pathname,
            rateLimitConfig: metadata.rateLimitConfig,
            remainingTime: rateLimitResult.remainingTime
          });

          return NextResponse.json(
            {
              error: rateLimitResult.error,
              type: 'RATE_LIMIT_EXCEEDED',
              remainingTime: rateLimitResult.remainingTime
            },
            {
              status: 429,
              headers: {
                ...getSecurityHeaders(metadata.securityLevel),
                'Retry-After': rateLimitResult.remainingTime?.toString() || '60'
              }
            }
          );
        }
      }

      // 2. Authentication and authorization (if required)
      if (metadata.requiresAuth) {
        const validationResult = await securityValidator.validateAPIToken(
          request,
          metadata.securityLevel
        );

        context.validationResult = validationResult;
        context.securityFlags = validationResult.securityFlags;

        if (!validationResult.valid) {
          // Check if this is a token refresh scenario
          if (validationResult.error?.includes('expired') || validationResult.shouldRefresh) {
            log.security('API Token Expired/Refresh Required', 'low', `${method} ${pathname}`, {
              requestId,
              clientIP,
              error: validationResult.error
            });

            return NextResponse.json(
              {
                error: 'Token expired',
                type: 'TOKEN_EXPIRED',
                shouldRefresh: true
              },
              {
                status: 401,
                headers: getSecurityHeaders(metadata.securityLevel)
              }
            );
          }

          // Check if re-authentication is required
          if (validationResult.requireReauth) {
            log.security('API Re-authentication Required', 'high', `${method} ${pathname}`, {
              requestId,
              clientIP,
              securityFlags: validationResult.securityFlags,
              error: validationResult.error
            });

            return NextResponse.json(
              {
                error: 'Re-authentication required',
                type: 'REAUTH_REQUIRED',
                reason: validationResult.error
              },
              {
                status: 401,
                headers: getSecurityHeaders(metadata.securityLevel)
              }
            );
          }

          // General authentication failure
          log.security('API Authentication Failed', 'medium', `${method} ${pathname}`, {
            requestId,
            clientIP,
            error: validationResult.error,
            securityFlags: validationResult.securityFlags
          });

          return NextResponse.json(
            {
              error: validationResult.error || 'Authentication failed',
              type: 'AUTH_FAILED'
            },
            {
              status: 401,
              headers: getSecurityHeaders(metadata.securityLevel)
            }
          );
        }

        // Set authenticated user in context
        context.user = validationResult.payload;

        // 3. Role-based authorization
        if (metadata.allowedRoles && metadata.allowedRoles.length > 0) {
          const userRole = validationResult.payload!.role;
          if (!metadata.allowedRoles.includes(userRole)) {
            log.security('API Authorization Failed', 'medium', `${method} ${pathname}`, {
              requestId,
              clientIP,
              userId: validationResult.payload!.userId.toString(),
              userRole,
              allowedRoles: metadata.allowedRoles
            });

            return NextResponse.json(
              {
                error: 'Insufficient permissions',
                type: 'INSUFFICIENT_PERMISSIONS'
              },
              {
                status: 403,
                headers: getSecurityHeaders(metadata.securityLevel)
              }
            );
          }
        }

        // Log successful authentication
        log.security('API Authentication Successful', 'low', `${method} ${pathname}`, {
          requestId,
          clientIP,
          userId: validationResult.payload!.userId.toString(),
          userRole: validationResult.payload!.role,
          securityFlags: validationResult.securityFlags
        });
      }

      // 4. Call the actual handler
      const response = await handler(request, context);

      // 5. Add security headers to response
      const securityHeaders = getSecurityHeaders(metadata.securityLevel);
      Object.entries(securityHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });

      // Add request ID for tracking
      response.headers.set('X-Request-ID', requestId);

      // Log successful response
      const responseTime = Date.now() - startTime;
      log.debug(`API Response: ${method} ${pathname} - ${response.status}`, {
        requestId,
        method,
        pathname,
        status: response.status,
        responseTime,
        userId: context.user?.userId?.toString()
      });

      return response;

    } catch (error: any) {
      const responseTime = Date.now() - startTime;

      // Log error
      log.error(`API Error: ${method} ${pathname}`, error, {
        requestId,
        method,
        pathname,
        clientIP,
        responseTime,
        userId: context.user?.userId?.toString(),
        stack: error.stack
      });

      // Return error response with security headers
      return NextResponse.json(
        {
          error: 'Internal server error',
          type: 'INTERNAL_ERROR',
          requestId // Include request ID for error tracking
        },
        {
          status: 500,
          headers: getSecurityHeaders(metadata.securityLevel)
        }
      );
    }
  };
}

/**
 * Predefined security configurations for common endpoint types
 */
export const securityConfigs = {
  // Public endpoints (no auth required)
  public: {
    securityLevel: 'public' as SecurityLevel,
    requiresAuth: false,
    rateLimitConfig: 'api' as const
  },

  // Standard authenticated endpoints
  authenticated: {
    securityLevel: 'medium' as SecurityLevel,
    requiresAuth: true,
    rateLimitConfig: 'api' as const
  },

  // Admin-only endpoints
  admin: {
    securityLevel: 'high' as SecurityLevel,
    requiresAuth: true,
    allowedRoles: ['admin', 'super_admin'],
    rateLimitConfig: 'api' as const
  },

  // Super admin only endpoints
  superAdmin: {
    securityLevel: 'critical' as SecurityLevel,
    requiresAuth: true,
    allowedRoles: ['super_admin'],
    rateLimitConfig: 'sensitive' as const,
    requiresFreshToken: true
  },

  // Authentication endpoints
  auth: {
    securityLevel: 'high' as SecurityLevel,
    requiresAuth: false,
    rateLimitConfig: 'auth' as const
  },

  // Sensitive operations (password reset, etc.)
  sensitive: {
    securityLevel: 'critical' as SecurityLevel,
    requiresAuth: true,
    rateLimitConfig: 'sensitive' as const,
    requiresFreshToken: true
  }
};

/**
 * Convenience wrapper functions for common security levels
 */
export const publicAPI = (handler: SecureAPIHandler) =>
  secureAPIWrapper(handler, securityConfigs.public);

export const authenticatedAPI = (handler: SecureAPIHandler) =>
  secureAPIWrapper(handler, securityConfigs.authenticated);

export const adminAPI = (handler: SecureAPIHandler) =>
  secureAPIWrapper(handler, securityConfigs.admin);

export const superAdminAPI = (handler: SecureAPIHandler) =>
  secureAPIWrapper(handler, securityConfigs.superAdmin);

export const authAPI = (handler: SecureAPIHandler) =>
  secureAPIWrapper(handler, securityConfigs.auth);

export const sensitiveAPI = (handler: SecureAPIHandler) =>
  secureAPIWrapper(handler, securityConfigs.sensitive);