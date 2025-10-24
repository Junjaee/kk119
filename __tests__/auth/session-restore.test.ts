// @TEST:AUTH-004-018 | Chain: SPEC-AUTH-004 -> CODE-AUTH-004-INTEGRATE -> TEST-AUTH-004-018
// Test session restoration with token detection integration

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthSync } from '@/lib/auth/auth-sync';
import { detectToken, isValidToken } from '@/lib/auth/token-detector';
import { storeToken, clearAllTokens } from '@/lib/auth/storage';
import { UserRole } from '@/lib/auth/storage-keys';

describe('SPEC-AUTH-004: 세션 복원 통합 테스트', () => {
  let authSync: AuthSync;

  beforeEach(() => {
    authSync = AuthSync.getInstance();
    clearAllTokens();
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('TC-11: Page refresh session persistence', () => {
    it('페이지 새로고침 시 역할별 토큰으로 세션을 복원해야 한다 (TEST-AUTH-004-020)', () => {
      // Given: teacher logged in with role-specific token
      const futureTime = Math.floor(Date.now() / 1000) + 3600;
      const payload = btoa(JSON.stringify({ exp: futureTime, role: 'teacher', userId: 1 }));
      const teacherToken = `header.${payload}.signature`;

      storeToken('teacher', teacherToken);

      // When: simulating page refresh (detecting token)
      const detected = detectToken('teacher');

      // Then: should detect and restore session
      expect(detected).toBe(teacherToken);
      expect(isValidToken(detected!)).toBe(true);
    });

    it('페이지 새로고침 시 legacy 토큰으로 세션을 복원하고 마이그레이션해야 한다 (TEST-AUTH-004-021)', () => {
      // Given: user has only legacy token (old session)
      const futureTime = Math.floor(Date.now() / 1000) + 3600;
      const payload = btoa(JSON.stringify({ exp: futureTime, role: 'lawyer', userId: 2 }));
      const legacyToken = `header.${payload}.signature`;

      localStorage.setItem('token', legacyToken);

      // When: simulating page refresh for lawyer
      const detected = detectToken('lawyer');

      // Then: should restore from legacy and migrate
      expect(detected).toBe(legacyToken);
      expect(localStorage.getItem('token_lawyer')).toBe(legacyToken);
    });

    it('페이지 새로고침 시 만료된 토큰은 복원하지 않아야 한다 (TEST-AUTH-004-022)', () => {
      // Given: expired token in storage
      const pastTime = Math.floor(Date.now() / 1000) - 3600;
      const payload = btoa(JSON.stringify({ exp: pastTime, role: 'admin', userId: 3 }));
      const expiredToken = `header.${payload}.signature`;

      localStorage.setItem('token_admin', expiredToken);

      // When: simulating page refresh
      const detected = detectToken('admin');

      // Then: should not restore expired token
      expect(detected).toBeNull();
    });
  });

  describe('TC-12: Browser restart session persistence', () => {
    it('브라우저 재시작 후 유효한 토큰으로 세션을 복원해야 한다 (TEST-AUTH-004-023)', () => {
      // Given: super_admin token stored (browser restart scenario)
      const futureTime = Math.floor(Date.now() / 1000) + 7200; // +2 hours
      const payload = btoa(JSON.stringify({ exp: futureTime, role: 'super_admin', userId: 4 }));
      const token = `header.${payload}.signature`;

      storeToken('super_admin', token);

      // Simulate browser restart (localStorage persists)
      // When: detecting token after restart
      const detected = detectToken('super_admin');

      // Then: should restore session
      expect(detected).toBe(token);
      expect(isValidToken(detected!)).toBe(true);
    });

    it('브라우저 재시작 후 토큰이 없으면 null을 반환해야 한다', () => {
      // Given: no tokens (fresh browser)
      // When: detecting token
      const detected = detectToken('teacher');

      // Then: should return null
      expect(detected).toBeNull();
    });
  });

  describe('TC-13: Role switching with session persistence', () => {
    it('역할 전환 후 새로운 역할의 토큰으로 세션을 복원해야 한다 (TEST-AUTH-004-024)', () => {
      // Given: teacher logged in
      const futureTime = Math.floor(Date.now() / 1000) + 3600;
      const teacherPayload = btoa(JSON.stringify({ exp: futureTime, role: 'teacher', userId: 1 }));
      const teacherToken = `header.${teacherPayload}.signature`;

      storeToken('teacher', teacherToken);

      // When: switching to lawyer (clear and store new token)
      clearAllTokens();
      const lawyerPayload = btoa(JSON.stringify({ exp: futureTime, role: 'lawyer', userId: 2 }));
      const lawyerToken = `header.${lawyerPayload}.signature`;
      storeToken('lawyer', lawyerToken);

      // Then: should detect lawyer token, not teacher
      expect(detectToken('teacher')).toBeNull();
      expect(detectToken('lawyer')).toBe(lawyerToken);
    });

    it('역할 전환 시 이전 역할의 토큰이 남아있지 않아야 한다', () => {
      // Given: admin logged in
      const futureTime = Math.floor(Date.now() / 1000) + 3600;
      const adminPayload = btoa(JSON.stringify({ exp: futureTime, role: 'admin', userId: 3 }));
      const adminToken = `header.${adminPayload}.signature`;

      storeToken('admin', adminToken);

      // When: logging out and switching to super_admin
      clearAllTokens();
      const superAdminPayload = btoa(JSON.stringify({ exp: futureTime, role: 'super_admin', userId: 4 }));
      const superAdminToken = `header.${superAdminPayload}.signature`;
      storeToken('super_admin', superAdminToken);

      // Then: admin token should be completely removed
      expect(localStorage.getItem('token_admin')).toBeNull();
      expect(detectToken('admin')).toBeNull();
      expect(detectToken('super_admin')).toBe(superAdminToken);
    });
  });

  describe('TC-14: Integration with AuthSync', () => {
    it('AuthSync가 토큰 감지 로직을 사용하여 세션을 복원해야 한다', async () => {
      // Given: valid teacher token
      const futureTime = Math.floor(Date.now() / 1000) + 3600;
      const payload = btoa(JSON.stringify({ exp: futureTime, role: 'teacher', userId: 1 }));
      const teacherToken = `header.${payload}.signature`;

      await authSync.setTokenForRole('teacher', teacherToken);

      // When: retrieving token via AuthSync
      const retrieved = await authSync.getTokenForRole('teacher');

      // Then: should match stored token
      expect(retrieved).toBe(teacherToken);
    });
  });

  describe('TC-15: Performance requirements', () => {
    it('세션 복원은 500ms 이내에 완료되어야 한다 (TEST-AUTH-004-025)', () => {
      // Given: valid token stored
      const futureTime = Math.floor(Date.now() / 1000) + 3600;
      const payload = btoa(JSON.stringify({ exp: futureTime, role: 'lawyer', userId: 2 }));
      const token = `header.${payload}.signature`;

      storeToken('lawyer', token);

      // When: measuring session restoration time
      const startTime = performance.now();
      const detected = detectToken('lawyer');
      const isValid = isValidToken(detected!);
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Then: should complete within 500ms
      expect(detected).toBe(token);
      expect(isValid).toBe(true);
      expect(duration).toBeLessThan(500);
    });
  });

  describe('TC-16: Security validation', () => {
    it('손상된 JWT 토큰을 거부해야 한다', () => {
      // Given: tampered token (modified payload)
      const futureTime = Math.floor(Date.now() / 1000) + 3600;
      const validPayload = btoa(JSON.stringify({ exp: futureTime, role: 'admin', userId: 3 }));
      const tamperedToken = `header.TAMPERED-${validPayload}.signature`;

      localStorage.setItem('token_admin', tamperedToken);

      // When: detecting token
      const detected = detectToken('admin');

      // Then: should reject tampered token
      expect(isValidToken(detected!)).toBe(false);
    });

    it('역할 불일치 토큰을 거부해야 한다 (보안 강화)', () => {
      // Given: teacher token stored in lawyer key (mismatch - security issue)
      const futureTime = Math.floor(Date.now() / 1000) + 3600;
      const teacherPayload = btoa(JSON.stringify({ exp: futureTime, role: 'teacher', userId: 1 }));
      const teacherToken = `header.${teacherPayload}.signature`;

      localStorage.setItem('token_lawyer', teacherToken);

      // When: detecting token for lawyer
      const detected = detectToken('lawyer');

      // Then: should REJECT mismatched token (security improvement)
      expect(detected).toBeNull();
      // This prevents cross-role token contamination
    });
  });
});
