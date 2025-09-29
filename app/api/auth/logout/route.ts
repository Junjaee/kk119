import { NextRequest, NextResponse } from 'next/server';
import { enhancedAuth } from '@/lib/auth/enhanced-auth';
import { sessionDb } from '@/lib/db/database';
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
    const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                     request.headers.get('x-real-ip') ||
                     request.ip || 'unknown';

    // Get token ONLY from Authorization header - cookies completely ignored
    let accessToken: string | undefined;
    let refreshToken: string | undefined;

    // ONLY Authorization header is accepted
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      accessToken = authHeader.substring(7);
    }

    // Try to get refresh token from request body only
    try {
      const body = await request.json();
      refreshToken = body.refreshToken;
    } catch (error) {
      // Ignore JSON parsing errors
    }

    console.log('🔍 [LOGOUT] Token source (cookies disabled):', {
      hasAuthHeader: !!authHeader,
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      cookiesIgnored: true
    });

    let userId: number | undefined;
    let userEmail: string | undefined;
    let sessionId: string | undefined;

    // If we have an access token, verify it to get user info
    if (accessToken) {
      const verificationResult = await enhancedAuth.verifyAccessToken(accessToken);
      if (verificationResult.valid && verificationResult.payload) {
        userId = verificationResult.payload.userId;
        userEmail = verificationResult.payload.email;
        sessionId = verificationResult.payload.sessionId;

        // Blacklist the access token
        enhancedAuth.blacklistToken(accessToken);
      }
    }

    // If we have a refresh token, verify and blacklist it
    if (refreshToken) {
      const refreshVerificationResult = await enhancedAuth.verifyRefreshToken(refreshToken);
      if (refreshVerificationResult.valid && refreshVerificationResult.payload) {
        // Get user info from refresh token if we didn't get it from access token
        if (!userId) {
          userId = refreshVerificationResult.payload.userId;
          userEmail = refreshVerificationResult.payload.email;
          sessionId = refreshVerificationResult.payload.sessionId;
        }

        // Blacklist the refresh token
        enhancedAuth.blacklistToken(refreshToken);
      }
    }

    // Clean up database sessions if we have user info
    if (userId) {
      try {
        // Remove all sessions for this user (global logout)
        sessionDb.deleteByUserId(userId);
      } catch (dbError) {
        log.error('Failed to clean up user sessions from database', dbError as Error, {
          requestId,
          userId
        });
      }
    }

    // Invalidate session if we have session ID
    if (sessionId) {
      enhancedAuth.invalidateSession(sessionId);
    }

    // Log successful logout
    log.security('User Logout Successful', 'low', `User: ${userEmail || 'Unknown'}`, {
      requestId,
      userId,
      userEmail,
      sessionId,
      clientIP,
      hadAccessToken: !!accessToken,
      hadRefreshToken: !!refreshToken,
      userAgent: request.headers.get('user-agent')
    });

    // Create response
    const response = NextResponse.json(
      { message: '로그아웃되었습니다.' },
      {
        status: 200,
        headers: securityHeaders
      }
    );

    // Clear all authentication cookies
    response.cookies.delete('auth-token');
    response.cookies.delete('refresh-token');

    // Also set expired cookies as a fallback for some browsers
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/'
    });

    response.cookies.set('refresh-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/api/auth'
    });

    const responseTime = Date.now() - startTime;
    log.debug(`Logout API response time: ${responseTime}ms`, {
      requestId,
      responseTime,
      userId
    });

    return response;

  } catch (error: any) {
    const responseTime = Date.now() - startTime;

    log.error('Logout API unexpected error', error, {
      requestId,
      responseTime,
      stack: error.stack
    });

    // Even if there's an error, we should still clear cookies and return success
    // because the user intention is to log out
    const response = NextResponse.json(
      { message: '로그아웃되었습니다.' },
      { status: 200, headers: securityHeaders }
    );

    response.cookies.delete('auth-token');
    response.cookies.delete('refresh-token');

    return response;
  }
}

// GET method for logout (sometimes needed for legacy compatibility)
export async function GET(request: NextRequest) {
  return POST(request);
}