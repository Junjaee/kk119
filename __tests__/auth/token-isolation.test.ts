// @TEST:AUTH-001-ISOLATION | Chain: SPEC-AUTH-001 -> CODE-AUTH-001 -> TEST-AUTH-001-ISOLATION
// Test role-based token isolation system

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthSync } from '@/lib/auth/auth-sync';
import { AUTH_STORAGE_KEYS, UserRole } from '@/lib/auth/storage-keys';

describe('SPEC-AUTH-001: 역할별 토큰 격리 시스템', () => {
  let authSync: AuthSync;

  beforeEach(() => {
    // Reset singleton instance for each test
    authSync = AuthSync.getInstance();
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('역할별 독립된 저장소 키 사용', () => {
    it('각 역할은 독립된 localStorage 키를 사용해야 한다', () => {
      // Given: 역할별 저장소 키가 정의되어 있음
      // When: 각 역할의 키를 확인할 때
      // Then: 모든 역할이 고유한 키를 가져야 함
      const roles: UserRole[] = ['teacher', 'lawyer', 'admin', 'super_admin'];
      const tokenKeys = roles.map(role => AUTH_STORAGE_KEYS[role].token);
      const storageKeys = roles.map(role => AUTH_STORAGE_KEYS[role].storage);

      // 토큰 키 중복 없음
      expect(new Set(tokenKeys).size).toBe(tokenKeys.length);
      // 저장소 키 중복 없음
      expect(new Set(storageKeys).size).toBe(storageKeys.length);

      // 각 역할의 키가 역할명을 포함해야 함
      expect(AUTH_STORAGE_KEYS.teacher.token).toBe('token_teacher');
      expect(AUTH_STORAGE_KEYS.lawyer.token).toBe('token_lawyer');
      expect(AUTH_STORAGE_KEYS.admin.token).toBe('token_admin');
      expect(AUTH_STORAGE_KEYS.super_admin.token).toBe('token_super_admin');
    });

    it('역할별 토큰을 저장하면 해당 역할의 키에만 저장되어야 한다', () => {
      // Given: Teacher 토큰
      const teacherToken = 'teacher-jwt-token-123';

      // When: Teacher 역할로 토큰을 저장할 때
      authSync.setTokenForRole('teacher', teacherToken);

      // Then: Teacher 키에만 토큰이 저장되어야 함
      expect(localStorage.getItem('token_teacher')).toBe(teacherToken);
      expect(localStorage.getItem('token_lawyer')).toBeNull();
      expect(localStorage.getItem('token_admin')).toBeNull();
      expect(localStorage.getItem('token_super_admin')).toBeNull();
    });
  });

  describe('완전한 로그아웃', () => {
    beforeEach(() => {
      // Setup: 모든 역할의 토큰과 저장소를 설정
      localStorage.setItem('token_teacher', 'teacher-token');
      localStorage.setItem('token_lawyer', 'lawyer-token');
      localStorage.setItem('token_admin', 'admin-token');
      localStorage.setItem('token_super_admin', 'super-admin-token');
      localStorage.setItem('storage_teacher', '{"data":"teacher"}');
      localStorage.setItem('storage_lawyer', '{"data":"lawyer"}');
      localStorage.setItem('kyokwon119-storage', '{"user":{"id":1}}');
      sessionStorage.setItem('temp', 'data');
    });

    it('로그아웃 시 모든 역할의 토큰을 제거해야 한다', () => {
      // Given: 모든 역할의 토큰이 저장되어 있음
      // When: 로그아웃을 실행할 때
      authSync.clearAllAuthState();

      // Then: 모든 역할의 토큰이 제거되어야 함
      expect(localStorage.getItem('token_teacher')).toBeNull();
      expect(localStorage.getItem('token_lawyer')).toBeNull();
      expect(localStorage.getItem('token_admin')).toBeNull();
      expect(localStorage.getItem('token_super_admin')).toBeNull();
    });

    it('로그아웃 시 모든 역할의 저장소를 제거해야 한다', () => {
      // Given: 모든 역할의 저장소가 존재함
      // When: 로그아웃을 실행할 때
      authSync.clearAllAuthState();

      // Then: 모든 역할의 저장소가 제거되어야 함
      expect(localStorage.getItem('storage_teacher')).toBeNull();
      expect(localStorage.getItem('storage_lawyer')).toBeNull();
      expect(localStorage.getItem('kyokwon119-storage')).toBeNull();
    });

    it('로그아웃 시 sessionStorage를 완전히 초기화해야 한다', () => {
      // Given: sessionStorage에 데이터가 있음
      // When: 로그아웃을 실행할 때
      authSync.clearAllAuthState();

      // Then: sessionStorage가 비어있어야 함
      expect(sessionStorage.length).toBe(0);
    });

    it('로그아웃 시 레거시 토큰도 제거해야 한다', () => {
      // Given: 레거시 토큰이 존재함
      localStorage.setItem('token', 'legacy-token');
      localStorage.setItem('rememberedEmail', 'test@example.com');

      // When: 로그아웃을 실행할 때
      authSync.clearAllAuthState();

      // Then: 레거시 키도 제거되어야 함
      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('rememberedEmail')).toBeNull();
    });
  });

  describe('역할 전환 프로세스', () => {
    it('Teacher 로그인 → 로그아웃 → Lawyer 로그인 시 Teacher 토큰이 남아있지 않아야 한다', () => {
      // Given: Teacher로 로그인됨
      authSync.setTokenForRole('teacher', 'teacher-token-123');
      expect(localStorage.getItem('token_teacher')).toBe('teacher-token-123');

      // When: 로그아웃 후 Lawyer로 로그인할 때
      authSync.clearAllAuthState();
      authSync.setTokenForRole('lawyer', 'lawyer-token-456');

      // Then: Teacher 토큰은 없고 Lawyer 토큰만 존재해야 함
      expect(localStorage.getItem('token_teacher')).toBeNull();
      expect(localStorage.getItem('token_lawyer')).toBe('lawyer-token-456');
      expect(localStorage.getItem('token_admin')).toBeNull();
      expect(localStorage.getItem('token_super_admin')).toBeNull();
    });

    it('역할 전환 시 이전 역할의 저장소가 완전히 제거되어야 한다', () => {
      // Given: Admin 역할로 데이터가 저장됨
      localStorage.setItem('storage_admin', '{"data":"admin-data"}');
      localStorage.setItem('kyokwon119-storage', '{"user":{"role":"admin"}}');

      // When: 로그아웃 후 Teacher로 전환할 때
      authSync.clearAllAuthState();
      authSync.setTokenForRole('teacher', 'teacher-token');

      // Then: 이전 역할의 저장소가 제거되어야 함
      expect(localStorage.getItem('storage_admin')).toBeNull();
      expect(localStorage.getItem('kyokwon119-storage')).toBeNull();
    });

    it('로그인 시 이전 역할의 모든 흔적을 제거해야 한다', () => {
      // Given: Lawyer 역할의 토큰과 데이터가 있음
      localStorage.setItem('token_lawyer', 'lawyer-token');
      localStorage.setItem('storage_lawyer', '{"data":"lawyer"}');
      localStorage.setItem('token_admin', 'admin-token');

      // When: 로그인 전 clearAllAuthState 호출
      authSync.clearAllAuthState(true); // skipServerSideCleanup=true (로그인 과정)

      // Then: 모든 토큰과 저장소가 제거되어야 함
      expect(localStorage.getItem('token_lawyer')).toBeNull();
      expect(localStorage.getItem('token_admin')).toBeNull();
      expect(localStorage.getItem('storage_lawyer')).toBeNull();
    });
  });

  describe('현재 역할의 토큰 조회', () => {
    it('현재 역할에 맞는 토큰만 반환해야 한다', () => {
      // Given: 여러 역할의 토큰이 저장되어 있음 (비정상 상태)
      localStorage.setItem('token_teacher', 'teacher-token');
      localStorage.setItem('token_lawyer', 'lawyer-token');

      // When: Teacher 역할의 토큰을 조회할 때
      const teacherToken = authSync.getTokenForRole('teacher');

      // Then: Teacher 토큰만 반환되어야 함
      expect(teacherToken).toBe('teacher-token');
    });

    it('토큰이 없는 역할은 null을 반환해야 한다', () => {
      // Given: Super Admin 토큰이 없음
      // When: Super Admin 토큰을 조회할 때
      const token = authSync.getTokenForRole('super_admin');

      // Then: null이 반환되어야 함
      expect(token).toBeNull();
    });
  });

  describe('쿠키 제거', () => {
    it('로그아웃 시 모든 도메인/경로 조합의 쿠키를 제거해야 한다', () => {
      // Given: Mock document.cookie setter
      let cookieWriteCount = 0;
      Object.defineProperty(global, 'document', {
        value: {
          cookie: '',
          get cookie() {
            return 'auth-token=test-token; session=session-id';
          },
          set cookie(value: string) {
            cookieWriteCount++;
          },
        },
        writable: true,
        configurable: true,
      });

      // When: 로그아웃을 실행할 때
      authSync.clearAllAuthState();

      // Then: 쿠키 제거 명령이 여러 전략으로 실행되어야 함
      // 최소 10가지 이상의 쿠키 제거 전략 사용 (2 cookie names × 3 domains × 5 paths × 2 strategies)
      expect(cookieWriteCount).toBeGreaterThanOrEqual(10);
    });
  });

  describe('타이밍 및 성능', () => {
    it('로그아웃 처리 시간은 500ms를 초과하지 않아야 한다', async () => {
      // Given: 모든 역할의 토큰과 데이터가 있음
      localStorage.setItem('token_teacher', 'teacher-token');
      localStorage.setItem('token_lawyer', 'lawyer-token');
      localStorage.setItem('token_admin', 'admin-token');
      localStorage.setItem('token_super_admin', 'super-admin-token');

      // When: 로그아웃 시간을 측정할 때
      const startTime = performance.now();
      authSync.clearAllAuthState();
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Then: 500ms 이하여야 함
      expect(duration).toBeLessThan(500);
    });

    it('역할 전환 처리 시간은 1초를 초과하지 않아야 한다', () => {
      // Given: Admin으로 로그인되어 있음
      authSync.setTokenForRole('admin', 'admin-token');

      // When: Teacher로 역할 전환 시간을 측정할 때
      const startTime = performance.now();
      authSync.clearAllAuthState();
      authSync.setTokenForRole('teacher', 'teacher-token');
      const endTime = performance.now();
      const duration = endTime - startTime;

      // Then: 1초 이하여야 함
      expect(duration).toBeLessThan(1000);
    });
  });

  describe('크로스 컨테미네이션 방지', () => {
    it('A 역할 로그인 → 로그아웃 → B 역할 로그인 시 A의 토큰이 남아있지 않아야 한다', () => {
      // Scenario: Teacher → Lawyer → Admin → Super Admin 순환
      const scenarios: Array<{ from: UserRole; to: UserRole }> = [
        { from: 'teacher', to: 'lawyer' },
        { from: 'lawyer', to: 'admin' },
        { from: 'admin', to: 'super_admin' },
        { from: 'super_admin', to: 'teacher' },
      ];

      scenarios.forEach(({ from, to }) => {
        // Given: from 역할로 로그인
        authSync.setTokenForRole(from, `${from}-token`);
        expect(localStorage.getItem(`token_${from}`)).toBe(`${from}-token`);

        // When: 로그아웃 후 to 역할로 로그인
        authSync.clearAllAuthState();
        authSync.setTokenForRole(to, `${to}-token`);

        // Then: from 토큰은 없고 to 토큰만 존재
        expect(localStorage.getItem(`token_${from}`)).toBeNull();
        expect(localStorage.getItem(`token_${to}`)).toBe(`${to}-token`);

        // Cleanup for next iteration
        authSync.clearAllAuthState();
      });
    });

    it('동시에 여러 역할의 토큰이 존재하지 않아야 한다', () => {
      // Given: 정상적인 로그인 프로세스
      authSync.clearAllAuthState();
      authSync.setTokenForRole('teacher', 'teacher-token');

      // When: 현재 저장된 토큰 개수를 확인할 때
      const allRoles: UserRole[] = ['teacher', 'lawyer', 'admin', 'super_admin'];
      const tokenCount = allRoles.filter(
        role => localStorage.getItem(`token_${role}`) !== null
      ).length;

      // Then: 단 하나의 토큰만 존재해야 함
      expect(tokenCount).toBe(1);
    });
  });
});
