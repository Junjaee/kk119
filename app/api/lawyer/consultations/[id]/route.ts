import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

// 상담 응답 수정 요청 타입
interface ConsultationUpdateRequest {
  consultation_content?: string;
  recommended_actions?: string;
  consultation_type?: 'general' | 'legal_advice' | 'document_review' | 'case_analysis';
  priority_level?: number;
  estimated_duration?: number;
  internal_notes?: string;
  status?: 'pending' | 'in_progress' | 'completed';
  modification_reason?: string; // 수정 사유
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

// GET: 특정 상담 정보 조회
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const consultationId = params.id;

  // UUID 형식 검증
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(consultationId)) {
    return NextResponse.json(
      { error: '유효하지 않은 상담 ID 형식입니다.' },
      { status: 400 }
    );
  }

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
    const supabase = createClient();

    // 상담 정보 조회
    const { data: consultation, error: consultationError } = await supabase
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
        internal_notes,
        started_at,
        completed_at,
        created_at,
        updated_at,
        last_activity_at,
        report:report_id(id, title, status, reporter_id)
      `)
      .eq('id', consultationId)
      .single();

    if (consultationError || !consultation) {
      return NextResponse.json(
        { error: '상담을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 본인의 상담인지 확인
    if (consultation.lawyer_id !== lawyer.id) {
      return NextResponse.json(
        { error: '본인의 상담만 조회할 수 있습니다.' },
        { status: 403 }
      );
    }

    // 수정 이력 조회
    const { data: modifications, error: modificationsError } = await supabase
      .from('lawyer_consultation_discussions')
      .select(`
        id,
        content,
        attachments,
        created_at,
        author:author_id(id, name)
      `)
      .eq('consultation_id', consultationId)
      .contains('attachments', { modification_type: 'consultation_update' })
      .order('created_at', { ascending: false });

    return NextResponse.json({
      consultation,
      modification_history: modifications || [],
      lawyer_info: {
        id: lawyer.id,
        name: lawyer.name,
        specialization: lawyer.specialization,
        law_firm: lawyer.law_firm
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

// PUT: 상담 응답 수정
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const consultationId = params.id;

  // UUID 형식 검증
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(consultationId)) {
    return NextResponse.json(
      { error: '유효하지 않은 상담 ID 형식입니다.' },
      { status: 400 }
    );
  }

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
    const body: ConsultationUpdateRequest = await req.json();
    const {
      consultation_content,
      recommended_actions,
      consultation_type,
      priority_level,
      estimated_duration,
      internal_notes,
      status,
      modification_reason = '상담 내용 수정'
    } = body;

    // 필드 검증
    if (consultation_content !== undefined) {
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
    }

    if (recommended_actions !== undefined && recommended_actions.length > 2000) {
      return NextResponse.json(
        { error: '권장 조치는 2000자를 초과할 수 없습니다.' },
        { status: 400 }
      );
    }

    if (internal_notes !== undefined && internal_notes.length > 1000) {
      return NextResponse.json(
        { error: '내부 메모는 1000자를 초과할 수 없습니다.' },
        { status: 400 }
      );
    }

    if (priority_level !== undefined && (priority_level < 1 || priority_level > 5)) {
      return NextResponse.json(
        { error: '우선순위는 1-5 사이의 값이어야 합니다.' },
        { status: 400 }
      );
    }

    if (consultation_type !== undefined) {
      const validTypes = ['general', 'legal_advice', 'document_review', 'case_analysis'];
      if (!validTypes.includes(consultation_type)) {
        return NextResponse.json(
          { error: '유효하지 않은 상담 타입입니다.' },
          { status: 400 }
        );
      }
    }

    if (status !== undefined) {
      const validStatuses = ['pending', 'in_progress', 'completed'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: '유효하지 않은 상태값입니다.' },
          { status: 400 }
        );
      }
    }

    const supabase = createClient();
    const now = new Date().toISOString();

    // 기존 상담 정보 조회
    const { data: existingConsultation, error: existingError } = await supabase
      .from('lawyer_consultations')
      .select(`
        id,
        lawyer_id,
        consultation_content,
        recommended_actions,
        consultation_type,
        priority_level,
        estimated_duration,
        internal_notes,
        status,
        report:report_id(id, title, status)
      `)
      .eq('id', consultationId)
      .single();

    if (existingError || !existingConsultation) {
      return NextResponse.json(
        { error: '상담을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 본인의 상담인지 확인
    if (existingConsultation.lawyer_id !== lawyer.id) {
      return NextResponse.json(
        { error: '본인의 상담만 수정할 수 있습니다.' },
        { status: 403 }
      );
    }

    // 완료된 상담인지 확인
    if (existingConsultation.status === 'completed') {
      return NextResponse.json(
        { error: '완료된 상담은 수정할 수 없습니다.' },
        { status: 400 }
      );
    }

    // 수정할 필드만 업데이트용 객체 생성
    const updateData: any = {
      updated_at: now,
      last_activity_at: now
    };

    // 변경사항 추적을 위한 변경 내역 저장
    const changes: Record<string, { from: any, to: any }> = {};

    if (consultation_content !== undefined && consultation_content !== existingConsultation.consultation_content) {
      updateData.consultation_content = consultation_content;
      changes.consultation_content = {
        from: existingConsultation.consultation_content?.substring(0, 100) + '...',
        to: consultation_content.substring(0, 100) + '...'
      };
    }

    if (recommended_actions !== undefined && recommended_actions !== existingConsultation.recommended_actions) {
      updateData.recommended_actions = recommended_actions;
      changes.recommended_actions = {
        from: existingConsultation.recommended_actions?.substring(0, 100) + '...',
        to: recommended_actions.substring(0, 100) + '...'
      };
    }

    if (consultation_type !== undefined && consultation_type !== existingConsultation.consultation_type) {
      updateData.consultation_type = consultation_type;
      changes.consultation_type = {
        from: existingConsultation.consultation_type,
        to: consultation_type
      };
    }

    if (priority_level !== undefined && priority_level !== existingConsultation.priority_level) {
      updateData.priority_level = priority_level;
      changes.priority_level = {
        from: existingConsultation.priority_level,
        to: priority_level
      };
    }

    if (estimated_duration !== undefined && estimated_duration !== existingConsultation.estimated_duration) {
      updateData.estimated_duration = estimated_duration;
      changes.estimated_duration = {
        from: existingConsultation.estimated_duration,
        to: estimated_duration
      };
    }

    if (internal_notes !== undefined && internal_notes !== existingConsultation.internal_notes) {
      updateData.internal_notes = internal_notes;
      changes.internal_notes = {
        from: existingConsultation.internal_notes ? 'Yes' : 'No',
        to: internal_notes ? 'Yes' : 'No'
      };
    }

    if (status !== undefined && status !== existingConsultation.status) {
      updateData.status = status;
      changes.status = {
        from: existingConsultation.status,
        to: status
      };

      // 상담이 완료되면 완료 시간 설정
      if (status === 'completed') {
        updateData.completed_at = now;
      }
    }

    // 변경사항이 없으면 에러 반환
    if (Object.keys(changes).length === 0) {
      return NextResponse.json(
        { error: '변경사항이 없습니다.' },
        { status: 400 }
      );
    }

    // 상담 정보 업데이트
    const { data: updatedConsultation, error: updateError } = await supabase
      .from('lawyer_consultations')
      .update(updateData)
      .eq('id', consultationId)
      .select(`
        id,
        consultation_content,
        recommended_actions,
        status,
        consultation_type,
        priority_level,
        estimated_duration,
        internal_notes,
        started_at,
        completed_at,
        created_at,
        updated_at,
        last_activity_at
      `)
      .single();

    if (updateError) {
      console.error('Consultation update error:', updateError);
      return NextResponse.json(
        { error: '상담 업데이트에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 수정 이력 기록
    const { error: historyError } = await supabase
      .from('lawyer_consultation_discussions')
      .insert({
        consultation_id: consultationId,
        author_id: lawyer.id,
        content: `[상담 수정]\n\n**수정 사유:** ${modification_reason}\n\n**변경사항:**\n${Object.entries(changes)
          .map(([key, change]) => `- ${key}: ${change.from} → ${change.to}`)
          .join('\n')}`,
        is_internal_note: true,
        attachments: {
          modification_type: 'consultation_update',
          modification_reason,
          changes,
          modified_at: now,
          modified_by: lawyer.id
        },
        created_at: now,
        updated_at: now
      });

    if (historyError) {
      console.error('Modification history creation error:', historyError);
      // 이력 저장 실패해도 업데이트는 성공했으므로 경고만 로그
      console.warn('Failed to record modification history, but consultation update was successful');
    }

    return NextResponse.json({
      message: '상담이 성공적으로 수정되었습니다.',
      consultation: updatedConsultation,
      changes,
      modification_info: {
        modified_by: lawyer.name,
        modified_at: now,
        reason: modification_reason
      }
    });

  } catch (error) {
    console.error('Consultation modification error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// DELETE: 상담 삭제 (완료되지 않은 상담만)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const consultationId = params.id;

  // UUID 형식 검증
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(consultationId)) {
    return NextResponse.json(
      { error: '유효하지 않은 상담 ID 형식입니다.' },
      { status: 400 }
    );
  }

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
    const supabase = createClient();

    // 상담 정보 조회
    const { data: consultation, error: consultationError } = await supabase
      .from('lawyer_consultations')
      .select('id, lawyer_id, status, report_id')
      .eq('id', consultationId)
      .single();

    if (consultationError || !consultation) {
      return NextResponse.json(
        { error: '상담을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 본인의 상담인지 확인
    if (consultation.lawyer_id !== lawyer.id) {
      return NextResponse.json(
        { error: '본인의 상담만 삭제할 수 있습니다.' },
        { status: 403 }
      );
    }

    // 완료된 상담은 삭제 불가
    if (consultation.status === 'completed') {
      return NextResponse.json(
        { error: '완료된 상담은 삭제할 수 없습니다.' },
        { status: 400 }
      );
    }

    // 관련 토론 먼저 삭제
    const { error: discussionsError } = await supabase
      .from('lawyer_consultation_discussions')
      .delete()
      .eq('consultation_id', consultationId);

    if (discussionsError) {
      console.error('Discussions deletion error:', discussionsError);
      return NextResponse.json(
        { error: '관련 토론 삭제에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 상담 삭제
    const { error: deleteError } = await supabase
      .from('lawyer_consultations')
      .delete()
      .eq('id', consultationId);

    if (deleteError) {
      console.error('Consultation deletion error:', deleteError);
      return NextResponse.json(
        { error: '상담 삭제에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 신고 상태를 consulting으로 되돌리기
    const { error: reportUpdateError } = await supabase
      .from('incident_reports')
      .update({
        status: 'consulting',
        consultation_notes: '상담이 취소되었습니다.',
        updated_at: new Date().toISOString()
      })
      .eq('id', consultation.report_id);

    if (reportUpdateError) {
      console.error('Report status update error:', reportUpdateError);
      // 신고 상태 업데이트 실패해도 상담 삭제는 성공
      console.warn('Failed to update report status after consultation deletion');
    }

    return NextResponse.json({
      message: '상담이 성공적으로 삭제되었습니다.',
      deleted_consultation_id: consultationId
    });

  } catch (error) {
    console.error('Consultation deletion error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}