import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';
import { UserRole } from '@/lib/types/user';

// 권한 검증 함수
async function checkSuperAdminPermission(req: NextRequest) {
  const supabase = createClient();

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { authorized: false, error: '인증이 필요합니다.' };
    }

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

  const supabase = createClient();
  const userId = params.id;

  try {
    const { data: user, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('User fetch error:', error);
      return NextResponse.json(
        { error: '사용자 정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });

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

  const supabase = createClient();
  const userId = params.id;

  try {
    const body = await req.json();
    const {
      name,
      role,
      phone,
      school_name,
      employee_id,
      license_number,
      law_firm,
      specialization,
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

    if (role === 'lawyer' && (!license_number || !specialization)) {
      return NextResponse.json(
        { error: '변호사 계정은 면허번호와 전문분야가 필요합니다.' },
        { status: 400 }
      );
    }

    // 업데이트할 데이터 준비
    const updateData = {
      name,
      role,
      phone,
      school_name: role === 'teacher' ? school_name : null,
      employee_id: role === 'teacher' ? employee_id : null,
      license_number: role === 'lawyer' ? license_number : null,
      law_firm: role === 'lawyer' ? law_firm : null,
      specialization: role === 'lawyer' ? specialization : null,
      is_active: is_active !== undefined ? is_active : true,
      is_verified: is_verified !== undefined ? is_verified : true,
      updated_at: new Date().toISOString(),
    };

    const { data: user, error } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('User update error:', error);
      return NextResponse.json(
        { error: '사용자 정보 수정에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: '사용자 정보가 성공적으로 수정되었습니다.',
      user,
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

  const supabase = createClient();
  const userId = params.id;

  try {
    // 먼저 해당 사용자가 존재하는지 확인
    const { data: existingUser, error: fetchError } = await supabase
      .from('user_profiles')
      .select('role, name, email')
      .eq('id', userId)
      .single();

    if (fetchError || !existingUser) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 자기 자신을 비활성화하려는 경우 방지
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (currentUser && currentUser.id === userId) {
      return NextResponse.json(
        { error: '자기 자신의 계정은 비활성화할 수 없습니다.' },
        { status: 403 }
      );
    }

    // 계정 비활성화
    const { data: user, error } = await supabase
      .from('user_profiles')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('User deactivation error:', error);
      return NextResponse.json(
        { error: '계정 비활성화에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: '계정이 성공적으로 비활성화되었습니다.',
      user,
    });

  } catch (error) {
    console.error('User deletion error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}