import { NextRequest, NextResponse } from 'next/server';
import { userDb } from '@/lib/db/database';
import { auth } from '@/lib/auth/auth-utils';

export async function GET(request: NextRequest) {
  try {
    // Try to get token from cookie first, then Authorization header
    let token = request.cookies.get('auth-token')?.value;

    if (!token) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // Verify JWT token
    const payload = await auth.verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: '유효하지 않은 토큰입니다.' },
        { status: 401 }
      );
    }

    // Get user data
    const user = userDb.findById(payload.userId) as any;
    if (!user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        school: user.school,
        position: user.position,
        phone: user.phone,
        isAdmin: user.is_admin === 1,
        isVerified: user.is_verified === 1,
        createdAt: user.created_at,
        lastLogin: user.last_login
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: '사용자 정보를 가져오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}