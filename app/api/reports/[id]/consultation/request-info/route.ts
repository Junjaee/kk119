import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

// 추가 정보 요청 타입
interface AdditionalInfoRequest {
  request_title: string;
  request_content: string;
  requested_info_types?: string[];
  urgency_level?: number;
  due_date?: string;
}

// 권한 검증 및 사용자 정보 조회 함수
async function checkUserPermission(req: NextRequest) {
  const supabase = createClient();

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { authorized: false, error: '인증이 필요합니다.', user: null };
    }

    // 사용자 프로필 조회
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, role, email, name')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return { authorized: false, error: '사용자 정보를 찾을 수 없습니다.', user: null };
    }

    return { authorized: true, user: profile };
  } catch (error) {
    console.error('Permission check error:', error);
    return { authorized: false, error: '권한 확인 중 오류가 발생했습니다.', user: null };
  }
}

// POST: 추가 정보 요청 (배정된 변호사만 가능)
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const reportId = params.id;

  // UUID 형식 검증
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(reportId)) {
    return NextResponse.json(
      { error: '유효하지 않은 신고 ID 형식입니다.' },
      { status: 400 }
    );
  }

  // 권한 검증
  const permissionCheck = await checkUserPermission(req);
  if (!permissionCheck.authorized || !permissionCheck.user) {
    return NextResponse.json(
      { error: permissionCheck.error },
      { status: 401 }
    );
  }

  const user = permissionCheck.user;

  // 변호사 권한 확인
  if (user.role !== 'lawyer') {
    return NextResponse.json(
      { error: '변호사만 추가 정보를 요청할 수 있습니다.' },
      { status: 403 }
    );
  }

  try {
    const body: AdditionalInfoRequest = await req.json();
    const {
      request_title,
      request_content,
      requested_info_types = [],
      urgency_level = 1,
      due_date
    } = body;

    // 필수 필드 검증
    if (!request_title || request_title.trim().length === 0) {
      return NextResponse.json(
        { error: '요청 제목을 입력해주세요.' },
        { status: 400 }
      );
    }

    if (!request_content || request_content.trim().length === 0) {
      return NextResponse.json(
        { error: '요청 내용을 입력해주세요.' },
        { status: 400 }
      );
    }

    if (request_title.length > 200) {
      return NextResponse.json(
        { error: '요청 제목은 200자를 초과할 수 없습니다.' },
        { status: 400 }
      );
    }

    if (request_content.length > 2000) {
      return NextResponse.json(
        { error: '요청 내용은 2000자를 초과할 수 없습니다.' },
        { status: 400 }
      );
    }

    // 긴급도 검증
    if (urgency_level < 1 || urgency_level > 5) {
      return NextResponse.json(
        { error: '긴급도는 1-5 사이의 값이어야 합니다.' },
        { status: 400 }
      );
    }

    // 마감일 검증
    if (due_date) {
      const dueDateObj = new Date(due_date);
      if (isNaN(dueDateObj.getTime())) {
        return NextResponse.json(
          { error: '유효하지 않은 마감일 형식입니다.' },
          { status: 400 }
        );
      }
      if (dueDateObj <= new Date()) {
        return NextResponse.json(
          { error: '마감일은 현재 시간보다 이후여야 합니다.' },
          { status: 400 }
        );
      }
    }

    const supabase = createClient();

    // 신고 정보 및 배정 확인
    const { data: report, error: reportError } = await supabase
      .from('incident_reports')
      .select(`
        id,
        title,
        assigned_lawyer_id,
        status,
        requires_legal_consultation,
        reporter_id,
        reporter:reporter_id(id, name, email)
      `)
      .eq('id', reportId)
      .single();

    if (reportError || !report) {
      return NextResponse.json(
        { error: '신고를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 본인에게 배정된 신고인지 확인
    if (report.assigned_lawyer_id !== user.id) {
      return NextResponse.json(
        { error: '본인에게 배정된 신고만 추가 정보를 요청할 수 있습니다.' },
        { status: 403 }
      );
    }

    // 법적 상담이 필요한지 확인
    if (!report.requires_legal_consultation) {
      return NextResponse.json(
        { error: '이 신고는 법적 상담이 필요하지 않습니다.' },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // 기존 상담 정보 확인
    const { data: existingConsultation, error: consultationFetchError } = await supabase
      .from('lawyer_consultations')
      .select('id, status')
      .eq('report_id', reportId)
      .eq('lawyer_id', user.id)
      .single();

    let consultationId: string;

    if (consultationFetchError && consultationFetchError.code === 'PGRST116') {
      // 상담이 없으면 먼저 상담을 생성
      const { data: newConsultation, error: createError } = await supabase
        .from('lawyer_consultations')
        .insert({
          report_id: reportId,
          lawyer_id: user.id,
          consultation_content: '추가 정보 요청을 위해 상담을 시작했습니다.',
          status: 'pending',
          consultation_type: 'general',
          priority_level: 1,
          started_at: now,
          created_at: now,
          updated_at: now,
          last_activity_at: now
        })
        .select('id')
        .single();

      if (createError) {
        console.error('Consultation creation error:', createError);
        return NextResponse.json(
          { error: '상담 생성에 실패했습니다.' },
          { status: 500 }
        );
      }

      consultationId = newConsultation.id;
    } else if (consultationFetchError) {
      console.error('Consultation fetch error:', consultationFetchError);
      return NextResponse.json(
        { error: '상담 정보 조회에 실패했습니다.' },
        { status: 500 }
      );
    } else {
      consultationId = existingConsultation.id;
    }

    // 추가 정보 요청을 lawyer_consultation_discussions에 저장
    const { data: infoRequest, error: requestError } = await supabase
      .from('lawyer_consultation_discussions')
      .insert({
        consultation_id: consultationId,
        author_id: user.id,
        content: `[추가 정보 요청]\n\n**제목:** ${request_title}\n\n**내용:** ${request_content}`,
        is_internal_note: false,
        attachments: {
          request_type: 'additional_info',
          request_title,
          request_content,
          requested_info_types,
          urgency_level,
          due_date,
          requested_at: now
        },
        created_at: now,
        updated_at: now
      })
      .select(`
        id,
        consultation_id,
        content,
        attachments,
        created_at,
        author:author_id(id, name, email, role)
      `)
      .single();

    if (requestError) {
      console.error('Info request creation error:', requestError);
      return NextResponse.json(
        { error: '추가 정보 요청 생성에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 상담 상태 업데이트 (추가 정보 요청 대기)
    const { error: consultationUpdateError } = await supabase
      .from('lawyer_consultations')
      .update({
        status: 'pending', // 추가 정보 요청 중으로 상태 변경
        updated_at: now,
        last_activity_at: now,
        internal_notes: `추가 정보 요청 발송: ${request_title}`
      })
      .eq('id', consultationId);

    if (consultationUpdateError) {
      console.error('Consultation status update error:', consultationUpdateError);
      return NextResponse.json(
        { error: '상담 상태 업데이트에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 신고 상태 업데이트 (추가 정보 요청됨)
    const { error: reportUpdateError } = await supabase
      .from('incident_reports')
      .update({
        status: 'consulting', // 상담 진행 중 상태 유지
        consultation_notes: `추가 정보 요청: ${request_title}`,
        updated_at: now
      })
      .eq('id', reportId);

    if (reportUpdateError) {
      console.error('Report status update error:', reportUpdateError);
      return NextResponse.json(
        { error: '신고 상태 업데이트에 실패했습니다.' },
        { status: 500 }
      );
    }

    // TODO: 신고자에게 추가 정보 요청 알림 발송 (추후 구현)
    // if (report.reporter) {
    //   await sendAdditionalInfoRequestNotification(
    //     report.reporter.id,
    //     report.title,
    //     request_title,
    //     request_content,
    //     due_date
    //   );
    // }

    return NextResponse.json({
      message: '추가 정보 요청이 성공적으로 발송되었습니다.',
      info_request: {
        id: infoRequest.id,
        consultation_id: consultationId,
        request_title,
        request_content,
        requested_info_types,
        urgency_level,
        due_date,
        requested_at: now,
        author: infoRequest.author
      },
      report: {
        id: report.id,
        title: report.title,
        reporter: report.reporter
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Additional info request error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// GET: 특정 신고의 추가 정보 요청 이력 조회
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const reportId = params.id;

  // UUID 형식 검증
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(reportId)) {
    return NextResponse.json(
      { error: '유효하지 않은 신고 ID 형식입니다.' },
      { status: 400 }
    );
  }

  // 권한 검증
  const permissionCheck = await checkUserPermission(req);
  if (!permissionCheck.authorized || !permissionCheck.user) {
    return NextResponse.json(
      { error: permissionCheck.error },
      { status: 401 }
    );
  }

  const user = permissionCheck.user;

  try {
    const supabase = createClient();

    // 신고 정보 및 접근 권한 확인
    const { data: report, error: reportError } = await supabase
      .from('incident_reports')
      .select(`
        id,
        title,
        assigned_lawyer_id,
        reporter_id,
        requires_legal_consultation
      `)
      .eq('id', reportId)
      .single();

    if (reportError || !report) {
      return NextResponse.json(
        { error: '신고를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 접근 권한 확인 (신고자, 배정된 변호사, 관리자만)
    const hasAccess =
      user.role === 'admin' ||
      user.role === 'super_admin' ||
      report.reporter_id === user.id ||
      (report.assigned_lawyer_id === user.id && user.role === 'lawyer');

    if (!hasAccess) {
      return NextResponse.json(
        { error: '이 신고의 추가 정보 요청 이력에 접근할 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 상담 ID 조회
    const { data: consultation, error: consultationError } = await supabase
      .from('lawyer_consultations')
      .select('id')
      .eq('report_id', reportId)
      .single();

    if (consultationError) {
      return NextResponse.json({
        report: {
          id: report.id,
          title: report.title
        },
        info_requests: [],
        message: '아직 추가 정보 요청이 없습니다.'
      });
    }

    // 추가 정보 요청 이력 조회
    const { data: infoRequests, error: requestsError } = await supabase
      .from('lawyer_consultation_discussions')
      .select(`
        id,
        content,
        attachments,
        created_at,
        updated_at,
        author:author_id(id, name, email, role)
      `)
      .eq('consultation_id', consultation.id)
      .contains('attachments', { request_type: 'additional_info' })
      .order('created_at', { ascending: false });

    if (requestsError) {
      console.error('Info requests fetch error:', requestsError);
      return NextResponse.json(
        { error: '추가 정보 요청 이력 조회에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      report: {
        id: report.id,
        title: report.title
      },
      info_requests: infoRequests || []
    });

  } catch (error) {
    console.error('Info requests retrieval error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}