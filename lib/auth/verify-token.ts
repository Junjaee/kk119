// @CODE:AUTH-VERIFY-001 | Chain: SPEC-AUTH-001 -> CODE-AUTH-001
// Token verification helper for API routes

import { NextRequest } from 'next/server';
import { JWTVerifier } from './jwt-verifier';
import { UserRole } from './storage-keys';
import { userDb } from '@/lib/db/database';

export interface AuthUser {
  id: number;
  email: string;
  name: string;
  role: UserRole;
}

export interface AuthResult {
  valid: boolean;
  user?: AuthUser;
  error?: string;
}

/**
 * Verify authentication from request headers
 * @CODE:AUTH-VERIFY-001-MAIN
 */
export async function verifyAuth(request: NextRequest): Promise<AuthResult> {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        valid: false,
        error: 'Missing or invalid Authorization header',
      };
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify JWT token
    const verifier = new JWTVerifier();
    const verifyResult = await verifier.verify(token);

    if (!verifyResult.valid || !verifyResult.payload) {
      return {
        valid: false,
        error: verifyResult.error || 'Invalid token',
      };
    }

    const { payload } = verifyResult;

    // Fetch full user details from database
    const dbUser = userDb.findById(payload.userId) as any;
    if (!dbUser) {
      return {
        valid: false,
        error: 'User not found',
      };
    }

    // Construct auth user object
    const user: AuthUser = {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role || 'teacher',
    };

    return {
      valid: true,
      user,
    };
  } catch (error) {
    console.error('Error verifying auth:', error);
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Authentication failed',
    };
  }
}

/**
 * Verify user has required role
 * @CODE:AUTH-VERIFY-001-ROLE
 */
export function hasRole(user: AuthUser, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(user.role);
}

/**
 * Verify user is admin
 * @CODE:AUTH-VERIFY-001-IS-ADMIN
 */
export function isAdmin(user: AuthUser): boolean {
  return user.role === 'admin' || user.role === 'admin';
}
