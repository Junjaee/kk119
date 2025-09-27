import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
// Web Crypto API를 사용하여 Edge Runtime 호환성 유지
import { UserRole, User, getUserRoleHierarchy, canAccessRole, hasRole as hasUserRole } from '../types/index';

const JWT_SECRET = process.env.JWT_SECRET || 'kyokwon119-secret-key-2024-change-this-in-production';
const JWT_EXPIRES_IN = '7d';

// Convert secret to Uint8Array for jose
const getJwtSecret = () => new TextEncoder().encode(JWT_SECRET);

export interface JWTPayload {
  userId: number;
  email: string;
  name: string;
  role: UserRole;
  association_id?: number;
  // Legacy support
  isAdmin?: boolean;
}

export const auth = {
  // Generate JWT token
  generateToken: async (payload: JWTPayload): Promise<string> => {
    const token = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(JWT_EXPIRES_IN)
      .sign(getJwtSecret());
    return token;
  },

  // Verify JWT token
  verifyToken: async (token: string): Promise<JWTPayload | null> => {
    try {
      const { payload } = await jwtVerify(token, getJwtSecret());
      return payload as JWTPayload;
    } catch (error) {
      return null;
    }
  },

  // Compare passwords
  comparePassword: async (password: string, hashedPassword: string): Promise<boolean> => {
    return bcrypt.compare(password, hashedPassword);
  },

  // Generate random token
  generateRandomToken: (): string => {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  },

  // Generate session token
  generateSessionToken: (): string => {
    const array = new Uint8Array(48);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  },

  // Extract token from headers
  extractTokenFromHeaders: (headers: Headers): string | null => {
    const authorization = headers.get('authorization');
    if (!authorization) return null;
    
    const parts = authorization.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
    
    return parts[1];
  },

  // Extract token from cookie
  extractTokenFromCookie: (cookie: string | null): string | null => {
    if (!cookie) return null;
    
    const cookies = cookie.split(';').reduce((acc, c) => {
      const [key, value] = c.trim().split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);
    
    return cookies['auth-token'] || null;
  }
};

// Password validation
export const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('비밀번호는 최소 8자 이상이어야 합니다.');
  }
  
  
  if (!/[a-z]/.test(password)) {
    errors.push('비밀번호는 소문자를 포함해야 합니다.');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('비밀번호는 숫자를 포함해야 합니다.');
  }
  
  if (!/[!@#$%^&*]/.test(password)) {
    errors.push('비밀번호는 특수문자(!@#$%^&*)를 포함해야 합니다.');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

// Email validation
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Phone validation (Korean format)
export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/;
  return phoneRegex.test(phone.replace(/-/g, ''));
};

// Role-based Authentication Utilities

/**
 * Extract user role from JWT token
 */
export const getUserRole = async (token: string): Promise<UserRole | null> => {
  try {
    const payload = await auth.verifyToken(token);
    return payload?.role || null;
  } catch (error) {
    return null;
  }
};

/**
 * Extract user role from JWT payload
 */
export const getUserRoleFromPayload = (payload: JWTPayload): UserRole => {
  return payload.role;
};

/**
 * Check if token holder has specific role
 */
export const hasRole = async (token: string, roles: UserRole[]): Promise<boolean> => {
  const userRole = await getUserRole(token);
  return userRole ? roles.includes(userRole) : false;
};

/**
 * Check if token holder has specific role (from payload)
 */
export const hasRoleFromPayload = (payload: JWTPayload, roles: UserRole[]): boolean => {
  return roles.includes(payload.role);
};

/**
 * Check if user can access a resource based on role hierarchy
 */
export const canAccess = async (token: string, requiredRole: UserRole): Promise<boolean> => {
  const userRole = await getUserRole(token);
  return userRole ? canAccessRole(userRole, requiredRole) : false;
};

/**
 * Check if user can access a resource based on role hierarchy (from payload)
 */
export const canAccessFromPayload = (payload: JWTPayload, requiredRole: UserRole): boolean => {
  return canAccessRole(payload.role, requiredRole);
};

/**
 * Comprehensive authorization check
 */
export interface AuthorizationContext {
  requiredRoles?: UserRole[];
  requiredRole?: UserRole;
  requireAssociation?: boolean;
  associationId?: number;
  allowSameUser?: boolean;
  targetUserId?: number;
}

export const isAuthorized = async (token: string, context: AuthorizationContext): Promise<boolean> => {
  const payload = await auth.verifyToken(token);
  if (!payload) return false;

  return isAuthorizedFromPayload(payload, context);
};

/**
 * Comprehensive authorization check from payload
 */
export const isAuthorizedFromPayload = (payload: JWTPayload, context: AuthorizationContext): boolean => {
  // Check required roles (exact match)
  if (context.requiredRoles && !hasRoleFromPayload(payload, context.requiredRoles)) {
    return false;
  }

  // Check required role (hierarchy based)
  if (context.requiredRole && !canAccessFromPayload(payload, context.requiredRole)) {
    return false;
  }

  // Check association requirement
  if (context.requireAssociation && !payload.association_id) {
    return false;
  }

  // Check specific association access
  if (context.associationId) {
    // Super admins can access any association
    if (payload.role === 'super_admin') {
      return true;
    }
    // Others must be in the same association
    if (payload.association_id !== context.associationId) {
      return false;
    }
  }

  // Check same user access
  if (context.allowSameUser && context.targetUserId) {
    if (payload.userId === context.targetUserId) {
      return true;
    }
  }

  return true;
};

/**
 * Check if user is super admin
 */
export const isSuperAdmin = async (token: string): Promise<boolean> => {
  const userRole = await getUserRole(token);
  return userRole === 'super_admin';
};

/**
 * Check if user is super admin (from payload)
 */
export const isSuperAdminFromPayload = (payload: JWTPayload): boolean => {
  return payload.role === 'super_admin';
};

/**
 * Check if user is admin or higher
 */
export const isAdminOrHigher = async (token: string): Promise<boolean> => {
  return await canAccess(token, 'admin');
};

/**
 * Check if user is admin or higher (from payload)
 */
export const isAdminOrHigherFromPayload = (payload: JWTPayload): boolean => {
  return canAccessFromPayload(payload, 'admin');
};

/**
 * Get user's association ID from token
 */
export const getUserAssociationId = async (token: string): Promise<number | null> => {
  const payload = await auth.verifyToken(token);
  return payload?.association_id || null;
};

/**
 * Check if users are in the same association
 */
export const isSameAssociation = async (token1: string, token2: string): Promise<boolean> => {
  const assoc1 = await getUserAssociationId(token1);
  const assoc2 = await getUserAssociationId(token2);
  return assoc1 !== null && assoc2 !== null && assoc1 === assoc2;
};

/**
 * Create authorization middleware helper
 */
export const createAuthCheck = (context: AuthorizationContext) => {
  return async (token: string): Promise<boolean> => {
    return await isAuthorized(token, context);
  };
};

/**
 * Extract full user info from JWT token
 */
export const getUserFromToken = async (token: string): Promise<Partial<User> | null> => {
  const payload = await auth.verifyToken(token);
  if (!payload) return null;

  return {
    id: payload.userId,
    email: payload.email,
    name: payload.name,
    role: payload.role,
    association_id: payload.association_id,
    // Legacy support
    isAdmin: payload.isAdmin
  };
};