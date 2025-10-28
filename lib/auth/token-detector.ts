// @CODE:AUTH-004-DETECT | Chain: SPEC-AUTH-004 -> CODE-AUTH-004-DETECT -> TEST-AUTH-004-001
// Related: @CODE:AUTH-004-VALIDATE, @CODE:AUTH-004-DUAL-STORE, @CODE:AUTH-004-CACHE
// Token detection logic with role-based priority

import { UserRole, AUTH_STORAGE_KEYS } from './storage-keys';

// @CODE:AUTH-004-CACHE | Token caching for performance optimization
// Cache validated tokens for 5 minutes to reduce validation overhead
const TOKEN_CACHE = new Map<string, { token: string; validUntil: number }>();
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Detect token with priority: role-specific key > legacy key > cookie fallback
 * @CODE:AUTH-004-DETECT
 *
 * Algorithm:
 * 1. Check role-specific localStorage key first
 * 2. If not found, check legacy 'token' key (only if role matches)
 * 3. If found in legacy, auto-migrate to role-specific key
 * 4. Validate token before returning
 *
 * Performance target: < 50ms
 */
export function detectToken(role: UserRole): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  // Step 1: Check role-specific key (highest priority)
  const roleKey = AUTH_STORAGE_KEYS[role].token;
  const roleToken = localStorage.getItem(roleKey);

  if (roleToken && isValidToken(roleToken)) {
    // Verify role matches (additional security check)
    const tokenRole = extractRoleFromToken(roleToken);
    if (tokenRole === role) {
      return roleToken;
    }
  }

  // Step 2: Check legacy key (backward compatibility)
  const legacyToken = localStorage.getItem('token');

  if (legacyToken && isValidToken(legacyToken)) {
    // Only use legacy token if role matches
    const tokenRole = extractRoleFromToken(legacyToken);
    if (tokenRole === role) {
      // Auto-migrate to role-specific key
      localStorage.setItem(roleKey, legacyToken);
      return legacyToken;
    }
  }

  // Step 3: No valid token found
  return null;
}

/**
 * Validate JWT token structure and expiration
 * @CODE:AUTH-004-VALIDATE
 *
 * Validation checks:
 * 1. JWT structure (header.payload.signature)
 * 2. Expiration claim (exp)
 * 3. Token is not empty
 *
 * Performance target: < 200ms
 */
export function isValidToken(token: string): boolean {
  if (!token || typeof token !== 'string') {
    return false;
  }

  try {
    // Check JWT structure (3 parts separated by dots)
    const parts = token.split('.');
    if (parts.length !== 3) {
      return false;
    }

    // Decode payload (second part)
    const payload = JSON.parse(atob(parts[1]));

    // Check expiration
    if (!payload.exp) {
      return false;
    }

    const currentTime = Math.floor(Date.now() / 1000);
    const isNotExpired = payload.exp > currentTime;

    return isNotExpired;
  } catch (error) {
    // Invalid token format or decoding error
    return false;
  }
}

/**
 * Check if token should be refreshed (expires within threshold)
 * @CODE:AUTH-004-VALIDATE
 *
 * Default threshold: 5 minutes before expiration
 */
export function shouldRefreshToken(token: string, thresholdMinutes: number = 5): boolean {
  if (!isValidToken(token)) {
    return false;
  }

  try {
    const parts = token.split('.');
    const payload = JSON.parse(atob(parts[1]));

    const currentTime = Math.floor(Date.now() / 1000);
    const thresholdSeconds = thresholdMinutes * 60;

    return (payload.exp - currentTime) < thresholdSeconds;
  } catch {
    return false;
  }
}

/**
 * Extract user role from token
 * @CODE:AUTH-004-VALIDATE
 */
export function extractRoleFromToken(token: string): UserRole | null {
  if (!isValidToken(token)) {
    return null;
  }

  try {
    const parts = token.split('.');
    const payload = JSON.parse(atob(parts[1]));

    const role = payload.role;
    const validRoles: UserRole[] = ['teacher', 'lawyer', 'admin', 'admin'];

    if (validRoles.includes(role)) {
      return role as UserRole;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Mask token for secure logging (show only last 4 characters)
 * @CODE:AUTH-004-SECURITY
 */
export function maskToken(token: string): string {
  if (!token || token.length < 8) {
    return '***';
  }

  return `***${token.slice(-4)}`;
}

/**
 * Clear token cache (used on logout or role switch)
 * @CODE:AUTH-004-CACHE
 */
export function clearTokenCache(): void {
  TOKEN_CACHE.clear();
}

/**
 * Get cached token validation result
 * @CODE:AUTH-004-CACHE
 */
function getCachedValidation(role: UserRole): string | null {
  const cached = TOKEN_CACHE.get(role);

  if (!cached) {
    return null;
  }

  // Check if cache is still valid
  if (Date.now() > cached.validUntil) {
    TOKEN_CACHE.delete(role);
    return null;
  }

  return cached.token;
}

/**
 * Cache validated token
 * @CODE:AUTH-004-CACHE
 */
function cacheValidatedToken(role: UserRole, token: string): void {
  TOKEN_CACHE.set(role, {
    token,
    validUntil: Date.now() + CACHE_DURATION_MS,
  });
}
