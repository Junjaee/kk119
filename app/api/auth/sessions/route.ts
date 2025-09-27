import { NextRequest, NextResponse } from 'next/server';
import { authenticatedAPI, SecureAPIContext } from '@/lib/middleware/secure-api-wrapper';
import { sessionManager } from '@/lib/auth/session-manager';
import { log } from '@/lib/utils/logger';

/**
 * GET /api/auth/sessions - Get all active sessions for the authenticated user
 */
async function getSessionsHandler(request: NextRequest, context: SecureAPIContext): Promise<NextResponse> {
  const { user, requestId } = context;

  if (!user) {
    return NextResponse.json(
      { error: '인증이 필요합니다.' },
      { status: 401 }
    );
  }

  try {
    const sessions = sessionManager.getUserSessions(user.userId);

    // Get current session info
    const currentSessionId = user.sessionId;
    const currentSession = sessions.find(s => s.id === currentSessionId);

    log.debug('User sessions retrieved', {
      requestId,
      userId: user.userId,
      sessionCount: sessions.length,
      currentSessionId
    });

    return NextResponse.json({
      sessions: sessions.map(session => ({
        id: session.id,
        deviceId: session.deviceId,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        createdAt: session.createdAt,
        lastActivity: session.lastActivity,
        isCurrentSession: session.id === currentSessionId,
        location: session.location,
        riskScore: session.riskScore,
        // Parse user agent for display
        deviceInfo: parseUserAgentForDisplay(session.userAgent || '')
      })),
      currentSession: currentSession ? {
        id: currentSession.id,
        createdAt: currentSession.createdAt,
        lastActivity: currentSession.lastActivity
      } : null,
      stats: sessionManager.getSessionStats()
    });

  } catch (error: any) {
    log.error('Get sessions error', error, {
      requestId,
      userId: user.userId,
      stack: error.stack
    });

    return NextResponse.json(
      { error: '세션 정보를 가져오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/auth/sessions - Invalidate sessions
 */
async function deleteSessionsHandler(request: NextRequest, context: SecureAPIContext): Promise<NextResponse> {
  const { user, requestId } = context;

  if (!user) {
    return NextResponse.json(
      { error: '인증이 필요합니다.' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { sessionId, action } = body;

    if (action === 'logout_all') {
      // Logout from all sessions except current one
      const currentSessionId = user.sessionId;
      const sessions = sessionManager.getUserSessions(user.userId);

      let invalidatedCount = 0;
      sessions.forEach(session => {
        if (session.id !== currentSessionId) {
          if (sessionManager.invalidateSession(session.id, 'User requested logout from all other sessions')) {
            invalidatedCount++;
          }
        }
      });

      log.security('User Logged Out From All Other Sessions', 'medium', `User: ${user.email}`, {
        requestId,
        userId: user.userId,
        currentSessionId,
        invalidatedCount
      });

      return NextResponse.json({
        message: '다른 모든 세션에서 로그아웃되었습니다.',
        invalidatedCount
      });

    } else if (action === 'logout_session' && sessionId) {
      // Logout from specific session
      const currentSessionId = user.sessionId;

      if (sessionId === currentSessionId) {
        return NextResponse.json(
          { error: '현재 세션은 로그아웃할 수 없습니다.' },
          { status: 400 }
        );
      }

      const success = sessionManager.invalidateSession(sessionId, 'User requested logout from specific session');

      if (success) {
        log.security('User Logged Out From Specific Session', 'low', `User: ${user.email}`, {
          requestId,
          userId: user.userId,
          targetSessionId: sessionId,
          currentSessionId
        });

        return NextResponse.json({
          message: '선택한 세션에서 로그아웃되었습니다.',
          sessionId
        });
      } else {
        return NextResponse.json(
          { error: '세션을 찾을 수 없습니다.' },
          { status: 404 }
        );
      }

    } else {
      return NextResponse.json(
        { error: '잘못된 요청입니다.' },
        { status: 400 }
      );
    }

  } catch (error: any) {
    log.error('Delete sessions error', error, {
      requestId,
      userId: user.userId,
      stack: error.stack
    });

    return NextResponse.json(
      { error: '세션 관리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

/**
 * Helper function to parse user agent for display
 */
function parseUserAgentForDisplay(userAgent: string): {
  browser: string;
  os: string;
  device: string;
} {
  let browser = 'Unknown Browser';
  let os = 'Unknown OS';
  let device = 'Desktop';

  // Browser detection
  if (userAgent.includes('Chrome')) {
    browser = 'Chrome';
  } else if (userAgent.includes('Firefox')) {
    browser = 'Firefox';
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    browser = 'Safari';
  } else if (userAgent.includes('Edge')) {
    browser = 'Edge';
  } else if (userAgent.includes('Opera')) {
    browser = 'Opera';
  }

  // OS detection
  if (userAgent.includes('Windows NT')) {
    os = 'Windows';
  } else if (userAgent.includes('Mac OS X')) {
    os = 'macOS';
  } else if (userAgent.includes('Linux')) {
    os = 'Linux';
  } else if (userAgent.includes('Android')) {
    os = 'Android';
    device = 'Mobile';
  } else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) {
    os = 'iOS';
    device = userAgent.includes('iPad') ? 'Tablet' : 'Mobile';
  }

  // Mobile detection
  if (userAgent.includes('Mobile') && device === 'Desktop') {
    device = 'Mobile';
  } else if (userAgent.includes('Tablet')) {
    device = 'Tablet';
  }

  return { browser, os, device };
}

// Export the secured handlers
export const GET = authenticatedAPI(getSessionsHandler);
export const DELETE = authenticatedAPI(deleteSessionsHandler);