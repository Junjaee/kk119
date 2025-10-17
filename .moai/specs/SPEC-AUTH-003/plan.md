---
id: AUTH-003
version: 0.0.1
status: draft
created: 2025-10-17
updated: 2025-10-17
---

# SPEC-AUTH-003 구현 계획

## 목표

auth-sync.ts의 타이밍 문제를 해결하고, 10초/15초 지연을 제거하며, 브라우저 탭 간 동기화를 구현하여 사용자 경험을 개선한다.

---

## 우선순위별 마일스톤

### 1차 목표: 타이밍 지연 로직 제거

**우선순위**: Critical

**목표**:
- auth-sync.ts의 10초/15초 타이밍 지연 로직 완전 제거
- race condition 방지를 위한 대체 메커니즘 구현

**현재 문제 코드**:
```typescript
// ❌ 제거할 코드
if (this.loginCompletedAt && Date.now() - this.loginCompletedAt < 10000) {
  console.log('Skipping refresh - preventing token contamination after login (10s delay)');
  return;
}

if (this.logoutCompletedAt && Date.now() - this.logoutCompletedAt < 15000) {
  console.log('Skipping refresh - logout recently completed (preventing auto re-login)');
  return;
}
```

**개선 방향**:
```typescript
// ✅ 개선된 코드 (타이밍 지연 없이 명시적 플래그 사용)
if (this.isLoggingIn) {
  console.log('Skipping refresh - login in progress');
  return;
}

if (this.isLoggingOut) {
  console.log('Skipping refresh - logout in progress');
  return;
}
```

**산출물**:
- `lib/auth/auth-sync.ts` 수정
- `loginCompletedAt`, `logoutCompletedAt` 타임스탬프 제거
- 타이밍 기반 로직 완전 제거

**의존성**:
- 없음 (독립적으로 진행 가능)

---

### 2차 목표: 명시적 프로세스 상태 관리

**우선순위**: Critical

**목표**:
- 로그인/로그아웃 프로세스의 시작/완료 상태를 명시적으로 관리
- 프로세스 진행 중 다른 인증 작업 차단

**산출물**:
- `startLogin()`, `endLogin()` 메서드 구현
- `startLogout()`, `endLogout()` 메서드 구현
- `isLoggingIn`, `isLoggingOut` 플래그 추가

**기술적 접근**:
```typescript
export class AuthSync {
  private isLoggingIn: boolean = false;
  private isLoggingOut: boolean = false;

  startLogin(): void {
    this.isLoggingIn = true;
  }

  endLogin(): void {
    this.isLoggingIn = false;
  }

  startLogout(): void {
    this.isLoggingOut = true;
  }

  endLogout(): void {
    this.isLoggingOut = false;
  }

  async refreshAuthState(): Promise<void> {
    // Block if login/logout in progress
    if (this.isLoggingIn || this.isLoggingOut) {
      return;
    }
    // ... rest of logic
  }
}
```

**의존성**:
- 1차 목표 완료 후 진행

---

### 3차 목표: 로그인 플로우 통합

**우선순위**: High

**목표**:
- 로그인 페이지에서 명시적 프로세스 상태 관리 적용
- 타이밍 지연 없이 즉시 상태 동기화

**산출물**:
- `app/login/page.tsx` 수정

**기술적 접근**:
```typescript
const handleLogin = async (email, password) => {
  try {
    authSync.startLogin();
    authSync.clearAllAuthState(true);

    const response = await fetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    // Immediately save token and sync state (NO TIMING DELAY)
    authSync.setTokenForRole(data.user.role, data.token);
    authSync.syncUserState(data.user);

    authSync.endLogin();

    router.push(getDefaultPageForRole(data.user.role));
  } catch (error) {
    authSync.endLogin();
    setError('로그인 실패');
  }
};
```

**의존성**:
- 2차 목표 완료 후 진행

---

### 4차 목표: 로그아웃 플로우 통합

**우선순위**: High

**목표**:
- 로그아웃 시 명시적 프로세스 상태 관리 적용
- 타이밍 지연 없이 즉시 상태 초기화

**산출물**:
- `lib/hooks/useAuth.ts` 수정

**기술적 접근**:
```typescript
const handleLogout = async () => {
  try {
    authSync.startLogout();

    // Immediately clear all auth state (NO TIMING DELAY)
    authSync.clearAllAuthState(false);
    useStore.getState().logout();

    authSync.endLogout();

    router.push('/login');
  } catch (error) {
    authSync.endLogout();
    console.error('Logout failed:', error);
  }
};
```

**의존성**:
- 2차 목표 완료 후 진행

---

### 5차 목표: 브라우저 탭 간 동기화 구현

**우선순위**: Medium

**목표**:
- localStorage 변경 이벤트를 감지하여 탭 간 동기화
- 한 탭에서 로그아웃 시 모든 탭에서 자동 로그아웃

**산출물**:
- `lib/auth/tab-sync.ts` 신규 생성
- `TabSyncManager` 클래스 구현

**기술적 접근**:
```typescript
export class TabSyncManager {
  private static instance: TabSyncManager;

  static getInstance(): TabSyncManager {
    if (!TabSyncManager.instance) {
      TabSyncManager.instance = new TabSyncManager();
    }
    return TabSyncManager.instance;
  }

  init(authSync: AuthSync): void {
    window.addEventListener('storage', (event) => {
      // Token removed in another tab → logout in this tab
      if (event.key?.startsWith('token_') && event.newValue === null) {
        console.log('[TAB-SYNC] Token removed, logging out');
        authSync.clearAllAuthState();
        authSync.syncUserState(null);
      }
    });
  }

  broadcastLogout(): void {
    // Remove all tokens to trigger storage event
    Object.values(AUTH_STORAGE_KEYS).forEach(({ token }) => {
      localStorage.removeItem(token);
    });
  }
}
```

**통합 위치**:
- `app/layout.tsx` 또는 `components/auth/auth-provider.tsx`에서 초기화

```typescript
// app/layout.tsx
useEffect(() => {
  TabSyncManager.getInstance().init(authSync);
}, []);
```

**의존성**:
- 2차 목표 완료 후 진행

---

### 6차 목표: Zustand persist 동기화 개선

**우선순위**: Low (선택)

**목표**:
- Zustand persist 저장 완료를 확인 후 리다이렉트
- 새로고침 시 상태 손실 방지

**산출물**:
- `lib/store/index.ts` 수정

**기술적 접근**:
```typescript
export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      logout: () => set({ user: null }),
    }),
    {
      name: 'kyokwon119-storage',
      onRehydrateStorage: () => (state) => {
        console.log('Zustand rehydrated:', state);
        // Verify state consistency
        if (state?.user) {
          authSync.syncUserState(state.user);
        }
      },
    }
  )
);
```

**의존성**:
- 3차, 4차 목표 완료 후 진행

---

## 기술적 설계 방향

### 아키텍처 원칙

1. **명시적 상태 관리 (Explicit State Management)**
   - 타이밍 기반 로직(10초/15초) 대신 명시적 플래그(`isLoggingIn`, `isLoggingOut`) 사용
   - 프로세스의 시작/진행/완료를 명확히 구분

2. **즉시성 (Immediacy)**
   - 로그인/로그아웃 완료 즉시 상태 동기화 (타이밍 지연 없음)
   - 사용자 경험 개선

3. **동기화 (Synchronization)**
   - 브라우저 탭 간 상태 동기화
   - localStorage 이벤트 기반 실시간 동기화

### 에러 처리 전략

1. **프로세스 진행 중 에러**
   ```typescript
   try {
     authSync.startLogin();
     // ... login logic
     authSync.endLogin();
   } catch (error) {
     // Ensure process flag is reset
     authSync.endLogin();
     authSync.clearAllAuthState();
   }
   ```

2. **탭 동기화 실패**
   - storage 이벤트가 지원되지 않는 브라우저에서는 탭 동기화 생략
   - 에러 발생 시 로그만 기록하고 현재 탭 동작은 정상 수행

---

## 리스크 및 대응 방안

### 리스크 1: 타이밍 지연 제거로 인한 새로운 race condition

**발생 확률**: 중간

**영향도**: 높음

**대응 방안**:
1. **명시적 플래그 사용**
   - `isLoggingIn`, `isLoggingOut` 플래그로 프로세스 중복 차단
2. **Promise 기반 동기화**
   - `refreshPromise`로 중복 새로고침 차단
3. **철저한 테스트**
   - 빠른 로그인/로그아웃 전환 시나리오 테스트

### 리스크 2: 브라우저 호환성 (storage 이벤트)

**발생 확률**: 낮음

**영향도**: 낮음

**대응 방안**:
- storage 이벤트 지원 여부 확인
- 미지원 브라우저에서는 탭 동기화 생략 (현재 탭 동작은 정상)

### 리스크 3: Zustand persist 타이밍 이슈

**발생 확률**: 낮음

**영향도**: 중간

**대응 방안**:
- `onRehydrateStorage` 콜백으로 복원 확인
- 복원 실패 시 서버에서 사용자 정보 재조회

---

## 테스트 계획

### 단위 테스트

**파일**: `__tests__/auth/auth-sync-timing.test.ts`

**테스트 케이스**:
1. `startLogin()` → `isLoggingIn = true` 확인
2. `endLogin()` → `isLoggingIn = false` 확인
3. 로그인 진행 중 `refreshAuthState()` 호출 → 즉시 반환 확인
4. 로그아웃 진행 중 `refreshAuthState()` 호출 → 즉시 반환 확인

**파일**: `__tests__/auth/tab-sync.test.ts`

**테스트 케이스**:
1. localStorage 토큰 제거 → storage 이벤트 발생 → 자동 로그아웃 확인
2. `broadcastLogout()` 호출 → 모든 토큰 제거 확인

### 통합 테스트

**파일**: `__tests__/auth/login-logout-flow.test.ts`

**테스트 시나리오**:
1. 로그인 → 즉시 역할별 페이지 이동 (10초 지연 없음)
2. 로그아웃 → 즉시 로그인 페이지 이동 (15초 지연 없음)
3. 빠른 로그인/로그아웃 전환 → race condition 없음 확인

### E2E 테스트

**도구**: Playwright

**시나리오**:
1. 로그인 → 로그아웃 → 재로그인 (빠른 전환)
2. 두 개 탭 열기 → 첫 번째 탭에서 로그아웃 → 두 번째 탭 자동 로그아웃 확인
3. Teacher 로그인 → 빠르게 로그아웃 → Lawyer 로그인 → Teacher 토큰 미검출

---

## 성공 지표

### 기능 지표
- [ ] 로그인 후 즉시 상태 동기화 (10초 지연 없음)
- [ ] 로그아웃 후 즉시 상태 초기화 (15초 지연 없음)
- [ ] 탭 간 로그아웃 동기화율: 100%

### 성능 지표
- [ ] 상태 동기화 시간 < 200ms
- [ ] 탭 간 동기화 지연 < 500ms
- [ ] 메모리 누수: 0건

### UX 지표
- [ ] 로그인 후 페이지 이동 지연: 0초
- [ ] 로그아웃 후 페이지 이동 지연: 0초
- [ ] 역할 전환 시 이전 UI 잔존: 0건

---

## 배포 전 체크리스트

- [ ] 타이밍 지연 로직 완전 제거 확인 (10초/15초)
- [ ] `isLoggingIn`, `isLoggingOut` 플래그 구현 완료
- [ ] `startLogin()`, `endLogin()` 메서드 구현 완료
- [ ] `startLogout()`, `endLogout()` 메서드 구현 완료
- [ ] 로그인 플로우 통합 완료
- [ ] 로그아웃 플로우 통합 완료
- [ ] TabSyncManager 구현 완료
- [ ] storage 이벤트 리스너 등록 완료
- [ ] 단위 테스트 작성 및 통과
- [ ] 통합 테스트 작성 및 통과
- [ ] E2E 테스트 작성 및 통과
- [ ] 코드 리뷰 완료

---

## 문서화 계획

1. **개발자 문서**
   - `docs/auth/state-sync.md`: 클라이언트 상태 동기화 원칙
   - `docs/auth/tab-sync.md`: 브라우저 탭 간 동기화 가이드

2. **API 문서**
   - `AuthSync` 클래스 JSDoc 주석 업데이트
   - `TabSyncManager` API 문서 작성

3. **사용자 가이드**
   - 로그인/로그아웃 즉시 반영 안내

---

**작성자**: @spec-builder
**최종 수정일**: 2025-10-17
