---
id: AUTH-003
version: 0.0.1
status: draft
created: 2025-10-17
updated: 2025-10-17
author: @spec-builder
priority: high
category: feature
labels:
  - authentication
  - state-sync
  - client-side
  - timing-fix
depends_on:
  - AUTH-001
  - AUTH-002
---

# @SPEC:AUTH-003: 클라이언트 상태 동기화 개선

## HISTORY

### v0.0.1 (2025-10-17)
- **INITIAL**: 클라이언트 상태 동기화 개선 명세 작성
- **AUTHOR**: @spec-builder
- **SCOPE**: auth-sync.ts 타이밍 문제 해결, 10초/15초 지연 제거, 역할 전환 시 전체 리셋
- **PROBLEM**: 로그인 후 10초, 로그아웃 후 15초 지연으로 인한 race condition 및 자동 새로고침 차단 문제

---

## Environment (환경)

### 시스템 환경
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Runtime**: Node.js 18+ (Browser)
- **State Management**: Zustand (persist 미들웨어)
- **Storage**: localStorage, sessionStorage
- **Hook**: React useEffect

### 관련 파일
- `lib/auth/auth-sync.ts` (379 LOC) - 인증 상태 동기화 매니저
- `lib/store/index.ts` - Zustand 스토어
- `lib/hooks/useAuth.ts` - 인증 훅
- `components/auth/auth-provider.tsx` - 인증 컨텍스트 프로바이더
- `app/layout.tsx` - 루트 레이아웃 (AuthProvider 통합)

### 전제 조건
- SPEC-AUTH-001 구현 완료 (역할별 토큰 격리)
- SPEC-AUTH-002 구현 완료 (서버 측 역할 검증)
- Zustand persist 설정 완료
- auth-sync.ts의 기본 구조 존재

---

## Assumptions (가정)

1. **타이밍 문제 원인**: 로그인 후 10초, 로그아웃 후 15초 지연은 race condition을 피하기 위한 임시 방편이었으나 UX 저하 및 버그 원인
2. **불필요한 자동 새로고침**: 로그인/로그아웃 직후 자동 새로고침(`refreshAuthState()`)이 토큰 오염을 유발
3. **명시적 상태 관리 부족**: 로그인/로그아웃 프로세스가 명시적으로 관리되지 않아 중간 상태에서 충돌 발생
4. **브라우저 탭 간 동기화 부재**: 한 탭에서 로그아웃해도 다른 탭에서는 로그인 상태 유지
5. **Zustand persist 타이밍 이슈**: 로그인 직후 persist 저장이 완료되기 전 새로고침 시 상태 손실

---

## Requirements (요구사항)

### Ubiquitous Requirements (필수 기능)

1. **타이밍 지연 제거**
   - 시스템은 로그인 후 10초 지연을 제거하고 즉시 상태를 동기화해야 한다
   - 시스템은 로그아웃 후 15초 지연을 제거하고 즉시 상태를 초기화해야 한다
   - 시스템은 타이밍 지연 없이도 race condition을 방지해야 한다

2. **명시적 프로세스 상태 관리**
   - 시스템은 로그인 프로세스의 시작/진행/완료 상태를 명확히 구분해야 한다
   - 시스템은 로그아웃 프로세스의 시작/진행/완료 상태를 명확히 구분해야 한다
   - 시스템은 프로세스 진행 중 다른 인증 작업을 차단해야 한다

3. **역할 전환 시 전체 리셋**
   - 시스템은 역할 전환 시 Zustand 스토어를 완전히 초기화해야 한다
   - 시스템은 역할 전환 시 모든 메모리 내 인증 상태를 리셋해야 한다
   - 시스템은 역할 전환 시 이전 역할의 UI 상태를 제거해야 한다

4. **브라우저 탭 간 동기화**
   - 시스템은 localStorage 변경 이벤트를 감지하여 탭 간 동기화해야 한다
   - 시스템은 한 탭에서 로그아웃 시 모든 탭에서 로그아웃 처리해야 한다
   - 시스템은 한 탭에서 로그인 시 다른 탭은 기존 세션을 종료해야 한다

### Event-driven Requirements (이벤트 기반)

1. **로그인 프로세스**
   - WHEN 로그인 버튼 클릭 시, 시스템은 `isLoggingIn` 플래그를 true로 설정해야 한다
   - WHEN 로그인 API 성공 시, 시스템은 즉시 토큰을 저장하고 사용자 상태를 동기화해야 한다
   - WHEN 로그인 완료 시, 시스템은 `isLoggingIn` 플래그를 false로 설정하고 타임스탬프를 기록해야 한다

2. **로그아웃 프로세스**
   - WHEN 로그아웃 버튼 클릭 시, 시스템은 `isLoggingOut` 플래그를 true로 설정해야 한다
   - WHEN 로그아웃 처리 시, 시스템은 즉시 모든 저장소를 정리하고 사용자 상태를 null로 설정해야 한다
   - WHEN 로그아웃 완료 시, 시스템은 `isLoggingOut` 플래그를 false로 설정해야 한다

3. **자동 새로고침**
   - WHEN 로그인 프로세스가 진행 중이면, 시스템은 `refreshAuthState()` 호출을 무시해야 한다
   - WHEN 로그아웃 프로세스가 진행 중이면, 시스템은 `refreshAuthState()` 호출을 무시해야 한다
   - WHEN 페이지 로드 시 유효한 토큰이 있으면, 시스템은 서버에서 사용자 정보를 가져와야 한다

4. **브라우저 탭 간 동기화**
   - WHEN localStorage 변경 이벤트가 발생하면, 시스템은 다른 탭의 상태를 동기화해야 한다
   - WHEN 토큰이 제거되면, 시스템은 모든 탭에서 로그아웃 처리해야 한다

### State-driven Requirements (상태 기반)

1. **로그인 진행 중 상태**
   - WHILE 로그인 프로세스가 진행 중일 때, 시스템은 자동 새로고침을 차단해야 한다
   - WHILE 로그인 프로세스가 진행 중일 때, 시스템은 추가 로그인 시도를 차단해야 한다

2. **로그아웃 진행 중 상태**
   - WHILE 로그아웃 프로세스가 진행 중일 때, 시스템은 자동 새로고침을 차단해야 한다
   - WHILE 로그아웃 진행 중일 때, 시스템은 API 요청을 차단해야 한다

3. **동기화 중 상태**
   - WHILE 상태 동기화가 진행 중일 때, 시스템은 중복 동기화를 방지해야 한다

### Optional Features (선택 기능)

1. **자동 토큰 갱신**
   - WHERE JWT가 만료 5분 전이면, 시스템은 자동으로 토큰을 갱신할 수 있다

2. **오프라인 모드**
   - WHERE 네트워크가 끊어지면, 시스템은 오프라인 모드로 전환할 수 있다
   - WHERE 네트워크가 복구되면, 시스템은 자동으로 상태를 동기화할 수 있다

### Constraints (제약사항)

1. **성능 제약**
   - 상태 동기화 처리 시간은 200ms를 초과하지 않아야 한다
   - 브라우저 탭 간 동기화 지연은 500ms 이하여야 한다

2. **보안 제약**
   - IF 프로세스 진행 중 예외가 발생하면, 시스템은 안전하게 로그아웃 처리해야 한다

3. **코드 품질 제약**
   - auth-sync.ts는 450 LOC를 초과하지 않아야 한다
   - 순환 의존성을 생성하지 않아야 한다

---

## Technical Design (기술 설계)

### 타이밍 지연 제거 및 명시적 상태 관리

```typescript
// @CODE:AUTH-003-SYNC | SPEC: SPEC-AUTH-003.md
// lib/auth/auth-sync.ts

export class AuthSync implements AuthSyncManager {
  private isLoggingIn: boolean = false;
  private isLoggingOut: boolean = false;
  private refreshPromise: Promise<void> | null = null;

  /**
   * Start login process - blocks concurrent operations
   */
  startLogin(): void {
    console.log('🔒 [AUTH-SYNC] Starting login process');
    this.isLoggingIn = true;
  }

  /**
   * End login process - allows normal operations to resume
   */
  endLogin(): void {
    console.log('🔓 [AUTH-SYNC] Login process completed');
    this.isLoggingIn = false;
  }

  /**
   * Start logout process - blocks concurrent operations
   */
  startLogout(): void {
    console.log('🔒 [AUTH-SYNC] Starting logout process');
    this.isLoggingOut = true;
  }

  /**
   * End logout process - allows normal operations to resume
   */
  endLogout(): void {
    console.log('🔓 [AUTH-SYNC] Logout process completed');
    this.isLoggingOut = false;
  }

  /**
   * Refresh authentication state from server (NO TIMING DELAYS)
   */
  async refreshAuthState(): Promise<void> {
    // Block refresh if login/logout is in progress
    if (this.isLoggingIn) {
      console.log('🔄 [AUTH-SYNC] Skipping refresh - login in progress');
      return;
    }

    if (this.isLoggingOut) {
      console.log('🔄 [AUTH-SYNC] Skipping refresh - logout in progress');
      return;
    }

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
      const token = this.getCurrentToken();
      if (!token) {
        this.syncUserState(null);
        return;
      }

      const response = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` },
        credentials: 'omit', // Ignore cookies
      });

      if (response.ok) {
        const data = await response.json();
        this.syncUserState(data.user);
      } else {
        this.syncUserState(null);
      }
    } catch (error) {
      console.error('❌ [AUTH-SYNC] Failed to refresh auth state:', error);
      this.syncUserState(null);
    }
  }
}
```

### 브라우저 탭 간 동기화

```typescript
// @CODE:AUTH-003-TAB-SYNC | SPEC: SPEC-AUTH-003.md
// lib/auth/tab-sync.ts

export class TabSyncManager {
  private static instance: TabSyncManager;

  static getInstance(): TabSyncManager {
    if (!TabSyncManager.instance) {
      TabSyncManager.instance = new TabSyncManager();
    }
    return TabSyncManager.instance;
  }

  /**
   * Initialize cross-tab synchronization
   */
  init(authSync: AuthSync): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('storage', (event) => {
      // Token removed in another tab → logout in this tab
      if (event.key?.startsWith('token_') && event.newValue === null) {
        console.log('🔄 [TAB-SYNC] Token removed in another tab, logging out');
        authSync.clearAllAuthState();
        authSync.syncUserState(null);
      }

      // Zustand persist storage changed in another tab → sync state
      if (event.key === 'kyokwon119-storage' && event.newValue) {
        console.log('🔄 [TAB-SYNC] Zustand state changed in another tab');
        // Zustand persist will automatically rehydrate
      }
    });
  }

  /**
   * Broadcast logout to all tabs
   */
  broadcastLogout(): void {
    if (typeof window === 'undefined') return;

    // Remove all tokens to trigger storage event in other tabs
    Object.values(AUTH_STORAGE_KEYS).forEach(({ token }) => {
      localStorage.removeItem(token);
    });

    console.log('📢 [TAB-SYNC] Logout broadcasted to all tabs');
  }
}
```

### 로그인 플로우 통합

```typescript
// @CODE:AUTH-003-LOGIN | SPEC: SPEC-AUTH-003.md
// app/login/page.tsx

const handleLogin = async (email: string, password: string) => {
  try {
    // 1. Start login process (blocks concurrent operations)
    authSync.startLogin();

    // 2. Clear all previous auth state
    authSync.clearAllAuthState(true); // skipServerSideCleanup=true

    // 3. Call login API
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const data = await response.json();

    // 4. Save token for specific role (NO TIMING DELAY)
    authSync.setTokenForRole(data.user.role, data.token);

    // 5. Sync user state (NO TIMING DELAY)
    authSync.syncUserState(data.user);

    // 6. End login process
    authSync.endLogin();

    // 7. Redirect to role-specific page
    router.push(getDefaultPageForRole(data.user.role));
  } catch (error) {
    authSync.endLogin();
    console.error('Login failed:', error);
    setError('로그인에 실패했습니다.');
  }
};
```

### 로그아웃 플로우 통합

```typescript
// @CODE:AUTH-003-LOGOUT | SPEC: SPEC-AUTH-003.md
// lib/hooks/useAuth.ts

const handleLogout = async () => {
  try {
    // 1. Start logout process
    authSync.startLogout();

    // 2. Clear all auth state (NO TIMING DELAY)
    authSync.clearAllAuthState(false); // skipServerSideCleanup=false

    // 3. Broadcast logout to all tabs
    TabSyncManager.getInstance().broadcastLogout();

    // 4. Reset Zustand store
    useStore.getState().logout();

    // 5. End logout process
    authSync.endLogout();

    // 6. Redirect to login page
    router.push('/login');
  } catch (error) {
    authSync.endLogout();
    console.error('Logout failed:', error);
  }
};
```

---

## Traceability (@TAG)

- **SPEC**: @SPEC:AUTH-003
- **TEST**: `__tests__/auth/auth-sync-timing.test.ts` (예정)
- **CODE**:
  - `lib/auth/auth-sync.ts` (수정)
  - `lib/auth/tab-sync.ts` (신규)
  - `app/login/page.tsx` (수정)
  - `lib/hooks/useAuth.ts` (수정)
- **DOC**: `.moai/specs/SPEC-AUTH-003/`
- **RELATED**:
  - @SPEC:AUTH-001 (역할별 토큰 격리)
  - @SPEC:AUTH-002 (서버 측 역할 검증)

---

## Success Criteria (성공 기준)

### 기능 완성도
- [ ] 로그인 후 10초 지연 제거
- [ ] 로그아웃 후 15초 지연 제거
- [ ] 명시적 프로세스 상태 관리 (`isLoggingIn`, `isLoggingOut`)
- [ ] 역할 전환 시 Zustand 스토어 완전 초기화
- [ ] 브라우저 탭 간 로그아웃 동기화

### 품질 기준
- [ ] 테스트 커버리지 90% 이상
- [ ] auth-sync.ts LOC ≤ 450
- [ ] TypeScript 타입 안정성 100%
- [ ] 순환 의존성 없음

### 성능 기준
- [ ] 상태 동기화 시간 < 200ms
- [ ] 탭 간 동기화 지연 < 500ms
- [ ] 메모리 누수 없음

### UX 기준
- [ ] 로그인 후 즉시 역할별 페이지 이동
- [ ] 로그아웃 후 즉시 로그인 페이지 이동
- [ ] 역할 전환 시 이전 역할 UI 잔존 0건

---

## Dependencies (의존성)

### 기술 의존성
- Next.js 14 App Router
- Zustand (persist 미들웨어)
- React useEffect
- Browser Storage API

### SPEC 의존성
- **선행**:
  - @SPEC:AUTH-001 (역할별 토큰 격리)
  - @SPEC:AUTH-002 (서버 측 역할 검증)

### 선행 조건
- AuthSync 클래스 존재
- Zustand persist 설정 완료
- localStorage 접근 가능

---

## Risk Analysis (리스크 분석)

### 높은 리스크
1. **타이밍 지연 제거로 인한 새로운 race condition**: 10초/15초 지연을 제거하면 빠른 로그인/로그아웃 전환 시 충돌 가능
   - **완화**: 명시적 `isLoggingIn`, `isLoggingOut` 플래그로 프로세스 중복 차단

2. **브라우저 호환성**: 일부 브라우저에서 storage 이벤트 미지원
   - **완화**: storage 이벤트 지원 여부 확인 후 폴백 전략

### 중간 리스크
1. **Zustand persist 타이밍 이슈**: 로그인 직후 persist 저장 전 새로고침 시 상태 손실
   - **완화**: persist onRehydrateStorage 콜백으로 복원 확인

---

## Implementation Notes (구현 참고사항)

### 단계별 구현
1. **Phase 1**: 타이밍 지연 제거 (10초/15초 로직 삭제)
2. **Phase 2**: 명시적 프로세스 상태 관리 (`isLoggingIn`, `isLoggingOut`)
3. **Phase 3**: 브라우저 탭 간 동기화 (`tab-sync.ts`)
4. **Phase 4**: 로그인/로그아웃 플로우 통합
5. **Phase 5**: 테스트 작성 (단위 테스트, E2E 테스트)
6. **Phase 6**: 성능 모니터링 및 최적화

### 테스트 전략
- 타이밍 테스트: 로그인/로그아웃 후 즉시 동작 확인
- 프로세스 상태 테스트: `isLoggingIn` 플래그 동작 검증
- 탭 동기화 테스트: 한 탭에서 로그아웃 → 다른 탭 자동 로그아웃
- race condition 테스트: 빠른 로그인/로그아웃 전환 시나리오

### 코드 리뷰 포인트
- 타이밍 지연 로직 완전 제거 확인
- 프로세스 플래그 누락 없이 설정/해제 확인
- storage 이벤트 리스너 메모리 누수 확인
