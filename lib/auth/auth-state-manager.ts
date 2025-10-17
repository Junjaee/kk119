// @CODE:AUTH-003-STATE | Chain: SPEC-AUTH-003 -> CODE-AUTH-003-STATE
// Client-side authentication state management

'use client';

import { User } from '@/lib/types';
import { UserRole, AUTH_STORAGE_KEYS } from './storage-keys';

export interface AuthState {
  isLoading: boolean;
  user?: User | null;
  role?: UserRole | null;
}

type StateChangeCallback = (state: AuthState) => void;

export class AuthStateManager {
  private state: AuthState;
  private subscribers: Set<StateChangeCallback>;
  private debounceTimer: NodeJS.Timeout | null = null;
  private previousStateHash: string = '';

  constructor() {
    this.state = {
      isLoading: true,
      user: undefined,
      role: undefined
    };
    this.subscribers = new Set();
    this.setupStorageListener();
  }

  /**
   * Get current authentication state
   * @CODE:AUTH-003-GET-STATE | Chain: SPEC-AUTH-003 -> CODE-AUTH-003-GET-STATE
   */
  getAuthState(): AuthState {
    return { ...this.state };
  }

  /**
   * Set user and update state
   * @CODE:AUTH-003-SET-USER | Chain: SPEC-AUTH-003 -> CODE-AUTH-003-SET-USER
   */
  async setUser(user: User | null): Promise<void> {
    // Check if state actually changed
    const newStateHash = JSON.stringify({ user, role: user?.role || null });
    if (this.previousStateHash === newStateHash && !this.state.isLoading) {
      return; // No change, skip update
    }
    this.previousStateHash = newStateHash;

    this.state = {
      isLoading: false,
      user,
      role: user?.role || null
    };

    this.notifySubscribers();
  }

  /**
   * Update loading state
   * @CODE:AUTH-003-LOADING | Chain: SPEC-AUTH-003 -> CODE-AUTH-003-LOADING
   */
  updateLoadingState(isLoading: boolean): void {
    if (this.state.isLoading === isLoading) return;

    this.state.isLoading = isLoading;
    this.notifySubscribersDebounced();
  }

  /**
   * Subscribe to state changes
   * @CODE:AUTH-003-SUBSCRIBE | Chain: SPEC-AUTH-003 -> CODE-AUTH-003-SUBSCRIBE
   */
  subscribe(callback: StateChangeCallback): () => void {
    this.subscribers.add(callback);

    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback);
    };
  }

  /**
   * Get visible menus for role
   * @CODE:AUTH-003-MENUS | Chain: SPEC-AUTH-003 -> CODE-AUTH-003-MENUS
   */
  getVisibleMenus(role: UserRole | null): string[] {
    if (!role) return [];

    const menuMap: Record<UserRole, string[]> = {
      teacher: ['home', 'reports', 'consultation', 'profile'],
      lawyer: ['home', 'cases', 'consultation', 'profile'],
      admin: ['home', 'user-management', 'reports', 'statistics', 'consultation', 'profile'],
      super_admin: ['home', 'system-settings', 'user-management', 'reports', 'statistics', 'consultation', 'profile']
    };

    return menuMap[role] || [];
  }

  /**
   * Restore state from storage
   * @CODE:AUTH-003-RESTORE | Chain: SPEC-AUTH-003 -> CODE-AUTH-003-RESTORE
   */
  async restoreFromStorage(): Promise<void> {
    try {
      // Check for tokens in localStorage
      const roles: UserRole[] = ['teacher', 'lawyer', 'admin', 'super_admin'];

      for (const role of roles) {
        const tokenKey = AUTH_STORAGE_KEYS[role].token;
        const storageKey = AUTH_STORAGE_KEYS[role].storage;

        const token = localStorage.getItem(tokenKey);
        if (token && token !== 'invalid-token') {
          // Try to restore user data from storage
          const storageData = localStorage.getItem(storageKey);
          if (storageData && storageData !== 'invalid-json') {
            try {
              const parsed = JSON.parse(storageData);
              if (parsed.user) {
                await this.setUser(parsed.user);
                return;
              }
            } catch (e) {
              // Invalid JSON, clear it
              localStorage.removeItem(storageKey);
            }
          } else if (storageData !== 'invalid-json') {
            // Token exists but no user data, create minimal user from token
            await this.setUser({
              id: 1,
              email: `${role}@example.com`,
              name: role === 'teacher' ? '김선생' : role,
              role
            } as User);
            return;
          }
        }
      }

      // No valid auth found
      await this.setUser(null);
    } catch (error) {
      console.error('Failed to restore auth state:', error);
      await this.setUser(null);
    }
  }

  /**
   * Setup storage event listener
   * @CODE:AUTH-003-STORAGE-LISTENER | Chain: SPEC-AUTH-003 -> CODE-AUTH-003-STORAGE-LISTENER
   */
  private setupStorageListener(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('storage', async (event) => {
      // Check if the changed key is a token key
      const roles: UserRole[] = ['teacher', 'lawyer', 'admin', 'super_admin'];

      for (const role of roles) {
        const tokenKey = AUTH_STORAGE_KEYS[role].token;

        if (event.key === tokenKey) {
          if (event.newValue) {
            // Token added - someone logged in
            await this.restoreFromStorage();
          } else if (!event.newValue && event.oldValue) {
            // Token removed - someone logged out
            await this.setUser(null);
          }
          break;
        }
      }
    });
  }

  /**
   * Notify subscribers of state change
   */
  private notifySubscribers(): void {
    const currentState = this.getAuthState();
    this.subscribers.forEach(callback => {
      try {
        callback(currentState);
      } catch (error) {
        console.error('Subscriber callback error:', error);
      }
    });
  }

  /**
   * Notify subscribers with debouncing
   */
  private notifySubscribersDebounced(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.notifySubscribers();
      this.debounceTimer = null;
    }, 50); // 50ms debounce
  }
}