import { NextRequest, NextResponse } from 'next/server';
import { NotificationService } from '@/lib/services/notification-service';
import { createClient } from '@/lib/supabase/client';

// Check admin permission
async function checkAdminPermission(req: NextRequest) {
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

    if (profile.role !== 'admin' && profile.role !== 'super_admin') {
      return { authorized: false, error: '관리자 권한이 필요합니다.' };
    }

    return { authorized: true, userId: user.id };
  } catch (error) {
    console.error('Permission check error:', error);
    return { authorized: false, error: '권한 확인 중 오류가 발생했습니다.' };
  }
}

// GET: 알림 통계 및 로그 조회
export async function GET(req: NextRequest) {
  const permissionCheck = await checkAdminPermission(req);
  if (!permissionCheck.authorized) {
    return NextResponse.json(
      { error: permissionCheck.error },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const action = searchParams.get('action');
    const notificationService = NotificationService.getInstance();

    if (action === 'stats') {
      const days = parseInt(searchParams.get('days') || '7');
      const stats = notificationService.getNotificationStats(days);

      return NextResponse.json({
        success: true,
        data: stats
      });
    } else if (action === 'logs') {
      const recipientId = searchParams.get('recipient_id') || undefined;
      const channel = searchParams.get('channel') || undefined;
      const status = searchParams.get('status') || undefined;
      const fromDate = searchParams.get('from_date') || undefined;
      const toDate = searchParams.get('to_date') || undefined;

      const logs = notificationService.getNotificationLogs({
        recipient_id: recipientId,
        channel,
        status,
        from_date: fromDate,
        to_date: toDate
      });

      return NextResponse.json({
        success: true,
        data: {
          logs,
          total: logs.length
        }
      });
    } else {
      // Default: return recent stats and logs
      const stats = notificationService.getNotificationStats(7);
      const logs = notificationService.getNotificationLogs();

      return NextResponse.json({
        success: true,
        data: {
          stats,
          recent_logs: logs.slice(0, 10)
        }
      });
    }
  } catch (error) {
    console.error('Notification API error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// POST: 알림 재전송 또는 테스트 알림
export async function POST(req: NextRequest) {
  const permissionCheck = await checkAdminPermission(req);
  if (!permissionCheck.authorized) {
    return NextResponse.json(
      { error: permissionCheck.error },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { action, ...params } = body;
    const notificationService = NotificationService.getInstance();

    if (action === 'retry') {
      const { recipient_id } = params;
      await notificationService.retryFailedNotifications(recipient_id);

      return NextResponse.json({
        success: true,
        message: '실패한 알림을 재전송했습니다.'
      });
    } else if (action === 'test') {
      // Send test notification
      const { template_id, recipient_id, variables } = params;

      const result = await notificationService.sendNotification({
        template_id,
        recipient_ids: [recipient_id],
        variables: variables || {},
        priority: 'low'
      });

      return NextResponse.json({
        success: result.success,
        message: result.success ? '테스트 알림을 발송했습니다.' : '테스트 알림 발송에 실패했습니다.',
        data: result.logs
      });
    } else {
      return NextResponse.json(
        { error: '지원하지 않는 작업입니다.' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Notification POST error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}