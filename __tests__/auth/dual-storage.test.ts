// @TEST:AUTH-004-013 | Chain: SPEC-AUTH-004 -> CODE-AUTH-004-DUAL-STORE -> TEST-AUTH-004-013
// Test dual storage mechanism (role-specific + legacy)

import { describe, it, expect, beforeEach } from 'vitest';
import { storeToken, clearAllTokens } from '@/lib/auth/storage';
import { UserRole } from '@/lib/auth/storage-keys';

describe('SPEC-AUTH-004: 이중 저장 메커니즘', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('TC-7: Dual storage strategy', () => {
    it('토큰을 역할별 키와 legacy 키 모두에 저장해야 한다 (TEST-AUTH-004-013)', () => {
      // Given: teacher token
      const teacherToken = 'valid-teacher-token-12345';

      // When: storing token
      storeToken('teacher', teacherToken);

      // Then: should store in both role-specific and legacy keys
      expect(localStorage.getItem('token_teacher')).toBe(teacherToken);
      expect(localStorage.getItem('token')).toBe(teacherToken);
    });

    it('역할별 저장 시 다른 역할의 키는 영향받지 않아야 한다 (TEST-AUTH-004-014)', () => {
      // Given: lawyer token stored first
      const lawyerToken = 'valid-lawyer-token-11111';
      storeToken('lawyer', lawyerToken);

      // When: storing admin token
      const adminToken = 'valid-admin-token-22222';
      storeToken('admin', adminToken);

      // Then: lawyer token should remain unchanged in its role-specific key
      expect(localStorage.getItem('token_lawyer')).toBe(lawyerToken);
      expect(localStorage.getItem('token_admin')).toBe(adminToken);
      // Legacy key should have the latest token (admin)
      expect(localStorage.getItem('token')).toBe(adminToken);
    });

    it('모든 역할에 대해 동일한 dual storage 전략을 적용해야 한다', () => {
      // Given: all roles
      const roles: UserRole[] = ['teacher', 'lawyer', 'admin', 'super_admin'];

      // When: storing tokens for all roles
      roles.forEach(role => {
        const token = `valid-${role}-token`;
        storeToken(role, token);

        // Then: each should be stored in both keys
        expect(localStorage.getItem(`token_${role}`)).toBe(token);
        expect(localStorage.getItem('token')).toBe(token); // Last one wins
      });
    });
  });

  describe('TC-8: Complete token removal', () => {
    it('clearAllTokens는 모든 역할의 토큰을 제거해야 한다 (TEST-AUTH-004-015)', () => {
      // Given: tokens for all roles
      storeToken('teacher', 'teacher-token');
      storeToken('lawyer', 'lawyer-token');
      storeToken('admin', 'admin-token');
      storeToken('super_admin', 'super-admin-token');

      // When: clearing all tokens
      clearAllTokens();

      // Then: all role-specific tokens should be removed
      expect(localStorage.getItem('token_teacher')).toBeNull();
      expect(localStorage.getItem('token_lawyer')).toBeNull();
      expect(localStorage.getItem('token_admin')).toBeNull();
      expect(localStorage.getItem('token_super_admin')).toBeNull();
      expect(localStorage.getItem('token')).toBeNull();
    });

    it('clearAllTokens는 session storage도 초기화해야 한다 (TEST-AUTH-004-016)', () => {
      // Given: session storage with data
      sessionStorage.setItem('temp', 'data');
      storeToken('teacher', 'teacher-token');

      // When: clearing all tokens
      clearAllTokens();

      // Then: session storage should be cleared
      expect(sessionStorage.length).toBe(0);
    });
  });

  describe('TC-9: Performance requirements', () => {
    it('토큰 저장은 100ms 이내에 완료되어야 한다', () => {
      // Given: token to store
      const token = 'valid-token-12345';

      // When: measuring storage time
      const startTime = performance.now();
      storeToken('admin', token);
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Then: should complete within 100ms
      expect(duration).toBeLessThan(100);
    });

    it('토큰 제거는 500ms 이내에 완료되어야 한다 (TEST-AUTH-004-017)', () => {
      // Given: all tokens stored
      const roles: UserRole[] = ['teacher', 'lawyer', 'admin', 'super_admin'];
      roles.forEach(role => storeToken(role, `${role}-token`));

      // When: measuring clear time
      const startTime = performance.now();
      clearAllTokens();
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Then: should complete within 500ms
      expect(duration).toBeLessThan(500);
    });
  });

  describe('TC-10: Edge cases', () => {
    it('빈 토큰을 저장하려고 하면 저장하지 않아야 한다', () => {
      // Given: empty token
      const emptyToken = '';

      // When: attempting to store
      storeToken('teacher', emptyToken);

      // Then: should not store
      expect(localStorage.getItem('token_teacher')).toBeNull();
      expect(localStorage.getItem('token')).toBeNull();
    });

    it('null 토큰을 저장하려고 하면 에러 없이 무시해야 한다', () => {
      // Given: null token
      // When: attempting to store (should not throw)
      expect(() => {
        storeToken('lawyer', null as any);
      }).not.toThrow();

      // Then: should not store
      expect(localStorage.getItem('token_lawyer')).toBeNull();
    });
  });
});
