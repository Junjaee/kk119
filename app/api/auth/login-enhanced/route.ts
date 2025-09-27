import { NextRequest, NextResponse } from 'next/server';
import { userDb, sessionDb } from '@/lib/db/database';
import { enhancedAuth } from '@/lib/auth/enhanced-auth';
import { authRateLimit, checkRateLimit, rateLimitConfigs } from '@/lib/middleware/rate-limiter';
import { ensureAdminRecord } from '@/lib/db/admin-sync';
import { log } from '@/lib/utils/logger';
import { validateEmail } from '@/lib/auth/auth-utils';
import bcrypt from 'bcryptjs';

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

    // Rate limiting check
    const rateLimitKey = `auth:login:${clientIP}`;
    const rateLimitResult = checkRateLimit(rateLimitKey, rateLimitConfigs.auth);

    if (!rateLimitResult.success) {
      log.security('Login Rate Limit Exceeded', 'high', `IP: ${clientIP}`, {
        requestId,
        clientIP,
        remainingTime: rateLimitResult.remainingTime,
        userAgent: request.headers.get('user-agent')
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
            'Retry-After': rateLimitResult.remainingTime?.toString() || '3600'
          }
        }
      );
    }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      log.security('Login Invalid JSON', 'medium', `IP: ${clientIP}`, {
        requestId,
        clientIP,
        error: 'Invalid JSON in request body'
      });

      return NextResponse.json(
        { error: '잘못된 요청 형식입니다.' },
        { status: 400, headers: securityHeaders }
      );
    }

    const { email, password, rememberMe = false } = body;

    // Input validation
    if (!email || !password) {
      log.security('Login Missing Credentials', 'medium', `IP: ${clientIP}`, {
        requestId,
        clientIP,
        hasEmail: !!email,
        hasPassword: !!password
      });

      return NextResponse.json(
        { error: '이메일과 비밀번호를 입력해주세요.' },
        { status: 400, headers: securityHeaders }
      );
    }

    if (!validateEmail(email)) {
      log.security('Login Invalid Email Format', 'medium', `IP: ${clientIP}, Email: ${email}`, {
        requestId,
        clientIP,
        email: email.substring(0, 20) + '...'
      });

      return NextResponse.json(
        { error: '올바른 이메일 형식을 입력해주세요.' },
        { status: 400, headers: securityHeaders }
      );
    }

    // Find user
    const user = userDb.findByEmail(email) as any;

    if (!user) {
      log.security('Login User Not Found', 'medium', `IP: ${clientIP}, Email: ${email}`, {
        requestId,
        clientIP,
        email,
        attempt: 'user_not_found'
      });

      return NextResponse.json(
        { error: '이메일 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401, headers: securityHeaders }
      );
    }

    // Check if user account is locked/disabled
    if (user.is_verified === 0) {
      log.security('Login Unverified Account', 'medium', `IP: ${clientIP}, User: ${user.id}`, {
        requestId,
        clientIP,
        userId: user.id,
        email: user.email
      });

      return NextResponse.json(
        { error: '계정이 아직 인증되지 않았습니다. 이메일을 확인해주세요.' },
        { status: 401, headers: securityHeaders }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      log.security('Login Invalid Password', 'high', `IP: ${clientIP}, User: ${user.id}`, {
        requestId,
        clientIP,
        userId: user.id,
        email: user.email,
        attempt: 'invalid_password'
      });

      return NextResponse.json(
        { error: '이메일 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401, headers: securityHeaders }
      );
    }

    // Update last login
    userDb.updateLastLogin(user.id);

    // Generate session token for database session tracking
    const sessionToken = enhancedAuth.generateSessionToken();
    sessionDb.create(user.id, sessionToken);

    // Create enhanced JWT payload
    const tokenPayload = enhancedAuth.createPayloadFromUser(user, request.headers);

    // Generate enhanced token pair
    const tokens = await enhancedAuth.generateTokenPair(tokenPayload);

    // Ensure admin users have corresponding admins table records
    if (user.role === 'admin' || user.role === 'super_admin') {
      try {
        ensureAdminRecord(user.id, user.association_id || null);
      } catch (adminSyncError) {
        log.error('Admin sync failed during login', adminSyncError as Error, {
          requestId,
          userId: user.id,
          email: user.email
        });
        // Don't fail login if admin sync fails, just log the error
      }
    }

    // Log successful login
    log.security('User Login Successful', 'low', `User: ${user.email}`, {
      requestId,
      userId: user.id,
      email: user.email,
      role: user.role,
      clientIP,
      userAgent: request.headers.get('user-agent'),
      deviceId: tokenPayload.deviceId,
      sessionToken: sessionToken.substring(0, 8) + '...',
      rememberMe
    });

    // Create response with user data
    const userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      school: user.school,
      position: user.position,
      role: user.role || 'teacher',
      isAdmin: user.is_admin === 1,
      isVerified: user.is_verified === 1,
      association_id: user.association_id
    };

    const response = NextResponse.json(
      {
        message: '로그인되었습니다.',
        user: userData,
        tokens: {
          accessToken: tokens.accessToken,
          // Only include refresh token in response, don't set as cookie for security
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

    // Set HTTP-only cookie with access token
    // Note: In production, consider using separate short-lived access tokens in memory
    // and long-lived refresh tokens in HTTP-only cookies
    const cookieMaxAge = rememberMe ? tokens.refreshExpiresIn : tokens.expiresIn;

    response.cookies.set('auth-token', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: cookieMaxAge,
      path: '/'
    });

    // Set refresh token in separate HTTP-only cookie
    response.cookies.set('refresh-token', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: tokens.refreshExpiresIn,
      path: '/api/auth'  // Only accessible to auth endpoints
    });

    // Log response time
    const responseTime = Date.now() - startTime;
    log.debug(`Login API response time: ${responseTime}ms`, {
      requestId,
      responseTime,
      userId: user.id
    });

    return response;

  } catch (error: any) {
    const responseTime = Date.now() - startTime;

    log.error('Login API unexpected error', error, {
      requestId,
      responseTime,
      stack: error.stack
    });

    return NextResponse.json(
      { error: '로그인 중 오류가 발생했습니다.' },
      { status: 500, headers: securityHeaders }
    );
  }
}