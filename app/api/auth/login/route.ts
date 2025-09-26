import { NextRequest, NextResponse } from 'next/server';
import { userDb, sessionDb } from '@/lib/db/database';
import { auth } from '@/lib/auth/auth-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: '이메일과 비밀번호를 입력해주세요.' },
        { status: 400 }
      );
    }

    // Find user
    const user = userDb.findByEmail(email) as any;
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
    userDb.updateLastLogin(user.id);

    // Generate session token
    const sessionToken = auth.generateSessionToken();
    sessionDb.create(user.id, sessionToken);

    // Generate JWT token
    const jwtToken = await auth.generateToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role || 'teacher',
      association_id: user.association_id || undefined,
      isAdmin: user.is_admin === 1
    });

    // Create response
    const response = NextResponse.json(
      {
        message: '로그인되었습니다.',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          school: user.school,
          position: user.position,
          isAdmin: user.is_admin === 1,
          isVerified: user.is_verified === 1
        },
        token: jwtToken
      },
      { status: 200 }
    );

    // Set HTTP-only cookie with JWT token
    response.cookies.set('auth-token', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/'
    });

    return response;

  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: '로그인 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}