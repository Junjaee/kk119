/**
 * Server-side authentication configuration and utilities
 * Provides session management for API routes
 */

import { cookies } from 'next/headers';
import { JWTPayload, auth } from './auth-utils';
import { User, UserRole } from '../types/index';

export interface ServerSession {
  user: {
    id: number;
    email: string;
    name: string;
    role: UserRole;
    association_id?: number;
  };
  token: string;
}

/**
 * Get the current server-side session from cookies
 * Used in API routes and server components
 */
export async function getServerSession(): Promise<ServerSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token) {
    return null;
  }

  const payload = await auth.verifyToken(token);
  if (!payload) {
    return null;
  }

  return {
    user: {
      id: payload.userId,
      email: payload.email,
      name: payload.name,
      role: payload.role,
      association_id: payload.association_id
    },
    token
  };
}

/**
 * Get user from server session
 */
export async function getServerUser(): Promise<User | null> {
  const session = await getServerSession();
  if (!session) return null;

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role,
    association_id: session.user.association_id
  };
}

/**
 * Require authentication for API routes
 * Throws 401 error if not authenticated
 */
export async function requireAuth(): Promise<ServerSession> {
  const session = await getServerSession();
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session;
}

/**
 * Require specific role for API routes
 * Throws 401 if not authenticated, 403 if wrong role
 */
export async function requireRole(roles: UserRole[]): Promise<ServerSession> {
  const session = await requireAuth();

  if (!roles.includes(session.user.role)) {
    throw new Error('Forbidden');
  }

  return session;
}

/**
 * Require admin role
 */
export async function requireAdmin(): Promise<ServerSession> {
  return requireRole(['admin']);
}

/**
 * Require teacher or admin role
 */
export async function requireTeacherOrAdmin(): Promise<ServerSession> {
  return requireRole(['teacher', 'admin']);
}

/**
 * Require lawyer or admin role
 */
export async function requireLawyerOrAdmin(): Promise<ServerSession> {
  return requireRole(['lawyer', 'admin']);
}
