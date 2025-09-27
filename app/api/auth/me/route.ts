import { NextRequest, NextResponse } from 'next/server';
import { userDb } from '@/lib/db/database';
import { authenticatedAPI, SecureAPIContext } from '@/lib/middleware/secure-api-wrapper';
import { log } from '@/lib/utils/logger';

async function getUserHandler(request: NextRequest, context: SecureAPIContext): Promise<NextResponse> {
  const { user, requestId } = context;

  if (!user) {
    // This shouldn't happen with authenticatedAPI wrapper, but included for type safety
    return NextResponse.json(
      { error: '인증 정보를 찾을 수 없습니다.' },
      { status: 401 }
    );
  }

  try {
    // Get fresh user data from database
    const dbUser = userDb.findById(user.userId) as any;
    if (!dbUser) {
      log.security('User Not Found in Database', 'medium', `User ID: ${user.userId}`, {
        requestId,
        userId: user.userId,
        userEmail: user.email
      });

      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // Check if user is still verified
    if (dbUser.is_verified === 0) {
      log.security('Unverified User Access Attempt', 'medium', `User: ${dbUser.email}`, {
        requestId,
        userId: dbUser.id,
        userEmail: dbUser.email
      });

      return NextResponse.json(
        { error: '계정이 인증되지 않았습니다.' },
        { status: 403 }
      );
    }

    // Log successful user info retrieval
    log.debug('User info retrieved', {
      requestId,
      userId: dbUser.id,
      userRole: dbUser.role,
      securityFlags: context.securityFlags
    });

    // Prepare user response data
    const userData = {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      school: dbUser.school,
      position: dbUser.position,
      phone: dbUser.phone,
      role: dbUser.role || 'teacher',
      isAdmin: dbUser.is_admin === 1,
      isVerified: dbUser.is_verified === 1,
      createdAt: dbUser.created_at,
      lastLogin: dbUser.last_login,
      association_id: dbUser.association_id
    };

    // Include token security information if there are any flags
    const response: any = { user: userData };

    if (context.securityFlags && context.securityFlags.length > 0) {
      response.securityInfo = {
        flags: context.securityFlags,
        shouldRefresh: context.validationResult?.shouldRefresh || false
      };
    }

    // Add token refresh recommendation if needed
    if (context.validationResult?.shouldRefresh) {
      response.tokenInfo = {
        shouldRefresh: true,
        message: '토큰을 곧 갱신해야 합니다.'
      };
    }

    return NextResponse.json(response);

  } catch (error: any) {
    log.error('Get user info error', error, {
      requestId,
      userId: user.userId,
      stack: error.stack
    });

    return NextResponse.json(
      { error: '사용자 정보를 가져오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// Export the secured handler
export const GET = authenticatedAPI(getUserHandler);