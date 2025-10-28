import { NextRequest, NextResponse } from 'next/server';
import { userDb, sessionDb } from '@/lib/db/database';
import { auth } from '@/lib/auth/auth-utils';
import { enhancedAuth } from '@/lib/auth/enhanced-auth';
import { ensureAdminRecord } from '@/lib/db/admin-sync';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    console.log('🔍 Login Debug - Request body:', { email, password: password ? '***' : 'missing' });

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: '이메일과 비밀번호를 입력해주세요.' },
        { status: 400 }
      );
    }

    // Find user
    const user = await userDb.findByEmail(email) as any;
    console.log('🔍 Login Debug - User from DB:', {
      id: user?.id,
      email: user?.email,
      name: user?.name,
      role: user?.role,
      is_admin: user?.is_admin
    });
    if (!user) {
      return NextResponse.json(
        { error: '이메일 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      );
    }

    // Verify password
    const isValidPassword = await auth.comparePassword(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: '이메일 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      );
    }

    // Update last login
    await userDb.updateLastLogin(user.id);

    // Generate session token
    const sessionToken = auth.generateSessionToken();
    await sessionDb.create(user.id, sessionToken);

    // Generate JWT token pair using enhanced auth
    const tokenPair = await enhancedAuth.generateTokenPair({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role || 'teacher',
      association_id: user.association_id || undefined,
      deviceId: enhancedAuth.generateDeviceFingerprint(
        request.headers.get('user-agent') || undefined,
        request.headers.get('accept-language') || undefined,
        request.headers.get('accept-encoding') || undefined
      ),
      ipAddress: enhancedAuth.getClientIP(request.headers),
      isAdmin: user.is_admin === 1
    });

    const jwtToken = tokenPair.accessToken;

    // Ensure admin users have corresponding admins table records
    if (user.role === 'admin' || user.role === 'admin') {
      try {
        ensureAdminRecord(user.id, user.association_id || null);
      } catch (adminSyncError) {
        console.error('❌ [ADMIN-SYNC] Failed to sync admin record for user:', user.email, adminSyncError);
        // Don't fail login if admin sync fails, just log the error
      }
    }

    // Create response with additional auth state data for client sync
    const response = NextResponse.json(
      {
        message: '로그인되었습니다.',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          school: user.school,
          position: user.position,
          role: user.role || 'teacher',
          isAdmin: user.is_admin === 1,
          isVerified: user.is_verified === 1,
          association_id: user.association_id
        },
        token: jwtToken,
        syncRequired: true // Signal to client to sync auth state
      },
      { status: 200 }
    );

    // HYBRID AUTH: Set cookie for browser navigation while APIs use Authorization headers
    // Cookie maxAge matches JWT access token expiry (30 minutes)
    response.cookies.set('auth-token', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 1800, // 30 minutes (matches JWT access token)
      path: '/'
    });

    console.log('🍪 [LOGIN] Cookie set for middleware (30min), APIs use Authorization headers');

    return response;

  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: '로그인 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}