'use client';

import { useStore } from '@/lib/store';
import { User } from '@/lib/types';
import { AUTH_STORAGE_KEYS, LEGACY_KEYS, UserRole } from '@/lib/auth/storage-keys';

interface AuthSyncManager {
  syncUserState: (user: User | null) => void;
  clearAllAuthState: (skipServerSideCleanup?: boolean) => void;
  refreshAuthState: () => Promise<void>;
  syncTokens: (token?: string) => void;
  isTokenValid: (token: string) => boolean;
  shouldRefreshToken: (token: string) => boolean;
  setTokenForRole: (role: UserRole, token: string) => void;
  getTokenForRole: (role: UserRole) => string | null;
  getCurrentRole: () => UserRole | null;
}

/**
 * Centralized authentication state synchronization manager
 * Handles synchronization between Zustand store, localStorage, and cookies
 */
export class AuthSync implements AuthSyncManager {
  private static instance: AuthSync;
  private refreshPromise: Promise<void> | null = null;
  private isLoggingIn: boolean = false;
  private loginCompletedAt: number | null = null;
  private logoutCompletedAt: number | null = null;
  private currentRole: UserRole | null = null;

  static getInstance(): AuthSync {
    if (!AuthSync.instance) {
      AuthSync.instance = new AuthSync();
    }
    return AuthSync.instance;
  }

  /**
   * Set token for specific role
   * @CODE:AUTH-001-SET-TOKEN | Chain: SPEC-AUTH-001 -> CODE-AUTH-001
   * @CODE:AUTH-004-INTEGRATE | Uses dual storage strategy
   */
  async setTokenForRole(role: UserRole, token: string): Promise<void> {
    console.log(`🔑 [AUTH-SYNC] Setting token for role: ${role}`);

    if (typeof window !== 'undefined') {
      // Use new dual storage mechanism
      const { storeToken } = await import('./storage');
      storeToken(role, token);
      this.currentRole = role;
    }
  }

  /**
   * Get token for specific role
   * @CODE:AUTH-001-GET-TOKEN | Chain: SPEC-AUTH-001 -> CODE-AUTH-001
   * @CODE:AUTH-004-INTEGRATE | Uses token detection with validation
   */
  async getTokenForRole(role: UserRole): Promise<string | null> {
    if (typeof window === 'undefined') return null;

    // Use new token detection logic
    const { detectToken } = await import('./token-detector');
    return detectToken(role);
  }

  /**
   * Get current role
   * @CODE:AUTH-001-CURRENT-ROLE | Chain: SPEC-AUTH-001 -> CODE-AUTH-001
   */
  getCurrentRole(): UserRole | null {
    return this.currentRole;
  }

  /**
   * Synchronize user state across all authentication stores
   */
  syncUserState(user: User | null): void {
    console.log('🔄 [AUTH-SYNC] Syncing user state:', user ? { id: user.id, email: user.email, role: user.role } : null);
    console.log('🔄 [AUTH-SYNC] CRITICAL DEBUG - syncUserState called during login?', {
      isLoggingIn: this.isLoggingIn,
      loginCompletedAt: this.loginCompletedAt,
      logoutCompletedAt: this.logoutCompletedAt,
      currentToken: typeof window !== 'undefined' ? localStorage.getItem('token')?.substring(0, 20) + '...' : 'N/A'
    });

    // Update Zustand store
    const { setUser } = useStore.getState();
    setUser(user);

    // If user is null, clear all auth state
    if (!user) {
      this.clearAllAuthState();
    }
  }

  /**
   * Start login process - prevents concurrent refresh operations
   */
  startLogin(): void {
    console.log('🔒 [AUTH-SYNC] Starting login process');
    this.isLoggingIn = true;
  }

  /**
   * End login process - allows refresh operations to resume
   */
  endLogin(): void {
    console.log('🔓 [AUTH-SYNC] Login process completed');
    this.isLoggingIn = false;
    this.loginCompletedAt = Date.now();
  }

  /**
   * Clear all authentication state from all storage locations
   * @CODE:AUTH-001-CLEAR-ALL | Chain: SPEC-AUTH-001 -> CODE-AUTH-001
   * @CODE:AUTH-004-INTEGRATE | Uses centralized clearAllTokens function
   */
  async clearAllAuthState(skipServerSideCleanup = false): Promise<void> {
    console.log('🗑️ [AUTH-SYNC] Clearing all auth state for ALL roles', skipServerSideCleanup ? '(skipping server-side cleanup)' : '');

    // CRITICAL FIX: Only track logout completion if this is NOT called during login process
    // During login, skipServerSideCleanup=true, so we don't want to reset logout protection
    if (!skipServerSideCleanup) {
      this.logoutCompletedAt = Date.now();
      console.log('🚪 [AUTH-SYNC] Logout protection activated');
    } else {
      console.log('🔄 [AUTH-SYNC] Clearing state during login - preserving logout protection');
    }

    try {
      // Use centralized clearAllTokens function
      const { clearAllTokens, clearCookies } = await import('./storage');
      clearAllTokens();

      // Reset current role
      this.currentRole = null;

      // Clear client-side cookies
      if (typeof document !== 'undefined') {
        clearCookies();
        this.clearAllCookies(); // Keep existing cookie clearing for redundancy
      }

      // Clear cookies by making logout request (only if not skipping server-side cleanup)
      if (!skipServerSideCleanup && typeof fetch !== 'undefined') {
        fetch('/api/auth/logout', { method: 'POST' }).catch(err =>
          console.warn('Failed to clear server-side session:', err)
        );
      }

      console.log('✅ [AUTH-SYNC] All auth state cleared');
    } catch (error) {
      console.error('❌ [AUTH-SYNC] Error clearing auth state:', error);
    }
  }

  /**
   * Clear all cookies with multiple strategies
   * @CODE:AUTH-001-CLEAR-COOKIES | Chain: SPEC-AUTH-001 -> CODE-AUTH-001
   */
  private clearAllCookies(): void {
    if (typeof document === 'undefined') return;

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

    console.log('🍪 [AUTH-SYNC] Client-side cookies cleared with multiple strategies');
  }

  /**
   * Refresh authentication state from server
   */
  async refreshAuthState(): Promise<void> {
    // Skip refresh if login is in progress to prevent race conditions
    if (this.isLoggingIn) {
      console.log('🔄 [AUTH-SYNC] Skipping refresh - login in progress');
      return;
    }

    // CRITICAL FIX: Prevent refresh immediately after login to avoid token contamination
    // The login process sets the correct token, so we should trust it and not refresh immediately
    if (this.loginCompletedAt && Date.now() - this.loginCompletedAt < 10000) {
      console.log('🔄 [AUTH-SYNC] Skipping refresh - preventing token contamination after login (10s delay)');
      return;
    }

    // CRITICAL FIX: Also skip refresh after logout to prevent auto re-login from stale cookies
    if (this.logoutCompletedAt && Date.now() - this.logoutCompletedAt < 15000) {
      console.log('🔄 [AUTH-SYNC] Skipping refresh - logout recently completed (preventing auto re-login)');
      return;
    }

    // Prevent multiple simultaneous refresh calls
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this._performRefresh();
    try {
      await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async _performRefresh(): Promise<void> {
    console.log('🔄 [AUTH-SYNC] Refreshing auth state from server');

    try {
      // Check if server has signaled auth reset via middleware
      if (typeof document !== 'undefined') {
        const authReset = document.querySelector('meta[name="x-auth-reset"]')?.getAttribute('content');
        if (authReset === 'true') {
          console.log('🔄 [AUTH-SYNC] Server signaled auth reset, clearing all state');
          this.clearAllAuthState();
          return;
        }
      }

      // @CODE:AUTH-004-INTEGRATE | Chain: SPEC-AUTH-004 -> CODE-AUTH-004-INTEGRATE
      // Use new token detection logic with role-based priority
      let token: string | null = null;

      // Try to detect token for current role first
      if (this.currentRole) {
        const { detectToken } = await import('./token-detector');
        token = detectToken(this.currentRole);
        console.log('🔄 [AUTH-SYNC] Token detection for role:', this.currentRole, token ? 'found' : 'not found');
      }

      // Fallback to legacy key if no role is set
      if (!token && typeof window !== 'undefined') {
        token = localStorage.getItem('token');
        console.log('🔄 [AUTH-SYNC] Fallback to legacy token:', token ? 'found' : 'not found');
      }

      // CRITICAL DEBUG: Log full token details to track cross-contamination
      console.log('🔍 [AUTH-SYNC] DETAILED token analysis:', {
        hasLocalStorageToken: !!token,
        tokenPreview: token ? token.substring(0, 20) + '...' : 'none',
        tokenSuffix: token ? '...' + token.substring(token.length - 10) : 'none',
        fullTokenLength: token ? token.length : 0,
        timestamp: new Date().toISOString(),
        cookies: typeof document !== 'undefined' ? document.cookie.split(';').filter(c => c.includes('auth-token')) : 'N/A'
      });

      // CRITICAL DEBUG: Try to decode token to see which user it belongs to
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          console.log('🔍 [AUTH-SYNC] DECODED TOKEN DATA:', {
            userId: payload.userId,
            email: payload.email,
            role: payload.role,
            exp: payload.exp,
            tokenAge: payload.exp ? (payload.exp - Math.floor(Date.now() / 1000)) + ' seconds until expiry' : 'no expiry'
          });
        } catch (decodeError) {
          console.error('🔍 [AUTH-SYNC] Failed to decode token:', decodeError);
        }
      }

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      // Include Authorization header if token exists
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log('🔍 [AUTH-SYNC] Using localStorage token in Authorization header');
      }

      // CRITICAL FIX: 쿠키 기반 인증 완전 차단 - Authorization 헤더만 사용
      const fetchOptions: RequestInit = {
        headers,
        credentials: 'omit'  // 쿠키를 완전히 무시
      };

      // localStorage 토큰이 없으면 인증 실패로 처리
      if (!token) {
        console.log('🚫 [AUTH-SYNC] No localStorage token - cookies disabled, clearing auth state');
        this.syncUserState(null);
        return;
      }

      console.log('🔍 [AUTH-SYNC] Using ONLY localStorage token - cookies completely disabled');

      const response = await fetch('/api/auth/me', fetchOptions);

      // Check if middleware has signaled auth reset
      const authResetHeader = response.headers.get('X-Auth-Reset');
      if (authResetHeader === 'true') {
        console.log('🔄 [AUTH-SYNC] Server signaled auth reset via response header, clearing all state');
        this.clearAllAuthState();
        return;
      }

      if (response.ok) {
        const data = await response.json();

        // Transform API response to User format if needed
        const user: User | null = data.user ? {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          role: data.user.role,
          association_id: data.user.association_id,
          school: data.user.school,
          position: data.user.position,
          phone: data.user.phone,
          isAdmin: data.user.isAdmin,
          isVerified: data.user.isVerified,
          created_at: data.user.createdAt || data.user.created_at,
          updated_at: data.user.updatedAt || data.user.updated_at,
          last_login: data.user.lastLogin || data.user.last_login
        } : null;

        this.syncUserState(user);
        console.log('✅ [AUTH-SYNC] Auth state refreshed successfully');
      } else {
        // Check if this is a JWT format issue that can be ignored
        if (response.status === 401) {
          try {
            const errorData = await response.json();
            // If it's a JWT format/issuer error, don't clear user state
            // The user was successfully authenticated, just has old token format
            if (errorData.error && (
              errorData.error.includes('missing required') ||
              errorData.error.includes('iss') ||
              errorData.error.includes('issuer') ||
              errorData.error.includes('audience')
            )) {
              console.log('⚠️ [AUTH-SYNC] JWT format issue detected, keeping user state');
              return;
            }
          } catch (parseError) {
            // If we can't parse the error, fall through to clearing state
          }
        }

        console.log('⚠️ [AUTH-SYNC] Authentication failed, clearing auth state');
        this.syncUserState(null);
      }
    } catch (error) {
      console.error('❌ [AUTH-SYNC] Failed to refresh auth state:', error);
      this.syncUserState(null);
    }
  }

  /**
   * Synchronize tokens between localStorage and cookies
   */
  syncTokens(token?: string): void {
    if (token) {
      console.log('🔄 [AUTH-SYNC] Syncing new token to localStorage');
      localStorage.setItem('token', token);
    } else {
      console.log('🗑️ [AUTH-SYNC] Removing token from localStorage');
      localStorage.removeItem('token');
    }
  }

  /**
   * Check if token is valid (not expired)
   */
  isTokenValid(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp > currentTime;
    } catch {
      return false;
    }
  }

  /**
   * Check if token should be refreshed (expires within 5 minutes)
   */
  shouldRefreshToken(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      const fiveMinutes = 5 * 60;
      return payload.exp - currentTime < fiveMinutes;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const authSync = AuthSync.getInstance();

/**
 * Hook for reactive authentication state synchronization
 */
export function useAuthSync() {
  const user = useStore(state => state.user);
  const setUser = useStore(state => state.setUser);
  const logout = useStore(state => state.logout);

  const syncUser = (newUser: User | null) => {
    authSync.syncUserState(newUser);
  };

  const clearAuth = (skipServerSideCleanup = false) => {
    authSync.clearAllAuthState(skipServerSideCleanup);
    logout();
  };

  const refreshAuth = () => {
    return authSync.refreshAuthState();
  };

  return {
    user,
    syncUser,
    clearAuth,
    refreshAuth,
    setUser,
    isAuthenticated: !!user,
  };
}