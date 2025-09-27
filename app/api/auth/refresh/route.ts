import { NextRequest, NextResponse } from 'next/server';
import { enhancedAuth } from '@/lib/auth/enhanced-auth';
import { apiRateLimit, checkRateLimit, rateLimitConfigs } from '@/lib/middleware/rate-limiter';
import { log } from '@/lib/utils/logger';

// Security headers for authentication responses
const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0'
};

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();

  try {
    // Get client IP for rate limiting and logging
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                     request.headers.get('x-real-ip') ||
                     request.ip || 'unknown';

    // Rate limiting check (less strict than login)
    const rateLimitKey = `auth:refresh:${clientIP}`;
    const rateLimitResult = checkRateLimit(rateLimitKey, {
      ...rateLimitConfigs.api,
      maxAttempts: 20,  // 20 refresh attempts per minute
      message: '토큰 갱신 요청이 너무 많습니다. 잠시 후 다시 시도해주세요.'
    });

    if (!rateLimitResult.success) {
      log.security('Token Refresh Rate Limit Exceeded', 'medium', `IP: ${clientIP}`, {
        requestId,
        clientIP,
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
            ...securityHeaders,
            'Retry-After': rateLimitResult.remainingTime?.toString() || '60'
          }
        }
      );
    }

    // Get refresh token from multiple sources
    let refreshToken: string | null = null;

    // 1. Try HTTP-only cookie first (most secure)
    refreshToken = request.cookies.get('refresh-token')?.value || null;

    // 2. Try Authorization header as fallback
    if (!refreshToken) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        refreshToken = authHeader.substring(7);
      }
    }

    // 3. Try request body as last resort
    if (!refreshToken) {
      try {
        const body = await request.json();
        refreshToken = body.refreshToken;
      } catch (error) {
        // Ignore JSON parsing errors
      }
    }

    if (!refreshToken) {
      log.security('Token Refresh Missing Token', 'medium', `IP: ${clientIP}`, {
        requestId,
        clientIP,
        hasCookie: !!request.cookies.get('refresh-token'),
        hasAuthHeader: !!request.headers.get('authorization')
      });

      return NextResponse.json(
        { error: '리프레시 토큰이 필요합니다.' },
        { status: 401, headers: securityHeaders }
      );
    }

    // Attempt to refresh the token
    const refreshResult = await enhancedAuth.refreshAccessToken(refreshToken);

    if (!refreshResult.success || !refreshResult.tokens) {
      log.security('Token Refresh Failed', 'medium', `IP: ${clientIP}`, {
        requestId,
        clientIP,
        error: refreshResult.error,
        tokenPrefix: refreshToken.substring(0, 20) + '...'
      });

      // Clear invalid refresh token cookie
      const response = NextResponse.json(
        { error: refreshResult.error || '토큰 갱신에 실패했습니다.' },
        { status: 401, headers: securityHeaders }
      );

      response.cookies.delete('refresh-token');
      response.cookies.delete('auth-token');

      return response;
    }

    const { tokens } = refreshResult;

    log.security('Token Refresh Successful', 'low', `IP: ${clientIP}`, {
      requestId,
      clientIP,
      newAccessTokenJTI: tokens.accessToken.substring(0, 20) + '...',
      expiresIn: tokens.expiresIn
    });

    // Create response with new tokens
    const response = NextResponse.json(
      {
        message: '토큰이 갱신되었습니다.',
        tokens: {
          accessToken: tokens.accessToken,
          expiresIn: tokens.expiresIn
        }
      },
      {
        status: 200,
        headers: {
          ...securityHeaders,
          'X-RateLimit-Remaining': rateLimitResult.remainingAttempts?.toString() || '0'
        }
      }
    );

    // Update cookies with new tokens
    response.cookies.set('auth-token', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: tokens.expiresIn,
      path: '/'
    });

    response.cookies.set('refresh-token', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: tokens.refreshExpiresIn,
      path: '/api/auth'
    });

    // Log response time
    const responseTime = Date.now() - startTime;
    log.debug(`Token refresh API response time: ${responseTime}ms`, {
      requestId,
      responseTime
    });

    return response;

  } catch (error: any) {
    const responseTime = Date.now() - startTime;

    log.error('Token refresh API unexpected error', error, {
      requestId,
      responseTime,
      stack: error.stack
    });

    return NextResponse.json(
      { error: '토큰 갱신 중 오류가 발생했습니다.' },
      { status: 500, headers: securityHeaders }
    );
  }
}

export async function GET(request: NextRequest) {
  // GET method for checking token status
  const requestId = crypto.randomUUID();

  try {
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                     request.headers.get('x-real-ip') ||
                     request.ip || 'unknown';

    // Get access token from cookie or header
    let accessToken = request.cookies.get('auth-token')?.value;

    if (!accessToken) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        accessToken = authHeader.substring(7);
      }
    }

    if (!accessToken) {
      return NextResponse.json(
        { error: '액세스 토큰이 필요합니다.' },
        { status: 401, headers: securityHeaders }
      );
    }

    // Verify access token
    const verificationResult = await enhancedAuth.verifyAccessToken(accessToken);

    if (!verificationResult.valid) {
      return NextResponse.json(
        {
          valid: false,
          error: verificationResult.error,
          shouldRefresh: true
        },
        { status: 401, headers: securityHeaders }
      );
    }

    const { payload, shouldRefresh } = verificationResult;

    return NextResponse.json(
      {
        valid: true,
        shouldRefresh,
        expiresAt: new Date(payload!.exp * 1000).toISOString(),
        user: {
          userId: payload!.userId,
          email: payload!.email,
          role: payload!.role
        }
      },
      {
        status: 200,
        headers: securityHeaders
      }
    );

  } catch (error: any) {
    log.error('Token status check error', error, {
      requestId,
      stack: error.stack
    });

    return NextResponse.json(
      { error: '토큰 상태 확인 중 오류가 발생했습니다.' },
      { status: 500, headers: securityHeaders }
    );
  }
}