import { NextRequest, NextResponse } from 'next/server';
import { userDb } from '@/lib/db/database';
import { auth } from '@/lib/auth/auth-utils';
import { UserRole } from '@/lib/types/user';

// 권한 검증 함수
async function checkSuperAdminPermission(req: NextRequest) {
  try {
    // JWT 토큰 검증
    const token = req.cookies.get('auth-token')?.value;
    if (!token) {
      return { authorized: false, error: '인증 토큰이 없습니다.' };
    }

    const decodedToken = await auth.verifyToken(token);
    if (!decodedToken || decodedToken.role !== 'super_admin') {
      return { authorized: false, error: '슈퍼어드민 권한이 필요합니다.' };
    }

    return { authorized: true };
  } catch (error) {
    console.error('Permission check error:', error);
    return { authorized: false, error: '권한 확인 중 오류가 발생했습니다.' };
  }
}

// GET: 특정 사용자 정보 조회
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // 권한 검증
  const permissionCheck = await checkSuperAdminPermission(req);
  if (!permissionCheck.authorized) {
    return NextResponse.json(
      { error: permissionCheck.error },
      { status: 401 }
    );
  }

  const userId = parseInt(params.id);

  try {
    const user = await userDb.findById(userId);

    if (!user) {
      return NextResponse.json(
        { error: '사용자 정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role || 'teacher',
        phone: user.phone,
        school_name: user.school,
        employee_id: user.position,
        is_active: user.is_verified === 1,
        is_verified: user.is_verified === 1,
        created_at: user.created_at,
        updated_at: user.updated_at,
        last_login: user.last_login
      }
    });

  } catch (error) {
    console.error('User API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// PUT: 사용자 정보 수정
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // 권한 검증
  const permissionCheck = await checkSuperAdminPermission(req);
  if (!permissionCheck.authorized) {
    return NextResponse.json(
      { error: permissionCheck.error },
      { status: 401 }
    );
  }

  const userId = parseInt(params.id);

  try {
    const body = await req.json();
    const {
      name,
      role,
      phone,
      school_name,
      employee_id,
      is_active,
      is_verified
    } = body;

    // 필수 필드 검증
    if (!name || !role) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 역할별 필수 필드 검증
    if (role === 'teacher' && !school_name) {
      return NextResponse.json(
        { error: '교사 계정은 학교명이 필요합니다.' },
        { status: 400 }
      );
    }

    // 사용자 업데이트
    const updatedUser = await userDb.update(userId, {
      name,
      role,
      phone,
      school: role === 'teacher' ? school_name : null,
      position: role === 'teacher' ? employee_id : null,
      is_verified: is_verified !== undefined ? (is_verified ? 1 : 0) : 1,
    });

    if (!updatedUser) {
      return NextResponse.json(
        { error: '사용자 정보 수정에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: '사용자 정보가 성공적으로 수정되었습니다.',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        phone: updatedUser.phone,
        school_name: updatedUser.school,
        employee_id: updatedUser.position,
        is_active: updatedUser.is_verified === 1,
        is_verified: updatedUser.is_verified === 1,
      },
    });

  } catch (error) {
    console.error('User update error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// DELETE: 사용자 비활성화 (실제 삭제 대신 비활성화)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // 권한 검증
  const permissionCheck = await checkSuperAdminPermission(req);
  if (!permissionCheck.authorized) {
    return NextResponse.json(
      { error: permissionCheck.error },
      { status: 401 }
    );
  }

  const userId = parseInt(params.id);

  try {
    // 먼저 해당 사용자가 존재하는지 확인
    const existingUser = await userDb.findById(userId);

    if (!existingUser) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // JWT에서 현재 사용자 확인
    const token = req.cookies.get('auth-token')?.value;
    if (token) {
      const decodedToken = await auth.verifyToken(token);
      if (decodedToken && decodedToken.userId === userId) {
        return NextResponse.json(
          { error: '자기 자신의 계정은 비활성화할 수 없습니다.' },
          { status: 403 }
        );
      }
    }

    // 계정 비활성화
    const updatedUser = await userDb.update(userId, {
      is_verified: 0, // 비활성화
    });

    if (!updatedUser) {
      return NextResponse.json(
        { error: '계정 비활성화에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: '계정이 성공적으로 비활성화되었습니다.',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        is_active: updatedUser.is_verified === 1,
        is_verified: updatedUser.is_verified === 1,
      },
    });

  } catch (error) {
    console.error('User deletion error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}