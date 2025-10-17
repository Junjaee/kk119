---
id: AUTH-003
version: 0.0.1
status: draft
created: 2025-10-17
updated: 2025-10-17
---

# SPEC-AUTH-003 수락 기준 (Acceptance Criteria)

## 개요

본 문서는 SPEC-AUTH-003 "클라이언트 상태 동기화 개선"의 상세한 수락 기준을 정의합니다. 모든 시나리오는 Given-When-Then 형식으로 작성되었습니다.

---

## AC-001: 타이밍 지연 제거

### Given-When-Then

**Given**: 사용자가 로그인 또는 로그아웃을 완료하고,
**When**: 페이지를 새로고침하거나 API를 호출하면,
**Then**: 10초/15초 타이밍 지연 없이 즉시 상태가 반영되어야 한다.

### 검증 기준

1. **로그인 후 즉시 상태 동기화**
   ```typescript
   await login('teacher@example.com', 'password');

   // 즉시 사용자 상태 확인 (10초 대기 없음)
   expect(useStore.getState().user?.role).toBe('teacher');

   // 즉시 API 요청 가능 (10초 대기 없음)
   const response = await fetch('/api/reports');
   expect(response.status).toBe(200);
   ```

2. **로그아웃 후 즉시 상태 초기화**
   ```typescript
   await logout();

   // 즉시 사용자 상태 null (15초 대기 없음)
   expect(useStore.getState().user).toBeNull();

   // 즉시 재로그인 가능 (15초 대기 없음)
   await login('lawyer@example.com', 'password');
   expect(useStore.getState().user?.role).toBe('lawyer');
   ```

3. **타이밍 기반 로직 완전 제거**
   ```typescript
   // auth-sync.ts에서 타이밍 기반 로직 검색 시 0건
   const authSyncCode = fs.readFileSync('lib/auth/auth-sync.ts', 'utf-8');
   expect(authSyncCode).not.toContain('loginCompletedAt');
   expect(authSyncCode).not.toContain('logoutCompletedAt');
   expect(authSyncCode).not.toContain('< 10000'); // 10초
   expect(authSyncCode).not.toContain('< 15000'); // 15초
   ```

### 테스트 시나리오

```typescript
describe('AC-001: 타이밍 지연 제거', () => {
  test('로그인 후 즉시 상태 동기화 (10초 지연 없음)', async () => {
    const startTime = Date.now();

    await login('teacher@example.com', 'password');

    // 사용자 상태 확인
    expect(useStore.getState().user?.role).toBe('teacher');

    const elapsedTime = Date.now() - startTime;
    // 1초 이내에 완료되어야 함 (10초 지연 없음)
    expect(elapsedTime).toBeLessThan(1000);
  });

  test('로그아웃 후 즉시 재로그인 가능 (15초 지연 없음)', async () => {
    await login('teacher@example.com', 'password');
    await logout();

    // 즉시 재로그인 시도
    const startTime = Date.now();
    await login('lawyer@example.com', 'password');

    expect(useStore.getState().user?.role).toBe('lawyer');

    const elapsedTime = Date.now() - startTime;
    // 1초 이내에 완료되어야 함 (15초 지연 없음)
    expect(elapsedTime).toBeLessThan(1000);
  });
});
```

---

## AC-002: 명시적 프로세스 상태 관리

### Given-When-Then

**Given**: 로그인 또는 로그아웃 프로세스가 진행 중이고,
**When**: 자동 새로고침이나 다른 인증 작업이 시도되면,
**Then**: 명시적 플래그(`isLoggingIn`, `isLoggingOut`)를 확인하여 중복 작업을 차단해야 한다.

### 검증 기준

1. **로그인 진행 중 자동 새로고침 차단**
   ```typescript
   authSync.startLogin();
   expect(authSync.isLoggingIn).toBe(true);

   // 자동 새로고침 시도
   await authSync.refreshAuthState();

   // refreshAuthState는 즉시 반환되어야 함 (실제 새로고침 안 함)
   // 테스트: /api/auth/me 호출 횟수 0회
   ```

2. **로그아웃 진행 중 API 요청 차단**
   ```typescript
   authSync.startLogout();
   expect(authSync.isLoggingOut).toBe(true);

   // API 요청 시도
   await authSync.refreshAuthState();

   // refreshAuthState는 즉시 반환되어야 함
   ```

3. **프로세스 완료 후 플래그 리셋**
   ```typescript
   authSync.startLogin();
   expect(authSync.isLoggingIn).toBe(true);

   authSync.endLogin();
   expect(authSync.isLoggingIn).toBe(false);
   ```

### 테스트 시나리오

```typescript
describe('AC-002: 명시적 프로세스 상태 관리', () => {
  test('로그인 진행 중 refreshAuthState 차단', async () => {
    authSync.startLogin();

    // Spy on fetch to ensure /api/auth/me is not called
    const fetchSpy = jest.spyOn(global, 'fetch');

    await authSync.refreshAuthState();

    // fetch should not have been called
    expect(fetchSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/me'),
      expect.anything()
    );

    authSync.endLogin();
  });

  test('로그아웃 진행 중 refreshAuthState 차단', async () => {
    authSync.startLogout();

    const fetchSpy = jest.spyOn(global, 'fetch');

    await authSync.refreshAuthState();

    expect(fetchSpy).not.toHaveBeenCalled();

    authSync.endLogout();
  });

  test('프로세스 완료 후 플래그 리셋', () => {
    authSync.startLogin();
    expect(authSync.isLoggingIn).toBe(true);

    authSync.endLogin();
    expect(authSync.isLoggingIn).toBe(false);

    authSync.startLogout();
    expect(authSync.isLoggingOut).toBe(true);

    authSync.endLogout();
    expect(authSync.isLoggingOut).toBe(false);
  });
});
```

---

## AC-003: 역할 전환 시 전체 리셋

### Given-When-Then

**Given**: 사용자가 A 역할로 로그인된 상태이고,
**When**: 로그아웃 후 B 역할로 로그인하면,
**Then**: Zustand 스토어와 메모리 내 인증 상태가 완전히 초기화되어야 한다.

### 검증 기준

1. **Zustand 스토어 초기화**
   ```typescript
   // Teacher 로그인
   await login('teacher@example.com', 'password');
   expect(useStore.getState().user?.role).toBe('teacher');

   // 로그아웃
   await logout();
   expect(useStore.getState().user).toBeNull();

   // Lawyer 로그인
   await login('lawyer@example.com', 'password');
   expect(useStore.getState().user?.role).toBe('lawyer');

   // Teacher 상태 완전 제거 확인
   const storeState = useStore.getState();
   expect(Object.values(storeState)).not.toContain('teacher');
   ```

2. **메모리 내 인증 상태 리셋**
   ```typescript
   // Teacher 로그인
   await login('teacher@example.com', 'password');
   expect(authSync.getCurrentRole()).toBe('teacher');

   // 로그아웃 → 역할 null
   await logout();
   expect(authSync.getCurrentRole()).toBeNull();

   // Lawyer 로그인 → 새 역할
   await login('lawyer@example.com', 'password');
   expect(authSync.getCurrentRole()).toBe('lawyer');
   ```

### 테스트 시나리오

```typescript
describe('AC-003: 역할 전환 시 전체 리셋', () => {
  test('Teacher → Lawyer 전환 시 Zustand 스토어 완전 초기화', async () => {
    await login('teacher@example.com', 'password');
    expect(useStore.getState().user?.role).toBe('teacher');

    await logout();
    expect(useStore.getState().user).toBeNull();

    await login('lawyer@example.com', 'password');
    expect(useStore.getState().user?.role).toBe('lawyer');

    // Teacher 잔존 확인 (JSON 직렬화 후 검색)
    const storeJSON = JSON.stringify(useStore.getState());
    expect(storeJSON).not.toContain('teacher');
  });

  test('역할 전환 시 currentRole 리셋', async () => {
    await login('admin@example.com', 'password');
    expect(authSync.getCurrentRole()).toBe('admin');

    await logout();
    expect(authSync.getCurrentRole()).toBeNull();

    await login('teacher@example.com', 'password');
    expect(authSync.getCurrentRole()).toBe('teacher');
  });
});
```

---

## AC-004: 브라우저 탭 간 동기화

### Given-When-Then

**Given**: 두 개의 브라우저 탭이 열려 있고 동일한 사용자로 로그인된 상태이고,
**When**: 첫 번째 탭에서 로그아웃하면,
**Then**: 두 번째 탭에서도 자동으로 로그아웃 처리되어야 한다.

### 검증 기준

1. **로그아웃 브로드캐스트**
   ```typescript
   // Tab 1: 로그아웃
   TabSyncManager.getInstance().broadcastLogout();

   // localStorage에서 모든 토큰 제거 확인
   Object.values(AUTH_STORAGE_KEYS).forEach(({ token }) => {
     expect(localStorage.getItem(token)).toBeNull();
   });
   ```

2. **다른 탭에서 storage 이벤트 감지**
   ```typescript
   // Tab 2: storage 이벤트 리스너
   const storageListener = jest.fn();
   window.addEventListener('storage', storageListener);

   // Tab 1: 로그아웃
   localStorage.removeItem('token_teacher');

   // Tab 2: storage 이벤트 발생 확인
   await waitFor(() => {
     expect(storageListener).toHaveBeenCalled();
   });

   // Tab 2: 자동 로그아웃 확인
   expect(useStore.getState().user).toBeNull();
   ```

### 테스트 시나리오

```typescript
describe('AC-004: 브라우저 탭 간 동기화', () => {
  test('한 탭에서 로그아웃 → 다른 탭 자동 로그아웃', async () => {
    // Simulate two tabs
    const tab1AuthSync = AuthSync.getInstance();
    const tab2AuthSync = AuthSync.getInstance();

    // Tab 1 & Tab 2: Login
    await login('teacher@example.com', 'password');

    // Tab 2: Listen for storage events
    TabSyncManager.getInstance().init(tab2AuthSync);

    // Tab 1: Logout
    await tab1AuthSync.clearAllAuthState();
    TabSyncManager.getInstance().broadcastLogout();

    // Tab 2: Should detect logout and clear state
    await waitFor(() => {
      expect(useStore.getState().user).toBeNull();
    });
  });

  test('broadcastLogout() 호출 시 모든 토큰 제거', () => {
    // Set tokens for all roles
    Object.entries(AUTH_STORAGE_KEYS).forEach(([role, { token }]) => {
      localStorage.setItem(token, `test_token_${role}`);
    });

    // Broadcast logout
    TabSyncManager.getInstance().broadcastLogout();

    // All tokens should be removed
    Object.values(AUTH_STORAGE_KEYS).forEach(({ token }) => {
      expect(localStorage.getItem(token)).toBeNull();
    });
  });
});
```

---

## AC-005: 빠른 로그인/로그아웃 전환

### Given-When-Then

**Given**: 사용자가 로그인된 상태이고,
**When**: 빠르게 로그아웃 후 다른 역할로 재로그인하면,
**Then**: race condition 없이 새 역할의 토큰만 남아있어야 한다.

### 검증 기준

1. **빠른 전환 시나리오**
   ```typescript
   // Teacher 로그인
   await login('teacher@example.com', 'password');
   expect(useStore.getState().user?.role).toBe('teacher');

   // 즉시 로그아웃 (타이밍 지연 없음)
   await logout();

   // 즉시 Lawyer 로그인 (타이밍 지연 없음)
   await login('lawyer@example.com', 'password');
   expect(useStore.getState().user?.role).toBe('lawyer');

   // Teacher 토큰 미존재 확인
   expect(localStorage.getItem('token_teacher')).toBeNull();
   expect(localStorage.getItem('token_lawyer')).toBeTruthy();
   ```

2. **race condition 방지**
   ```typescript
   // 동시에 로그인 시도 (race condition 테스트)
   authSync.startLogin();

   // 두 번째 로그인 시도 → 차단되어야 함
   await expect(login('lawyer@example.com', 'password')).rejects.toThrow();

   authSync.endLogin();
   ```

### 테스트 시나리오

```typescript
describe('AC-005: 빠른 로그인/로그아웃 전환', () => {
  test('Teacher → 로그아웃 → Lawyer 빠른 전환', async () => {
    await login('teacher@example.com', 'password');
    await logout();
    await login('lawyer@example.com', 'password');

    // Lawyer 토큰만 존재
    expect(localStorage.getItem('token_lawyer')).toBeTruthy();
    expect(localStorage.getItem('token_teacher')).toBeNull();
  });

  test('4개 역할 순환 전환 (race condition 없음)', async () => {
    const roles = ['teacher', 'lawyer', 'admin', 'super_admin'];

    for (const role of roles) {
      await login(`${role}@example.com`, 'password');
      expect(useStore.getState().user?.role).toBe(role);

      await logout();
      expect(useStore.getState().user).toBeNull();
    }
  });

  test('로그인 진행 중 중복 로그인 차단', async () => {
    authSync.startLogin();

    // 중복 로그인 시도
    await expect(login('lawyer@example.com', 'password')).rejects.toThrow(
      'Login already in progress'
    );

    authSync.endLogin();
  });
});
```

---

## AC-006: 에러 발생 시 프로세스 플래그 리셋

### Given-When-Then

**Given**: 로그인 또는 로그아웃 프로세스가 진행 중이고,
**When**: 예외가 발생하면,
**Then**: 프로세스 플래그가 안전하게 리셋되어야 한다.

### 검증 기준

1. **로그인 에러 시 플래그 리셋**
   ```typescript
   try {
     authSync.startLogin();
     // 로그인 API 실패 시뮬레이션
     throw new Error('Login failed');
   } catch (error) {
     authSync.endLogin();
   }

   // 플래그 리셋 확인
   expect(authSync.isLoggingIn).toBe(false);
   ```

2. **로그아웃 에러 시 플래그 리셋**
   ```typescript
   try {
     authSync.startLogout();
     // 로그아웃 실패 시뮬레이션
     throw new Error('Logout failed');
   } catch (error) {
     authSync.endLogout();
   }

   expect(authSync.isLoggingOut).toBe(false);
   ```

### 테스트 시나리오

```typescript
describe('AC-006: 에러 발생 시 프로세스 플래그 리셋', () => {
  test('로그인 에러 시 isLoggingIn 플래그 리셋', async () => {
    authSync.startLogin();
    expect(authSync.isLoggingIn).toBe(true);

    // 로그인 실패 시뮬레이션
    try {
      throw new Error('Network error');
    } catch (error) {
      authSync.endLogin();
    }

    expect(authSync.isLoggingIn).toBe(false);
  });

  test('로그아웃 에러 시 isLoggingOut 플래그 리셋', async () => {
    authSync.startLogout();
    expect(authSync.isLoggingOut).toBe(true);

    try {
      throw new Error('Server error');
    } catch (error) {
      authSync.endLogout();
    }

    expect(authSync.isLoggingOut).toBe(false);
  });
});
```

---

## 완료 조건 (Definition of Done)

### 기능 완료
- [ ] AC-001: 타이밍 지연 제거 - 통과
- [ ] AC-002: 명시적 프로세스 상태 관리 - 통과
- [ ] AC-003: 역할 전환 시 전체 리셋 - 통과
- [ ] AC-004: 브라우저 탭 간 동기화 - 통과
- [ ] AC-005: 빠른 로그인/로그아웃 전환 - 통과
- [ ] AC-006: 에러 발생 시 프로세스 플래그 리셋 - 통과

### 품질 게이트
- [ ] 단위 테스트 커버리지 ≥ 90%
- [ ] 통합 테스트 모두 통과
- [ ] E2E 테스트 모두 통과
- [ ] TypeScript 타입 에러 0건
- [ ] ESLint 에러 0건

### 성능 기준
- [ ] 상태 동기화 시간 < 200ms
- [ ] 탭 간 동기화 지연 < 500ms
- [ ] 메모리 누수 0건

### UX 기준
- [ ] 로그인 후 페이지 이동 지연: 0초
- [ ] 로그아웃 후 페이지 이동 지연: 0초
- [ ] 역할 전환 시 이전 UI 잔존: 0건

### 문서화
- [ ] AuthSync 클래스 JSDoc 주석 업데이트
- [ ] TabSyncManager API 문서 작성
- [ ] 상태 동기화 가이드 문서 작성

### 코드 리뷰
- [ ] 2명 이상의 리뷰어 승인
- [ ] 모든 리뷰 코멘트 해결
- [ ] SPEC 문서와 코드 일치 확인

---

**작성자**: @spec-builder
**최종 수정일**: 2025-10-17
