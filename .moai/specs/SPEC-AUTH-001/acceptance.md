---
id: AUTH-001
version: 0.0.1
status: draft
created: 2025-10-17
updated: 2025-10-17
---

# SPEC-AUTH-001 수락 기준 (Acceptance Criteria)

## 개요

본 문서는 SPEC-AUTH-001 "역할별 토큰 격리 시스템"의 상세한 수락 기준을 정의합니다. 모든 시나리오는 Given-When-Then 형식으로 작성되었습니다.

---

## AC-001: 역할별 독립된 저장소 키 사용

### Given-When-Then

**Given**: 4개 역할(Teacher, Lawyer, Admin, Super Admin)이 정의되어 있고,
**When**: 각 역할로 로그인하면,
**Then**: 각 역할별로 독립된 localStorage 키에 토큰이 저장되어야 한다.

### 검증 기준

1. **Teacher 로그인**
   ```typescript
   expect(localStorage.getItem('token_teacher')).toBeTruthy();
   expect(localStorage.getItem('token_lawyer')).toBeNull();
   expect(localStorage.getItem('token_admin')).toBeNull();
   expect(localStorage.getItem('token_super_admin')).toBeNull();
   ```

2. **Lawyer 로그인**
   ```typescript
   expect(localStorage.getItem('token_lawyer')).toBeTruthy();
   expect(localStorage.getItem('token_teacher')).toBeNull();
   expect(localStorage.getItem('token_admin')).toBeNull();
   expect(localStorage.getItem('token_super_admin')).toBeNull();
   ```

3. **Admin 로그인**
   ```typescript
   expect(localStorage.getItem('token_admin')).toBeTruthy();
   expect(localStorage.getItem('token_teacher')).toBeNull();
   expect(localStorage.getItem('token_lawyer')).toBeNull();
   expect(localStorage.getItem('token_super_admin')).toBeNull();
   ```

4. **Super Admin 로그인**
   ```typescript
   expect(localStorage.getItem('token_super_admin')).toBeTruthy();
   expect(localStorage.getItem('token_teacher')).toBeNull();
   expect(localStorage.getItem('token_lawyer')).toBeNull();
   expect(localStorage.getItem('token_admin')).toBeNull();
   ```

### 테스트 시나리오

```typescript
describe('AC-001: 역할별 독립된 저장소 키 사용', () => {
  test('Teacher 로그인 시 teacher 키만 사용', async () => {
    await login('teacher@example.com', 'password');
    expect(localStorage.getItem('token_teacher')).toBeTruthy();
    expect(getAllRoleTokens().filter(t => t !== null).length).toBe(1);
  });

  test('역할 전환 시 이전 역할 키는 제거됨', async () => {
    await login('teacher@example.com', 'password');
    await logout();
    await login('lawyer@example.com', 'password');
    expect(localStorage.getItem('token_teacher')).toBeNull();
    expect(localStorage.getItem('token_lawyer')).toBeTruthy();
  });
});
```

---

## AC-002: 로그아웃 시 모든 역할 토큰 제거

### Given-When-Then

**Given**: 사용자가 특정 역할로 로그인된 상태이고,
**When**: 로그아웃 버튼을 클릭하면,
**Then**: 모든 역할의 토큰과 저장소가 완전히 제거되어야 한다.

### 검증 기준

1. **모든 역할 토큰 제거**
   ```typescript
   expect(localStorage.getItem('token_teacher')).toBeNull();
   expect(localStorage.getItem('token_lawyer')).toBeNull();
   expect(localStorage.getItem('token_admin')).toBeNull();
   expect(localStorage.getItem('token_super_admin')).toBeNull();
   ```

2. **모든 역할 저장소 제거**
   ```typescript
   expect(localStorage.getItem('storage_teacher')).toBeNull();
   expect(localStorage.getItem('storage_lawyer')).toBeNull();
   expect(localStorage.getItem('storage_admin')).toBeNull();
   expect(localStorage.getItem('storage_super_admin')).toBeNull();
   ```

3. **레거시 키 제거**
   ```typescript
   expect(localStorage.getItem('token')).toBeNull();
   expect(localStorage.getItem('kyokwon119-storage')).toBeNull();
   expect(localStorage.getItem('rememberedEmail')).toBeNull();
   ```

4. **세션 저장소 초기화**
   ```typescript
   expect(sessionStorage.length).toBe(0);
   ```

5. **쿠키 제거**
   ```typescript
   expect(document.cookie).not.toContain('auth-token');
   ```

### 테스트 시나리오

```typescript
describe('AC-002: 로그아웃 시 모든 역할 토큰 제거', () => {
  test('Teacher 로그아웃 시 모든 저장소 제거', async () => {
    await login('teacher@example.com', 'password');
    await logout();

    // 모든 역할 토큰 제거 확인
    const allTokens = Object.values(AUTH_STORAGE_KEYS).map(
      ({ token }) => localStorage.getItem(token)
    );
    expect(allTokens.every(t => t === null)).toBe(true);

    // 세션 저장소 초기화 확인
    expect(sessionStorage.length).toBe(0);
  });

  test('로그아웃 후 자동 재로그인 차단 (15초)', async () => {
    await login('teacher@example.com', 'password');
    await logout();

    // 즉시 새로고침 시도
    authSync.refreshAuthState();

    // 15초 이내에는 새로고침 차단됨
    expect(useStore.getState().user).toBeNull();
  });
});
```

---

## AC-003: 역할 전환 시 이전 역할 완전 제거

### Given-When-Then

**Given**: 사용자가 A 역할로 로그인된 상태이고,
**When**: 로그아웃 후 B 역할로 로그인하면,
**Then**: A 역할의 모든 흔적(토큰, 저장소, 쿠키)이 제거되고 B 역할의 토큰만 존재해야 한다.

### 검증 기준

1. **Teacher → Lawyer 전환**
   ```typescript
   // Before
   expect(localStorage.getItem('token_teacher')).toBeTruthy();

   // After logout → login as lawyer
   expect(localStorage.getItem('token_teacher')).toBeNull();
   expect(localStorage.getItem('token_lawyer')).toBeTruthy();
   ```

2. **Admin → Super Admin 전환**
   ```typescript
   // Before
   expect(localStorage.getItem('token_admin')).toBeTruthy();

   // After logout → login as super_admin
   expect(localStorage.getItem('token_admin')).toBeNull();
   expect(localStorage.getItem('token_super_admin')).toBeTruthy();
   ```

3. **Zustand 스토어 리셋**
   ```typescript
   // Before
   expect(useStore.getState().user?.role).toBe('teacher');

   // After logout → login as lawyer
   expect(useStore.getState().user?.role).toBe('lawyer');
   ```

### 테스트 시나리오

```typescript
describe('AC-003: 역할 전환 시 이전 역할 완전 제거', () => {
  test('Teacher → Lawyer 전환 시 Teacher 토큰 미검출', async () => {
    // Teacher 로그인
    await login('teacher@example.com', 'password');
    expect(localStorage.getItem('token_teacher')).toBeTruthy();

    // 로그아웃
    await logout();

    // Lawyer 로그인
    await login('lawyer@example.com', 'password');
    expect(localStorage.getItem('token_teacher')).toBeNull();
    expect(localStorage.getItem('token_lawyer')).toBeTruthy();
  });

  test('4개 역할 순환 전환 시 현재 역할만 유지', async () => {
    const roles = ['teacher', 'lawyer', 'admin', 'super_admin'];

    for (const role of roles) {
      await login(`${role}@example.com`, 'password');

      // 현재 역할의 토큰만 존재
      const currentToken = localStorage.getItem(`token_${role}`);
      expect(currentToken).toBeTruthy();

      // 다른 역할의 토큰은 모두 null
      const otherRoles = roles.filter(r => r !== role);
      otherRoles.forEach(r => {
        expect(localStorage.getItem(`token_${r}`)).toBeNull();
      });

      await logout();
    }
  });
});
```

---

## AC-004: 로그인 시 이전 역할 흔적 제거

### Given-When-Then

**Given**: 이전 로그인 세션의 토큰이 잔존하는 상태이고,
**When**: 새로운 역할로 로그인하면,
**Then**: 로그인 프로세스가 시작되기 전에 모든 이전 역할의 흔적이 제거되어야 한다.

### 검증 기준

1. **로그인 전 자동 정리**
   ```typescript
   // 로그인 전 상태 (이전 세션 잔존)
   localStorage.setItem('token_teacher', 'old_token');

   // 로그인 시작
   await login('lawyer@example.com', 'password');

   // 이전 토큰 제거 확인
   expect(localStorage.getItem('token_teacher')).toBeNull();
   expect(localStorage.getItem('token_lawyer')).toBeTruthy();
   ```

2. **로그인 프로세스 보호**
   ```typescript
   // 로그인 시작
   authSync.startLogin();
   expect(authSync.isLoggingIn).toBe(true);

   // 로그인 중에는 자동 새로고침 차단
   authSync.refreshAuthState();
   // refreshAuthState는 즉시 반환되어야 함

   // 로그인 완료
   authSync.endLogin();
   expect(authSync.isLoggingIn).toBe(false);
   ```

### 테스트 시나리오

```typescript
describe('AC-004: 로그인 시 이전 역할 흔적 제거', () => {
  test('로그인 전 clearAllAuthState 호출', async () => {
    // 이전 세션 시뮬레이션
    localStorage.setItem('token_teacher', 'old_teacher_token');
    localStorage.setItem('token_lawyer', 'old_lawyer_token');

    // Spy on clearAllAuthState
    const clearSpy = jest.spyOn(authSync, 'clearAllAuthState');

    // 로그인
    await login('admin@example.com', 'password');

    // clearAllAuthState가 호출되었는지 확인
    expect(clearSpy).toHaveBeenCalledWith(true); // skipServerSideCleanup=true

    // 이전 토큰 제거 확인
    expect(localStorage.getItem('token_teacher')).toBeNull();
    expect(localStorage.getItem('token_lawyer')).toBeNull();
  });

  test('로그인 중 자동 새로고침 차단', async () => {
    authSync.startLogin();

    // 로그인 중에 refreshAuthState 호출 시도
    const refreshPromise = authSync.refreshAuthState();

    // Promise가 즉시 반환되어야 함 (실제 새로고침 실행 안 함)
    await expect(refreshPromise).resolves.toBeUndefined();

    authSync.endLogin();
  });
});
```

---

## AC-005: API 요청 시 역할별 토큰 사용

### Given-When-Then

**Given**: 사용자가 특정 역할로 로그인된 상태이고,
**When**: API 요청을 보내면,
**Then**: 현재 역할에 맞는 토큰만 Authorization 헤더에 포함되어야 한다.

### 검증 기준

1. **역할별 토큰 헤더 확인**
   ```typescript
   // Teacher 로그인
   await login('teacher@example.com', 'password');
   const teacherToken = localStorage.getItem('token_teacher');

   // API 요청
   const response = await fetch('/api/reports', {
     headers: { 'Authorization': `Bearer ${teacherToken}` }
   });

   // 올바른 토큰 사용 확인
   expect(response.ok).toBe(true);
   ```

2. **역할 불일치 시 자동 로그아웃**
   ```typescript
   // Teacher 로그인 후 수동으로 토큰 변경 (비정상 상황 시뮬레이션)
   await login('teacher@example.com', 'password');
   localStorage.setItem('token_teacher', 'invalid_token');

   // API 요청
   await fetch('/api/auth/me');

   // 자동 로그아웃 확인
   expect(useStore.getState().user).toBeNull();
   ```

### 테스트 시나리오

```typescript
describe('AC-005: API 요청 시 역할별 토큰 사용', () => {
  test('Teacher 로그인 시 teacher 토큰으로 API 요청', async () => {
    await login('teacher@example.com', 'password');
    const teacherToken = localStorage.getItem('token_teacher');

    // Mock fetch
    const fetchSpy = jest.spyOn(global, 'fetch');

    // API 요청
    await apiRequest('/api/reports', { method: 'GET' });

    // Authorization 헤더 확인
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': `Bearer ${teacherToken}`
        })
      })
    );
  });

  test('역할 불일치 시 자동 로그아웃', async () => {
    await login('teacher@example.com', 'password');

    // 비정상적으로 토큰 변경
    localStorage.setItem('token_teacher', 'invalid_jwt_token');

    // API 요청 시 401 에러 발생
    await expect(apiRequest('/api/auth/me')).rejects.toThrow('Unauthorized');

    // 자동 로그아웃 확인
    expect(useStore.getState().user).toBeNull();
  });
});
```

---

## AC-006: 브라우저 새로고침 후 토큰 유지

### Given-When-Then

**Given**: 사용자가 특정 역할로 로그인된 상태이고,
**When**: 브라우저를 새로고침하면,
**Then**: 현재 역할의 토큰과 사용자 상태가 유지되어야 한다.

### 검증 기준

1. **새로고침 후 토큰 유지**
   ```typescript
   await login('lawyer@example.com', 'password');
   const lawyerToken = localStorage.getItem('token_lawyer');

   // 페이지 새로고침 시뮬레이션
   window.location.reload();

   // 토큰 유지 확인
   expect(localStorage.getItem('token_lawyer')).toBe(lawyerToken);
   ```

2. **새로고침 후 사용자 상태 복원**
   ```typescript
   await login('admin@example.com', 'password');

   // 페이지 새로고침 시뮬레이션
   window.location.reload();

   // 사용자 상태 복원 확인
   expect(useStore.getState().user?.role).toBe('admin');
   ```

### 테스트 시나리오

```typescript
describe('AC-006: 브라우저 새로고침 후 토큰 유지', () => {
  test('Lawyer 로그인 후 새로고침 시 상태 유지', async () => {
    await login('lawyer@example.com', 'password');
    const originalUser = useStore.getState().user;

    // 새로고침 시뮬레이션 (Zustand persist에서 복원)
    const persistedState = localStorage.getItem('kyokwon119-storage');
    expect(persistedState).toBeTruthy();

    // 스토어 리로드
    useStore.persist.rehydrate();

    // 사용자 상태 복원 확인
    expect(useStore.getState().user?.id).toBe(originalUser?.id);
    expect(useStore.getState().user?.role).toBe('lawyer');
  });
});
```

---

## AC-007: 쿠키 완전 삭제

### Given-When-Then

**Given**: 사용자가 로그인된 상태이고 여러 쿠키가 설정되어 있으며,
**When**: 로그아웃하면,
**Then**: 모든 도메인/경로 조합의 쿠키가 제거되어야 한다.

### 검증 기준

1. **다중 전략 쿠키 삭제**
   ```typescript
   // 로그인 시 쿠키 설정
   document.cookie = 'auth-token=abc123; path=/';
   document.cookie = 'session=xyz789; path=/admin';

   // 로그아웃
   await logout();

   // 모든 쿠키 제거 확인
   expect(document.cookie).not.toContain('auth-token');
   expect(document.cookie).not.toContain('session');
   ```

### 테스트 시나리오

```typescript
describe('AC-007: 쿠키 완전 삭제', () => {
  test('로그아웃 시 모든 쿠키 제거', async () => {
    await login('teacher@example.com', 'password');

    // 쿠키 설정 시뮬레이션
    document.cookie = 'auth-token=test_token; path=/';
    document.cookie = 'session=test_session; path=/';

    // 로그아웃
    await logout();

    // 쿠키 제거 확인
    const cookies = document.cookie.split(';').map(c => c.trim());
    expect(cookies.find(c => c.startsWith('auth-token'))).toBeUndefined();
    expect(cookies.find(c => c.startsWith('session'))).toBeUndefined();
  });
});
```

---

## 완료 조건 (Definition of Done)

### 기능 완료
- [ ] AC-001: 역할별 독립된 저장소 키 사용 - 통과
- [ ] AC-002: 로그아웃 시 모든 역할 토큰 제거 - 통과
- [ ] AC-003: 역할 전환 시 이전 역할 완전 제거 - 통과
- [ ] AC-004: 로그인 시 이전 역할 흔적 제거 - 통과
- [ ] AC-005: API 요청 시 역할별 토큰 사용 - 통과
- [ ] AC-006: 브라우저 새로고침 후 토큰 유지 - 통과
- [ ] AC-007: 쿠키 완전 삭제 - 통과

### 품질 게이트
- [ ] 단위 테스트 커버리지 ≥ 90%
- [ ] 통합 테스트 모두 통과
- [ ] E2E 테스트 모두 통과
- [ ] TypeScript 타입 에러 0건
- [ ] ESLint 에러 0건

### 성능 기준
- [ ] 로그아웃 처리 시간 < 500ms
- [ ] 역할 전환 처리 시간 < 1초
- [ ] 메모리 누수 0건

### 문서화
- [ ] JSDoc 주석 작성 완료
- [ ] 개발자 가이드 문서 작성 완료
- [ ] API 문서 업데이트 완료

### 코드 리뷰
- [ ] 2명 이상의 리뷰어 승인
- [ ] 모든 리뷰 코멘트 해결
- [ ] SPEC 문서와 코드 일치 확인

---

**작성자**: @spec-builder
**최종 수정일**: 2025-10-17
