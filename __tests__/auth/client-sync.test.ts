// @TEST:AUTH-003-CLIENT | Chain: SPEC-AUTH-003 -> CODE-AUTH-003 -> TEST-AUTH-003-CLIENT
// Test client state synchronization system

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthStateManager } from '@/lib/auth/auth-state-manager';
import { UserRole } from '@/lib/auth/storage-keys';
import { User } from '@/lib/types';

describe('SPEC-AUTH-003: 클라이언트 상태 동기화 개선', () => {
  let stateManager: AuthStateManager;

  beforeEach(() => {
    stateManager = new AuthStateManager();
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  describe('로딩 상태 관리', () => {
    it('초기 로딩 중에는 인증 상태를 undefined로 유지해야 한다', () => {
      // Given: 초기 상태
      // When: 아직 로딩 중
      const state = stateManager.getAuthState();

      // Then: undefined 상태 유지
      expect(state.isLoading).toBe(true);
      expect(state.user).toBeUndefined();
      expect(state.role).toBeUndefined();
    });

    it('로딩 완료 후 실제 인증 상태를 반영해야 한다', async () => {
      // Given: 로딩 상태
      expect(stateManager.getAuthState().isLoading).toBe(true);

      // When: 로딩 완료 및 사용자 설정
      const user: User = {
        id: 1,
        email: 'teacher@example.com',
        name: '김선생',
        role: 'teacher'
      };
      await stateManager.setUser(user);

      // Then: 로딩 완료 및 사용자 반영
      const state = stateManager.getAuthState();
      expect(state.isLoading).toBe(false);
      expect(state.user).toEqual(user);
      expect(state.role).toBe('teacher');
    });

    it('로딩 실패 시 null 사용자로 설정해야 한다', async () => {
      // Given: 로딩 상태
      // When: 인증 실패
      await stateManager.setUser(null);

      // Then: null 사용자, 로딩 완료
      const state = stateManager.getAuthState();
      expect(state.isLoading).toBe(false);
      expect(state.user).toBeNull();
      expect(state.role).toBeNull();
    });
  });

  describe('상태 변경 구독', () => {
    it('상태 변경 시 구독자에게 알려야 한다', async () => {
      // Given: 구독자 등록
      const callback = vi.fn();
      stateManager.subscribe(callback);

      // When: 사용자 설정
      const user: User = {
        id: 1,
        email: 'admin@example.com',
        name: '관리자',
        role: 'admin'
      };
      await stateManager.setUser(user);

      // Then: 콜백 호출됨
      expect(callback).toHaveBeenCalledWith({
        isLoading: false,
        user,
        role: 'admin'
      });
    });

    it('구독 해제 후에는 알림을 받지 않아야 한다', async () => {
      // Given: 구독 후 해제
      const callback = vi.fn();
      const unsubscribe = stateManager.subscribe(callback);
      unsubscribe();

      // When: 상태 변경
      await stateManager.setUser(null);

      // Then: 콜백 호출되지 않음
      expect(callback).not.toHaveBeenCalled();
    });

    it('다수의 구독자를 지원해야 한다', async () => {
      // Given: 여러 구독자
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      stateManager.subscribe(callback1);
      stateManager.subscribe(callback2);

      // When: 상태 변경
      await stateManager.setUser(null);

      // Then: 모든 구독자에게 알림
      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });
  });

  describe('localStorage와 상태 동기화', () => {
    it('localStorage 변경 시 상태를 업데이트해야 한다', async () => {
      // Given: 초기 상태
      const callback = vi.fn();
      stateManager.subscribe(callback);

      // When: 다른 탭에서 localStorage 변경 (storage event)
      localStorage.setItem('token_teacher', 'new-teacher-token');
      const event = new StorageEvent('storage', {
        key: 'token_teacher',
        newValue: 'new-teacher-token',
        oldValue: null,
        storageArea: localStorage
      });
      window.dispatchEvent(event);

      // Then: 상태 업데이트됨
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(callback).toHaveBeenCalled();
    });

    it('localStorage 클리어 시 로그아웃 처리해야 한다', async () => {
      // Given: 로그인된 상태
      const user: User = {
        id: 1,
        email: 'teacher@example.com',
        name: '김선생',
        role: 'teacher'
      };
      await stateManager.setUser(user);

      // When: localStorage 클리어 이벤트
      const event = new StorageEvent('storage', {
        key: 'token_teacher',
        newValue: null,
        oldValue: 'teacher-token',
        storageArea: localStorage
      });
      window.dispatchEvent(event);

      // Then: 로그아웃 상태로 변경
      await new Promise(resolve => setTimeout(resolve, 10));
      const state = stateManager.getAuthState();
      expect(state.user).toBeNull();
      expect(state.role).toBeNull();
    });
  });

  describe('역할 전환 시 UI 업데이트', () => {
    it('역할 변경 시 즉시 UI에 반영되어야 한다', async () => {
      // Given: Teacher로 로그인
      const teacherUser: User = {
        id: 1,
        email: 'teacher@example.com',
        name: '김선생',
        role: 'teacher'
      };
      await stateManager.setUser(teacherUser);
      expect(stateManager.getAuthState().role).toBe('teacher');

      // When: Admin으로 재로그인
      const adminUser: User = {
        id: 2,
        email: 'admin@example.com',
        name: '관리자',
        role: 'admin'
      };
      await stateManager.setUser(adminUser);

      // Then: 즉시 Admin으로 변경
      expect(stateManager.getAuthState().role).toBe('admin');
      expect(stateManager.getAuthState().user?.email).toBe('admin@example.com');
    });

    it('역할별 메뉴 표시 상태를 관리해야 한다', () => {
      // Given: 각 역할별 상태 관리자

      // Teacher 메뉴
      const teacherMenus = stateManager.getVisibleMenus('teacher');
      expect(teacherMenus).toContain('reports');
      expect(teacherMenus).toContain('consultation');
      expect(teacherMenus).not.toContain('user-management');

      // Admin 메뉴
      const adminMenus = stateManager.getVisibleMenus('admin');
      expect(adminMenus).toContain('user-management');
      expect(adminMenus).toContain('statistics');
      expect(adminMenus).toContain('reports');

      // Super Admin 메뉴
      const superAdminMenus = stateManager.getVisibleMenus('super_admin');
      expect(superAdminMenus).toContain('system-settings');
      expect(superAdminMenus).toContain('user-management');
      expect(superAdminMenus).toContain('statistics');
    });
  });

  describe('페이지 새로고침 시 상태 복구', () => {
    it('새로고침 후에도 인증 상태를 유지해야 한다', async () => {
      // Given: 로그인 후 토큰 저장
      localStorage.setItem('token_teacher', 'valid-teacher-token');
      localStorage.setItem('kyokwon119-storage-teacher', JSON.stringify({
        user: {
          id: 1,
          email: 'teacher@example.com',
          name: '김선생',
          role: 'teacher'
        }
      }));

      // When: StateManager 재생성 (새로고침 시뮬레이션)
      const newStateManager = new AuthStateManager();
      await newStateManager.restoreFromStorage();

      // Then: 상태 복구됨
      const state = newStateManager.getAuthState();
      expect(state.user?.email).toBe('teacher@example.com');
      expect(state.role).toBe('teacher');
    });

    it('유효하지 않은 토큰은 복구하지 않아야 한다', async () => {
      // Given: 잘못된 데이터
      localStorage.setItem('token_teacher', 'invalid-token');
      localStorage.setItem('kyokwon119-storage-teacher', 'invalid-json');

      // When: 복구 시도
      const newStateManager = new AuthStateManager();
      await newStateManager.restoreFromStorage();

      // Then: 로그아웃 상태
      const state = newStateManager.getAuthState();
      expect(state.user).toBeNull();
      expect(state.role).toBeNull();
    });
  });

  describe('성능 최적화', () => {
    it('상태 변경을 디바운싱해야 한다', async () => {
      // Given: 구독자
      const callback = vi.fn();
      stateManager.subscribe(callback);

      // When: 연속적인 상태 변경
      for (let i = 0; i < 10; i++) {
        stateManager.updateLoadingState(i % 2 === 0);
      }

      // Then: 마지막 변경만 전달됨 (디바운싱)
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it('불필요한 재렌더링을 방지해야 한다', async () => {
      // Given: 구독자
      const callback = vi.fn();
      stateManager.subscribe(callback);

      // When: 동일한 상태로 업데이트
      const user: User = {
        id: 1,
        email: 'teacher@example.com',
        name: '김선생',
        role: 'teacher'
      };
      await stateManager.setUser(user);
      callback.mockClear();
      await stateManager.setUser(user); // 동일한 사용자

      // Then: 재렌더링 없음
      expect(callback).not.toHaveBeenCalled();
    });
  });
});