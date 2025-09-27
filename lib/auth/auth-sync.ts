'use client';

import { useStore } from '@/lib/store';
import { UserProfile } from '@/lib/types/user';

interface AuthSyncManager {
  syncUserState: (user: UserProfile | null) => void;
  clearAllAuthState: () => void;
  refreshAuthState: () => Promise<void>;
  syncTokens: (token?: string) => void;
  isTokenValid: (token: string) => boolean;
  shouldRefreshToken: (token: string) => boolean;
}

/**
 * Centralized authentication state synchronization manager
 * Handles synchronization between Zustand store, localStorage, and cookies
 */
export class AuthSync implements AuthSyncManager {
  private static instance: AuthSync;
  private refreshPromise: Promise<void> | null = null;

  static getInstance(): AuthSync {
    if (!AuthSync.instance) {
      AuthSync.instance = new AuthSync();
    }
    return AuthSync.instance;
  }

  /**
   * Synchronize user state across all authentication stores
   */
  syncUserState(user: UserProfile | null): void {
    console.log('🔄 [AUTH-SYNC] Syncing user state:', user ? { id: user.id, email: user.email, role: user.role } : null);

    // Update Zustand store
    const { setUser } = useStore.getState();
    setUser(user);

    // If user is null, clear all auth state
    if (!user) {
      this.clearAllAuthState();
    }
  }

  /**
   * Clear all authentication state from all storage locations
   */
  clearAllAuthState(): void {
    console.log('🗑️ [AUTH-SYNC] Clearing all auth state');

    try {
      // Clear localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('rememberedEmail');

      // Clear Zustand persist storage
      localStorage.removeItem('kyokwon119-storage');

      // Clear session storage
      sessionStorage.clear();

      // Clear cookies by making logout request
      fetch('/api/auth/logout', { method: 'POST' }).catch(err =>
        console.warn('Failed to clear server-side session:', err)
      );

      console.log('✅ [AUTH-SYNC] All auth state cleared');
    } catch (error) {
      console.error('❌ [AUTH-SYNC] Error clearing auth state:', error);
    }
  }

  /**
   * Refresh authentication state from server
   */
  async refreshAuthState(): Promise<void> {
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
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        this.syncUserState(data.user);
        console.log('✅ [AUTH-SYNC] Auth state refreshed successfully');
      } else {
        console.log('⚠️ [AUTH-SYNC] Server returned non-ok status, clearing auth state');
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

  const syncUser = (newUser: UserProfile | null) => {
    authSync.syncUserState(newUser);
  };

  const clearAuth = () => {
    authSync.clearAllAuthState();
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