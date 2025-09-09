import { NextRequest, NextResponse } from 'next/server';
import { userDb, sessionDb } from '@/lib/db/database';
import { auth, validateEmail, validatePassword, validatePhone } from '@/lib/auth/auth-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, confirmPassword, name, school, position, phone } = body;

    // Validation
    if (!email || !password || !confirmPassword || !name) {
      return NextResponse.json(
        { error: '필수 정보를 모두 입력해주세요.' },
        { status: 400 }
      );
    }

    // Email validation
    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: '올바른 이메일 형식이 아닙니다.' },
        { status: 400 }
      );
    }

    // Password validation
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.errors.join(' ') },
        { status: 400 }
      );
    }

    // Confirm password match
    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: '비밀번호가 일치하지 않습니다.' },
        { status: 400 }
      );
    }

    // Phone validation (optional)
    if (phone && !validatePhone(phone)) {
      return NextResponse.json(
        { error: '올바른 전화번호 형식이 아닙니다. (예: 010-1234-5678)' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = userDb.findByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: '이미 등록된 이메일입니다.' },
        { status: 409 }
      );
    }

    // Create user
    const user = await userDb.create({
      email,
      password,
      name,
      school: school || null,
      position: position || null,
      phone: phone || null
    });

    // Generate session token
    const sessionToken = auth.generateSessionToken();
    sessionDb.create(Number(user.id), sessionToken);

    // Generate JWT token
    const jwtToken = auth.generateToken({
      userId: Number(user.id),
      email: user.email,
      name: user.name,
      isAdmin: false
    });

    // Create response with cookie
    const response = NextResponse.json(
      {
        message: '회원가입이 완료되었습니다.',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          school: user.school,
          position: user.position
        },
        token: jwtToken
      },
      { status: 201 }
    );

    // Set HTTP-only cookie
    response.cookies.set('auth-token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/'
    });

    return response;

  } catch (error: any) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: error.message || '회원가입 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}