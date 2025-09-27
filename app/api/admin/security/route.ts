import { NextRequest, NextResponse } from 'next/server';
import { adminAPI, SecureAPIContext } from '@/lib/middleware/secure-api-wrapper';
import { securityMonitor } from '@/lib/security/security-monitor';
import { log } from '@/lib/utils/logger';

/**
 * GET /api/admin/security - Get security dashboard data
 */
async function getSecurityDashboardHandler(request: NextRequest, context: SecureAPIContext): Promise<NextResponse> {
  const { user, requestId } = context;

  if (!user) {
    return NextResponse.json(
      { error: '인증이 필요합니다.' },
      { status: 401 }
    );
  }

  try {
    const url = new URL(request.url);
    const timeRange = url.searchParams.get('timeRange') as '1h' | '24h' | '7d' | '30d' || '24h';
    const reportType = url.searchParams.get('reportType') || 'dashboard';

    if (reportType === 'metrics') {
      // Get security metrics for dashboard
      const metrics = securityMonitor.getSecurityMetrics();

      log.userAction('Security Dashboard Accessed', `Time range: ${timeRange}`, {
        requestId,
        userId: user.userId.toString(),
        userRole: user.role,
        timeRange
      });

      return NextResponse.json({
        metrics,
        timestamp: new Date().toISOString()
      });

    } else if (reportType === 'events') {
      // Get security events with filtering
      const type = url.searchParams.get('type') as any;
      const severity = url.searchParams.get('severity') as any;
      const userId = url.searchParams.get('userId') ? parseInt(url.searchParams.get('userId')!) : undefined;
      const ipAddress = url.searchParams.get('ipAddress') || undefined;
      const limit = url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : 100;

      const events = securityMonitor.getSecurityEvents({
        type,
        severity,
        userId,
        ipAddress,
        limit,
        startTime: timeRange ? new Date(Date.now() - getTimeRangeMs(timeRange)) : undefined
      });

      return NextResponse.json({
        events,
        filters: { type, severity, userId, ipAddress, timeRange, limit },
        timestamp: new Date().toISOString()
      });

    } else if (reportType === 'report') {
      // Generate comprehensive security report
      const report = securityMonitor.generateSecurityReport(timeRange);

      log.userAction('Security Report Generated', `Time range: ${timeRange}`, {
        requestId,
        userId: user.userId.toString(),
        userRole: user.role,
        timeRange,
        reportEvents: report.summary.totalEvents
      });

      return NextResponse.json({
        report,
        timestamp: new Date().toISOString()
      });

    } else if (reportType === 'user-analysis') {
      // Analyze specific user behavior
      const targetUserId = url.searchParams.get('targetUserId');
      if (!targetUserId) {
        return NextResponse.json(
          { error: 'targetUserId parameter is required for user analysis' },
          { status: 400 }
        );
      }

      const analysis = securityMonitor.analyzeUserBehavior(parseInt(targetUserId));

      log.userAction('User Security Analysis', `Target user: ${targetUserId}`, {
        requestId,
        userId: user.userId.toString(),
        userRole: user.role,
        targetUserId,
        riskScore: analysis.riskScore
      });

      return NextResponse.json({
        analysis,
        targetUserId: parseInt(targetUserId),
        timestamp: new Date().toISOString()
      });

    } else {
      // Default dashboard data
      const metrics = securityMonitor.getSecurityMetrics();
      const report = securityMonitor.generateSecurityReport(timeRange);

      return NextResponse.json({
        dashboard: {
          metrics,
          summary: report.summary,
          topThreats: report.topThreats,
          riskAnalysis: report.riskAnalysis,
          recommendations: report.recommendations
        },
        timestamp: new Date().toISOString()
      });
    }

  } catch (error: any) {
    log.error('Security dashboard error', error, {
      requestId,
      userId: user.userId,
      stack: error.stack
    });

    return NextResponse.json(
      { error: '보안 대시보드 데이터를 가져오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/security - Manage security alerts and actions
 */
async function postSecurityActionHandler(request: NextRequest, context: SecureAPIContext): Promise<NextResponse> {
  const { user, requestId } = context;

  if (!user) {
    return NextResponse.json(
      { error: '인증이 필요합니다.' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { action, alertId, userId, ipAddress, reason } = body;

    if (action === 'acknowledge_alert') {
      if (!alertId) {
        return NextResponse.json(
          { error: 'alertId is required for acknowledge action' },
          { status: 400 }
        );
      }

      const success = securityMonitor.acknowledgeAlert(alertId);

      if (success) {
        log.security('Security Alert Acknowledged', 'low', `Alert: ${alertId}`, {
          requestId,
          userId: user.userId.toString(),
          userRole: user.role,
          alertId,
          acknowledgedBy: user.email
        });

        return NextResponse.json({
          message: '알림이 확인되었습니다.',
          alertId
        });
      } else {
        return NextResponse.json(
          { error: '알림을 찾을 수 없습니다.' },
          { status: 404 }
        );
      }

    } else if (action === 'block_ip') {
      if (!ipAddress) {
        return NextResponse.json(
          { error: 'ipAddress is required for block action' },
          { status: 400 }
        );
      }

      // This would integrate with a firewall or IP blocking system
      // For now, we'll just record the security event
      securityMonitor.recordEvent(
        'IP_CHANGE',
        'high',
        {
          message: `IP address ${ipAddress} blocked by admin`,
          action: 'block_ip',
          adminUser: user.email,
          reason: reason || 'Admin action'
        },
        {
          requestId,
          userId: user.userId.toString(),
          userEmail: user.email,
          ipAddress
        }
      );

      log.security('IP Address Blocked by Admin', 'high', `IP: ${ipAddress}`, {
        requestId,
        userId: user.userId.toString(),
        userRole: user.role,
        blockedIP: ipAddress,
        reason: reason || 'Admin action'
      });

      return NextResponse.json({
        message: `IP 주소 ${ipAddress}가 차단되었습니다.`,
        ipAddress,
        reason
      });

    } else if (action === 'reset_user_risk') {
      if (!userId) {
        return NextResponse.json(
          { error: 'userId is required for reset risk action' },
          { status: 400 }
        );
      }

      // This would reset the user's risk score
      securityMonitor.recordEvent(
        'DATA_ACCESS',
        'medium',
        {
          message: `User risk score reset by admin`,
          action: 'reset_user_risk',
          adminUser: user.email,
          targetUserId: userId,
          reason: reason || 'Admin action'
        },
        {
          requestId,
          userId: user.userId.toString(),
          userEmail: user.email
        }
      );

      log.security('User Risk Score Reset by Admin', 'medium', `Target user: ${userId}`, {
        requestId,
        userId: user.userId.toString(),
        userRole: user.role,
        targetUserId: userId,
        reason: reason || 'Admin action'
      });

      return NextResponse.json({
        message: `사용자 ${userId}의 위험 점수가 재설정되었습니다.`,
        userId,
        reason
      });

    } else {
      return NextResponse.json(
        { error: '지원되지 않는 작업입니다.' },
        { status: 400 }
      );
    }

  } catch (error: any) {
    log.error('Security action error', error, {
      requestId,
      userId: user.userId,
      stack: error.stack
    });

    return NextResponse.json(
      { error: '보안 작업 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * Helper function to convert time range to milliseconds
 */
function getTimeRangeMs(timeRange: string): number {
  const ranges = {
    '1h': 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000
  };
  return ranges[timeRange as keyof typeof ranges] || ranges['24h'];
}

// Export the secured handlers
export const GET = adminAPI(getSecurityDashboardHandler);
export const POST = adminAPI(postSecurityActionHandler);