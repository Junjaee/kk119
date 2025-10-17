// @TEST:AUTH-002-SERVER | Chain: SPEC-AUTH-002 -> CODE-AUTH-002 -> TEST-AUTH-002-SERVER
// Test server-side role verification system

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JWTVerifier } from '@/lib/auth/jwt-verifier';
import { AuthGuard } from '@/lib/auth/auth-guard';
import { UserRole } from '@/lib/auth/storage-keys';
import { NextRequest, NextResponse } from 'next/server';

describe('SPEC-AUTH-002: 서버 측 역할 검증 강화', () => {
  describe('JWT 토큰 검증', () => {
    let verifier: JWTVerifier;

    beforeEach(() => {
      verifier = new JWTVerifier();
    });

    it('유효한 JWT 토큰을 검증하고 페이로드를 반환해야 한다', async () => {
      // Given: 유효한 JWT 토큰
      const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidGVhY2hlckBleGFtcGxlLmNvbSIsInJvbGUiOiJ0ZWFjaGVyIiwiaWF0IjoxNzAwMDAwMDAwLCJleHAiOjk5OTk5OTk5OTl9.test';

      // When: 토큰을 검증할 때
      const result = await verifier.verify(validToken);

      // Then: 성공과 페이로드를 반환해야 함
      expect(result.valid).toBe(true);
      expect(result.payload?.role).toBe('teacher');
      expect(result.payload?.email).toBe('teacher@example.com');
    });

    it('만료된 토큰을 거부해야 한다', async () => {
      // Given: 만료된 JWT 토큰
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUiOiJ0ZWFjaGVyIiwiZXhwIjoxNjAwMDAwMDAwfQ.test';

      // When: 토큰을 검증할 때
      const result = await verifier.verify(expiredToken);

      // Then: 거부되어야 함
      expect(result.valid).toBe(false);
      expect(result.error).toContain('expired');
    });

    it('잘못된 서명의 토큰을 거부해야 한다', async () => {
      // Given: 잘못된 서명의 토큰
      const invalidToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUiOiJ0ZWFjaGVyIn0.invalid_signature';

      // When: 토큰을 검증할 때
      const result = await verifier.verify(invalidToken);

      // Then: 거부되어야 함
      expect(result.valid).toBe(false);
      expect(result.error?.toLowerCase()).toContain('invalid');
    });

    it('필수 클레임이 없는 토큰을 거부해야 한다', async () => {
      // Given: role 클레임이 없는 토큰
      const incompleteToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSJ9.test';

      // When: 토큰을 검증할 때
      const result = await verifier.verify(incompleteToken);

      // Then: 거부되어야 함
      expect(result.valid).toBe(false);
      expect(result.error).toContain('missing required claims');
    });
  });

  describe('역할 기반 접근 제어', () => {
    let authGuard: AuthGuard;

    beforeEach(() => {
      authGuard = new AuthGuard();
    });

    it('Teacher는 teacher 전용 엔드포인트에만 접근할 수 있어야 한다', async () => {
      // Given: Teacher 토큰과 엔드포인트
      const teacherToken = 'valid-teacher-token';
      const endpoints = {
        '/api/teacher/profile': true,
        '/api/teacher/reports': true,
        '/api/admin/users': false,
        '/api/lawyer/cases': false,
      };

      // When/Then: 각 엔드포인트 접근 권한 확인
      for (const [endpoint, allowed] of Object.entries(endpoints)) {
        const canAccess = await authGuard.canAccess('teacher', endpoint);
        expect(canAccess).toBe(allowed);
      }
    });

    it('Admin은 admin 전용 엔드포인트와 teacher 엔드포인트에 접근할 수 있어야 한다', async () => {
      // Given: Admin 역할
      const endpoints = {
        '/api/admin/users': true,
        '/api/admin/settings': true,
        '/api/teacher/reports': true,  // Admin은 teacher 리소스도 접근 가능
        '/api/lawyer/cases': false,     // 하지만 lawyer는 불가
        '/api/super-admin/system': false,
      };

      // When/Then: 각 엔드포인트 접근 권한 확인
      for (const [endpoint, allowed] of Object.entries(endpoints)) {
        const canAccess = await authGuard.canAccess('admin', endpoint);
        expect(canAccess).toBe(allowed);
      }
    });

    it('Super Admin은 모든 엔드포인트에 접근할 수 있어야 한다', async () => {
      // Given: Super Admin 역할
      const endpoints = [
        '/api/teacher/profile',
        '/api/lawyer/cases',
        '/api/admin/users',
        '/api/super-admin/system',
      ];

      // When/Then: 모든 엔드포인트 접근 가능
      for (const endpoint of endpoints) {
        const canAccess = await authGuard.canAccess('super_admin', endpoint);
        expect(canAccess).toBe(true);
      }
    });
  });

  describe('API Route 보호', () => {
    it('인증되지 않은 요청을 거부해야 한다', async () => {
      // Given: Authorization 헤더가 없는 요청
      const request = new NextRequest('http://localhost:3000/api/teacher/profile');

      // When: 보호된 route handler 호출
      const guard = new AuthGuard();
      const response = await guard.protect(request, ['teacher']);

      // Then: 401 응답
      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.error).toContain('No token provided');
    });

    it('잘못된 역할의 토큰을 거부해야 한다', async () => {
      // Given: Lawyer 토큰으로 Teacher 엔드포인트 접근
      const request = new NextRequest('http://localhost:3000/api/teacher/profile');
      request.headers.set('Authorization', 'Bearer lawyer-token');

      // When: Teacher 전용 route 접근 시도
      const guard = new AuthGuard();
      const response = await guard.protect(request, ['teacher']);

      // Then: 403 응답
      expect(response.status).toBe(403);
      const body = await response.json();
      expect(body.error).toContain('Insufficient permissions');
    });

    it('올바른 역할의 토큰은 허용해야 한다', async () => {
      // Given: Teacher 토큰으로 Teacher 엔드포인트 접근
      const request = new NextRequest('http://localhost:3000/api/teacher/profile');
      request.headers.set('Authorization', 'Bearer valid-teacher-token');

      // When: Teacher 전용 route 접근
      const guard = new AuthGuard();
      const response = await guard.protect(request, ['teacher']);

      // Then: 요청 허용 (null 반환)
      expect(response).toBeNull();
    });
  });

  describe('동적 역할 검증', () => {
    it('요청 시점에 역할을 재검증해야 한다', async () => {
      // Given: 캐시되지 않은 검증 시스템
      const guard = new AuthGuard();
      const token = 'valid-teacher-token';

      // When: 동일 토큰으로 연속 요청
      const result1 = await guard.verifyRole(token);
      await new Promise(resolve => setTimeout(resolve, 10)); // Small delay to ensure different timestamps
      const result2 = await guard.verifyRole(token);

      // Then: 매번 새로 검증 (캐시하지 않음)
      expect(result1.verified).toBe(true);
      expect(result2.verified).toBe(true);
      expect(result1.timestamp).not.toBe(result2.timestamp);
    });

    it('역할 변경 시 즉시 반영되어야 한다', async () => {
      // Given: Teacher → Admin으로 역할 변경된 사용자
      const guard = new AuthGuard();

      // Mock 역할 변경
      vi.spyOn(guard, 'getUserRole').mockResolvedValueOnce('teacher');
      const teacherAccess = await guard.canAccess('teacher', '/api/admin/users');
      expect(teacherAccess).toBe(false);

      // When: 역할이 Admin으로 변경됨
      vi.spyOn(guard, 'getUserRole').mockResolvedValueOnce('admin');
      const adminAccess = await guard.canAccess('admin', '/api/admin/users');

      // Then: 즉시 Admin 권한 획득
      expect(adminAccess).toBe(true);
    });
  });

  describe('보안 헤더 검증', () => {
    it('CSRF 토큰을 검증해야 한다', async () => {
      // Given: CSRF 토큰이 포함된 요청
      const request = new NextRequest('http://localhost:3000/api/admin/users', {
        method: 'POST',
      });
      request.headers.set('X-CSRF-Token', 'valid-csrf-token');

      // When: POST 요청 검증
      const guard = new AuthGuard();
      const isValid = await guard.validateCSRF(request);

      // Then: CSRF 검증 통과
      expect(isValid).toBe(true);
    });

    it('CSRF 토큰이 없는 POST 요청을 거부해야 한다', async () => {
      // Given: CSRF 토큰이 없는 POST 요청
      const request = new NextRequest('http://localhost:3000/api/admin/users', {
        method: 'POST',
      });

      // When: POST 요청 검증
      const guard = new AuthGuard();
      const isValid = await guard.validateCSRF(request);

      // Then: CSRF 검증 실패
      expect(isValid).toBe(false);
    });

    it('GET 요청은 CSRF 검증을 건너뛰어야 한다', async () => {
      // Given: GET 요청 (CSRF 토큰 불필요)
      const request = new NextRequest('http://localhost:3000/api/teacher/profile', {
        method: 'GET',
      });

      // When: GET 요청 검증
      const guard = new AuthGuard();
      const isValid = await guard.validateCSRF(request);

      // Then: CSRF 검증 건너뜀
      expect(isValid).toBe(true);
    });
  });

  describe('Rate Limiting', () => {
    it('동일 IP에서 과도한 요청을 차단해야 한다', async () => {
      // Given: Rate limiter
      const guard = new AuthGuard();
      const ip = '192.168.1.1';

      // When: 제한 초과 요청
      for (let i = 0; i < 100; i++) {
        await guard.checkRateLimit(ip);
      }

      // Then: 차단됨
      const isBlocked = await guard.isRateLimited(ip);
      expect(isBlocked).toBe(true);
    });

    it('역할별로 다른 rate limit을 적용해야 한다', async () => {
      // Given: 역할별 rate limit 설정
      const guard = new AuthGuard();

      // Super Admin: 높은 제한
      const superAdminLimit = await guard.getRateLimit('super_admin');
      expect(superAdminLimit).toBe(1000);

      // Teacher: 기본 제한
      const teacherLimit = await guard.getRateLimit('teacher');
      expect(teacherLimit).toBe(100);
    });
  });
});