# SPEC-API-001 구현 계획서

## 개요

이 문서는 **SPEC-API-001: API 인증 헤더 통합**의 구체적인 구현 계획과 기술적 접근 방법을 설명합니다.

---

## 목표

**핵심 목표**: 모든 API 호출에 Authorization 헤더를 자동으로 주입하여 인증 실패를 방지합니다.

**측정 가능한 성과**:
- 401 Unauthorized 에러 발생률 0%
- API 호출 성공률 100%
- 개발자가 수동으로 헤더 설정하는 코드 제거

---

## 구현 마일스톤

### 1차 목표: Fetch Wrapper 구현

**범위**:
- `fetchWithAuth()` 함수 작성
- 토큰 자동 조회 및 헤더 주입
- 공개 경로 화이트리스트

**구현 파일**:
```
lib/api/fetch-wrapper.ts              # 글로벌 fetch wrapper
lib/auth/token-resolver.ts            # 토큰 조회 로직
lib/api/public-routes.ts              # 공개 경로 정의
```

**구현 순서**:
1. `token-resolver.ts` 작성 (토큰 우선순위 로직)
2. `public-routes.ts` 작성 (화이트리스트)
3. `fetch-wrapper.ts` 작성 (헤더 자동 주입)
4. 기존 fetch 호출을 fetchWithAuth로 변경

**의존성**:
- localStorage API
- Native fetch API

---

### 2차 목표: API 에러 핸들러 통합

**범위**:
- 401/403 에러 처리
- 자동 로그아웃
- 에러 메시지 통일

**구현 파일**:
```
lib/api/error-handler.ts              # 통합 에러 핸들러
lib/auth/logout.ts                    # 로그아웃 로직
```

**구현 순서**:
1. `error-handler.ts` 작성 (401/403 처리)
2. `logout.ts` 작성 (토큰 클리어 및 리디렉션)
3. `fetch-wrapper.ts`에 에러 핸들러 통합
4. E2E 테스트로 401 시나리오 검증

**의존성**:
- Next.js router (리디렉션)
- localStorage API

---

### 3차 목표: React Hook 통합

**범위**:
- `useApi()` 훅 구현
- GET, POST, PUT, DELETE 메서드 제공
- 타입 안전성 확보

**구현 파일**:
```
hooks/useApi.ts                       # React Hook for API calls
types/api.ts                          # API 타입 정의
```

**구현 순서**:
1. `useApi.ts` 작성 (CRUD 메서드)
2. `types/api.ts` 작성 (제네릭 타입)
3. 기존 컴포넌트에서 useApi 적용
4. 타입 안전성 검증

**의존성**:
- React hooks
- `fetchWithAuth()` 함수

---

### 최종 목표: 기존 코드 마이그레이션

**범위**:
- 수동 헤더 설정 코드 제거
- fetchWithAuth 또는 useApi로 대체
- 코드 리뷰 및 테스트

**구현 파일**:
```
app/reports/page.tsx                  # Teacher 신고 작성
app/consult/[id]/route.ts             # Lawyer 상담 응답
app/admin/users/page.tsx              # Admin 사용자 관리
```

**구현 순서**:
1. 기존 fetch 호출 검색 (`grep -r "fetch('/api" app/`)
2. 각 파일별로 fetchWithAuth 또는 useApi로 변경
3. 테스트 실행 및 회귀 검증
4. 코드 리뷰 및 머지

**의존성**:
- 모든 이전 마일스톤 완료

---

## 기술적 접근 방법

### 아키텍처 설계

#### API 호출 계층
```
┌─────────────────────────────────────────┐
│  React Component                        │
├─────────────────────────────────────────┤
│  useApi() Hook                          │
│  - get(), post(), put(), delete()       │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│  Fetch Wrapper                          │
├─────────────────────────────────────────┤
│  fetchWithAuth()                        │
│  - Token injection                      │
│  - Error handling                       │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│  Native Fetch API                       │
├─────────────────────────────────────────┤
│  - HTTP request                         │
│  - Response handling                    │
└─────────────────────────────────────────┘
```

#### 토큰 조회 우선순위
```
getCurrentToken()
  ↓
Check admin_token
  ↓ (exists)       ↓ (not found)
Return token    Check lawyer_token
                  ↓ (exists)       ↓ (not found)
                Return token    Check teacher_token
                                  ↓ (exists)      ↓ (not found)
                                Return token    Return null
```

### 주요 기술 스택

1. **Fetch Wrapper**
   - 라이브러리: Native `fetch` API
   - 패턴: Wrapper Function
   - 타입: TypeScript Generic

2. **React Hook**
   - 라이브러리: React 18 hooks
   - 패턴: Custom Hook
   - 타입: Generic Type Parameters

3. **에러 처리**
   - 패턴: Centralized Error Handler
   - 로깅: Console + 향후 Sentry 연동 고려

4. **타입 안전성**
   - TypeScript Strict Mode
   - Generic Type Parameters
   - Type Guards

---

## 리스크 및 대응 방안

### 리스크 1: 기존 코드와의 충돌

**영향도**: 중간

**대응 방안**:
1. 점진적 마이그레이션
2. 기존 fetch 호출 유지하며 새 코드만 fetchWithAuth 사용
3. 회귀 테스트 강화

**구현 예시**:
```typescript
// 기존 코드 (유지)
const response = await fetch('/api/reports', {
  headers: { Authorization: `Bearer ${token}` }
});

// 새 코드 (권장)
const response = await fetchWithAuth('/api/reports');
```

---

### 리스크 2: 토큰 우선순위 오해

**영향도**: 낮음

**대응 방안**:
1. 명확한 문서화
2. 로그 출력으로 현재 사용 중인 역할 표시
3. 디버그 모드 제공

**구현 예시**:
```typescript
export function getCurrentToken(): string | null {
  const role = getCurrentRole();
  const token = role ? localStorage.getItem(`${role}_token`) : null;

  if (process.env.NODE_ENV === 'development') {
    console.log(`[API] Using ${role} token:`, token?.slice(0, 20));
  }

  return token;
}
```

---

### 리스크 3: 공개 API 경로 누락

**영향도**: 높음 (무한 루프 가능)

**대응 방안**:
1. 화이트리스트를 별도 파일로 관리
2. 로그인 API는 반드시 공개 경로에 포함
3. E2E 테스트로 검증

**화이트리스트 예시**:
```typescript
const PUBLIC_ROUTES = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/verify',
  '/api/health',
];
```

---

### 리스크 4: 401 응답 시 무한 리디렉션

**영향도**: 중간

**대응 방안**:
1. 로그인 페이지 자체는 인증 불필요
2. 이미 로그인 페이지에 있으면 리디렉션 스킵
3. 로그아웃 후 토큰 완전 클리어

**구현 예시**:
```typescript
export async function handleApiError(response: Response) {
  if (response.status === 401) {
    clearAllTokens();

    // 이미 로그인 페이지에 있으면 리디렉션 안 함
    if (!window.location.pathname.startsWith('/login')) {
      window.location.href = '/login';
    }

    throw new Error('Unauthorized');
  }
}
```

---

## 구현 순서 (Dependency Order)

```
1. token-resolver.ts (독립)
   ↓
2. public-routes.ts (독립)
   ↓
3. fetch-wrapper.ts (의존: token-resolver, public-routes)
   ↓
4. error-handler.ts (의존: logout.ts)
   ↓
5. logout.ts (독립)
   ↓
6. useApi.ts (의존: fetch-wrapper)
   ↓
7. 기존 코드 마이그레이션 (의존: useApi, fetch-wrapper)
```

---

## 테스트 계획

### Unit Tests (Jest)

**테스트 파일**: `__tests__/lib/api/`

1. `token-resolver.test.ts`
   - ✅ 역할 우선순위 검증 (admin > lawyer > teacher)
   - ✅ 토큰 없을 때 null 반환
   - ✅ getCurrentRole() 검증

2. `public-routes.test.ts`
   - ✅ 공개 경로 화이트리스트 검증
   - ✅ 보호된 경로는 false 반환

3. `fetch-wrapper.test.ts`
   - ✅ 토큰 존재 시 Authorization 헤더 추가
   - ✅ 공개 경로는 헤더 미추가
   - ✅ 401 응답 시 에러 발생

4. `error-handler.test.ts`
   - ✅ 401 응답 시 로그아웃 처리
   - ✅ 403 응답 시 에러 발생
   - ✅ 성공 응답은 그대로 반환

---

### Integration Tests (Playwright)

**테스트 파일**: `e2e/api-auth-header.spec.ts`

1. **시나리오 1: Teacher API 호출**
   ```typescript
   test('Teacher 신고 작성 시 Authorization 헤더 자동 주입', async ({ page }) => {
     await page.goto('/login');
     await login(page, 'teacher1', 'password123');

     // API 요청 intercept
     let authHeader = '';
     await page.route('/api/reports', (route) => {
       authHeader = route.request().headers()['authorization'] || '';
       route.continue();
     });

     // 신고 작성 폼 제출
     await page.goto('/reports/new');
     await page.fill('input[name="title"]', '테스트 신고');
     await page.click('button[type="submit"]');

     // Authorization 헤더 검증
     expect(authHeader).toMatch(/^Bearer eyJ/);
   });
   ```

2. **시나리오 2: 401 에러 처리**
   ```typescript
   test('만료된 토큰으로 API 호출 시 로그인 페이지 리디렉션', async ({ page }) => {
     // 만료된 토큰 설정
     await page.goto('/teacher');
     await page.evaluate(() => {
       localStorage.setItem('teacher_token', 'expired_token');
     });

     // API 호출
     await page.goto('/reports');

     // 401 응답 시뮬레이션
     await page.route('/api/reports', (route) => {
       route.fulfill({ status: 401, body: 'Unauthorized' });
     });

     // 로그인 페이지로 리디렉션 확인
     await expect(page).toHaveURL('/login');
   });
   ```

---

## 성능 최적화

### 토큰 조회 캐싱

**목표**: 매 API 호출마다 localStorage 조회 최소화

**전략**:
1. 메모리에 토큰 캐싱
2. 로그인/로그아웃 시 캐시 갱신
3. 캐시 만료 시간 설정 (5분)

**구현 예시**:
```typescript
let cachedToken: string | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5분

export function getCurrentToken(): string | null {
  const now = Date.now();

  if (cachedToken && now - cacheTimestamp < CACHE_DURATION) {
    return cachedToken;
  }

  // localStorage 조회
  cachedToken = localStorage.getItem('admin_token')
    || localStorage.getItem('lawyer_token')
    || localStorage.getItem('teacher_token');

  cacheTimestamp = now;
  return cachedToken;
}
```

---

## 문서화 계획

### 업데이트 대상 문서

1. **API 사용 가이드**
   - `fetchWithAuth()` 사용법
   - `useApi()` 훅 사용 예시
   - 공개 경로 화이트리스트

2. **개발자 가이드**
   - 토큰 우선순위 정책
   - 에러 처리 가이드
   - 마이그레이션 체크리스트

3. **아키텍처 문서**
   - API 호출 계층 다이어그램
   - 토큰 조회 플로우

---

## Definition of Done

### 구현 완료 기준
- [x] 모든 마일스톤 코드 작성 완료
- [x] Unit Tests 100% 통과
- [x] E2E Tests 100% 통과
- [x] 코드 리뷰 승인

### 배포 준비 기준
- [ ] 기존 코드 마이그레이션 완료
- [ ] 회귀 테스트 통과
- [ ] 문서화 완료

---

**작성자**: @claude
**최종 수정**: 2025-10-20
