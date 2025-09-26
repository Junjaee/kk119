import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

// 상담 응답 작성 요청 타입
interface ConsultationResponseRequest {
  report_id: string;
  consultation_content: string;
  recommended_actions?: string;
  consultation_type?: 'general' | 'legal_advice' | 'document_review' | 'case_analysis';
  priority_level?: number;
  estimated_duration?: number;
  internal_notes?: string;
  requires_additional_info?: boolean;
  additional_info_request?: string;
}

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

// POST: 변호사 상담 응답 작성
export async function POST(req: NextRequest) {
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
    const body: ConsultationResponseRequest = await req.json();
    const {
      report_id,
      consultation_content,
      recommended_actions = '',
      consultation_type = 'general',
      priority_level = 1,
      estimated_duration = 0,
      internal_notes = '',
      requires_additional_info = false,
      additional_info_request = ''
    } = body;

    // 필수 필드 검증
    if (!report_id || !consultation_content) {
      return NextResponse.json(
        { error: '신고 ID와 상담 내용은 필수입니다.' },
        { status: 400 }
      );
    }

    // UUID 형식 검증
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(report_id)) {
      return NextResponse.json(
        { error: '유효하지 않은 신고 ID 형식입니다.' },
        { status: 400 }
      );
    }

    // 필드 길이 검증
    if (consultation_content.trim().length === 0) {
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

    if (recommended_actions && recommended_actions.length > 2000) {
      return NextResponse.json(
        { error: '권장 조치는 2000자를 초과할 수 없습니다.' },
        { status: 400 }
      );
    }

    if (internal_notes && internal_notes.length > 1000) {
      return NextResponse.json(
        { error: '내부 메모는 1000자를 초과할 수 없습니다.' },
        { status: 400 }
      );
    }

    // 우선순위 검증
    if (priority_level < 1 || priority_level > 5) {
      return NextResponse.json(
        { error: '우선순위는 1-5 사이의 값이어야 합니다.' },
        { status: 400 }
      );
    }

    // 상담 타입 검증
    const validConsultationTypes = ['general', 'legal_advice', 'document_review', 'case_analysis'];
    if (!validConsultationTypes.includes(consultation_type)) {
      return NextResponse.json(
        { error: '유효하지 않은 상담 타입입니다.' },
        { status: 400 }
      );
    }

    const supabase = createClient();
    const now = new Date().toISOString();

    // 신고 정보 조회 및 권한 확인
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
      .eq('id', report_id)
      .single();

    if (reportError || !report) {
      return NextResponse.json(
        { error: '신고를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 본인에게 배정된 신고인지 확인
    if (report.assigned_lawyer_id !== lawyer.id) {
      return NextResponse.json(
        { error: '본인에게 배정된 신고만 상담 응답을 작성할 수 있습니다.' },
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

    // 기존 상담이 있는지 확인
    const { data: existingConsultation, error: consultationFetchError } = await supabase
      .from('lawyer_consultations')
      .select('id, status')
      .eq('report_id', report_id)
      .eq('lawyer_id', lawyer.id)
      .single();

    let consultationId: string;

    if (consultationFetchError && consultationFetchError.code === 'PGRST116') {
      // 새로운 상담 생성
      const { data: newConsultation, error: createError } = await supabase
        .from('lawyer_consultations')
        .insert({
          report_id: report_id,
          lawyer_id: lawyer.id,
          consultation_content,
          recommended_actions,
          status: 'in_progress',
          consultation_type,
          priority_level,
          estimated_duration,
          started_at: now,
          internal_notes,
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
        { error: '기존 상담 정보 조회에 실패했습니다.' },
        { status: 500 }
      );
    } else {
      // 기존 상담 업데이트
      const { error: updateError } = await supabase
        .from('lawyer_consultations')
        .update({
          consultation_content,
          recommended_actions,
          status: 'in_progress',
          consultation_type,
          priority_level,
          estimated_duration,
          internal_notes,
          updated_at: now,
          last_activity_at: now
        })
        .eq('id', existingConsultation.id);

      if (updateError) {
        console.error('Consultation update error:', updateError);
        return NextResponse.json(
          { error: '상담 업데이트에 실패했습니다.' },
          { status: 500 }
        );
      }

      consultationId = existingConsultation.id;
    }

    // 추가 정보 요청이 있으면 discussion에 기록
    if (requires_additional_info && additional_info_request) {
      const { error: discussionError } = await supabase
        .from('lawyer_consultation_discussions')
        .insert({
          consultation_id: consultationId,
          author_id: lawyer.id,
          content: `[추가 정보 요청]\n\n${additional_info_request}`,
          is_internal_note: false,
          attachments: {
            request_type: 'additional_info_from_consultation',
            request_content: additional_info_request,
            requested_at: now
          },
          created_at: now,
          updated_at: now
        });

      if (discussionError) {
        console.error('Discussion creation error:', discussionError);
        // 추가 정보 요청 실패해도 상담은 생성되었으므로 경고만 로그
        console.warn('Additional info request failed, but consultation was created successfully');
      }
    }

    // 신고 상태 업데이트
    const { error: reportUpdateError } = await supabase
      .from('incident_reports')
      .update({
        status: 'lawyer_responded', // 변호사가 응답함으로 상태 변경
        consultation_notes: `${consultation_type} 상담 완료`,
        updated_at: now
      })
      .eq('id', report_id);

    if (reportUpdateError) {
      console.error('Report status update error:', reportUpdateError);
      return NextResponse.json(
        { error: '신고 상태 업데이트에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 최종 상담 정보 조회
    const { data: finalConsultation, error: finalFetchError } = await supabase
      .from('lawyer_consultations')
      .select(`
        id,
        consultation_content,
        recommended_actions,
        status,
        consultation_type,
        priority_level,
        estimated_duration,
        started_at,
        completed_at,
        internal_notes,
        created_at,
        updated_at,
        last_activity_at
      `)
      .eq('id', consultationId)
      .single();

    if (finalFetchError) {
      console.error('Final consultation fetch error:', finalFetchError);
      return NextResponse.json(
        { error: '상담 정보 조회에 실패했습니다.' },
        { status: 500 }
      );
    }

    // TODO: 신고자에게 상담 응답 완료 알림 발송 (추후 구현)
    // if (report.reporter) {
    //   await sendConsultationCompletedNotification(
    //     report.reporter.id,
    //     report.title,
    //     lawyer.name,
    //     consultation_type
    //   );
    // }

    return NextResponse.json({
      message: '상담 응답이 성공적으로 작성되었습니다.',
      consultation: finalConsultation,
      report: {
        id: report.id,
        title: report.title,
        status: 'lawyer_responded',
        reporter: report.reporter
      },
      lawyer_info: {
        id: lawyer.id,
        name: lawyer.name,
        specialization: lawyer.specialization,
        law_firm: lawyer.law_firm
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Consultation response creation error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}