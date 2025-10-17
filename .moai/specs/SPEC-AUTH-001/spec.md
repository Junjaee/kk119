---
id: AUTH-001
version: 0.0.1
status: draft
created: 2025-10-17
updated: 2025-10-17
author: @spec-builder
priority: critical
category: security
labels:
  - authentication
  - token-isolation
  - role-based-access
---

# @SPEC:AUTH-001: 역할별 토큰 격리 시스템

## HISTORY

### v0.0.1 (2025-10-17)
- **INITIAL**: 역할별 토큰 격리 시스템 명세 작성
- **AUTHOR**: @spec-builder
- **SCOPE**: 4개 역할(Teacher, Lawyer, Admin, Super Admin)의 토큰/권한 완전 분리
- **PROBLEM**: A 역할 로그인 → 로그아웃 → B 역할 로그인 시 A의 토큰이 남아있는 크로스 컨테미네이션 발생

---

## Environment (환경)

### 시스템 환경
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Runtime**: Node.js 18+
- **Authentication**: JWT (JSON Web Token)
- **State Management**: Zustand
- **Storage**: localStorage, sessionStorage, cookies

### 관련 파일
- `lib/auth/auth-sync.ts` (379 LOC) - 인증 상태 동기화 매니저
- `lib/store/index.ts` - Zustand 스토어 (persist 설정 포함)
- `lib/hooks/useAuth.ts` - 인증 훅
- `app/login/page.tsx` - 로그인 페이지
- `middleware.ts` - Next.js 미들웨어 (라우트 보호)

### 전제 조건
- JWT 기반 로그인 시스템 구현 완료
- 4개 역할(teacher, lawyer, admin, super_admin) 정의 완료
- localStorage 기반 토큰 저장 사용 중
- Zustand persist로 사용자 상태 관리

---

## Assumptions (가정)

1. **토큰 오염 원인**: 로그아웃 시 localStorage, Zustand persist, cookies가 완전히 정리되지 않아 다음 로그인 시 이전 역할의 토큰이 잔존
2. **동일 브라우저 세션**: 동일 브라우저에서 여러 역할로 순차 로그인하는 시나리오가 빈번함
3. **타이밍 문제**: auth-sync.ts의 10초/15초 지연 로직이 로그아웃 직후 재로그인 시 race condition 유발
4. **단일 저장소 충돌**: 모든 역할이 동일한 localStorage 키(`token`, `kyokwon119-storage`)를 공유하여 충돌 발생
5. **서버 세션 불일치**: 클라이언트 토큰과 서버 쿠키가 동기화되지 않아 혼재 발생

---

## Requirements (요구사항)

### Ubiquitous Requirements (필수 기능)

1. **역할별 토큰 격리**
   - 시스템은 각 역할별로 독립된 localStorage 키를 사용해야 한다
     - Teacher: `token_teacher`, `storage_teacher`
     - Lawyer: `token_lawyer`, `storage_lawyer`
     - Admin: `token_admin`, `storage_admin`
     - Super Admin: `token_super_admin`, `storage_super_admin`

2. **완전한 로그아웃**
   - 시스템은 로그아웃 시 모든 역할의 토큰과 저장소를 제거해야 한다
   - 시스템은 로그아웃 시 Zustand persist 저장소를 완전히 초기화해야 한다
   - 시스템은 로그아웃 시 sessionStorage를 완전히 초기화해야 한다
   - 시스템은 로그아웃 시 모든 도메인/경로 조합의 쿠키를 제거해야 한다

3. **역할 전환 프로세스**
   - 시스템은 로그인 시 이전 역할의 모든 흔적을 제거한 후 새 토큰을 저장해야 한다
   - 시스템은 역할 전환 시 Zustand 스토어를 완전히 리셋해야 한다
   - 시스템은 역할 전환 시 메모리 내 인증 상태를 초기화해야 한다

### Event-driven Requirements (이벤트 기반)

1. **로그인 프로세스**
   - WHEN 사용자가 로그인 버튼을 클릭하면, 시스템은 먼저 `clearAllAuthState()`를 호출해야 한다
   - WHEN 로그인 API가 성공하면, 시스템은 역할별 저장소 키에 토큰을 저장해야 한다
   - WHEN 로그인이 완료되면, 시스템은 `loginCompletedAt` 타임스탬프를 기록해야 한다

2. **로그아웃 프로세스**
   - WHEN 사용자가 로그아웃하면, 시스템은 모든 역할의 토큰을 제거해야 한다
   - WHEN 로그아웃이 완료되면, 시스템은 `logoutCompletedAt` 타임스탬프를 기록해야 한다
   - WHEN 로그아웃 후 15초 이내에는, 시스템은 자동 새로고침을 차단해야 한다

3. **토큰 검증**
   - WHEN API 요청 시, 시스템은 현재 역할에 맞는 토큰만 사용해야 한다
   - WHEN 토큰 불일치가 발견되면, 시스템은 즉시 로그아웃 처리해야 한다

### State-driven Requirements (상태 기반)

1. **로그인 상태**
   - WHILE 사용자가 로그인된 상태일 때, 시스템은 해당 역할의 토큰만 유효하다고 간주해야 한다
   - WHILE 로그인 프로세스가 진행 중일 때, 시스템은 자동 새로고침을 차단해야 한다

2. **로그아웃 상태**
   - WHILE 사용자가 로그아웃 상태일 때, 시스템은 모든 역할의 토큰이 무효하다고 간주해야 한다
   - WHILE 로그아웃 후 15초 이내일 때, 시스템은 쿠키 기반 자동 재로그인을 차단해야 한다

3. **역할 전환 상태**
   - WHILE 역할 전환이 진행 중일 때, 시스템은 이전 역할의 저장소 접근을 금지해야 한다

### Optional Features (선택 기능)

1. **역할별 저장소 마이그레이션**
   - WHERE 기존 사용자의 토큰이 존재하면, 시스템은 역할별 키로 자동 마이그레이션할 수 있다

2. **디버그 로깅**
   - WHERE 개발 환경이면, 시스템은 토큰 상태 변경을 상세히 로깅할 수 있다

### Constraints (제약사항)

1. **보안 제약**
   - IF 역할이 일치하지 않는 토큰이 발견되면, 시스템은 즉시 로그아웃 처리해야 한다
   - IF JWT 디코딩이 실패하면, 시스템은 해당 토큰을 무효로 처리해야 한다

2. **성능 제약**
   - 로그아웃 처리 시간은 500ms를 초과하지 않아야 한다
   - 역할 전환 처리 시간은 1초를 초과하지 않아야 한다

3. **코드 품질 제약**
   - auth-sync.ts는 400 LOC를 초과하지 않아야 한다
   - 순환 의존성을 생성하지 않아야 한다

---

## Technical Design (기술 설계)

### 역할별 저장소 키 구조

```typescript
// @CODE:AUTH-001-STORAGE | SPEC: SPEC-AUTH-001.md

export const AUTH_STORAGE_KEYS = {
  teacher: {
    token: 'token_teacher',
    storage: 'storage_teacher',
  },
  lawyer: {
    token: 'token_lawyer',
    storage: 'storage_lawyer',
  },
  admin: {
    token: 'token_admin',
    storage: 'storage_admin',
  },
  super_admin: {
    token: 'token_super_admin',
    storage: 'storage_super_admin',
  },
} as const;

export type UserRole = 'teacher' | 'lawyer' | 'admin' | 'super_admin';
```

### AuthSync 개선 구조

```typescript
// @CODE:AUTH-001-SYNC | SPEC: SPEC-AUTH-001.md

export class AuthSync implements AuthSyncManager {
  private currentRole: UserRole | null = null;

  /**
   * Clear all authentication state for ALL roles
   */
  clearAllAuthState(skipServerSideCleanup = false): void {
    console.log('🗑️ [AUTH-SYNC] Clearing all auth state for ALL roles');

    // Clear tokens for ALL roles
    Object.values(AUTH_STORAGE_KEYS).forEach(({ token, storage }) => {
      localStorage.removeItem(token);
      localStorage.removeItem(storage);
    });

    // Clear legacy keys
    localStorage.removeItem('token');
    localStorage.removeItem('kyokwon119-storage');
    localStorage.removeItem('rememberedEmail');

    // Clear session storage
    sessionStorage.clear();

    // Clear all cookies
    this.clearAllCookies();

    // Reset role
    this.currentRole = null;

    if (!skipServerSideCleanup) {
      this.logoutCompletedAt = Date.now();
      fetch('/api/auth/logout', { method: 'POST' }).catch(err =>
        console.warn('Failed to clear server-side session:', err)
      );
    }
  }

  /**
   * Get token for current role
   */
  private getTokenForRole(role: UserRole): string | null {
    const keys = AUTH_STORAGE_KEYS[role];
    return localStorage.getItem(keys.token);
  }

  /**
   * Set token for specific role
   */
  setTokenForRole(role: UserRole, token: string): void {
    const keys = AUTH_STORAGE_KEYS[role];
    localStorage.setItem(keys.token, token);
    this.currentRole = role;
  }

  /**
   * Clear all cookies with multiple strategies
   */
  private clearAllCookies(): void {
    if (typeof document === 'undefined') return;

    const hostname = window.location.hostname;
    const cookieNames = ['auth-token', 'session'];
    const domains = [hostname, `.${hostname}`, ''];
    const paths = ['/', '/api', '/admin', '/teacher', '/lawyer'];

    cookieNames.forEach(name => {
      domains.forEach(domain => {
        paths.forEach(path => {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}; domain=${domain}`;
          document.cookie = `${name}=; Max-Age=0; path=${path}; domain=${domain}`;
        });
      });
    });
  }
}
```

---

## Traceability (@TAG)

- **SPEC**: @SPEC:AUTH-001
- **TEST**: `__tests__/auth/token-isolation.test.ts` (예정)
- **CODE**:
  - `lib/auth/auth-sync.ts` (수정)
  - `lib/auth/storage-keys.ts` (신규)
  - `lib/hooks/useAuth.ts` (수정)
- **DOC**: `.moai/specs/SPEC-AUTH-001/`
- **RELATED**:
  - @SPEC:AUTH-002 (서버 측 역할 검증)
  - @SPEC:AUTH-003 (클라이언트 상태 동기화)

---

## Success Criteria (성공 기준)

### 기능 완성도
- [ ] 역할별 독립된 localStorage 키 사용
- [ ] 로그아웃 시 모든 역할의 토큰 제거
- [ ] 역할 전환 시 이전 역할 저장소 완전 초기화
- [ ] 로그인 시 이전 역할 흔적 제거
- [ ] Zustand persist 저장소 완전 초기화

### 품질 기준
- [ ] 테스트 커버리지 90% 이상
- [ ] auth-sync.ts LOC ≤ 400
- [ ] 순환 의존성 없음
- [ ] TypeScript 타입 안정성 100%

### 성능 기준
- [ ] 로그아웃 처리 시간 < 500ms
- [ ] 역할 전환 처리 시간 < 1초
- [ ] 메모리 누수 없음

### 검증 시나리오
- [ ] Teacher 로그인 → 로그아웃 → Lawyer 로그인 시 Teacher 토큰 미검출
- [ ] Admin 로그인 → 로그아웃 → Teacher 로그인 시 Admin 권한 미노출
- [ ] 브라우저 새로고침 후에도 현재 역할의 토큰만 유지
- [ ] 역할별 독립된 Zustand persist 저장소 사용

---

## Dependencies (의존성)

### 기술 의존성
- Next.js 14 App Router
- Zustand (persist 미들웨어)
- JWT 라이브러리
- TypeScript 5.x

### SPEC 의존성
- **독립적**: 다른 SPEC과 의존성 없음 (우선 진행 가능)
- **연관**:
  - @SPEC:AUTH-002: 서버 측 역할 검증 강화
  - @SPEC:AUTH-003: 클라이언트 상태 동기화 개선

### 선행 조건
- JWT 기반 로그인 시스템 구현 완료
- UserRole 타입 정의 완료
- auth-sync.ts 모듈 존재

---

## Risk Analysis (리스크 분석)

### 높은 리스크
1. **기존 사용자 토큰 무효화**: 기존 로그인 사용자의 토큰이 새 키 구조와 호환되지 않음
   - **완화**: 마이그레이션 로직 추가, 자동 로그아웃 후 재로그인 유도

2. **브라우저 간 호환성**: 일부 브라우저에서 localStorage 제한 존재
   - **완화**: 쿠키 fallback 전략, 에러 처리 강화

### 중간 리스크
1. **타이밍 race condition**: 로그아웃과 로그인이 짧은 시간 내 발생 시 충돌
   - **완화**: 로그인 전 명시적 clearAllAuthState() 호출

2. **쿠키 삭제 실패**: 다양한 도메인/경로 조합으로 쿠키 완전 삭제 실패
   - **완화**: 다중 전략 쿠키 삭제 (여러 domain/path 조합 시도)

---

## Implementation Notes (구현 참고사항)

### 단계별 구현
1. **Phase 1**: 역할별 저장소 키 정의 (`storage-keys.ts`)
2. **Phase 2**: `clearAllAuthState()` 개선 (모든 역할 토큰 제거)
3. **Phase 3**: `getTokenForRole()`, `setTokenForRole()` 구현
4. **Phase 4**: 로그인/로그아웃 플로우에 통합
5. **Phase 5**: 테스트 작성 (단위 테스트, E2E 테스트)
6. **Phase 6**: 기존 사용자 마이그레이션 로직 추가

### 테스트 전략
- 역할별 로그인/로그아웃 순환 테스트 (4개 역할 x 4개 역할 조합)
- 브라우저 새로고침 후 토큰 유지 검증
- 동시 로그인 시도 시 race condition 검증
- 쿠키 삭제 완전성 검증

### 코드 리뷰 포인트
- 모든 역할 키가 누락 없이 처리되는지 확인
- 로그아웃 시 단일 실패 지점(SPOF) 없는지 확인
- 에러 발생 시에도 부분적 정리가 아닌 완전한 정리 수행 확인
