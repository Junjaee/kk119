import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';
import { getNextReportStatus } from '@/lib/types';
import { NotificationService } from '@/lib/services/notification-service';

// 변호사 배정 요청 타입
interface AssignLawyerRequest {
  lawyer_id: string;
  consultation_priority?: number;
  consultation_notes?: string;
  requires_legal_consultation?: boolean;
}

// 관리자 권한 검증 함수
async function checkAdminPermission(req: NextRequest) {
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

    // 관리자 또는 슈퍼어드민 권한 확인
    if (profile.role !== 'admin' && profile.role !== 'super_admin') {
      return { authorized: false, error: '관리자 권한이 필요합니다.' };
    }

    return { authorized: true, userId: user.id };
  } catch (error) {
    console.error('Permission check error:', error);
    return { authorized: false, error: '권한 확인 중 오류가 발생했습니다.' };
  }
}

// POST: 변호사 배정 (관리자만 가능)
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const reportId = params.id;

  // 권한 검증
  const permissionCheck = await checkAdminPermission(req);
  if (!permissionCheck.authorized) {
    return NextResponse.json(
      { error: permissionCheck.error },
      { status: 401 }
    );
  }

  const adminUserId = permissionCheck.userId;

  try {
    const body: AssignLawyerRequest = await req.json();
    const {
      lawyer_id,
      consultation_priority = 1,
      consultation_notes = '',
      requires_legal_consultation = true
    } = body;

    // 필수 필드 검증
    if (!lawyer_id) {
      return NextResponse.json(
        { error: '변호사 ID가 필요합니다.' },
        { status: 400 }
      );
    }

    // UUID 형식 검증
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(reportId) || !uuidRegex.test(lawyer_id)) {
      return NextResponse.json(
        { error: '유효하지 않은 ID 형식입니다.' },
        { status: 400 }
      );
    }

    // 우선순위 값 검증
    if (consultation_priority < 1 || consultation_priority > 5) {
      return NextResponse.json(
        { error: '상담 우선순위는 1-5 사이의 값이어야 합니다.' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // 신고 건 존재 확인
    const { data: report, error: reportError } = await supabase
      .from('incident_reports')
      .select('id, status, assigned_lawyer_id, title')
      .eq('id', reportId)
      .single();

    if (reportError || !report) {
      return NextResponse.json(
        { error: '신고 건을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 변호사 존재 및 역할 확인
    const { data: lawyer, error: lawyerError } = await supabase
      .from('user_profiles')
      .select('id, name, role, is_verified')
      .eq('id', lawyer_id)
      .single();

    if (lawyerError || !lawyer) {
      return NextResponse.json(
        { error: '변호사를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    if (lawyer.role !== 'lawyer') {
      return NextResponse.json(
        { error: '선택한 사용자는 변호사가 아닙니다.' },
        { status: 400 }
      );
    }

    if (!lawyer.is_verified) {
      return NextResponse.json(
        { error: '인증되지 않은 변호사입니다.' },
        { status: 400 }
      );
    }

    // 신고 상태가 배정 가능한지 확인 (기본 상태들)
    const assignableStatuses = ['submitted', 'investigating', 'consulting'];
    if (!assignableStatuses.includes(report.status)) {
      return NextResponse.json(
        { error: `현재 상태(${report.status})에서는 변호사를 배정할 수 없습니다.` },
        { status: 400 }
      );
    }

    // 변호사 배정 정보 업데이트
    const updateData = {
      assigned_lawyer_id: lawyer_id,
      assigned_at: new Date().toISOString(),
      assigned_by: adminUserId,
      consultation_priority,
      consultation_notes,
      requires_legal_consultation,
      status: 'consulting', // 상담 진행 상태로 변경
      updated_at: new Date().toISOString()
    };

    const { data: updatedReport, error: updateError } = await supabase
      .from('incident_reports')
      .update(updateData)
      .eq('id', reportId)
      .select(`
        id,
        title,
        status,
        assigned_lawyer_id,
        assigned_at,
        assigned_by,
        consultation_priority,
        consultation_notes,
        requires_legal_consultation,
        lawyer:assigned_lawyer_id(id, name, email),
        assigned_by_user:assigned_by(id, name)
      `)
      .single();

    if (updateError) {
      console.error('Report update error:', updateError);
      return NextResponse.json(
        { error: '변호사 배정 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 알림 발송
    try {
      // Get reporter information for notifications
      const { data: reporter, error: reporterError } = await supabase
        .from('user_profiles')
        .select('id, name, email, notification_preferences')
        .eq('id', updatedReport.user_id)
        .single();

      if (!reporterError && reporter) {
        const notificationService = NotificationService.getInstance();

        // Prepare notification data
        const notificationData = {
          lawyer: {
            id: lawyer.id,
            name: lawyer.name,
            email: lawyer.email,
            role: 'lawyer' as const,
            preferences: {
              email: true,
              push: true,
              sms: false,
              in_app: true
            }
          },
          client: {
            id: reporter.id,
            name: reporter.name,
            email: reporter.email,
            role: 'client' as const,
            preferences: {
              email: true,
              push: false,
              sms: false,
              in_app: true
            }
          },
          report_title: updatedReport.title,
          report_type: report.type || 'other',
          priority: consultation_priority,
          incident_date: report.incident_date || 'N/A',
          assigned_date: updateData.assigned_at,
          assigned_by: adminUserId,
          notes: consultation_notes,
          law_firm: lawyer.law_firm || '등록된 법무법인 정보 없음',
          specialization: lawyer.specialization ? [lawyer.specialization] : ['일반'],
          avg_response_time: '24시간',
          submitted_date: report.created_at || updateData.assigned_at
        };

        // Send notifications asynchronously
        const notificationResult = await notificationService.sendLawyerAssignmentNotification(notificationData);

        console.log(`Assignment notifications sent:`, notificationResult);
      }
    } catch (notificationError) {
      // Don't fail the assignment if notifications fail
      console.error('Failed to send assignment notifications:', notificationError);
    }

    return NextResponse.json({
      message: '변호사가 성공적으로 배정되었습니다.',
      report: updatedReport,
      assignment: {
        lawyer_id,
        lawyer_name: lawyer.name,
        assigned_at: updateData.assigned_at,
        assigned_by: adminUserId,
        consultation_priority,
        consultation_notes
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Lawyer assignment error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// GET: 배정 가능한 변호사 목록 조회 (관리자만 가능)
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const reportId = params.id;

  // 권한 검증
  const permissionCheck = await checkAdminPermission(req);
  if (!permissionCheck.authorized) {
    return NextResponse.json(
      { error: permissionCheck.error },
      { status: 401 }
    );
  }

  try {
    const supabase = createClient();

    // 신고 건 존재 확인
    const { data: report, error: reportError } = await supabase
      .from('incident_reports')
      .select('id, title, status')
      .eq('id', reportId)
      .single();

    if (reportError || !report) {
      return NextResponse.json(
        { error: '신고 건을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 배정 가능한 변호사 목록 조회
    const { data: lawyers, error: lawyersError } = await supabase
      .from('user_profiles')
      .select(`
        id,
        name,
        email,
        specialization,
        law_firm,
        is_verified,
        created_at
      `)
      .eq('role', 'lawyer')
      .eq('is_verified', true)
      .eq('is_active', true)
      .order('name');

    if (lawyersError) {
      console.error('Lawyers fetch error:', lawyersError);
      return NextResponse.json(
        { error: '변호사 목록 조회에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      report: {
        id: report.id,
        title: report.title,
        status: report.status
      },
      available_lawyers: lawyers || []
    });

  } catch (error) {
    console.error('Available lawyers API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}