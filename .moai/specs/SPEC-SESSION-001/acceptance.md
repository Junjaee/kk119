# SPEC-SESSION-001 수락 기준

## 개요

이 문서는 **SPEC-SESSION-001: 세션 영속성 개선**의 상세한 수락 기준과 테스트 시나리오를 정의합니다.

---

## 수락 기준 (Acceptance Criteria)

### AC-1: httpOnly 쿠키 저장

**Given**: 사용자가 로그인에 성공했을 때
**When**: 서버가 인증 응답을 반환하면
**Then**:
- HTTP 응답 헤더에 `Set-Cookie`가 포함되어야 한다
- 쿠키 속성: `HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=86400`
- 쿠키 이름: `{role}_token` (예: `teacher_token`)

**검증 방법**:
```bash
curl -i -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"teacher1","password":"password123","role":"teacher"}'

# Expected:
# Set-Cookie: teacher_token=eyJhbGc...; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=86400
```

---

### AC-2: 페이지 새로고침 시 세션 유지

**Given**: 사용자가 로그인된 상태에서
**When**: 브라우저에서 F5 또는 Ctrl+R로 페이지를 새로고침하면
**Then**:
- 로그인 상태가 유지되어야 한다
- 사용자 정보가 계속 표시되어야 한다
- 로그인 페이지로 리디렉션되지 않아야 한다

**검증 방법**:
```typescript
// Playwright E2E Test
test('페이지 새로고침 후 세션 유지', async ({ page }) => {
  await page.goto('/login');
  await login(page, 'teacher1', 'password123');

  await page.reload();

  await expect(page).toHaveURL('/teacher');
  await expect(page.locator('[data-testid="user-name"]')).toContainText('홍길동');
});
```

---

### AC-3: localStorage 유실 시 쿠키로 복구

**Given**: 사용자가 로그인된 상태에서
**When**: localStorage가 클리어되었지만 httpOnly 쿠키는 유지된 경우
**Then**:
- 쿠키에서 토큰을 복구해야 한다
- localStorage에 토큰을 다시 저장해야 한다
- 사용자는 로그인 상태를 유지해야 한다

**검증 방법**:
```typescript
test('localStorage 클리어 후 쿠키 복구', async ({ page }) => {
  await login(page, 'teacher1', 'password123');

  // localStorage 클리어
  await page.evaluate(() => localStorage.clear());

  await page.reload();

  // 세션 유지 확인
  await expect(page).toHaveURL('/teacher');

  // localStorage 복구 확인
  const token = await page.evaluate(() => localStorage.getItem('teacher_token'));
  expect(token).toBeTruthy();
});
```

---

### AC-4: 서버 사이드 세션 검증

**Given**: 클라이언트가 보호된 경로에 접근할 때
**When**: 미들웨어가 실행되면
**Then**:
- 쿠키에서 토큰을 추출해야 한다
- JWT를 검증해야 한다
- DB에서 사용자 존재 여부를 확인해야 한다
- 검증 실패 시 로그인 페이지로 리디렉션해야 한다

**검증 방법**:
```typescript
test('유효하지 않은 토큰으로 접근 시 리디렉션', async ({ page }) => {
  // 잘못된 토큰 설정
  await page.context().addCookies([{
    name: 'teacher_token',
    value: 'invalid_token',
    domain: 'localhost',
    path: '/',
  }]);

  await page.goto('/teacher');

  await expect(page).toHaveURL('/login');
});
```

---

### AC-5: ChunkLoadError 자동 복구

**Given**: 사용자가 페이지를 사용 중일 때
**When**: ChunkLoadError가 발생하면
**Then**:
- 에러를 자동으로 감지해야 한다
- 페이지를 자동으로 재로딩해야 한다
- 사용자에게 에러 메시지를 표시하지 않아야 한다

**검증 방법**:
```typescript
test('ChunkLoadError 자동 재로딩', async ({ page }) => {
  let reloaded = false;

  page.on('load', () => {
    if (reloaded) {
      console.log('Page reloaded successfully');
    }
  });

  // 청크 로딩 차단하여 에러 유발
  await page.route('**/_next/static/chunks/**', route => {
    if (!reloaded) {
      reloaded = true;
      route.abort();
    } else {
      route.continue();
    }
  });

  await page.goto('/teacher');

  // 자동 재로딩 후 정상 페이지 확인
  await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
});
```

---

### AC-6: 역할별 토큰 격리

**Given**: 사용자가 Teacher로 로그인한 상태에서
**When**: Lawyer로 다시 로그인하면
**Then**:
- Teacher 토큰이 클리어되어야 한다
- Lawyer 토큰만 유지되어야 한다
- 동시에 2개 이상의 역할 토큰이 존재하지 않아야 한다

**검증 방법**:
```typescript
test('역할 전환 시 이전 역할 토큰 클리어', async ({ page }) => {
  await login(page, 'teacher1', 'password123');

  // Teacher 토큰 확인
  let teacherToken = await page.evaluate(() => localStorage.getItem('teacher_token'));
  expect(teacherToken).toBeTruthy();

  // Lawyer로 재로그인
  await page.goto('/login');
  await login(page, 'lawyer1', 'password123');

  // Teacher 토큰 클리어 확인
  teacherToken = await page.evaluate(() => localStorage.getItem('teacher_token'));
  expect(teacherToken).toBeNull();

  // Lawyer 토큰만 존재
  const lawyerToken = await page.evaluate(() => localStorage.getItem('lawyer_token'));
  expect(lawyerToken).toBeTruthy();
});
```

---

## Given-When-Then 테스트 시나리오

### 시나리오 1: Teacher 정상 로그인 및 새로고침

```gherkin
Feature: 세션 영속성
  As a Teacher
  I want to maintain my session after page refresh
  So that I don't lose my work progress

Scenario: 정상 로그인 후 페이지 새로고침
  Given I am on the login page
  When I enter "teacher1" and "password123"
  And I click the login button
  Then I should be redirected to "/teacher"
  And I should see my name "홍길동"

  When I refresh the page
  Then I should still be on "/teacher"
  And I should still see my name "홍길동"
```

**Playwright 구현**:
```typescript
test('Teacher 정상 로그인 및 새로고침', async ({ page }) => {
  // Given: 로그인 페이지
  await page.goto('/login');

  // When: 로그인 수행
  await page.fill('input[name="username"]', 'teacher1');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  // Then: Teacher 대시보드로 리디렉션
  await expect(page).toHaveURL('/teacher');
  await expect(page.locator('[data-testid="user-name"]')).toContainText('홍길동');

  // When: 페이지 새로고침
  await page.reload();

  // Then: 여전히 로그인 상태 유지
  await expect(page).toHaveURL('/teacher');
  await expect(page.locator('[data-testid="user-name"]')).toContainText('홍길동');
});
```

---

### 시나리오 2: localStorage 유실 후 쿠키 복구

```gherkin
Scenario: localStorage 클리어 후 세션 복구
  Given I am logged in as a Teacher
  And localStorage contains "teacher_token"
  When I manually clear localStorage
  And I refresh the page
  Then the system should restore "teacher_token" from httpOnly cookie
  And I should remain logged in
```

**Playwright 구현**:
```typescript
test('localStorage 유실 후 쿠키 복구', async ({ page }) => {
  // Given: Teacher 로그인
  await page.goto('/login');
  await login(page, 'teacher1', 'password123');

  // localStorage 토큰 확인
  let token = await page.evaluate(() => localStorage.getItem('teacher_token'));
  expect(token).toBeTruthy();

  // When: localStorage 클리어
  await page.evaluate(() => localStorage.clear());

  // localStorage가 비었는지 확인
  token = await page.evaluate(() => localStorage.getItem('teacher_token'));
  expect(token).toBeNull();

  // When: 페이지 새로고침
  await page.reload();

  // Then: 쿠키로부터 세션 복구
  await expect(page).toHaveURL('/teacher');

  // localStorage에 토큰 복구 확인
  token = await page.evaluate(() => localStorage.getItem('teacher_token'));
  expect(token).toBeTruthy();
});
```

---

### 시나리오 3: 만료된 토큰으로 접근

```gherkin
Scenario: 만료된 JWT 토큰으로 보호된 경로 접근
  Given I have an expired JWT token in cookie
  When I try to access "/teacher"
  Then the middleware should reject the token
  And I should be redirected to "/login"
```

**Playwright 구현**:
```typescript
test('만료된 토큰으로 접근 시 리디렉션', async ({ page }) => {
  // Given: 만료된 토큰 생성 (exp가 과거)
  const expiredToken = jwt.sign(
    { userId: 1, role: 'teacher', exp: Math.floor(Date.now() / 1000) - 3600 },
    process.env.JWT_SECRET!
  );

  // 쿠키에 만료된 토큰 설정
  await page.context().addCookies([{
    name: 'teacher_token',
    value: expiredToken,
    domain: 'localhost',
    path: '/',
  }]);

  // When: 보호된 경로 접근
  await page.goto('/teacher');

  // Then: 로그인 페이지로 리디렉션
  await expect(page).toHaveURL('/login');
});
```

---

### 시나리오 4: 동시 다중 역할 로그인 방지

```gherkin
Scenario: 다른 역할로 재로그인 시 이전 토큰 클리어
  Given I am logged in as a Teacher
  When I log in as a Lawyer
  Then the system should clear "teacher_token"
  And the system should only keep "lawyer_token"
```

**Playwright 구현**:
```typescript
test('역할 전환 시 이전 토큰 클리어', async ({ page }) => {
  // Given: Teacher 로그인
  await page.goto('/login');
  await login(page, 'teacher1', 'password123');

  // Teacher 토큰 확인
  let teacherToken = await page.evaluate(() => localStorage.getItem('teacher_token'));
  expect(teacherToken).toBeTruthy();

  // When: Lawyer로 재로그인
  await page.goto('/login');
  await login(page, 'lawyer1', 'password123');

  // Then: Teacher 토큰 클리어 확인
  teacherToken = await page.evaluate(() => localStorage.getItem('teacher_token'));
  expect(teacherToken).toBeNull();

  // Lawyer 토큰만 존재
  const lawyerToken = await page.evaluate(() => localStorage.getItem('lawyer_token'));
  expect(lawyerToken).toBeTruthy();
});
```

---

## 품질 게이트 (Quality Gates)

### 기능 품질

- **세션 유지율**: 100% (페이지 새로고침 후)
- **토큰 복구 성공률**: 100% (쿠키 → localStorage)
- **ChunkLoadError 발생률**: 0%

### 성능 품질

- **세션 복구 시간**: < 100ms
- **서버 사이드 검증 시간**: < 50ms
- **쿠키 설정/읽기 시간**: < 10ms

### 보안 품질

- **httpOnly 쿠키 사용**: 필수
- **JWT 검증**: 모든 보호된 경로에서 필수
- **토큰 만료 시간**: 24시간 이하

---

## 테스트 커버리지 목표

### Unit Tests
- **커버리지**: 100% (핵심 로직)
- **대상 파일**:
  - `lib/auth/cookie-manager.ts`
  - `lib/auth/session-verify.ts`
  - `lib/auth/auth-sync.ts`
  - `lib/auth/session-recovery.ts`

### Integration Tests
- **커버리지**: 100% (주요 플로우)
- **대상 시나리오**:
  - 로그인 → 쿠키 저장
  - 새로고침 → 세션 유지
  - localStorage 유실 → 쿠키 복구
  - 만료된 토큰 → 리디렉션

### E2E Tests
- **커버리지**: 100% (사용자 시나리오)
- **대상 역할**:
  - Teacher, Lawyer, Admin 각각
  - 역할 전환 시나리오
  - ChunkLoadError 복구

---

## Definition of Done

### 기능 완료 조건
- ✅ 모든 수락 기준 (AC-1 ~ AC-6) 충족
- ✅ Given-When-Then 시나리오 100% 통과
- ✅ 품질 게이트 기준 만족

### 테스트 통과 조건
- ✅ Unit Tests 100% 커버리지
- ✅ Integration Tests 100% 통과
- ✅ E2E Tests 100% 통과 (모든 역할)

### 문서화 조건
- ✅ API 문서 업데이트 완료
- ✅ 세션 복구 플로우 다이어그램 추가
- ✅ 개발자 가이드 업데이트

### 코드 품질 조건
- ✅ ESLint 에러 0개
- ✅ TypeScript 컴파일 에러 0개
- ✅ 코드 리뷰 승인

---

## 검증 체크리스트

### 로그인 플로우
- [ ] 로그인 성공 시 localStorage + httpOnly 쿠키 동시 저장
- [ ] 쿠키 속성: HttpOnly, Secure, SameSite=Strict
- [ ] 쿠키 만료 시간: 24시간

### 세션 복구
- [ ] 페이지 새로고침 시 세션 유지
- [ ] localStorage 우선, 쿠키 폴백
- [ ] 복구 실패 시 로그인 페이지 리디렉션

### 서버 사이드 검증
- [ ] 미들웨어에서 모든 보호된 경로 검증
- [ ] JWT 검증 + DB 사용자 확인
- [ ] 만료된 토큰 거부

### 에러 처리
- [ ] ChunkLoadError 자동 감지 및 재로딩
- [ ] 글로벌 에러 핸들러 작동
- [ ] 사용자 친화적 에러 메시지

### 보안
- [ ] httpOnly 쿠키는 JavaScript에서 읽기 불가
- [ ] JWT Secret 환경 변수로 관리
- [ ] HTTPS에서만 Secure 쿠키 설정

---

**작성자**: @claude
**최종 수정**: 2025-10-20
