import { NextRequest, NextResponse } from 'next/server';
import { sessionDb, userDb } from '@/lib/db/database';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // Find session
    const session = sessionDb.findByToken(token) as any;
    if (!session) {
      return NextResponse.json(
        { error: '유효하지 않은 세션입니다.' },
        { status: 401 }
      );
    }

    // Get user data
    const user = userDb.findById(session.user_id) as any;
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