# SPEC-API-001 수락 기준

## 개요

이 문서는 **SPEC-API-001: API 인증 헤더 통합**의 상세한 수락 기준과 테스트 시나리오를 정의합니다.

---

## 수락 기준 (Acceptance Criteria)

### AC-1: Authorization 헤더 자동 주입

**Given**: 사용자가 로그인된 상태에서
**When**: 보호된 API 엔드포인트를 호출하면
**Then**:
- HTTP 요청 헤더에 `Authorization: Bearer {token}`이 포함되어야 한다
- 토큰은 localStorage에서 자동으로 조회되어야 한다
- 개발자가 수동으로 헤더를 설정할 필요가 없어야 한다

**검증 방법**:
```typescript
// Playwright E2E Test
test('API 호출 시 Authorization 헤더 자동 주입', async ({ page }) => {
  await login(page, 'teacher1', 'password123');

  let authHeader = '';
  await page.route('/api/reports', (route) => {
    authHeader = route.request().headers()['authorization'] || '';
    route.continue();
  });

  await page.goto('/reports');

  expect(authHeader).toMatch(/^Bearer eyJ/);
});
```

---

### AC-2: 공개 API 경로는 헤더 미추가

**Given**: 공개 API 경로에 접근할 때
**When**: `/api/auth/login` 또는 `/api/health`를 호출하면
**Then**:
- Authorization 헤더가 추가되지 않아야 한다
- 인증 없이도 API 호출이 성공해야 한다

**검증 방법**:
```typescript
test('공개 API는 Authorization 헤더 미추가', async ({ page }) => {
  let authHeader = '';
  await page.route('/api/auth/login', (route) => {
    authHeader = route.request().headers()['authorization'] || '';
    route.continue();
  });

  await page.goto('/login');
  await page.fill('input[name="username"]', 'teacher1');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  expect(authHeader).toBe('');
});
```

---

### AC-3: 401 에러 시 자동 로그아웃

**Given**: 만료된 토큰으로 API를 호출할 때
**When**: 서버가 401 Unauthorized를 반환하면
**Then**:
- 시스템은 자동으로 로그아웃 처리해야 한다
- localStorage의 모든 토큰이 클리어되어야 한다
- 사용자는 로그인 페이지로 리디렉션되어야 한다

**검증 방법**:
```typescript
test('401 에러 시 자동 로그아웃', async ({ page }) => {
  await page.goto('/teacher');
  await page.evaluate(() => {
    localStorage.setItem('teacher_token', 'expired_token');
  });

  await page.route('/api/reports', (route) => {
    route.fulfill({ status: 401, body: '{"error": "Unauthorized"}' });
  });

  await page.goto('/reports');

  await expect(page).toHaveURL('/login');

  const token = await page.evaluate(() => localStorage.getItem('teacher_token'));
  expect(token).toBeNull();
});
```

---

### AC-4: 역할별 토큰 자동 선택

**Given**: 여러 역할의 토큰이 존재할 때
**When**: API를 호출하면
**Then**:
- 우선순위에 따라 토큰을 선택해야 한다 (admin > lawyer > teacher)
- 선택된 토큰으로 Authorization 헤더가 생성되어야 한다

**검증 방법**:
```typescript
test('역할 우선순위 검증', async ({ page }) => {
  await page.goto('/teacher');
  await page.evaluate(() => {
    localStorage.setItem('teacher_token', 'teacher_jwt');
    localStorage.setItem('admin_token', 'admin_jwt');
  });

  let authHeader = '';
  await page.route('/api/reports', (route) => {
    authHeader = route.request().headers()['authorization'] || '';
    route.continue();
  });

  await page.goto('/reports');

  // admin_token이 우선되어야 함
  expect(authHeader).toContain('admin_jwt');
});
```

---

### AC-5: useApi 훅 사용성

**Given**: React 컴포넌트에서 API를 호출할 때
**When**: `useApi()` 훅을 사용하면
**Then**:
- GET, POST, PUT, DELETE 메서드를 제공해야 한다
- 타입 안전성이 보장되어야 한다
- Authorization 헤더가 자동으로 추가되어야 한다

**검증 방법**:
```typescript
// Unit Test
describe('useApi hook', () => {
  it('should provide CRUD methods', () => {
    const { result } = renderHook(() => useApi());

    expect(result.current.get).toBeDefined();
    expect(result.current.post).toBeDefined();
    expect(result.current.put).toBeDefined();
    expect(result.current.delete).toBeDefined();
  });

  it('should inject Authorization header', async () => {
    const { result } = renderHook(() => useApi());

    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({}) } as Response)
    );

    await result.current.get('/api/reports');

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/reports',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: expect.stringMatching(/^Bearer /),
        }),
      })
    );
  });
});
```

---

## Given-When-Then 테스트 시나리오

### 시나리오 1: Teacher 신고 작성 시 API 호출

```gherkin
Feature: API 인증 헤더 자동 주입
  As a Teacher
  I want to submit a report without manually setting auth headers
  So that I can focus on content creation

Scenario: 신고 작성 시 Authorization 헤더 자동 주입
  Given I am logged in as "teacher1"
  And my token is stored in localStorage
  When I fill out the report form
  And I click the submit button
  Then the API request should include "Authorization: Bearer {token}"
  And the report should be created successfully
```

**Playwright 구현**:
```typescript
test('Teacher 신고 작성 시 Authorization 헤더 자동 주입', async ({ page }) => {
  // Given: Teacher 로그인
  await page.goto('/login');
  await login(page, 'teacher1', 'password123');

  // 토큰 확인
  const token = await page.evaluate(() => localStorage.getItem('teacher_token'));
  expect(token).toBeTruthy();

  // API 요청 intercept
  let authHeader = '';
  let requestBody: any = null;
  await page.route('/api/reports', (route) => {
    authHeader = route.request().headers()['authorization'] || '';
    requestBody = JSON.parse(route.request().postData() || '{}');
    route.continue();
  });

  // When: 신고 작성 폼 제출
  await page.goto('/reports/new');
  await page.fill('input[name="title"]', '테스트 신고');
  await page.fill('textarea[name="content"]', '신고 내용');
  await page.click('button[type="submit"]');

  // Then: Authorization 헤더 검증
  expect(authHeader).toMatch(/^Bearer eyJ/);
  expect(requestBody.title).toBe('테스트 신고');

  // 신고 생성 성공 확인
  await expect(page.locator('text=신고가 접수되었습니다')).toBeVisible();
});
```

---

### 시나리오 2: Lawyer 상담 응답 시 API 호출

```gherkin
Scenario: 변호사 상담 응답 시 Authorization 헤더 자동 주입
  Given I am logged in as "lawyer1"
  When I submit a consultation response
  Then the API request should include "Authorization: Bearer {token}"
  And the response should be saved successfully
```

**Playwright 구현**:
```typescript
test('Lawyer 상담 응답 시 Authorization 헤더 자동 주입', async ({ page }) => {
  // Given: Lawyer 로그인
  await page.goto('/login');
  await login(page, 'lawyer1', 'password123');

  // API 요청 intercept
  let authHeader = '';
  await page.route('/api/consult/*', (route) => {
    authHeader = route.request().headers()['authorization'] || '';
    route.continue();
  });

  // When: 상담 응답 작성
  await page.goto('/consult/1');
  await page.fill('textarea[name="response"]', '법률 조언 내용');
  await page.click('button:has-text("응답 전송")');

  // Then: Authorization 헤더 검증
  expect(authHeader).toMatch(/^Bearer eyJ/);

  // 응답 저장 성공 확인
  await expect(page.locator('text=응답이 전송되었습니다')).toBeVisible();
});
```

---

### 시나리오 3: 만료된 토큰으로 API 호출

```gherkin
Scenario: 만료된 토큰으로 보호된 API 호출
  Given I have an expired JWT token
  When I try to access a protected API
  Then the system should return 401 Unauthorized
  And I should be automatically logged out
  And I should be redirected to "/login"
```

**Playwright 구현**:
```typescript
test('만료된 토큰으로 API 호출 시 자동 로그아웃', async ({ page }) => {
  // Given: 만료된 토큰 설정
  await page.goto('/teacher');
  await page.evaluate(() => {
    localStorage.setItem('teacher_token', 'expired_token');
  });

  // 401 응답 시뮬레이션
  await page.route('/api/reports', (route) => {
    route.fulfill({
      status: 401,
      body: JSON.stringify({ error: 'Token expired' })
    });
  });

  // When: 보호된 페이지 접근
  await page.goto('/reports');

  // Then: 로그인 페이지로 리디렉션
  await expect(page).toHaveURL('/login');

  // 토큰 클리어 확인
  const token = await page.evaluate(() => localStorage.getItem('teacher_token'));
  expect(token).toBeNull();
});
```

---

### 시나리오 4: 공개 API 호출 (인증 불필요)

```gherkin
Scenario: 공개 API 호출 시 헤더 미추가
  Given I am not logged in
  When I call a public API like "/api/health"
  Then the request should not include Authorization header
  And the API should respond successfully
```

**Playwright 구현**:
```typescript
test('공개 API 호출 시 Authorization 헤더 미추가', async ({ page }) => {
  // Given: 로그인하지 않은 상태
  await page.goto('/login');

  // API 요청 intercept
  let authHeader = '';
  await page.route('/api/health', (route) => {
    authHeader = route.request().headers()['authorization'] || '';
    route.fulfill({
      status: 200,
      body: JSON.stringify({ status: 'ok' })
    });
  });

  // When: 공개 API 호출
  await page.evaluate(() => fetch('/api/health'));

  // Then: Authorization 헤더 없음
  expect(authHeader).toBe('');
});
```

---

## 품질 게이트 (Quality Gates)

### 기능 품질

- **API 호출 성공률**: 100% (인증된 요청)
- **401 에러 처리율**: 100% (자동 로그아웃)
- **헤더 자동 주입률**: 100% (보호된 API)

### 성능 품질

- **토큰 조회 시간**: < 10ms (캐싱 적용 후)
- **fetchWithAuth 오버헤드**: < 5ms
- **useApi 훅 초기화 시간**: < 1ms

### 보안 품질

- **Authorization 헤더 형식**: `Bearer {JWT}` 필수
- **공개 API 화이트리스트**: 엄격히 관리
- **토큰 클리어 완전성**: 로그아웃 시 모든 토큰 삭제

---

## 테스트 커버리지 목표

### Unit Tests
- **커버리지**: 100% (핵심 로직)
- **대상 파일**:
  - `lib/api/fetch-wrapper.ts`
  - `lib/auth/token-resolver.ts`
  - `lib/api/error-handler.ts`
  - `hooks/useApi.ts`

### Integration Tests
- **커버리지**: 100% (주요 플로우)
- **대상 시나리오**:
  - 토큰 자동 주입
  - 공개 API 헤더 미추가
  - 401 에러 처리
  - 역할 우선순위

### E2E Tests
- **커버리지**: 100% (사용자 시나리오)
- **대상 역할**:
  - Teacher, Lawyer, Admin 각각
  - 공개 API 호출
  - 401 에러 시나리오

---

## Definition of Done

### 기능 완료 조건
- ✅ 모든 수락 기준 (AC-1 ~ AC-5) 충족
- ✅ Given-When-Then 시나리오 100% 통과
- ✅ 품질 게이트 기준 만족

### 테스트 통과 조건
- ✅ Unit Tests 100% 커버리지
- ✅ Integration Tests 100% 통과
- ✅ E2E Tests 100% 통과 (모든 역할)

### 문서화 조건
- ✅ API 사용 가이드 작성
- ✅ `fetchWithAuth` 사용 예시 추가
- ✅ 마이그레이션 체크리스트

### 코드 품질 조건
- ✅ ESLint 에러 0개
- ✅ TypeScript 컴파일 에러 0개
- ✅ 코드 리뷰 승인

---

## 검증 체크리스트

### Fetch Wrapper
- [ ] fetchWithAuth() 함수 구현 완료
- [ ] 토큰 자동 조회 로직 작동
- [ ] 공개 경로 화이트리스트 적용
- [ ] Authorization 헤더 형식 검증 (Bearer {token})

### 에러 핸들러
- [ ] 401 에러 시 자동 로그아웃
- [ ] 403 에러 시 에러 메시지 표시
- [ ] 로그인 페이지로 리디렉션

### useApi 훅
- [ ] GET, POST, PUT, DELETE 메서드 제공
- [ ] 타입 안전성 확보 (Generic Type)
- [ ] 에러 핸들링 통합

### 기존 코드 마이그레이션
- [ ] 모든 fetch 호출 검색 완료
- [ ] fetchWithAuth 또는 useApi로 변경
- [ ] 회귀 테스트 통과

### 보안
- [ ] 공개 API 화이트리스트 검증
- [ ] 토큰 클리어 완전성 확인
- [ ] 무한 리디렉션 방지

---

**작성자**: @claude
**최종 수정**: 2025-10-20
