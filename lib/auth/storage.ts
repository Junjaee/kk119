// @CODE:AUTH-004-DUAL-STORE | Chain: SPEC-AUTH-004 -> CODE-AUTH-004-DUAL-STORE -> TEST-AUTH-004-013
// Related: @CODE:AUTH-004-DETECT, @CODE:AUTH-004-INTEGRATE
// Dual storage mechanism for token persistence

import { UserRole, AUTH_STORAGE_KEYS, LEGACY_KEYS } from './storage-keys';

/**
 * Store token in both role-specific and legacy keys (dual storage strategy)
 * @CODE:AUTH-004-DUAL-STORE
 *
 * Strategy:
 * 1. Primary: Role-specific key (token_<role>)
 * 2. Secondary: Legacy key (token) for backward compatibility
 * 3. Both keys receive the same token value
 *
 * Performance target: < 100ms
 */
export function storeToken(role: UserRole, token: string): void {
  // Validate input
  if (!token || typeof token !== 'string' || token.trim() === '') {
    console.warn('[STORAGE] Attempted to store empty or invalid token, ignoring');
    return;
  }

  if (typeof window === 'undefined') {
    console.warn('[STORAGE] Cannot store token on server side');
    return;
  }

  try {
    // Primary: Role-specific key
    const roleKey = AUTH_STORAGE_KEYS[role].token;
    localStorage.setItem(roleKey, token);

    // Secondary: Legacy key (backward compatibility)
    localStorage.setItem(LEGACY_KEYS.token, token);

    console.log(`[STORAGE] Token stored for role: ${role} (dual storage)`);
  } catch (error) {
    console.error('[STORAGE] Failed to store token:', error);
    throw error;
  }
}

/**
 * Remove all tokens from all storage locations
 * @CODE:AUTH-004-DUAL-STORE
 *
 * Clears:
 * 1. All role-specific token keys
 * 2. All role-specific storage keys
 * 3. Legacy token key
 * 4. Legacy storage key
 * 5. Session storage
 * 6. Token validation cache
 *
 * Performance target: < 500ms
 */
export function clearAllTokens(): void {
  if (typeof window === 'undefined') {
    console.warn('[STORAGE] Cannot clear tokens on server side');
    return;
  }

  try {
    // Remove all role-specific keys
    const roles: UserRole[] = ['teacher', 'lawyer', 'admin', 'super_admin'];

    roles.forEach(role => {
      const keys = AUTH_STORAGE_KEYS[role];
      localStorage.removeItem(keys.token);
      localStorage.removeItem(keys.storage);
    });

    // Remove legacy keys
    localStorage.removeItem(LEGACY_KEYS.token);
    localStorage.removeItem(LEGACY_KEYS.storage);
    localStorage.removeItem(LEGACY_KEYS.rememberedEmail);

    // Clear session storage
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.clear();
    }

    // Clear token validation cache
    // Import dynamically to avoid circular dependency
    import('./token-detector').then(({ clearTokenCache }) => {
      clearTokenCache();
    }).catch(err => {
      console.warn('[STORAGE] Failed to clear token cache:', err);
    });

    console.log('[STORAGE] All tokens and storage cleared');
  } catch (error) {
    console.error('[STORAGE] Failed to clear tokens:', error);
    throw error;
  }
}

/**
 * Get token for specific role
 * @CODE:AUTH-004-DUAL-STORE
 */
export function getToken(role: UserRole): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const roleKey = AUTH_STORAGE_KEYS[role].token;
  return localStorage.getItem(roleKey);
}

/**
 * Check if token exists for specific role
 * @CODE:AUTH-004-DUAL-STORE
 */
export function hasToken(role: UserRole): boolean {
  return getToken(role) !== null;
}

/**
 * Store user data in role-specific storage
 * @CODE:AUTH-004-DUAL-STORE
 */
export function storeUserData(role: UserRole, data: any): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const storageKey = AUTH_STORAGE_KEYS[role].storage;
    localStorage.setItem(storageKey, JSON.stringify(data));
  } catch (error) {
    console.error('[STORAGE] Failed to store user data:', error);
  }
}

/**
 * Get user data from role-specific storage
 * @CODE:AUTH-004-DUAL-STORE
 */
export function getUserData(role: UserRole): any | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const storageKey = AUTH_STORAGE_KEYS[role].storage;
    const data = localStorage.getItem(storageKey);

    if (!data) {
      return null;
    }

    return JSON.parse(data);
  } catch (error) {
    console.error('[STORAGE] Failed to get user data:', error);
    return null;
  }
}

/**
 * Clear cookies (client-side)
 * @CODE:AUTH-004-DUAL-STORE
 */
export function clearCookies(): void {
  if (typeof document === 'undefined') {
    return;
  }

  const hostname = window.location.hostname;
  const cookieNames = ['auth-token', 'session'];
  const domains = [hostname, `.${hostname}`, ''];
  const paths = ['/', '/api', '/admin', '/teacher', '/lawyer'];

  cookieNames.forEach(name => {
    domains.forEach(domain => {
      paths.forEach(path => {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=${domain}`;
        document.cookie = `${name}=; Max-Age=0; path=${path}; domain=${domain}`;
      });
    });
  });

  console.log('[STORAGE] Cookies cleared');
}
