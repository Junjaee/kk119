import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

// 변호사 권한 검증 및 사용자 정보 조회 함수
async function checkLawyerPermission(req: NextRequest) {
  const supabase = createClient();

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { authorized: false, error: '인증이 필요합니다.', user: null };
    }

    // 사용자 프로필 조회
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, role, email, name, is_verified, specialization, law_firm')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return { authorized: false, error: '사용자 정보를 찾을 수 없습니다.', user: null };
    }

    // 변호사 권한 확인
    if (profile.role !== 'lawyer') {
      return { authorized: false, error: '변호사 권한이 필요합니다.', user: null };
    }

    // 인증된 변호사인지 확인
    if (!profile.is_verified) {
      return { authorized: false, error: '인증되지 않은 변호사입니다.', user: null };
    }

    return { authorized: true, user: profile };
  } catch (error) {
    console.error('Lawyer permission check error:', error);
    return { authorized: false, error: '권한 확인 중 오류가 발생했습니다.', user: null };
  }
}

// GET: 변호사에게 배정된 신고 목록 조회
export async function GET(req: NextRequest) {
  // 권한 검증
  const permissionCheck = await checkLawyerPermission(req);
  if (!permissionCheck.authorized || !permissionCheck.user) {
    return NextResponse.json(
      { error: permissionCheck.error },
      { status: 401 }
    );
  }

  const lawyer = permissionCheck.user;

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status'); // 선택적 상태 필터링
    const priority = searchParams.get('priority'); // 선택적 우선순위 필터링

    // 페이지네이션 검증
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: '유효하지 않은 페이지네이션 값입니다.' },
        { status: 400 }
      );
    }

    const offset = (page - 1) * limit;
    const supabase = createClient();

    // 기본 쿼리 설정
    let query = supabase
      .from('incident_reports')
      .select(`
        id,
        title,
        incident_type,
        incident_date,
        location,
        status,
        assigned_at,
        consultation_priority,
        consultation_notes,
        requires_legal_consultation,
        created_at,
        updated_at,
        reporter:reporter_id(id, name, email),
        lawyer_consultations(
          id,
          status,
          consultation_type,
          priority_level,
          started_at,
          completed_at,
          last_activity_at
        )
      `)
      .eq('assigned_lawyer_id', lawyer.id)
      .order('assigned_at', { ascending: false });

    // 상태 필터링 적용
    if (status) {
      query = query.eq('status', status);
    }

    // 우선순위 필터링 적용
    if (priority) {
      const priorityLevel = parseInt(priority);
      if (priorityLevel >= 1 && priorityLevel <= 5) {
        query = query.eq('consultation_priority', priorityLevel);
      }
    }

    // 총 개수 조회 (페이지네이션용)
    let countQuery = supabase
      .from('incident_reports')
      .select('*', { count: 'exact', head: true })
      .eq('assigned_lawyer_id', lawyer.id);

    if (status) {
      countQuery = countQuery.eq('status', status);
    }
    if (priority) {
      const priorityLevel = parseInt(priority);
      if (priorityLevel >= 1 && priorityLevel <= 5) {
        countQuery = countQuery.eq('consultation_priority', priorityLevel);
      }
    }

    const { count: totalCount, error: countError } = await countQuery;

    if (countError) {
      console.error('Reports count error:', countError);
      return NextResponse.json(
        { error: '신고 건수 조회에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 페이지네이션 적용하여 데이터 조회
    const { data: reports, error: reportsError } = await query
      .range(offset, offset + limit - 1);

    if (reportsError) {
      console.error('Assigned reports fetch error:', reportsError);
      return NextResponse.json(
        { error: '배정된 신고 목록 조회에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 응답 데이터 구성
    const reportsWithConsultationInfo = (reports || []).map(report => ({
      id: report.id,
      title: report.title,
      incident_type: report.incident_type,
      incident_date: report.incident_date,
      location: report.location,
      status: report.status,
      assigned_at: report.assigned_at,
      consultation_priority: report.consultation_priority,
      consultation_notes: report.consultation_notes,
      requires_legal_consultation: report.requires_legal_consultation,
      created_at: report.created_at,
      updated_at: report.updated_at,
      reporter: report.reporter,
      consultation: report.lawyer_consultations?.[0] || null,
      // 상담 진행률 계산
      consultation_progress: (() => {
        const consultation = report.lawyer_consultations?.[0];
        if (!consultation) return 0;

        switch (consultation.status) {
          case 'pending': return 25;
          case 'in_progress': return 50;
          case 'completed': return 100;
          default: return 0;
        }
      })(),
      // 긴급도 라벨
      priority_label: (() => {
        switch (report.consultation_priority) {
          case 5: return '매우 높음';
          case 4: return '높음';
          case 3: return '보통';
          case 2: return '낮음';
          case 1: return '매우 낮음';
          default: return '보통';
        }
      })()
    }));

    // 상태별 통계 계산
    const { data: statusStats, error: statsError } = await supabase
      .from('incident_reports')
      .select('status')
      .eq('assigned_lawyer_id', lawyer.id);

    const statusCounts = (statusStats || []).reduce((acc, report) => {
      acc[report.status] = (acc[report.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalPages = Math.ceil((totalCount || 0) / limit);

    return NextResponse.json({
      reports: reportsWithConsultationInfo,
      pagination: {
        page,
        limit,
        total_count: totalCount || 0,
        total_pages: totalPages,
        has_next: page < totalPages,
        has_prev: page > 1
      },
      statistics: {
        total_assigned: totalCount || 0,
        by_status: statusCounts
      },
      lawyer_info: {
        id: lawyer.id,
        name: lawyer.name,
        specialization: lawyer.specialization,
        law_firm: lawyer.law_firm
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Assigned reports API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}