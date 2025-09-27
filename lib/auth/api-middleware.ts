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
export async function authenticateRequest(request: NextRequest): Promise<AuthResult> {
  console.log('🔍 [AUTH] Starting authenticateRequest');

  // Try to get token from Authorization header first
  let token = auth.extractTokenFromHeaders(request.headers);

  // If not in header, try cookie
  if (!token) {
    const cookieHeader = request.headers.get('cookie');
    token = auth.extractTokenFromCookie(cookieHeader);
  }

  console.log('🔍 [AUTH] Token extracted:', token ? 'YES' : 'NO');

  if (!token) {
    console.log('🔍 [AUTH] No token found');
    return {
      success: false,
      error: 'No authentication token provided'
    };
  }

  const user = await getUserFromToken(token);
  console.log('🔍 [AUTH] User from token:', user ? { id: user.id, email: user.email, role: user.role } : 'NULL');

  if (!user) {
    console.log('🔍 [AUTH] Invalid token');
    return {
      success: false,
      error: 'Invalid authentication token'
    };
  }

  console.log('🔍 [AUTH] Authentication successful');
  return {
    success: true,
    user: {
      id: user.id as number,
      email: user.email || '',
      name: user.name || '',
      role: user.role as UserRole,
      association_id: user.association_id
    }
  };
}

/**
 * Authorize API request with role-based access control
 */
export async function authorizeRequest(
  request: NextRequest,
  context: AuthorizationContext
): Promise<AuthResult> {
  console.log('🔍 [AUTHZ] Starting authorizeRequest with context:', context);

  const authResult = await authenticateRequest(request);
  console.log('🔍 [AUTHZ] Authentication result:', authResult.success ? 'SUCCESS' : `FAILED: ${authResult.error}`);

  if (!authResult.success || !authResult.user) {
    return authResult;
  }

  // Try to get token for authorization check
  let token = auth.extractTokenFromHeaders(request.headers);
  if (!token) {
    const cookieHeader = request.headers.get('cookie');
    token = auth.extractTokenFromCookie(cookieHeader);
  }

  console.log('🔍 [AUTHZ] Token for authorization check:', token ? 'YES' : 'NO');

  const authorized = token ? await isAuthorized(token, context) : false;
  console.log('🔍 [AUTHZ] Authorization result:', authorized ? 'AUTHORIZED' : 'DENIED');

  if (!token || !authorized) {
    console.log('🔍 [AUTHZ] Access denied - User role:', authResult.user.role, 'Required:', context);
    return {
      success: false,
      error: 'Access denied: insufficient permissions'
    };
  }

  console.log('🔍 [AUTHZ] Authorization successful');
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
      result = await authorizeRequest(request, authContext);
    } else {
      result = await authenticateRequest(request);
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