---
id: AUTH-001
version: 0.0.1
status: draft
created: 2025-10-17
updated: 2025-10-17
---

# SPEC-AUTH-001 구현 계획

## 목표

4개 역할(Teacher, Lawyer, Admin, Super Admin)의 토큰과 권한을 완전히 격리하여 역할 전환 시 이전 역할의 토큰 오염을 방지한다.

---

## 우선순위별 마일스톤

### 1차 목표: 역할별 저장소 키 정의 및 구조 설계

**우선순위**: Critical

**목표**:
- 각 역할별로 독립된 localStorage 키 구조 정의
- 타입 안전성을 보장하는 TypeScript 타입 정의
- 레거시 키와의 호환성 고려

**산출물**:
- `lib/auth/storage-keys.ts` 신규 생성
- `AUTH_STORAGE_KEYS` 상수 정의
- `UserRole` 타입 정의

**기술적 접근**:
```typescript
// lib/auth/storage-keys.ts
export const AUTH_STORAGE_KEYS = {
  teacher: { token: 'token_teacher', storage: 'storage_teacher' },
  lawyer: { token: 'token_lawyer', storage: 'storage_lawyer' },
  admin: { token: 'token_admin', storage: 'storage_admin' },
  super_admin: { token: 'token_super_admin', storage: 'storage_super_admin' },
} as const;

export type UserRole = keyof typeof AUTH_STORAGE_KEYS;
export type AuthStorageKeys = typeof AUTH_STORAGE_KEYS[UserRole];
```

**의존성**:
- 없음 (독립적으로 진행 가능)

---

### 2차 목표: AuthSync 클래스 개선 (완전한 초기화)

**우선순위**: Critical

**목표**:
- `clearAllAuthState()` 함수 개선: 모든 역할의 토큰 제거
- `clearAllCookies()` 함수 구현: 다중 전략 쿠키 삭제
- 레거시 키 정리 로직 추가

**산출물**:
- `lib/auth/auth-sync.ts` 수정
- `clearAllAuthState()` 함수 개선
- `clearAllCookies()` private 메서드 추가

**기술적 접근**:
```typescript
clearAllAuthState(skipServerSideCleanup = false): void {
  // 1. 모든 역할의 토큰 제거
  Object.values(AUTH_STORAGE_KEYS).forEach(({ token, storage }) => {
    localStorage.removeItem(token);
    localStorage.removeItem(storage);
  });

  // 2. 레거시 키 제거
  localStorage.removeItem('token');
  localStorage.removeItem('kyokwon119-storage');

  // 3. 쿠키 삭제
  this.clearAllCookies();

  // 4. 서버 세션 정리
  if (!skipServerSideCleanup) {
    fetch('/api/auth/logout', { method: 'POST' });
  }
}
```

**의존성**:
- 1차 목표 완료 후 진행

---

### 3차 목표: 역할별 토큰 관리 함수 구현

**우선순위**: High

**목표**:
- 현재 역할에 맞는 토큰 가져오기/저장하기 함수 구현
- 역할 불일치 시 자동 로그아웃 처리

**산출물**:
- `getTokenForRole()` private 메서드
- `setTokenForRole()` public 메서드
- `getCurrentRole()` public 메서드

**기술적 접근**:
```typescript
private currentRole: UserRole | null = null;

getTokenForRole(role: UserRole): string | null {
  const keys = AUTH_STORAGE_KEYS[role];
  return localStorage.getItem(keys.token);
}

setTokenForRole(role: UserRole, token: string): void {
  const keys = AUTH_STORAGE_KEYS[role];
  localStorage.setItem(keys.token, token);
  this.currentRole = role;
}

getCurrentRole(): UserRole | null {
  return this.currentRole;
}
```

**의존성**:
- 1차 목표 완료 후 진행

---

### 4차 목표: 로그인 플로우 통합

**우선순위**: High

**목표**:
- 로그인 시 이전 역할의 모든 흔적 제거
- 새 역할의 토큰을 역할별 키에 저장
- 로그인 타이밍 보호 로직 강화

**산출물**:
- `app/login/page.tsx` 수정
- `lib/hooks/useAuth.ts` 수정

**기술적 접근**:
```typescript
// app/login/page.tsx
const handleLogin = async (email, password) => {
  // 1. 로그인 프로세스 시작
  authSync.startLogin();

  // 2. 이전 역할 완전 정리
  authSync.clearAllAuthState(true); // skipServerSideCleanup=true

  try {
    // 3. 로그인 API 호출
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    // 4. 역할별 토큰 저장
    authSync.setTokenForRole(data.user.role, data.token);

    // 5. 사용자 상태 동기화
    authSync.syncUserState(data.user);

    // 6. 로그인 완료
    authSync.endLogin();

    // 7. 역할별 페이지로 리다이렉트
    router.push(getDefaultPageForRole(data.user.role));
  } catch (error) {
    authSync.endLogin();
    console.error('Login failed:', error);
  }
};
```

**의존성**:
- 2차, 3차 목표 완료 후 진행

---

### 5차 목표: 로그아웃 플로우 통합

**우선순위**: High

**목표**:
- 로그아웃 시 모든 역할의 토큰 제거
- 로그아웃 후 15초간 자동 재로그인 차단
- 서버 세션 정리 확인

**산출물**:
- `lib/hooks/useAuth.ts` 수정
- 로그아웃 후 차단 로직 강화

**기술적 접근**:
```typescript
const handleLogout = async () => {
  try {
    // 1. 모든 역할 토큰 제거
    authSync.clearAllAuthState(false); // skipServerSideCleanup=false

    // 2. Zustand 스토어 리셋
    useStore.getState().logout();

    // 3. 로그인 페이지로 리다이렉트
    router.push('/login');
  } catch (error) {
    console.error('Logout failed:', error);
  }
};
```

**의존성**:
- 2차 목표 완료 후 진행

---

### 6차 목표: API 요청 시 역할별 토큰 사용

**우선순위**: Medium

**목표**:
- API 요청 시 현재 역할에 맞는 토큰만 사용
- 역할 불일치 시 자동 로그아웃

**산출물**:
- `lib/utils/api-client.ts` 수정 (또는 신규 생성)

**기술적 접근**:
```typescript
export async function apiRequest(url: string, options: RequestInit = {}) {
  const authSync = AuthSync.getInstance();
  const currentRole = authSync.getCurrentRole();

  if (!currentRole) {
    throw new Error('No authenticated role');
  }

  const token = authSync.getTokenForRole(currentRole);

  if (!token) {
    authSync.clearAllAuthState();
    throw new Error('Invalid token for role');
  }

  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`,
  };

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    authSync.clearAllAuthState();
    throw new Error('Unauthorized');
  }

  return response;
}
```

**의존성**:
- 3차 목표 완료 후 진행

---

## 기술적 설계 방향

### 아키텍처 원칙

1. **격리 원칙 (Isolation)**
   - 각 역할은 독립된 저장소 키를 사용
   - 역할 간 저장소 공유 금지

2. **완전성 원칙 (Completeness)**
   - 로그아웃 시 부분 정리가 아닌 완전한 정리
   - 모든 저장소(localStorage, sessionStorage, cookies) 동시 정리

3. **안전성 우선 (Safety First)**
   - 불확실한 상태에서는 로그아웃 처리
   - 역할 불일치 발견 시 즉시 세션 종료

### 에러 처리 전략

1. **토큰 불일치 감지**
   ```typescript
   if (decodedToken.role !== currentRole) {
     console.error('Token role mismatch detected');
     authSync.clearAllAuthState();
     router.push('/login');
   }
   ```

2. **저장소 접근 실패**
   ```typescript
   try {
     localStorage.setItem(key, value);
   } catch (error) {
     console.error('Storage quota exceeded or disabled');
     // Fallback to sessionStorage or cookies
   }
   ```

3. **쿠키 삭제 실패**
   - 다중 전략으로 모든 경로/도메인 조합 시도
   - 실패하더라도 나머지 정리 작업 계속 진행

---

## 리스크 및 대응 방안

### 리스크 1: 기존 사용자 토큰 무효화

**발생 확률**: 높음

**영향도**: 높음

**대응 방안**:
1. 마이그레이션 로직 추가
   ```typescript
   // lib/auth/migration.ts
   export function migrateTokenToRoleBased() {
     const legacyToken = localStorage.getItem('token');
     if (!legacyToken) return;

     const decoded = jwt.decode(legacyToken);
     const role = decoded.role as UserRole;

     authSync.setTokenForRole(role, legacyToken);
     localStorage.removeItem('token');
   }
   ```

2. 공지사항: "보안 강화를 위해 재로그인이 필요합니다"

### 리스크 2: 브라우저 호환성 문제

**발생 확률**: 낮음

**영향도**: 중간

**대응 방안**:
- 쿠키 fallback 전략
- IndexedDB 대체 저장소 검토

### 리스크 3: 타이밍 race condition

**발생 확률**: 중간

**영향도**: 중간

**대응 방안**:
- 로그인/로그아웃 시 명시적 플래그 사용 (`isLoggingIn`, `logoutCompletedAt`)
- 15초 지연 로직 유지 (로그아웃 후 자동 재로그인 차단)

---

## 테스트 계획

### 단위 테스트

**파일**: `__tests__/auth/auth-sync.test.ts`

**테스트 케이스**:
1. `clearAllAuthState()` - 모든 역할 토큰 제거 확인
2. `setTokenForRole()` - 역할별 키에 저장 확인
3. `getTokenForRole()` - 현재 역할 토큰 반환 확인
4. `clearAllCookies()` - 모든 쿠키 삭제 확인

### 통합 테스트

**파일**: `__tests__/auth/role-switching.test.ts`

**테스트 시나리오**:
1. Teacher 로그인 → 로그아웃 → Lawyer 로그인
   - Teacher 토큰 미검출 확인
   - Lawyer 토큰만 존재 확인
2. Admin 로그인 → 브라우저 새로고침
   - Admin 토큰 유지 확인
3. Lawyer 로그인 → 동시에 다른 탭에서 Teacher 로그인
   - 마지막 로그인 역할만 유효 확인

### E2E 테스트

**도구**: Playwright

**시나리오**:
1. 역할별 로그인 플로우 검증 (4개 역할)
2. 역할 전환 플로우 검증 (4x4 조합)
3. 로그아웃 후 localStorage/cookies 완전 제거 확인

---

## 성공 지표

### 기능 지표
- [ ] 역할별 독립된 localStorage 키 사용률: 100%
- [ ] 로그아웃 시 토큰 제거율: 100% (모든 역할)
- [ ] 역할 전환 성공률: 100%

### 성능 지표
- [ ] 로그아웃 처리 시간 < 500ms
- [ ] 역할 전환 처리 시간 < 1초
- [ ] 메모리 누수: 0건

### 품질 지표
- [ ] 테스트 커버리지 ≥ 90%
- [ ] TypeScript 타입 에러: 0건
- [ ] ESLint 에러: 0건

---

## 배포 전 체크리스트

- [ ] 모든 역할(Teacher, Lawyer, Admin, Super Admin)에 대한 저장소 키 정의 완료
- [ ] `clearAllAuthState()` 모든 역할 토큰 제거 검증
- [ ] `clearAllCookies()` 다중 전략 쿠키 삭제 검증
- [ ] 로그인 플로우 통합 완료
- [ ] 로그아웃 플로우 통합 완료
- [ ] 단위 테스트 작성 및 통과
- [ ] E2E 테스트 작성 및 통과
- [ ] 코드 리뷰 완료
- [ ] 기존 사용자 마이그레이션 로직 추가 (선택)

---

## 문서화 계획

1. **개발자 문서**
   - `docs/auth/token-isolation.md`: 역할별 토큰 격리 원칙 설명
   - `docs/auth/storage-keys.md`: 저장소 키 구조 문서화

2. **API 문서**
   - `AuthSync` 클래스 JSDoc 주석 작성
   - 공개 메서드 사용 예시 추가

3. **사용자 가이드**
   - 보안 강화 안내 공지 작성
   - 재로그인 필요 시 안내 문구

---

**작성자**: @spec-builder
**최종 수정일**: 2025-10-17
