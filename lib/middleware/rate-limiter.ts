import { NextRequest, NextResponse } from 'next/server';
import { log } from '@/lib/utils/logger';

// In-memory storage for rate limiting (replace with Redis in production)
interface RateLimitData {
  count: number;
  resetTime: number;
  blockedUntil?: number;
}

const rateLimitStore = new Map<string, RateLimitData>();

export interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxAttempts: number;   // Maximum attempts per window
  blockDurationMs: number; // Block duration after max attempts exceeded
  keyGenerator?: (req: NextRequest) => string; // Custom key generator
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean;     // Don't count failed requests
  message?: string;      // Custom error message
}

// Predefined rate limit configurations
export const rateLimitConfigs = {
  // Authentication endpoints (stricter)
  auth: {
    windowMs: 15 * 60 * 1000,  // 15 minutes
    maxAttempts: 5,            // 5 attempts per 15 minutes
    blockDurationMs: 60 * 60 * 1000, // Block for 1 hour
    message: '너무 많은 로그인 시도가 있었습니다. 잠시 후 다시 시도해주세요.'
  },

  // General API endpoints
  api: {
    windowMs: 1 * 60 * 1000,   // 1 minute
    maxAttempts: 60,           // 60 requests per minute
    blockDurationMs: 5 * 60 * 1000, // Block for 5 minutes
    message: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.'
  },

  // Sensitive operations (password reset, etc.)
  sensitive: {
    windowMs: 60 * 60 * 1000,  // 1 hour
    maxAttempts: 3,            // 3 attempts per hour
    blockDurationMs: 4 * 60 * 60 * 1000, // Block for 4 hours
    message: '민감한 작업에 대한 시도가 너무 많았습니다. 나중에 다시 시도해주세요.'
  },

  // Registration endpoint
  registration: {
    windowMs: 60 * 60 * 1000,  // 1 hour
    maxAttempts: 3,            // 3 registrations per hour per IP
    blockDurationMs: 2 * 60 * 60 * 1000, // Block for 2 hours
    message: '회원가입 시도가 너무 많습니다. 나중에 다시 시도해주세요.'
  }
};

/**
 * Default key generator uses IP address
 */
const defaultKeyGenerator = (req: NextRequest): string => {
  const forwardedFor = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const ip = forwardedFor?.split(',')[0] || realIp || req.ip || 'unknown';
  return `rate-limit:${ip}`;
};

/**
 * Email-based key generator for auth endpoints
 */
export const emailKeyGenerator = (req: NextRequest): string => {
  // This should be called after parsing the request body
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ||
            req.headers.get('x-real-ip') ||
            req.ip || 'unknown';
  return `rate-limit:auth:${ip}`;
};

/**
 * Combined IP + User key generator for authenticated endpoints
 */
export const userKeyGenerator = (req: NextRequest, userId?: string): string => {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ||
            req.headers.get('x-real-ip') ||
            req.ip || 'unknown';
  return `rate-limit:user:${userId || 'anonymous'}:${ip}`;
};

/**
 * Clean up expired entries from the rate limit store
 */
const cleanupExpiredEntries = (): void => {
  const now = Date.now();
  for (const [key, data] of rateLimitStore.entries()) {
    if (data.resetTime < now && (!data.blockedUntil || data.blockedUntil < now)) {
      rateLimitStore.delete(key);
    }
  }
};

/**
 * Rate limiter function
 */
export const rateLimit = (config: RateLimitConfig) => {
  return (key?: string) => {
    const now = Date.now();
    const keyToUse = key || 'default';

    // Clean up expired entries periodically
    if (Math.random() < 0.01) { // 1% chance to cleanup
      cleanupExpiredEntries();
    }

    let data = rateLimitStore.get(keyToUse);

    // Initialize if doesn't exist
    if (!data) {
      data = {
        count: 0,
        resetTime: now + config.windowMs
      };
      rateLimitStore.set(keyToUse, data);
    }

    // Check if currently blocked
    if (data.blockedUntil && data.blockedUntil > now) {
      const remainingBlockTime = Math.ceil((data.blockedUntil - now) / 1000);

      log.security('Rate Limit Block Active', 'high', `Key: ${keyToUse}, Remaining: ${remainingBlockTime}s`, {
        key: keyToUse,
        remainingTime: remainingBlockTime,
        blockedUntil: new Date(data.blockedUntil).toISOString()
      });

      return {
        success: false,
        error: config.message || '요청이 차단되었습니다.',
        remainingTime: remainingBlockTime,
        blocked: true
      };
    }

    // Reset window if expired
    if (data.resetTime < now) {
      data.count = 0;
      data.resetTime = now + config.windowMs;
      delete data.blockedUntil;
    }

    // Increment counter
    data.count++;

    // Check if limit exceeded
    if (data.count > config.maxAttempts) {
      data.blockedUntil = now + config.blockDurationMs;

      log.security('Rate Limit Exceeded', 'high', `Key: ${keyToUse}, Attempts: ${data.count}/${config.maxAttempts}`, {
        key: keyToUse,
        attempts: data.count,
        maxAttempts: config.maxAttempts,
        windowMs: config.windowMs,
        blockDurationMs: config.blockDurationMs,
        blockedUntil: new Date(data.blockedUntil).toISOString()
      });

      const blockDurationSeconds = Math.ceil(config.blockDurationMs / 1000);

      return {
        success: false,
        error: config.message || '요청 한도를 초과했습니다.',
        remainingTime: blockDurationSeconds,
        blocked: true
      };
    }

    // Update store
    rateLimitStore.set(keyToUse, data);

    const remainingAttempts = config.maxAttempts - data.count;
    const resetTime = Math.ceil((data.resetTime - now) / 1000);

    // Log when getting close to limit
    if (remainingAttempts <= 2) {
      log.security('Rate Limit Warning', 'medium', `Key: ${keyToUse}, Remaining: ${remainingAttempts}`, {
        key: keyToUse,
        attempts: data.count,
        remainingAttempts,
        resetTime
      });
    }

    return {
      success: true,
      remainingAttempts,
      resetTime,
      totalAttempts: data.count
    };
  };
};

/**
 * Express-style middleware for Next.js API routes
 */
export const createRateLimitMiddleware = (config: RateLimitConfig) => {
  const limiter = rateLimit(config);
  const keyGen = config.keyGenerator || defaultKeyGenerator;

  return async (req: NextRequest, context?: any): Promise<NextResponse | null> => {
    const key = keyGen(req);
    const result = limiter(key);

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.error,
          remainingTime: result.remainingTime,
          type: 'RATE_LIMIT_EXCEEDED'
        },
        {
          status: 429,
          headers: {
            'Retry-After': result.remainingTime?.toString() || '60',
            'X-RateLimit-Limit': config.maxAttempts.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': Date.now() + (result.remainingTime || 60) * 1000 + ''
          }
        }
      );
    }

    // Add rate limit headers to successful responses
    if (context && context.headers) {
      context.headers.set('X-RateLimit-Limit', config.maxAttempts.toString());
      context.headers.set('X-RateLimit-Remaining', result.remainingAttempts?.toString() || '0');
      context.headers.set('X-RateLimit-Reset', (Date.now() + (result.resetTime || 0) * 1000).toString());
    }

    return null; // Continue processing
  };
};

/**
 * Utility function to manually check rate limit
 */
export const checkRateLimit = (key: string, config: RateLimitConfig) => {
  const limiter = rateLimit(config);
  return limiter(key);
};

/**
 * Utility function to manually increment rate limit
 */
export const incrementRateLimit = (key: string, config: RateLimitConfig) => {
  return checkRateLimit(key, config);
};

/**
 * Reset rate limit for a specific key
 */
export const resetRateLimit = (key: string): void => {
  rateLimitStore.delete(key);
  log.security('Rate Limit Reset', 'low', `Key: ${key}`, { key });
};

/**
 * Get current rate limit status for a key
 */
export const getRateLimitStatus = (key: string) => {
  const data = rateLimitStore.get(key);
  if (!data) {
    return { exists: false };
  }

  const now = Date.now();
  return {
    exists: true,
    count: data.count,
    resetTime: data.resetTime,
    isBlocked: data.blockedUntil ? data.blockedUntil > now : false,
    blockedUntil: data.blockedUntil,
    timeUntilReset: Math.max(0, data.resetTime - now),
    timeUntilUnblocked: data.blockedUntil ? Math.max(0, data.blockedUntil - now) : 0
  };
};

/**
 * Clear all rate limit data (use with caution)
 */
export const clearAllRateLimits = (): void => {
  rateLimitStore.clear();
  log.security('All Rate Limits Cleared', 'medium', 'All rate limit data has been cleared');
};

// Export predefined middleware
export const authRateLimit = createRateLimitMiddleware(rateLimitConfigs.auth);
export const apiRateLimit = createRateLimitMiddleware(rateLimitConfigs.api);
export const sensitiveRateLimit = createRateLimitMiddleware(rateLimitConfigs.sensitive);
export const registrationRateLimit = createRateLimitMiddleware(rateLimitConfigs.registration);