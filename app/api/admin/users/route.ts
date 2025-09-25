import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';
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
  const supabase = createClient();

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { authorized: false, error: '인증이 필요합니다.' };
    }

    // 사용자 프로필 조회
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return { authorized: false, error: '사용자 정보를 찾을 수 없습니다.' };
    }

    if (profile.role !== 'super_admin') {
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

  const supabase = createClient();
  const { searchParams } = new URL(req.url);

  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const role = searchParams.get('role') as UserRole | null;
  const search = searchParams.get('search');

  try {
    let query = supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    // 역할 필터
    if (role) {
      query = query.eq('role', role);
    }

    // 검색 필터
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    // 페이지네이션
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: users, error, count } = await query;

    if (error) {
      console.error('Users fetch error:', error);
      return NextResponse.json(
        { error: '사용자 목록 조회에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      users: users || [],
      totalCount: count || 0,
      currentPage: page,
      totalPages: Math.ceil((count || 0) / limit),
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

    const supabase = createClient();

    // Supabase Auth로 사용자 생성
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // 이메일 인증 자동 완료
    });

    if (authError || !authData.user) {
      console.error('Auth user creation error:', authError);
      return NextResponse.json(
        { error: authError?.message || '계정 생성에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 사용자 프로필 생성
    const profileData = {
      id: authData.user.id,
      email,
      name,
      role,
      phone,
      school_name: role === 'teacher' ? school_name : null,
      employee_id: role === 'teacher' ? employee_id : null,
      license_number: role === 'lawyer' ? license_number : null,
      law_firm: role === 'lawyer' ? law_firm : null,
      specialization: role === 'lawyer' ? specialization : null,
      is_active: true,
      is_verified: true, // 슈퍼어드민이 생성하므로 자동 승인
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .insert(profileData)
      .select()
      .single();

    if (profileError) {
      console.error('Profile creation error:', profileError);

      // 실패 시 Auth 사용자도 삭제
      await supabase.auth.admin.deleteUser(authData.user.id);

      return NextResponse.json(
        { error: '프로필 생성에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 비밀번호는 응답에서 제외
    const { password: _, ...responseData } = body;

    return NextResponse.json({
      message: '사용자가 성공적으로 생성되었습니다.',
      user: {
        ...profile,
        auth_id: authData.user.id,
      },
    }, { status: 201 });

  } catch (error) {
    console.error('User creation error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}