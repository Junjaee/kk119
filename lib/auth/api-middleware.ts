import { NextRequest, NextResponse } from 'next/server';
import { auth, isAuthorized, getUserFromToken, AuthorizationContext } from './auth-utils';
import { UserRole } from '../types';

/**
 * API Authentication result
 */
export interface AuthResult {
  success: boolean;
  user?: {
    id: number;
    email: string;
    name: string;
    role: UserRole;
    association_id?: number;
  };
  error?: string;
}

/**
 * Extract and verify auth token from API request
 */
export function authenticateRequest(request: NextRequest): AuthResult {
  // Try to get token from Authorization header first
  let token = auth.extractTokenFromHeaders(request.headers);

  // If not in header, try cookie
  if (!token) {
    const cookieHeader = request.headers.get('cookie');
    token = auth.extractTokenFromCookie(cookieHeader);
  }

  if (!token) {
    return {
      success: false,
      error: 'No authentication token provided'
    };
  }

  const user = getUserFromToken(token);
  if (!user) {
    return {
      success: false,
      error: 'Invalid authentication token'
    };
  }

  return {
    success: true,
    user: {
      id: user.id as number,
      email: user.email,
      name: user.name || '',
      role: user.role as UserRole,
      association_id: user.association_id
    }
  };
}

/**
 * Authorize API request with role-based access control
 */
export function authorizeRequest(
  request: NextRequest,
  context: AuthorizationContext
): AuthResult {
  const authResult = authenticateRequest(request);

  if (!authResult.success || !authResult.user) {
    return authResult;
  }

  // Try to get token for authorization check
  let token = auth.extractTokenFromHeaders(request.headers);
  if (!token) {
    const cookieHeader = request.headers.get('cookie');
    token = auth.extractTokenFromCookie(cookieHeader);
  }

  if (!token || !isAuthorized(token, context)) {
    return {
      success: false,
      error: 'Access denied: insufficient permissions'
    };
  }

  return authResult;
}

/**
 * Higher-order function to protect API routes
 */
export function withAuth<T extends any[]>(
  handler: (request: NextRequest, authResult: AuthResult, ...args: T) => Promise<Response> | Response,
  authContext?: AuthorizationContext
) {
  return async (request: NextRequest, ...args: T): Promise<Response> => {
    let result: AuthResult;

    if (authContext) {
      result = authorizeRequest(request, authContext);
    } else {
      result = authenticateRequest(request);
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: result.error?.includes('Access denied') ? 403 : 401 }
      );
    }

    return handler(request, result, ...args);
  };
}

/**
 * Middleware for super admin only routes
 */
export function withSuperAdminAuth<T extends any[]>(
  handler: (request: NextRequest, authResult: AuthResult, ...args: T) => Promise<Response> | Response
) {
  return withAuth(handler, { requiredRoles: ['super_admin'] });
}

/**
 * Middleware for admin or higher routes
 */
export function withAdminAuth<T extends any[]>(
  handler: (request: NextRequest, authResult: AuthResult, ...args: T) => Promise<Response> | Response
) {
  return withAuth(handler, { requiredRole: 'admin' });
}

/**
 * Middleware for lawyer or higher routes
 */
export function withLawyerAuth<T extends any[]>(
  handler: (request: NextRequest, authResult: AuthResult, ...args: T) => Promise<Response> | Response
) {
  return withAuth(handler, { requiredRole: 'lawyer' });
}

/**
 * Middleware for authenticated routes (any role)
 */
export function withUserAuth<T extends any[]>(
  handler: (request: NextRequest, authResult: AuthResult, ...args: T) => Promise<Response> | Response
) {
  return withAuth(handler);
}

/**
 * Middleware for association-specific routes
 */
export function withAssociationAuth<T extends any[]>(
  handler: (request: NextRequest, authResult: AuthResult, ...args: T) => Promise<Response> | Response,
  requireAssociation: boolean = true
) {
  return withAuth(handler, { requireAssociation });
}

/**
 * Create custom authorization middleware
 */
export function createAuthMiddleware<T extends any[]>(
  context: AuthorizationContext,
  handler: (request: NextRequest, authResult: AuthResult, ...args: T) => Promise<Response> | Response
) {
  return withAuth(handler, context);
}

/**
 * Utility to check if request user can access a specific association
 */
export function checkAssociationAccess(
  authResult: AuthResult,
  targetAssociationId: number
): boolean {
  if (!authResult.success || !authResult.user) return false;

  // Super admins can access any association
  if (authResult.user.role === 'super_admin') return true;

  // Others must be in the same association
  return authResult.user.association_id === targetAssociationId;
}

/**
 * Utility to check if request user can access another user's data
 */
export function checkUserAccess(
  authResult: AuthResult,
  targetUserId: number
): boolean {
  if (!authResult.success || !authResult.user) return false;

  // Super admins can access any user
  if (authResult.user.role === 'super_admin') return true;

  // Users can access their own data
  if (authResult.user.id === targetUserId) return true;

  // Admins can access users in their association
  if (authResult.user.role === 'admin' && authResult.user.association_id) {
    // This would need to check if targetUserId is in the same association
    // For now, return true for admins (implement association check as needed)
    return true;
  }

  return false;
}