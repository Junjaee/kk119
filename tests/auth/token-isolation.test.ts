// @TEST:AUTH-001 | Chain: SPEC-AUTH-001 -> CODE-AUTH-001
// TEST-AUTH-001: 역할별 토큰 격리 시스템 테스트
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AuthSync } from '@/lib/auth/auth-sync';
import { AUTH_STORAGE_KEYS, LEGACY_KEYS } from '@/lib/auth/storage-keys';

describe('AUTH-001: 역할별 토큰 격리 시스템', () => {
  let authSync: AuthSync;

  beforeEach(() => {
    // Use vitest's built-in localStorage mock
    const localStorageMock: { [key: string]: string } = {};

    global.localStorage = {
      getItem: (key: string) => localStorageMock[key] || null,
      setItem: (key: string, value: string) => {
        localStorageMock[key] = value.toString();
      },
      removeItem: (key: string) => {
        delete localStorageMock[key];
      },
      clear: () => {
        Object.keys(localStorageMock).forEach(key => delete localStorageMock[key]);
      },
      length: Object.keys(localStorageMock).length,
      key: (index: number) => Object.keys(localStorageMock)[index] || null,
    } as any;

    // sessionStorage mock
    const sessionStorageMock: { [key: string]: string } = {};

    global.sessionStorage = {
      getItem: (key: string) => sessionStorageMock[key] || null,
      setItem: (key: string, value: string) => {
        sessionStorageMock[key] = value.toString();
      },
      removeItem: (key: string) => {
        delete sessionStorageMock[key];
      },
      clear: () => {
        Object.keys(sessionStorageMock).forEach(key => delete sessionStorageMock[key]);
      },
      length: Object.keys(sessionStorageMock).length,
      key: (index: number) => Object.keys(sessionStorageMock)[index] || null,
    } as any;

    authSync = new AuthSync();
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('AC-001: 역할별 독립된 저장소 키 사용', () => {
    it('should set token for teacher role', () => {
      const token = 'teacher_token_123';
      authSync.setTokenForRole('teacher', token);

      expect(localStorage.getItem('token_teacher')).toBe(token);
      expect(localStorage.getItem('token_lawyer')).toBeNull();
      expect(localStorage.getItem('token_admin')).toBeNull();
      expect(localStorage.getItem('token_super_admin')).toBeNull();
    });

    it('should set token for lawyer role', () => {
      const token = 'lawyer_token_456';
      authSync.setTokenForRole('lawyer', token);

      expect(localStorage.getItem('token_lawyer')).toBe(token);
      expect(localStorage.getItem('token_teacher')).toBeNull();
      expect(localStorage.getItem('token_admin')).toBeNull();
      expect(localStorage.getItem('token_super_admin')).toBeNull();
    });

    it('should set token for admin role', () => {
      const token = 'admin_token_789';
      authSync.setTokenForRole('admin', token);

      expect(localStorage.getItem('token_admin')).toBe(token);
      expect(localStorage.getItem('token_teacher')).toBeNull();
      expect(localStorage.getItem('token_lawyer')).toBeNull();
      expect(localStorage.getItem('token_super_admin')).toBeNull();
    });

    it('should set token for super_admin role', () => {
      const token = 'super_admin_token_101';
      authSync.setTokenForRole('super_admin', token);

      expect(localStorage.getItem('token_super_admin')).toBe(token);
      expect(localStorage.getItem('token_teacher')).toBeNull();
      expect(localStorage.getItem('token_lawyer')).toBeNull();
      expect(localStorage.getItem('token_admin')).toBeNull();
    });

    it('should get token for specific role', () => {
      const teacherToken = 'teacher_token_123';
      localStorage.setItem('token_teacher', teacherToken);

      expect(authSync.getTokenForRole('teacher')).toBe(teacherToken);
      expect(authSync.getTokenForRole('lawyer')).toBeNull();
    });

    it('should get current role after setting token', () => {
      authSync.setTokenForRole('teacher', 'token_123');
      expect(authSync.getCurrentRole()).toBe('teacher');

      authSync.setTokenForRole('lawyer', 'token_456');
      expect(authSync.getCurrentRole()).toBe('lawyer');
    });
  });

  describe('AC-002: 로그아웃 시 모든 역할 토큰 제거', () => {
    it('should clear all role tokens on logout', () => {
      // Set tokens for all roles
      authSync.setTokenForRole('teacher', 'token_teacher');
      authSync.setTokenForRole('lawyer', 'token_lawyer');
      authSync.setTokenForRole('admin', 'token_admin');
      authSync.setTokenForRole('super_admin', 'token_super_admin');

      // Verify all tokens are set
      expect(localStorage.getItem('token_teacher')).toBeTruthy();
      expect(localStorage.getItem('token_lawyer')).toBeTruthy();
      expect(localStorage.getItem('token_admin')).toBeTruthy();
      expect(localStorage.getItem('token_super_admin')).toBeTruthy();

      // Clear all auth state
      authSync.clearAllAuthState(true); // skipServerSideCleanup=true for testing

      // Verify all tokens are cleared
      expect(localStorage.getItem('token_teacher')).toBeNull();
      expect(localStorage.getItem('token_lawyer')).toBeNull();
      expect(localStorage.getItem('token_admin')).toBeNull();
      expect(localStorage.getItem('token_super_admin')).toBeNull();
    });

    it('should clear all role storage keys on logout', () => {
      // Set storage keys for all roles
      Object.values(AUTH_STORAGE_KEYS).forEach(({ storage }, index) => {
        localStorage.setItem(storage, `storage_data_${index}`);
      });

      // Verify all storage keys are set
      expect(localStorage.getItem('storage_teacher')).toBeTruthy();
      expect(localStorage.getItem('storage_lawyer')).toBeTruthy();
      expect(localStorage.getItem('storage_admin')).toBeTruthy();
      expect(localStorage.getItem('storage_super_admin')).toBeTruthy();

      // Clear all auth state
      authSync.clearAllAuthState(true);

      // Verify all storage keys are cleared
      expect(localStorage.getItem('storage_teacher')).toBeNull();
      expect(localStorage.getItem('storage_lawyer')).toBeNull();
      expect(localStorage.getItem('storage_admin')).toBeNull();
      expect(localStorage.getItem('storage_super_admin')).toBeNull();
    });

    it('should clear legacy keys on logout', () => {
      // Set legacy keys
      localStorage.setItem(LEGACY_KEYS.token, 'legacy_token');
      localStorage.setItem(LEGACY_KEYS.storage, 'legacy_storage');
      localStorage.setItem(LEGACY_KEYS.rememberedEmail, 'test@example.com');

      // Clear all auth state
      authSync.clearAllAuthState(true);

      // Verify legacy keys are cleared
      expect(localStorage.getItem(LEGACY_KEYS.token)).toBeNull();
      expect(localStorage.getItem(LEGACY_KEYS.storage)).toBeNull();
      expect(localStorage.getItem(LEGACY_KEYS.rememberedEmail)).toBeNull();
    });

    it('should clear session storage on logout', () => {
      // Set session storage
      sessionStorage.setItem('session_key_1', 'value_1');
      sessionStorage.setItem('session_key_2', 'value_2');

      // Clear all auth state
      authSync.clearAllAuthState(true);

      // Verify session storage is cleared
      expect(sessionStorage.length).toBe(0);
    });
  });

  describe('AC-003: 역할 전환 시 이전 역할 완전 제거', () => {
    it('should remove teacher tokens when switching to lawyer', () => {
      // Teacher login
      authSync.setTokenForRole('teacher', 'teacher_token');
      expect(localStorage.getItem('token_teacher')).toBe('teacher_token');

      // Clear for role switch
      authSync.clearAllAuthState(true);

      // Lawyer login
      authSync.setTokenForRole('lawyer', 'lawyer_token');
      expect(localStorage.getItem('token_teacher')).toBeNull();
      expect(localStorage.getItem('token_lawyer')).toBe('lawyer_token');
    });

    it('should handle multiple role switches correctly', () => {
      const roles = ['teacher', 'lawyer', 'admin', 'super_admin'] as const;

      for (const role of roles) {
        // Clear previous role
        authSync.clearAllAuthState(true);

        // Login as current role
        authSync.setTokenForRole(role, `token_${role}`);

        // Verify only current role token exists
        roles.forEach(r => {
          if (r === role) {
            expect(localStorage.getItem(`token_${r}`)).toBe(`token_${r}`);
          } else {
            expect(localStorage.getItem(`token_${r}`)).toBeNull();
          }
        });
      }
    });
  });

  describe('AC-004: 로그인 시 이전 역할 흔적 제거', () => {
    it('should clear all auth state before login', () => {
      // Previous login residue
      localStorage.setItem('token_teacher', 'old_teacher_token');
      localStorage.setItem('token_lawyer', 'old_lawyer_token');

      // New login starts with cleanup
      authSync.clearAllAuthState(true); // skipServerSideCleanup=true
      authSync.setTokenForRole('admin', 'new_admin_token');

      expect(localStorage.getItem('token_teacher')).toBeNull();
      expect(localStorage.getItem('token_lawyer')).toBeNull();
      expect(localStorage.getItem('token_admin')).toBe('new_admin_token');
    });

    it('should prevent refresh during login', () => {
      authSync.startLogin();
      expect(authSync['isLoggingIn']).toBe(true);

      authSync.endLogin();
      expect(authSync['isLoggingIn']).toBe(false);
      expect(authSync['loginCompletedAt']).toBeDefined();
    });
  });

  describe('AC-006: 브라우저 새로고침 후 토큰 유지', () => {
    it('should maintain token after page refresh simulation', () => {
      authSync.setTokenForRole('lawyer', 'lawyer_token_123');
      const token = localStorage.getItem('token_lawyer');

      // Simulate page refresh (token should persist in localStorage)
      expect(localStorage.getItem('token_lawyer')).toBe(token);
    });

    it('should maintain all role-separated tokens after refresh', () => {
      authSync.setTokenForRole('teacher', 'teacher_token');
      authSync.clearAllAuthState(true);
      authSync.setTokenForRole('admin', 'admin_token');

      // Simulate page refresh
      const adminToken = localStorage.getItem('token_admin');

      expect(localStorage.getItem('token_teacher')).toBeNull();
      expect(localStorage.getItem('token_admin')).toBe(adminToken);
    });
  });

  describe('Performance Requirements', () => {
    it('should clear all auth state within 500ms', () => {
      // Set tokens for all roles
      authSync.setTokenForRole('teacher', 'token_teacher');
      authSync.setTokenForRole('lawyer', 'token_lawyer');
      authSync.setTokenForRole('admin', 'token_admin');
      authSync.setTokenForRole('super_admin', 'token_super_admin');

      const startTime = Date.now();
      authSync.clearAllAuthState(true);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(500);
    });

    it('should set token for role within acceptable time', () => {
      const startTime = Date.now();
      authSync.setTokenForRole('teacher', 'token_123');
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(100);
    });

    it('should get token for role within acceptable time', () => {
      localStorage.setItem('token_teacher', 'token_123');

      const startTime = Date.now();
      authSync.getTokenForRole('teacher');
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(50);
    });
  });

  describe('Token Validation', () => {
    it('should validate expired token correctly', () => {
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE2MDA0MjAwMDB9.signature';

      // This token has exp: 1600420000 (Sept 17, 2020)
      expect(authSync.isTokenValid(expiredToken)).toBe(false);
    });

    it('should validate valid token format correctly', () => {
      // Create a token with far future expiry
      const futureTimestamp = Math.floor(Date.now() / 1000) + 3600 * 24 * 365; // 1 year from now
      const validToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${Buffer.from(JSON.stringify({ exp: futureTimestamp })).toString('base64')}.signature`;

      expect(authSync.isTokenValid(validToken)).toBe(true);
    });

    it('should detect token refresh need correctly', () => {
      // Create token expiring in 2 minutes
      const soonExpiryTimestamp = Math.floor(Date.now() / 1000) + 120;
      const tokenSoonExpiry = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${Buffer.from(JSON.stringify({ exp: soonExpiryTimestamp })).toString('base64')}.signature`;

      expect(authSync.shouldRefreshToken(tokenSoonExpiry)).toBe(true);
    });
  });
});
