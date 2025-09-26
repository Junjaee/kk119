import { NextRequest, NextResponse } from 'next/server';
import { userDb } from '@/lib/db/database';
import { auth } from '@/lib/auth/auth-utils';
import { UserRole } from '@/lib/types/user';

// 사용자 생성 요청 타입
interface CreateUserRequest {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  phone?: string;
  // 교사 필드
  school_name?: string;
  employee_id?: string;
  // 변호사 필드
  license_number?: string;
  law_firm?: string;
  specialization?: string;
}

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

// GET: 사용자 목록 조회 (슈퍼어드민만 가능)
export async function GET(req: NextRequest) {
  // 권한 검증
  const permissionCheck = await checkSuperAdminPermission(req);
  if (!permissionCheck.authorized) {
    return NextResponse.json(
      { error: permissionCheck.error },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);

  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const role = searchParams.get('role') as UserRole | null;
  const search = searchParams.get('search');

  try {
    // 데이터베이스에서 사용자 목록 조회
    let query = 'SELECT * FROM users WHERE 1=1';
    const params: any[] = [];

    if (role && role !== 'all') {
      query += ' AND role = ?';
      params.push(role);
    }

    if (search) {
      query += ' AND (name LIKE ? OR email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    // 전체 개수 조회
    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
    const db = await import('@/lib/db/database');
    const countResult = db.default.prepare(countQuery).get(...params) as { total: number };
    const totalCount = countResult.total;

    // 페이지네이션 적용
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, (page - 1) * limit);

    const users = db.default.prepare(query).all(...params);

    return NextResponse.json({
      users: users.map((user: any) => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role || 'teacher',
        phone: user.phone,
        school_name: user.school,
        position: user.position,
        is_active: user.is_verified === 1,
        is_verified: user.is_verified === 1,
        created_at: user.created_at,
        updated_at: user.updated_at,
        last_login: user.last_login
      })),
      totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
    });

  } catch (error) {
    console.error('Users API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// POST: 새 사용자 생성 (슈퍼어드민만 가능)
export async function POST(req: NextRequest) {
  // 권한 검증
  const permissionCheck = await checkSuperAdminPermission(req);
  if (!permissionCheck.authorized) {
    return NextResponse.json(
      { error: permissionCheck.error },
      { status: 401 }
    );
  }

  try {
    const body: CreateUserRequest = await req.json();
    const {
      email,
      password,
      name,
      role,
      phone,
      school_name,
      employee_id,
      license_number,
      law_firm,
      specialization
    } = body;

    // 필수 필드 검증
    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: '올바른 이메일 형식이 아닙니다.' },
        { status: 400 }
      );
    }

    // 비밀번호 강도 검증
    if (password.length < 8) {
      return NextResponse.json(
        { error: '비밀번호는 최소 8자 이상이어야 합니다.' },
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

    if (role === 'lawyer' && (!license_number || !specialization)) {
      return NextResponse.json(
        { error: '변호사 계정은 면허번호와 전문분야가 필요합니다.' },
        { status: 400 }
      );
    }

    // 사용자 생성
    const newUser = await userDb.create({
      email,
      password,
      name,
      school: school_name,
      position: employee_id,
      phone,
      role,
      association_id: null // 기본값으로 null 설정
    });

    return NextResponse.json({
      message: '사용자가 성공적으로 생성되었습니다.',
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role || role
      },
    }, { status: 201 });

  } catch (error: any) {
    console.error('User creation error:', error);
    if (error.message.includes('이미 등록된 이메일')) {
      return NextResponse.json(
        { error: '이미 등록된 이메일입니다.' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}