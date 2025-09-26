import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

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

// 특정 신고에 대한 접근 권한 확인
async function checkReportAccess(reportId: string, userId: string, userRole: string, supabase: any) {
  try {
    // 신고 정보 조회
    const { data: report, error: reportError } = await supabase
      .from('incident_reports')
      .select(`
        id,
        reporter_id,
        assigned_lawyer_id,
        title,
        status,
        requires_legal_consultation
      `)
      .eq('id', reportId)
      .single();

    if (reportError || !report) {
      return { hasAccess: false, error: '신고를 찾을 수 없습니다.', report: null };
    }

    // 접근 권한 확인
    let hasAccess = false;
    let accessReason = '';

    if (userRole === 'admin' || userRole === 'super_admin') {
      hasAccess = true;
      accessReason = 'admin';
    } else if (report.reporter_id === userId) {
      hasAccess = true;
      accessReason = 'reporter';
    } else if (report.assigned_lawyer_id === userId && userRole === 'lawyer') {
      hasAccess = true;
      accessReason = 'assigned_lawyer';
    }

    if (!hasAccess) {
      return { hasAccess: false, error: '이 신고에 접근할 권한이 없습니다.', report };
    }

    return { hasAccess: true, accessReason, report };
  } catch (error) {
    console.error('Report access check error:', error);
    return { hasAccess: false, error: '접근 권한 확인 중 오류가 발생했습니다.', report: null };
  }
}

// GET: 변호사 상담 정보 조회
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

    // 신고 접근 권한 확인
    const accessCheck = await checkReportAccess(reportId, user.id, user.role, supabase);
    if (!accessCheck.hasAccess) {
      return NextResponse.json(
        { error: accessCheck.error },
        { status: accessCheck.error.includes('찾을 수 없습니다') ? 404 : 403 }
      );
    }

    const report = accessCheck.report;

    // 상담이 필요하지 않은 신고인 경우
    if (!report.requires_legal_consultation) {
      return NextResponse.json({
        report: {
          id: report.id,
          title: report.title,
          status: report.status,
          requires_legal_consultation: false
        },
        consultation: null,
        message: '이 신고는 법적 상담이 필요하지 않습니다.'
      });
    }

    // lawyer_consultations 테이블에서 상담 정보 조회
    const { data: consultation, error: consultationError } = await supabase
      .from('lawyer_consultations')
      .select(`
        id,
        report_id,
        lawyer_id,
        assigned_by,
        consultation_content,
        recommended_actions,
        status,
        consultation_type,
        priority_level,
        estimated_duration,
        actual_duration,
        client_rating,
        client_feedback,
        internal_notes,
        billable_hours,
        billing_rate,
        total_cost,
        started_at,
        completed_at,
        created_at,
        updated_at,
        last_activity_at,
        lawyer:lawyer_id(id, name, email, specialization, law_firm),
        assigned_by_user:assigned_by(id, name, email)
      `)
      .eq('report_id', reportId)
      .single();

    if (consultationError && consultationError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Consultation fetch error:', consultationError);
      return NextResponse.json(
        { error: '상담 정보 조회에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 추가 신고 세부 정보 조회
    const { data: reportDetails, error: reportDetailsError } = await supabase
      .from('incident_reports')
      .select(`
        id,
        title,
        content,
        status,
        assigned_lawyer_id,
        assigned_at,
        assigned_by,
        lawyer_consultation_started_at,
        lawyer_response_at,
        consultation_priority,
        consultation_notes,
        requires_legal_consultation,
        created_at,
        updated_at,
        reporter:reporter_id(id, name, email),
        assigned_lawyer:assigned_lawyer_id(id, name, email, specialization, law_firm)
      `)
      .eq('id', reportId)
      .single();

    if (reportDetailsError) {
      console.error('Report details fetch error:', reportDetailsError);
      return NextResponse.json(
        { error: '신고 세부 정보 조회에 실패했습니다.' },
        { status: 500 }
      );
    }

    // lawyer_consultation_discussions 테이블에서 토론/대화 내역 조회 (만약 존재한다면)
    let discussions = [];
    if (consultation) {
      const { data: discussionData, error: discussionError } = await supabase
        .from('lawyer_consultation_discussions')
        .select(`
          id,
          consultation_id,
          author_id,
          content,
          is_internal_note,
          attachments,
          created_at,
          updated_at,
          author:author_id(id, name, email, role)
        `)
        .eq('consultation_id', consultation.id)
        .order('created_at', { ascending: true });

      if (!discussionError) {
        discussions = discussionData || [];
      }
    }

    // 사용자 역할에 따른 데이터 필터링
    let filteredConsultation = consultation;
    let filteredDiscussions = discussions;

    if (user.role !== 'admin' && user.role !== 'super_admin') {
      // 일반 사용자(신고자/변호사)는 내부 노트 등 민감한 정보 제외
      if (filteredConsultation) {
        if (user.role !== 'lawyer' || filteredConsultation.lawyer_id !== user.id) {
          // 배정된 변호사가 아니면 내부 노트, 청구 정보 등 제외
          const { internal_notes, billable_hours, billing_rate, total_cost, ...publicConsultation } = filteredConsultation;
          filteredConsultation = publicConsultation;
        }
      }

      // 내부 노트는 관리자와 해당 작성자만 볼 수 있음
      filteredDiscussions = discussions.filter(discussion =>
        !discussion.is_internal_note ||
        discussion.author_id === user.id ||
        user.role === 'admin' ||
        user.role === 'super_admin'
      );
    }

    return NextResponse.json({
      report: {
        id: reportDetails.id,
        title: reportDetails.title,
        content: reportDetails.content,
        status: reportDetails.status,
        assigned_lawyer_id: reportDetails.assigned_lawyer_id,
        assigned_at: reportDetails.assigned_at,
        assigned_by: reportDetails.assigned_by,
        lawyer_consultation_started_at: reportDetails.lawyer_consultation_started_at,
        lawyer_response_at: reportDetails.lawyer_response_at,
        consultation_priority: reportDetails.consultation_priority,
        consultation_notes: reportDetails.consultation_notes,
        requires_legal_consultation: reportDetails.requires_legal_consultation,
        created_at: reportDetails.created_at,
        updated_at: reportDetails.updated_at,
        reporter: reportDetails.reporter,
        assigned_lawyer: reportDetails.assigned_lawyer
      },
      consultation: filteredConsultation,
      discussions: filteredDiscussions,
      access_info: {
        user_role: user.role,
        access_reason: accessCheck.accessReason,
        can_edit: accessCheck.accessReason === 'assigned_lawyer' || accessCheck.accessReason === 'admin'
      }
    });

  } catch (error) {
    console.error('Consultation retrieval error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 상담 응답 업데이트 요청 타입
interface ConsultationUpdateRequest {
  consultation_content: string;
  recommended_actions?: string;
  status?: 'pending' | 'in_progress' | 'completed';
  consultation_type?: string;
  estimated_duration?: number;
  internal_notes?: string;
}

// PUT: 변호사 상담 응답 업데이트 (배정된 변호사만 가능)
export async function PUT(
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
      { error: '변호사만 상담을 업데이트할 수 있습니다.' },
      { status: 403 }
    );
  }

  try {
    const body: ConsultationUpdateRequest = await req.json();
    const {
      consultation_content,
      recommended_actions = '',
      status = 'in_progress',
      consultation_type = 'general',
      estimated_duration,
      internal_notes = ''
    } = body;

    // 필수 필드 검증
    if (!consultation_content || consultation_content.trim().length === 0) {
      return NextResponse.json(
        { error: '상담 내용을 입력해주세요.' },
        { status: 400 }
      );
    }

    if (consultation_content.length > 5000) {
      return NextResponse.json(
        { error: '상담 내용은 5000자를 초과할 수 없습니다.' },
        { status: 400 }
      );
    }

    // 상태 값 검증
    const validStatuses = ['pending', 'in_progress', 'completed'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: '유효하지 않은 상태 값입니다.' },
        { status: 400 }
      );
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
        { error: '본인에게 배정된 신고만 업데이트할 수 있습니다.' },
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

    // 기존 상담 정보 조회
    const { data: existingConsultation, error: consultationFetchError } = await supabase
      .from('lawyer_consultations')
      .select('id, status, started_at')
      .eq('report_id', reportId)
      .eq('lawyer_id', user.id)
      .single();

    let consultationId: string;
    let isNewConsultation = false;

    if (consultationFetchError && consultationFetchError.code === 'PGRST116') {
      // 상담 기록이 없으면 새로 생성
      isNewConsultation = true;
      const { data: newConsultation, error: createError } = await supabase
        .from('lawyer_consultations')
        .insert({
          report_id: reportId,
          lawyer_id: user.id,
          consultation_content,
          recommended_actions,
          status,
          consultation_type,
          priority_level: 1,
          estimated_duration,
          internal_notes,
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
      // 기존 상담 업데이트
      consultationId = existingConsultation.id;
      const updateData: any = {
        consultation_content,
        recommended_actions,
        status,
        consultation_type,
        estimated_duration,
        internal_notes,
        updated_at: now,
        last_activity_at: now
      };

      // 상담이 완료되는 경우 완료 시간 설정
      if (status === 'completed' && existingConsultation.status !== 'completed') {
        updateData.completed_at = now;
      }

      const { error: updateError } = await supabase
        .from('lawyer_consultations')
        .update(updateData)
        .eq('id', consultationId);

      if (updateError) {
        console.error('Consultation update error:', updateError);
        return NextResponse.json(
          { error: '상담 업데이트에 실패했습니다.' },
          { status: 500 }
        );
      }
    }

    // 신고 상태 업데이트
    let newReportStatus = report.status;
    const reportUpdateData: any = {
      updated_at: now
    };

    if (isNewConsultation || !existingConsultation?.started_at) {
      reportUpdateData.lawyer_consultation_started_at = now;
    }

    if (status === 'completed') {
      newReportStatus = 'consulting'; // 기본적으로 상담 진행 상태로
      reportUpdateData.lawyer_response_at = now;
    }

    if (Object.keys(reportUpdateData).length > 1) { // updated_at 외에 다른 필드가 있는 경우에만 업데이트
      reportUpdateData.status = newReportStatus;
      const { error: reportUpdateError } = await supabase
        .from('incident_reports')
        .update(reportUpdateData)
        .eq('id', reportId);

      if (reportUpdateError) {
        console.error('Report status update error:', reportUpdateError);
        return NextResponse.json(
          { error: '신고 상태 업데이트에 실패했습니다.' },
          { status: 500 }
        );
      }
    }

    // 업데이트된 상담 정보 조회
    const { data: updatedConsultation, error: fetchUpdatedError } = await supabase
      .from('lawyer_consultations')
      .select(`
        id,
        report_id,
        lawyer_id,
        consultation_content,
        recommended_actions,
        status,
        consultation_type,
        priority_level,
        estimated_duration,
        actual_duration,
        internal_notes,
        started_at,
        completed_at,
        created_at,
        updated_at,
        last_activity_at,
        lawyer:lawyer_id(id, name, email, specialization, law_firm)
      `)
      .eq('id', consultationId)
      .single();

    if (fetchUpdatedError) {
      console.error('Updated consultation fetch error:', fetchUpdatedError);
      return NextResponse.json(
        { error: '업데이트된 상담 정보 조회에 실패했습니다.' },
        { status: 500 }
      );
    }

    // TODO: 상담 완료 알림 발송 (추후 구현)
    // if (status === 'completed' && report.reporter) {
    //   await sendConsultationCompletedNotification(report.reporter.id, report.title, consultationId);
    // }

    return NextResponse.json({
      message: isNewConsultation ? '상담이 성공적으로 생성되었습니다.' : '상담이 성공적으로 업데이트되었습니다.',
      consultation: updatedConsultation,
      report: {
        id: report.id,
        title: report.title,
        status: newReportStatus,
        updated_at: reportUpdateData.updated_at
      }
    }, { status: isNewConsultation ? 201 : 200 });

  } catch (error) {
    console.error('Consultation update error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}