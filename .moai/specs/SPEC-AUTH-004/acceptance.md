# Acceptance Criteria - SPEC-AUTH-004

## 개요

**SPEC ID:** AUTH-004
**제목:** 세션 지속성 및 역할별 토큰 감지 수정
**검증 범위:** 토큰 감지, 세션 복원, 자동 마이그레이션, 이중 저장

---

## 검증 전략

### 테스트 환경

- **브라우저:** Chrome 120+, Firefox 121+, Safari 17+
- **디바이스:** Desktop (Windows, macOS), Mobile (iOS, Android)
- **네트워크:** 정상 연결, 느린 3G, 오프라인 → 온라인 전환
- **스토리지:** localStorage 활성화, 비활성화(프라이빗 모드)

### 품질 게이트

| 메트릭 | 목표 | 측정 방법 |
|--------|------|-----------|
| 세션 복원 성공률 | ≥ 99% | E2E 테스트 100회 반복 |
| 토큰 감지 지연 | ≤ 200ms | Performance API 측정 |
| 마이그레이션 성공률 | 100% | 레거시 키 1000개 테스트 |
| 에러율 | ≤ 1% | 프로덕션 모니터링 (48시간) |
| 코드 커버리지 | ≥ 90% | Jest coverage report |

---

## 상세 수락 기준

### AC-1: 역할별 토큰 우선 감지

#### Scenario 1.1: Role-specific 키 우선 감지

```gherkin
Given 사용자가 super_admin으로 이전에 로그인했음
  And localStorage에 "super_admin_token" = "valid_token_1" 존재
  And localStorage에 "token" = "valid_token_2" 존재 (legacy key)

When 사용자가 페이지를 새로고침

Then 시스템은 "super_admin_token"에서 토큰을 감지
  And 세션이 "valid_token_1"로 복원됨
  And "valid_token_2"는 무시됨
  And 페이지 리디렉션 없이 대시보드 유지
```

**검증 방법:**
```typescript
// E2E Test
test('should prioritize role-specific token', async ({ page }) => {
  // Setup
  await page.goto('/login');
  await login(page, 'admin@test.com', 'password');

  // Inject legacy token
  await page.evaluate(() => {
    localStorage.setItem('token', 'legacy_token_xyz');
  });

  // Refresh
  await page.reload();

  // Verify role-specific token used
  const tokenUsed = await page.evaluate(() => {
    return sessionStorage.getItem('_last_token_source');
  });

  expect(tokenUsed).toBe('super_admin_token');
});
```

**성공 기준:**
- ✅ 100회 테스트 중 100회 role-specific 키 사용
- ✅ 감지 시간 < 50ms (localStorage read)
- ✅ 콘솔에 에러 없음

---

#### Scenario 1.2: Legacy 키 폴백 및 자동 마이그레이션

```gherkin
Given 사용자가 lawyer로 이전에 로그인했음 (구버전 앱 사용)
  And localStorage에 "token" = "legacy_jwt_token" 존재 (role: lawyer)
  And localStorage에 "lawyer_token" 키 없음

When 사용자가 페이지를 새로고침

Then 시스템은 "token"에서 토큰을 감지 (폴백)
  And 토큰의 role claim을 확인하여 "lawyer" 식별
  And "lawyer_token" 키에 자동으로 토큰 저장 (마이그레이션)
  And 세션이 정상적으로 복원됨
  And 마이그레이션 로그에 기록됨
```

**검증 방법:**
```typescript
test('should migrate legacy token to role-specific key', async ({ page }) => {
  // Setup: Only legacy token exists
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem('token', createJWT({ role: 'lawyer', userId: '123' }));
  });

  // Trigger detection
  await page.goto('/lawyer/dashboard');

  // Verify migration
  const lawyerToken = await page.evaluate(() => {
    return localStorage.getItem('lawyer_token');
  });

  expect(lawyerToken).toBeTruthy();
  expect(lawyerToken).toBe(await page.evaluate(() => localStorage.getItem('token')));

  // Verify migration log
  const migrationLog = await fs.readFile('.moai/logs/token-migration.log', 'utf-8');
  expect(migrationLog).toContain('lawyer');
  expect(migrationLog).toContain('success: true');
});
```

**성공 기준:**
- ✅ 레거시 토큰 100개 중 100개 성공적 마이그레이션
- ✅ 마이그레이션 후 세션 유지 (로그아웃 없음)
- ✅ 마이그레이션 로그 `.moai/logs/token-migration.log` 생성
- ✅ 중복 마이그레이션 방지 (플래그 확인)

---

### AC-2: 이중 저장 메커니즘

#### Scenario 2.1: 로그인 시 두 위치 저장

```gherkin
Given 사용자가 로그인 페이지에 있음

When 사용자가 "teacher@test.com" / "password123"으로 로그인
  And 서버가 JWT 토큰 "jwt_teacher_token_abc" 반환

Then localStorage에 "teacher_token" = "jwt_teacher_token_abc" 저장됨
  And localStorage에 "token" = "jwt_teacher_token_abc" 저장됨 (호환성)
  And HTTP-only 쿠키 "auth_token" = "jwt_teacher_token_abc" 설정됨
  And 세 저장소 모두 동일한 토큰 값 보유
```

**검증 방법:**
```typescript
test('should store token in three locations on login', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'teacher@test.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  await page.waitForURL('/teacher/dashboard');

  // Check localStorage
  const tokens = await page.evaluate(() => ({
    roleToken: localStorage.getItem('teacher_token'),
    legacyToken: localStorage.getItem('token')
  }));

  expect(tokens.roleToken).toBeTruthy();
  expect(tokens.roleToken).toBe(tokens.legacyToken);

  // Check cookie (via API)
  const cookies = await page.context().cookies();
  const authCookie = cookies.find(c => c.name === 'auth_token');

  expect(authCookie).toBeTruthy();
  expect(authCookie.httpOnly).toBe(true);
  expect(authCookie.secure).toBe(true);
});
```

**성공 기준:**
- ✅ 3개 저장소 모두 토큰 존재
- ✅ 토큰 값 일치 (role-specific = legacy = cookie)
- ✅ 쿠키 속성: httpOnly=true, secure=true, sameSite=strict

---

#### Scenario 2.2: 로그아웃 시 완전 제거

```gherkin
Given 사용자가 association_admin으로 로그인되어 있음
  And localStorage에 "association_admin_token", "token" 존재
  And 쿠키에 "auth_token" 존재

When 사용자가 로그아웃 버튼 클릭

Then localStorage에서 "association_admin_token" 제거됨
  And localStorage에서 "token" 제거됨
  And 쿠키 "auth_token" 제거됨
  And 모든 다른 역할의 토큰도 제거됨 (super_admin_token, lawyer_token, teacher_token)
  And 사용자가 로그인 페이지로 리디렉트됨
```

**검증 방법:**
```typescript
test('should clear all tokens on logout', async ({ page }) => {
  // Login
  await login(page, 'assoc_admin@test.com', 'password');

  // Verify tokens exist
  let tokens = await page.evaluate(() => localStorage);
  expect(Object.keys(tokens).filter(k => k.includes('token'))).toHaveLength(2);

  // Logout
  await page.click('button:has-text("Logout")');

  await page.waitForURL('/login');

  // Verify all tokens removed
  tokens = await page.evaluate(() => localStorage);
  expect(Object.keys(tokens).filter(k => k.includes('token'))).toHaveLength(0);

  // Verify cookie removed
  const cookies = await page.context().cookies();
  expect(cookies.find(c => c.name === 'auth_token')).toBeUndefined();
});
```

**성공 기준:**
- ✅ 모든 토큰 키 완전 제거 (5개: 4 roles + legacy)
- ✅ 쿠키 완전 제거
- ✅ 세션 스토리지 클리어
- ✅ 로그인 페이지로 리디렉트 (URL 확인)

---

### AC-3: 세션 복원 (페이지 새로고침)

#### Scenario 3.1: 새로고침 시 세션 유지

```gherkin
Given 사용자가 super_admin으로 로그인되어 있음
  And 현재 "/admin/dashboard" 페이지에 있음
  And localStorage에 유효한 "super_admin_token" 존재

When 사용자가 F5 키 또는 새로고침 버튼 클릭

Then 페이지가 리로드됨
  And 시스템이 localStorage에서 토큰 자동 감지
  And "/api/auth/me" API 호출하여 사용자 정보 복원
  And 로그인 상태 유지됨 (로그인 페이지로 리디렉트 없음)
  And 사용자 정보 (이름, 역할) UI에 표시됨
  And 이전 페이지 URL 유지 ("/admin/dashboard")
```

**검증 방법:**
```typescript
test('should maintain session on page refresh', async ({ page }) => {
  // Login
  await login(page, 'super@test.com', 'password');
  await page.waitForURL('/admin/dashboard');

  // Verify user info displayed
  await expect(page.locator('text=Super Admin')).toBeVisible();

  // Refresh page
  await page.reload();

  // Verify session restored
  await expect(page).toHaveURL('/admin/dashboard');
  await expect(page.locator('text=Super Admin')).toBeVisible({ timeout: 2000 });

  // Verify API called
  const apiCalls = await page.evaluate(() => {
    return performance.getEntriesByType('resource')
      .filter(r => r.name.includes('/api/auth/me'));
  });

  expect(apiCalls.length).toBeGreaterThan(0);
});
```

**성공 기준:**
- ✅ 새로고침 후 2초 내 세션 복원
- ✅ `/api/auth/me` 호출 확인 (Network tab)
- ✅ UI에 사용자 정보 표시
- ✅ 페이지 URL 변경 없음

---

#### Scenario 3.2: 브라우저 재시작 후 세션 복원

```gherkin
Given 사용자가 lawyer로 로그인했음
  And 브라우저를 완전히 종료함
  And localStorage에 "lawyer_token"이 여전히 존재 (지속 저장소)
  And 토큰이 아직 만료되지 않음 (exp claim 확인)

When 사용자가 브라우저를 다시 시작
  And "/lawyer/dashboard" URL로 직접 접근

Then 시스템이 localStorage에서 "lawyer_token" 감지
  And 토큰 유효성 서버 사이드 검증
  And 세션이 자동으로 복원됨
  And 로그인 페이지로 리디렉트 없이 대시보드 표시
```

**검증 방법:**
```typescript
test('should restore session after browser restart', async ({ browser }) => {
  // First session: Login and save state
  const context1 = await browser.newContext();
  const page1 = await context1.newPage();

  await login(page1, 'lawyer@test.com', 'password');
  await page1.waitForURL('/lawyer/dashboard');

  // Save localStorage state
  const storageState = await context1.storageState();
  await context1.close();

  // Simulate browser restart: New context with saved state
  const context2 = await browser.newContext({ storageState });
  const page2 = await context2.newPage();

  // Direct navigation to dashboard
  await page2.goto('/lawyer/dashboard');

  // Verify session restored without login
  await expect(page2).toHaveURL('/lawyer/dashboard');
  await expect(page2.locator('text=Lawyer Dashboard')).toBeVisible();

  // Verify no redirect to login
  const navigationHistory = page2.url();
  expect(navigationHistory).not.toContain('/login');
});
```

**성공 기준:**
- ✅ 브라우저 재시작 후 세션 복원
- ✅ 로그인 페이지 거치지 않음
- ✅ 토큰 유효 기간 내에서만 복원 (만료 토큰은 실패)

---

### AC-4: 에러 처리 및 엣지 케이스

#### Scenario 4.1: 토큰 만료 시 처리

```gherkin
Given 사용자가 teacher로 로그인했음
  And localStorage에 "teacher_token" 존재
  But 토큰의 exp claim이 과거 시간 (만료됨)

When 사용자가 페이지를 새로고침
  And 시스템이 만료된 토큰을 감지

Then 시스템은 모든 토큰 키를 localStorage에서 제거
  And 쿠키도 제거
  And 사용자를 "/login?reason=expired"로 리디렉트
  And 토스트 메시지 "세션이 만료되었습니다. 다시 로그인해주세요." 표시
  And 만료 이벤트가 로그에 기록됨
```

**검증 방법:**
```typescript
test('should handle expired token', async ({ page }) => {
  // Create expired token
  const expiredToken = createJWT({
    role: 'teacher',
    userId: '123',
    exp: Math.floor(Date.now() / 1000) - 3600 // 1 hour ago
  });

  await page.evaluate((token) => {
    localStorage.setItem('teacher_token', token);
  }, expiredToken);

  // Navigate to dashboard
  await page.goto('/teacher/dashboard');

  // Verify redirect to login
  await expect(page).toHaveURL(/\/login\?reason=expired/);

  // Verify toast message
  await expect(page.locator('text=세션이 만료되었습니다')).toBeVisible();

  // Verify tokens cleared
  const tokens = await page.evaluate(() => localStorage);
  expect(Object.keys(tokens).filter(k => k.includes('token'))).toHaveLength(0);
});
```

**성공 기준:**
- ✅ 만료 토큰 감지 시 즉시 리디렉트
- ✅ 모든 토큰 완전 제거
- ✅ 사용자 친화적 에러 메시지
- ✅ 보안 로그 기록 (만료 이벤트)

---

#### Scenario 4.2: localStorage 비활성화 환경 (쿠키 폴백)

```gherkin
Given 사용자가 프라이빗 브라우징 모드 사용 중
  And localStorage API 비활성화됨

When 사용자가 "super@test.com" / "password"로 로그인

Then 시스템은 localStorage 사용 불가 감지
  And HTTP-only 쿠키에만 토큰 저장
  And 세션 스토리지를 임시 대안으로 사용 (탭 단위)
  And 로그인 성공 후 대시보드 정상 표시
  And 경고 메시지 "프라이빗 모드에서는 브라우저 종료 시 세션이 유지되지 않습니다" 표시
```

**검증 방법:**
```typescript
test('should fallback to cookie when localStorage unavailable', async ({ browser }) => {
  // Launch in incognito mode
  const context = await browser.newContext({
    permissions: [],
    // Simulate localStorage disabled
    bypassCSP: true
  });

  const page = await context.newPage();

  // Mock localStorage to throw error
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get: () => {
        throw new Error('localStorage is not available');
      }
    });
  });

  // Login
  await login(page, 'super@test.com', 'password');

  // Verify cookie set
  const cookies = await context.cookies();
  const authCookie = cookies.find(c => c.name === 'auth_token');
  expect(authCookie).toBeTruthy();

  // Verify warning message
  await expect(page.locator('text=프라이빗 모드')).toBeVisible();
});
```

**성공 기준:**
- ✅ localStorage 비활성화 환경에서 로그인 성공
- ✅ 쿠키 기반 인증 정상 작동
- ✅ 사용자 경고 메시지 표시
- ✅ 기능 저하 없음 (graceful degradation)

---

#### Scenario 4.3: 다중 탭 동기화

```gherkin
Given 사용자가 탭 A에서 lawyer로 로그인되어 있음
  And 탭 B를 열고 동일 애플리케이션 접근

When 탭 A에서 로그아웃 버튼 클릭

Then 탭 A에서 모든 토큰 제거됨
  And 탭 B에서도 storage 이벤트를 감지
  And 탭 B가 자동으로 로그아웃 처리됨
  And 탭 B가 로그인 페이지로 리디렉트됨
  And 두 탭 모두 일관된 상태 유지
```

**검증 방법:**
```typescript
test('should sync logout across multiple tabs', async ({ browser }) => {
  const context = await browser.newContext();

  // Tab A: Login
  const pageA = await context.newPage();
  await login(pageA, 'lawyer@test.com', 'password');

  // Tab B: Open same app
  const pageB = await context.newPage();
  await pageB.goto('/lawyer/dashboard');
  await expect(pageB.locator('text=Lawyer Dashboard')).toBeVisible();

  // Tab A: Logout
  await pageA.click('button:has-text("Logout")');

  // Wait for storage event propagation
  await pageB.waitForTimeout(500);

  // Verify Tab B redirected to login
  await expect(pageB).toHaveURL(/\/login/);

  // Verify both tabs have no tokens
  const tokensA = await pageA.evaluate(() => localStorage);
  const tokensB = await pageB.evaluate(() => localStorage);

  expect(Object.keys(tokensA).filter(k => k.includes('token'))).toHaveLength(0);
  expect(Object.keys(tokensB).filter(k => k.includes('token'))).toHaveLength(0);
});
```

**성공 기준:**
- ✅ 로그아웃 이벤트가 모든 탭에 전파 (< 1초)
- ✅ 모든 탭에서 일관된 상태 (모두 로그아웃)
- ✅ storage 이벤트 리스너 정상 작동

---

## 성능 수락 기준

### P-1: 토큰 감지 성능

```gherkin
Given 평균적인 데스크톱 환경 (Chrome, i5 CPU, 8GB RAM)

When 토큰 감지 로직 실행 (detectToken)

Then 실행 시간 ≤ 50ms (localStorage read)
  And 메인 스레드 블로킹 ≤ 10ms
  And 메모리 사용 증가 ≤ 1MB
```

**측정 방법:**
```typescript
test('token detection performance', async ({ page }) => {
  await page.goto('/dashboard');

  const metrics = await page.evaluate(() => {
    performance.mark('detect-start');
    const token = detectToken('super_admin');
    performance.mark('detect-end');

    performance.measure('token-detection', 'detect-start', 'detect-end');
    const measure = performance.getEntriesByName('token-detection')[0];

    return {
      duration: measure.duration,
      memory: performance.memory?.usedJSHeapSize
    };
  });

  expect(metrics.duration).toBeLessThan(50);
});
```

---

### P-2: 세션 복원 성능

```gherkin
Given 사용자가 이미 로그인되어 있음

When 페이지를 새로고침

Then 전체 세션 복원 시간 ≤ 500ms
  And First Contentful Paint (FCP) ≤ 1.5s
  And Time to Interactive (TTI) ≤ 3s
```

**측정 방법:**
- Lighthouse CI 성능 점수 ≥ 90
- WebPageTest 평균 응답 시간 ≤ 500ms

---

## 보안 수락 기준

### S-1: XSS 방지

```gherkin
Given 악의적 사용자가 XSS 공격 시도

When 토큰을 DOM에 직접 노출하려는 시도

Then 토큰이 innerHTML, textContent에 노출되지 않음
  And 토큰이 콘솔 로그에 전체 출력되지 않음 (마지막 4자리만)
  And CSP (Content Security Policy) 위반 감지
```

---

### S-2: CSRF 방지

```gherkin
Given 사용자가 로그인되어 있음

When 외부 사이트에서 인증 필요 API 호출 시도

Then SameSite=Strict 쿠키 정책으로 차단
  And CSRF 토큰 검증 실패로 요청 거부
  And 보안 로그에 의심 활동 기록
```

---

## 호환성 수락 기준

### C-1: 브라우저 호환성

- ✅ Chrome 120+ (100% 기능)
- ✅ Firefox 121+ (100% 기능)
- ✅ Safari 17+ (100% 기능)
- ✅ Edge 120+ (100% 기능)
- ⚠️ IE 11 (쿠키 전용 모드, 제한적 지원)

---

### C-2: 레거시 호환성

```gherkin
Given 구버전 앱(v1.x)을 사용하는 사용자
  And localStorage에 legacy "token" 키만 존재

When 신버전 앱(v2.x)으로 업데이트

Then 자동 마이그레이션으로 세션 유지
  And 사용자가 재로그인 불필요
  And 6개월간 legacy 키 병행 지원
```

---

## 완료 기준 체크리스트

### 기능 테스트
- [ ] AC-1: 역할별 토큰 우선 감지 (2개 시나리오) ✅
- [ ] AC-2: 이중 저장 메커니즘 (2개 시나리오) ✅
- [ ] AC-3: 세션 복원 (2개 시나리오) ✅
- [ ] AC-4: 에러 처리 (3개 시나리오) ✅

### 성능 테스트
- [ ] P-1: 토큰 감지 < 50ms ✅
- [ ] P-2: 세션 복원 < 500ms ✅

### 보안 테스트
- [ ] S-1: XSS 방지 검증 ✅
- [ ] S-2: CSRF 방지 검증 ✅

### 호환성 테스트
- [ ] C-1: 4개 브라우저 테스트 ✅
- [ ] C-2: 레거시 마이그레이션 ✅

### 품질 게이트
- [ ] 코드 커버리지 ≥ 90% ✅
- [ ] E2E 테스트 성공률 100% (100회 반복) ✅
- [ ] 프로덕션 에러율 ≤ 1% (48시간) ✅
- [ ] 세션 복원 성공률 ≥ 99% ✅

---

## 테스트 실행 가이드

### 로컬 환경

```bash
# 단위 테스트
npm run test:unit -- lib/auth

# 통합 테스트
npm run test:integration -- app/api/auth

# E2E 테스트
npm run test:e2e -- e2e/auth/session-persistence.spec.ts

# 성능 테스트
npm run test:perf -- --benchmark token-detection

# 전체 테스트 (CI)
npm run test:all
```

### Playwright 디버그 모드

```bash
# 헤드풀 모드로 E2E 실행
npx playwright test --headed --debug

# 특정 시나리오만 실행
npx playwright test -g "session persists across page refresh"
```

---

## 프로덕션 검증

### 모니터링 대시보드

**메트릭:**
- 세션 복원 성공률 (실시간)
- 토큰 감지 평균 지연 시간
- 마이그레이션 성공/실패 건수
- 에러율 (역할별, 브라우저별)

**알림 조건:**
- 에러율 > 5% (즉시 롤백)
- 세션 복원 실패율 > 1% (조사 필요)
- 토큰 감지 지연 > 200ms (성능 이슈)

---

**End of Acceptance Criteria**
