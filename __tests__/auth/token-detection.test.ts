// @TEST:AUTH-004-001 | Chain: SPEC-AUTH-004 -> CODE-AUTH-004-DETECT -> TEST-AUTH-004-001
// Test token detection with role-based priority

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { detectToken, isValidToken } from '@/lib/auth/token-detector';
import { UserRole } from '@/lib/auth/storage-keys';

describe('SPEC-AUTH-004: 토큰 감지 시스템', () => {
  beforeEach(() => {
    localStorage.clear();
    // Mock cookies
    Object.defineProperty(global, 'document', {
      value: { cookie: '' },
      writable: true,
      configurable: true,
    });
  });

  describe('TC-1: Role-specific token priority', () => {
    it('역할별 키에서 토큰을 우선 감지해야 한다 (TEST-AUTH-004-001)', () => {
      // Given: role-specific token exists (valid JWT format)
      const futureTime = Math.floor(Date.now() / 1000) + 3600;
      const payload = btoa(JSON.stringify({ exp: futureTime, role: 'teacher' }));
      const teacherToken = `header.${payload}.signature`;
      localStorage.setItem('token_teacher', teacherToken);

      // When: detecting token for teacher role
      const detected = detectToken('teacher');

      // Then: should return role-specific token
      expect(detected).toBe(teacherToken);
    });

    it('역할별 키가 없으면 legacy 키를 확인해야 한다 (TEST-AUTH-004-002)', () => {
      // Given: only legacy token exists (valid JWT format)
      const futureTime = Math.floor(Date.now() / 1000) + 3600;
      const payload = btoa(JSON.stringify({ exp: futureTime, role: 'lawyer' }));
      const legacyToken = `header.${payload}.signature`;
      localStorage.setItem('token', legacyToken);

      // When: detecting token for lawyer role
      const detected = detectToken('lawyer');

      // Then: should return legacy token
      expect(detected).toBe(legacyToken);
    });

    it('role-specific 토큰이 있으면 legacy 토큰을 무시해야 한다 (TEST-AUTH-004-003)', () => {
      // Given: both role-specific and legacy tokens exist (valid JWT format, different values)
      const futureTime = Math.floor(Date.now() / 1000) + 3600;
      const adminPayload = btoa(JSON.stringify({ exp: futureTime, role: 'admin', userId: 1 }));
      const legacyPayload = btoa(JSON.stringify({ exp: futureTime, role: 'admin', userId: 999 })); // Different userId

      const adminToken = `header.${adminPayload}.signature-admin`;
      const legacyToken = `header.${legacyPayload}.signature-legacy`;
      localStorage.setItem('token_admin', adminToken);
      localStorage.setItem('token', legacyToken);

      // When: detecting token for admin role
      const detected = detectToken('admin');

      // Then: should prioritize role-specific token
      expect(detected).toBe(adminToken);
      expect(detected).not.toBe(legacyToken);
    });
  });

  describe('TC-2: Token validation', () => {
    it('유효한 JWT 토큰을 검증해야 한다 (TEST-AUTH-004-004)', () => {
      // Given: valid JWT token (not expired)
      const futureTime = Math.floor(Date.now() / 1000) + 3600; // +1 hour
      const payload = btoa(JSON.stringify({ exp: futureTime, role: 'teacher' }));
      const validToken = `header.${payload}.signature`;

      // When: validating token
      const isValid = isValidToken(validToken);

      // Then: should return true
      expect(isValid).toBe(true);
    });

    it('만료된 JWT 토큰을 거부해야 한다 (TEST-AUTH-004-005)', () => {
      // Given: expired JWT token
      const pastTime = Math.floor(Date.now() / 1000) - 3600; // -1 hour
      const payload = btoa(JSON.stringify({ exp: pastTime, role: 'teacher' }));
      const expiredToken = `header.${payload}.signature`;

      // When: validating token
      const isValid = isValidToken(expiredToken);

      // Then: should return false
      expect(isValid).toBe(false);
    });

    it('잘못된 형식의 토큰을 거부해야 한다 (TEST-AUTH-004-006)', () => {
      // Given: invalid token format
      const invalidToken = 'not-a-jwt-token';

      // When: validating token
      const isValid = isValidToken(invalidToken);

      // Then: should return false
      expect(isValid).toBe(false);
    });

    it('빈 토큰을 거부해야 한다 (TEST-AUTH-004-007)', () => {
      // Given: empty token
      const emptyToken = '';

      // When: validating token
      const isValid = isValidToken(emptyToken);

      // Then: should return false
      expect(isValid).toBe(false);
    });
  });

  describe('TC-3: Legacy token migration', () => {
    it('legacy 토큰을 감지하면 역할별 키로 자동 마이그레이션해야 한다 (TEST-AUTH-004-008)', () => {
      // Given: only legacy token exists
      const futureTime = Math.floor(Date.now() / 1000) + 3600;
      const payload = btoa(JSON.stringify({ exp: futureTime, role: 'lawyer' }));
      const legacyToken = `header.${payload}.signature`;
      localStorage.setItem('token', legacyToken);

      // When: detecting token for lawyer role
      const detected = detectToken('lawyer');

      // Then: should migrate to role-specific key
      expect(detected).toBe(legacyToken);
      expect(localStorage.getItem('token_lawyer')).toBe(legacyToken);
    });

    it('유효하지 않은 legacy 토큰은 마이그레이션하지 않아야 한다 (TEST-AUTH-004-009)', () => {
      // Given: invalid legacy token
      const invalidToken = 'invalid-token';
      localStorage.setItem('token', invalidToken);

      // When: detecting token for super_admin role
      const detected = detectToken('super_admin');

      // Then: should not migrate invalid token
      expect(detected).toBeNull();
      expect(localStorage.getItem('token_super_admin')).toBeNull();
    });
  });

  describe('TC-4: No token scenario', () => {
    it('토큰이 없으면 null을 반환해야 한다 (TEST-AUTH-004-010)', () => {
      // Given: no tokens in storage
      // When: detecting token
      const detected = detectToken('teacher');

      // Then: should return null
      expect(detected).toBeNull();
    });
  });

  describe('TC-5: Performance requirements', () => {
    it('토큰 감지는 50ms 이내에 완료되어야 한다 (TEST-AUTH-004-011)', () => {
      // Given: role-specific token
      const futureTime = Math.floor(Date.now() / 1000) + 3600;
      const payload = btoa(JSON.stringify({ exp: futureTime, role: 'admin' }));
      const token = `header.${payload}.signature`;
      localStorage.setItem('token_admin', token);

      // When: measuring detection time
      const startTime = performance.now();
      const detected = detectToken('admin');
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Then: should complete within 50ms
      expect(detected).toBe(token);
      expect(duration).toBeLessThan(50);
    });

    it('토큰 검증은 200ms 이내에 완료되어야 한다 (TEST-AUTH-004-012)', () => {
      // Given: valid token
      const futureTime = Math.floor(Date.now() / 1000) + 3600;
      const payload = btoa(JSON.stringify({ exp: futureTime, role: 'teacher' }));
      const token = `header.${payload}.signature`;

      // When: measuring validation time
      const startTime = performance.now();
      const isValid = isValidToken(token);
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Then: should complete within 200ms
      expect(isValid).toBe(true);
      expect(duration).toBeLessThan(200);
    });
  });

  describe('TC-6: Multiple roles handling', () => {
    it('각 역할에 대해 독립적으로 토큰을 감지해야 한다', () => {
      // Given: multiple role tokens
      const futureTime = Math.floor(Date.now() / 1000) + 3600;
      const teacherPayload = btoa(JSON.stringify({ exp: futureTime, role: 'teacher' }));
      const lawyerPayload = btoa(JSON.stringify({ exp: futureTime, role: 'lawyer' }));

      const teacherToken = `header.${teacherPayload}.signature`;
      const lawyerToken = `header.${lawyerPayload}.signature`;

      localStorage.setItem('token_teacher', teacherToken);
      localStorage.setItem('token_lawyer', lawyerToken);

      // When: detecting tokens for different roles
      const detectedTeacher = detectToken('teacher');
      const detectedLawyer = detectToken('lawyer');

      // Then: should return correct token for each role
      expect(detectedTeacher).toBe(teacherToken);
      expect(detectedLawyer).toBe(lawyerToken);
    });
  });
});
