import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/utils/logger';
import { z } from 'zod';

// Types for API error handling
export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
  details?: Record<string, any>;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: Record<string, any>;
  };
  timestamp: string;
  requestId: string;
}

export interface RequestContext {
  method: string;
  url: string;
  userAgent?: string;
  ip?: string;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  requestId: string;
  startTime: number;
}

/**
 * Custom error classes for different types of API errors
 */
export class ValidationError extends Error implements ApiError {
  statusCode = 400;
  code = 'VALIDATION_ERROR';
  details: Record<string, any>;

  constructor(message: string, details: Record<string, any> = {}) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
  }
}

export class AuthenticationError extends Error implements ApiError {
  statusCode = 401;
  code = 'AUTHENTICATION_ERROR';

  constructor(message: string = '인증이 필요합니다.') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error implements ApiError {
  statusCode = 403;
  code = 'AUTHORIZATION_ERROR';

  constructor(message: string = '권한이 없습니다.') {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends Error implements ApiError {
  statusCode = 404;
  code = 'NOT_FOUND';

  constructor(message: string = '요청한 리소스를 찾을 수 없습니다.') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends Error implements ApiError {
  statusCode = 409;
  code = 'CONFLICT_ERROR';

  constructor(message: string = '리소스 충돌이 발생했습니다.') {
    super(message);
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends Error implements ApiError {
  statusCode = 429;
  code = 'RATE_LIMIT_ERROR';

  constructor(message: string = '요청 한도를 초과했습니다.') {
    super(message);
    this.name = 'RateLimitError';
  }
}

export class DatabaseError extends Error implements ApiError {
  statusCode = 500;
  code = 'DATABASE_ERROR';

  constructor(message: string = '데이터베이스 오류가 발생했습니다.') {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class ExternalServiceError extends Error implements ApiError {
  statusCode = 502;
  code = 'EXTERNAL_SERVICE_ERROR';

  constructor(message: string = '외부 서비스 오류가 발생했습니다.') {
    super(message);
    this.name = 'ExternalServiceError';
  }
}

/**
 * Generate a unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Extract client IP address from request
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cloudflareIP = request.headers.get('cf-connecting-ip');

  if (cloudflareIP) return cloudflareIP;
  if (realIP) return realIP;
  if (forwarded) return forwarded.split(',')[0].trim();

  return 'unknown';
}

/**
 * Create request context for logging
 */
function createRequestContext(request: NextRequest): RequestContext {
  const requestId = generateRequestId();

  return {
    method: request.method,
    url: request.url,
    userAgent: request.headers.get('user-agent') || undefined,
    ip: getClientIP(request),
    requestId,
    startTime: performance.now()
  };
}

/**
 * Format error response
 */
function formatErrorResponse(
  error: ApiError | Error,
  requestId: string,
  includeStack: boolean = false
): ApiResponse {
  const apiError = error as ApiError;
  const statusCode = apiError.statusCode || 500;

  const response: ApiResponse = {
    success: false,
    error: {
      message: error.message || '내부 서버 오류가 발생했습니다.',
      code: apiError.code || 'INTERNAL_SERVER_ERROR',
      ...(apiError.details && { details: apiError.details })
    },
    timestamp: new Date().toISOString(),
    requestId
  };

  // Include stack trace only in development
  if (includeStack && process.env.NODE_ENV === 'development') {
    response.error!.details = {
      ...response.error!.details,
      stack: error.stack
    };
  }

  return response;
}

/**
 * Format success response
 */
function formatSuccessResponse<T>(
  data: T,
  requestId: string
): ApiResponse<T> {
  return {
    success: true,
    data,
    timestamp: new Date().toISOString(),
    requestId
  };
}

/**
 * Log API request
 */
function logRequest(
  context: RequestContext,
  statusCode: number,
  responseSize?: number,
  error?: Error
) {
  const duration = performance.now() - context.startTime;

  const logContext = {
    requestId: context.requestId,
    method: context.method,
    url: context.url,
    statusCode,
    duration: Math.round(duration * 100) / 100, // Round to 2 decimal places
    ip: context.ip,
    userAgent: context.userAgent,
    responseSize,
    userId: context.userId,
    userEmail: context.userEmail,
    userRole: context.userRole
  };

  if (error) {
    log.error('API Request Failed', error, logContext);
  } else if (statusCode >= 400) {
    log.warn('API Request Warning', logContext);
  } else {
    log.info('API Request Completed', logContext);
  }
}

/**
 * Middleware wrapper for API route handlers
 */
export function withErrorHandler<T = any>(
  handler: (
    request: NextRequest,
    context: RequestContext,
    params?: any
  ) => Promise<T | NextResponse>
) {
  return async function(request: NextRequest, { params }: { params?: any } = {}) {
    const context = createRequestContext(request);

    // Set logging context for this request
    log.setContext({
      requestId: context.requestId,
      method: context.method,
      url: context.url,
      ip: context.ip,
      userAgent: context.userAgent
    });

    try {
      // Execute the handler
      const result = await handler(request, context, params);

      // If handler returns NextResponse, use it directly
      if (result instanceof NextResponse) {
        logRequest(context, result.status);
        return result;
      }

      // Create success response
      const successResponse = formatSuccessResponse(result, context.requestId);
      const response = NextResponse.json(successResponse, { status: 200 });

      logRequest(context, 200, JSON.stringify(successResponse).length);

      return response;

    } catch (error) {
      const apiError = error as ApiError;
      const statusCode = apiError.statusCode || 500;

      // Log the error
      logRequest(context, statusCode, undefined, apiError);

      // Create error response
      const errorResponse = formatErrorResponse(
        apiError,
        context.requestId,
        process.env.NODE_ENV === 'development'
      );

      return NextResponse.json(errorResponse, { status: statusCode });
    } finally {
      // Clear request-specific context
      log.clearContext(['environment', 'buildVersion']);
    }
  };
}

/**
 * Middleware for handling authentication
 */
export function withAuth<T = any>(
  handler: (
    request: NextRequest,
    context: RequestContext & { user: any },
    params?: any
  ) => Promise<T | NextResponse>
) {
  return withErrorHandler(async (request: NextRequest, context: RequestContext, params?: any) => {
    // Extract user from JWT token or session
    const authHeader = request.headers.get('authorization');
    const authCookie = request.cookies.get('auth-token');

    if (!authHeader && !authCookie) {
      throw new AuthenticationError('인증 토큰이 필요합니다.');
    }

    try {
      // TODO: Implement JWT verification
      // For now, just simulate user extraction
      const user = { id: 'user123', email: 'user@example.com', role: 'teacher' };

      // Update context with user info
      const userContext = {
        ...context,
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
        user
      };

      // Update logging context
      log.updateContext('userId', user.id);
      log.updateContext('userEmail', user.email);
      log.updateContext('userRole', user.role);

      return await handler(request, userContext, params);
    } catch (authError) {
      throw new AuthenticationError('유효하지 않은 인증 토큰입니다.');
    }
  });
}

/**
 * Middleware for request validation using Zod schemas
 */
export function withValidation<TBody = any, TQuery = any>(
  bodySchema?: z.ZodSchema<TBody>,
  querySchema?: z.ZodSchema<TQuery>
) {
  return function<T = any>(
    handler: (
      request: NextRequest,
      context: RequestContext,
      data: { body?: TBody; query?: TQuery },
      params?: any
    ) => Promise<T | NextResponse>
  ) {
    return withErrorHandler(async (request: NextRequest, context: RequestContext, params?: any) => {
      let body: TBody | undefined;
      let query: TQuery | undefined;

      // Validate request body
      if (bodySchema) {
        try {
          const rawBody = await request.json();
          body = bodySchema.parse(rawBody);
        } catch (error) {
          if (error instanceof z.ZodError) {
            throw new ValidationError('요청 데이터가 유효하지 않습니다.', {
              errors: error.errors
            });
          }
          throw new ValidationError('JSON 파싱 오류가 발생했습니다.');
        }
      }

      // Validate query parameters
      if (querySchema) {
        try {
          const url = new URL(request.url);
          const queryParams = Object.fromEntries(url.searchParams.entries());
          query = querySchema.parse(queryParams);
        } catch (error) {
          if (error instanceof z.ZodError) {
            throw new ValidationError('쿼리 파라미터가 유효하지 않습니다.', {
              errors: error.errors
            });
          }
          throw new ValidationError('쿼리 파라미터 검증 오류가 발생했습니다.');
        }
      }

      return await handler(request, context, { body, query }, params);
    });
  };
}

/**
 * Middleware for rate limiting (simple implementation)
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function withRateLimit(maxRequests: number = 100, windowMs: number = 60000) {
  return function<T = any>(
    handler: (
      request: NextRequest,
      context: RequestContext,
      params?: any
    ) => Promise<T | NextResponse>
  ) {
    return withErrorHandler(async (request: NextRequest, context: RequestContext, params?: any) => {
      const clientKey = context.ip || 'unknown';
      const now = Date.now();

      const clientData = rateLimitMap.get(clientKey);

      if (clientData) {
        if (now < clientData.resetTime) {
          if (clientData.count >= maxRequests) {
            log.security('Rate limit exceeded', 'medium', 'Client exceeded rate limit', {
              ip: context.ip,
              requestId: context.requestId,
              count: clientData.count,
              maxRequests
            });
            throw new RateLimitError(`요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.`);
          }
          clientData.count++;
        } else {
          // Reset the window
          rateLimitMap.set(clientKey, { count: 1, resetTime: now + windowMs });
        }
      } else {
        rateLimitMap.set(clientKey, { count: 1, resetTime: now + windowMs });
      }

      return await handler(request, context, params);
    });
  };
}

/**
 * Composite middleware that combines common functionality
 */
export function apiHandler<T = any>(
  handler: (
    request: NextRequest,
    context: RequestContext,
    params?: any
  ) => Promise<T | NextResponse>,
  options: {
    requireAuth?: boolean;
    rateLimit?: { maxRequests: number; windowMs: number };
    bodySchema?: z.ZodSchema;
    querySchema?: z.ZodSchema;
  } = {}
) {
  let wrappedHandler = handler;

  // Apply validation if schemas provided
  if (options.bodySchema || options.querySchema) {
    const validationHandler = withValidation(options.bodySchema, options.querySchema);
    wrappedHandler = validationHandler((req, ctx, data, params) =>
      handler(req, ctx, params)
    ) as any;
  }

  // Apply rate limiting if configured
  if (options.rateLimit) {
    const rateLimitHandler = withRateLimit(
      options.rateLimit.maxRequests,
      options.rateLimit.windowMs
    );
    wrappedHandler = rateLimitHandler(wrappedHandler);
  }

  // Apply authentication if required
  if (options.requireAuth) {
    wrappedHandler = withAuth(wrappedHandler as any) as any;
  }

  // Apply error handling (always applied)
  return withErrorHandler(wrappedHandler);
}

// Error classes are already exported above as individual exports

export default apiHandler;