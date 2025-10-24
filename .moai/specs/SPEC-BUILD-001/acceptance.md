# SPEC-BUILD-001 수락 기준

## 개요

이 문서는 **SPEC-BUILD-001: Webpack 빌드 최적화**의 상세한 수락 기준과 테스트 시나리오를 정의합니다.

---

## 수락 기준 (Acceptance Criteria)

### AC-1: 동적 임포트 제거

**Given**: Header, Sidebar, Footer 컴포넌트가 동적 임포트로 구현되어 있을 때
**When**: 정적 임포트로 변경하면
**Then**:
- ChunkLoadError가 발생하지 않아야 한다
- 페이지 로딩 시 컴포넌트가 즉시 렌더링되어야 한다
- 로딩 스피너가 표시되지 않아야 한다

**검증 방법**:
```typescript
// Playwright E2E Test
test('핵심 UI 컴포넌트 즉시 렌더링', async ({ page }) => {
  await page.goto('/teacher');

  // Header, Sidebar가 즉시 표시되어야 함 (로딩 없음)
  await expect(page.locator('header')).toBeVisible({ timeout: 100 });
  await expect(page.locator('aside')).toBeVisible({ timeout: 100 });

  // ChunkLoadError 발생하지 않음
  const errors = [];
  page.on('pageerror', (error) => {
    if (error.message.includes('ChunkLoadError')) {
      errors.push(error);
    }
  });

  expect(errors).toHaveLength(0);
});
```

---

### AC-2: 청크 크기 제약

**Given**: Webpack 빌드가 실행될 때
**When**: 청크 파일이 생성되면
**Then**:
- 각 청크 파일 크기는 250KB를 초과하지 않아야 한다
- 초기 번들 크기는 500KB를 초과하지 않아야 한다

**검증 방법**:
```bash
# 빌드 후 청크 크기 확인
npm run build
ls -lh .next/static/chunks/*.js | awk '{if ($5 > 250) print $5, $9}'

# 초과하는 파일이 없어야 함
# Expected: (empty output)
```

---

### AC-3: ChunkLoadError 자동 재로딩

**Given**: 청크 로딩이 실패할 때
**When**: ChunkLoadError가 발생하면
**Then**:
- 시스템은 자동으로 페이지를 재로딩해야 한다
- 재로딩 후 정상 페이지가 표시되어야 한다
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
  await page.route('**/_next/static/chunks/**', (route) => {
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
  expect(reloaded).toBe(true);
});
```

---

### AC-4: 청크 사전 로딩

**Given**: 페이지가 로드될 때
**When**: HTML에 Link preload 태그가 포함되면
**Then**:
- framework.js, commons.js, ui.js 청크가 사전 로딩되어야 한다
- 청크 로딩 순서가 우선순위에 따라 결정되어야 한다

**검증 방법**:
```typescript
test('Link preload 태그 확인', async ({ page }) => {
  await page.goto('/teacher');

  // Link preload 태그 확인
  const preloadLinks = await page.locator('link[rel="preload"]').all();

  const preloadHrefs = await Promise.all(
    preloadLinks.map((link) => link.getAttribute('href'))
  );

  expect(preloadHrefs).toContain('/_next/static/chunks/framework.js');
  expect(preloadHrefs).toContain('/_next/static/chunks/commons.js');
});
```

---

### AC-5: 빌드 성능

**Given**: 프로덕션 빌드를 실행할 때
**When**: 빌드가 완료되면
**Then**:
- 빌드 시간은 60초를 초과하지 않아야 한다
- 빌드 결과물이 .next 디렉토리에 생성되어야 한다
- 빌드 에러가 발생하지 않아야 한다

**검증 방법**:
```bash
# 빌드 시간 측정
time npm run build

# Expected: real < 1m0s
```

---

## Given-When-Then 테스트 시나리오

### 시나리오 1: 정상 페이지 로딩

```gherkin
Feature: 청크 로딩 최적화
  As a User
  I want pages to load without ChunkLoadError
  So that I can use the application reliably

Scenario: 정상 페이지 로딩
  Given I am on the login page
  When I log in as "teacher1"
  And I navigate to the dashboard
  Then the page should load successfully
  And no ChunkLoadError should occur
```

**Playwright 구현**:
```typescript
test('정상 페이지 로딩 (ChunkLoadError 없음)', async ({ page }) => {
  // Given: 로그인 페이지
  await page.goto('/login');

  // 에러 감지
  const errors = [];
  page.on('pageerror', (error) => {
    if (error.message.includes('ChunkLoadError')) {
      errors.push(error);
    }
  });

  // When: 로그인 및 대시보드 이동
  await login(page, 'teacher1', 'password123');
  await page.goto('/teacher');

  // Then: ChunkLoadError 없음
  await page.waitForLoadState('networkidle');
  expect(errors).toHaveLength(0);

  // 페이지 정상 렌더링
  await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
});
```

---

### 시나리오 2: 네트워크 불안정 시 청크 로딩 재시도

```gherkin
Scenario: 네트워크 불안정 시 청크 로딩 재시도
  Given the network is unstable
  When a chunk fails to load
  Then the system should retry loading 3 times
  And eventually load the chunk successfully
```

**Playwright 구현**:
```typescript
test('네트워크 불안정 시 청크 로딩 재시도', async ({ page }) => {
  let attemptCount = 0;

  // Given: 네트워크 불안정 시뮬레이션
  await page.route('**/_next/static/chunks/ui.js', (route) => {
    attemptCount++;

    // 처음 2번 실패, 3번째 성공
    if (attemptCount <= 2) {
      console.log(`Chunk load attempt ${attemptCount} failed`);
      route.abort();
    } else {
      console.log(`Chunk load attempt ${attemptCount} succeeded`);
      route.continue();
    }
  });

  // When: 페이지 로딩
  await page.goto('/teacher');

  // Then: 재시도 후 성공
  await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
  expect(attemptCount).toBeGreaterThanOrEqual(3);
});
```

---

### 시나리오 3: 빌드 후 청크 크기 검증

```gherkin
Scenario: 빌드 후 청크 크기 검증
  Given the project is built for production
  When I check the chunk sizes
  Then each chunk should be less than 250KB
  And the total initial bundle should be less than 500KB
```

**Jest 구현**:
```typescript
// __tests__/build/chunk-size.test.ts
import fs from 'fs';
import path from 'path';

describe('Chunk Size Validation', () => {
  it('각 청크 파일이 250KB 이하', () => {
    const chunksDir = path.join(process.cwd(), '.next', 'static', 'chunks');
    const chunkFiles = fs.readdirSync(chunksDir).filter((file) => file.endsWith('.js'));

    chunkFiles.forEach((file) => {
      const filePath = path.join(chunksDir, file);
      const stats = fs.statSync(filePath);
      const sizeInKB = stats.size / 1024;

      expect(sizeInKB).toBeLessThan(250);
      console.log(`${file}: ${sizeInKB.toFixed(2)} KB`);
    });
  });

  it('초기 번들 크기가 500KB 이하', () => {
    const chunksDir = path.join(process.cwd(), '.next', 'static', 'chunks');
    const initialChunks = ['framework.js', 'commons.js', 'ui.js'];

    let totalSize = 0;

    initialChunks.forEach((file) => {
      const filePath = path.join(chunksDir, file);
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        totalSize += stats.size;
      }
    });

    const totalSizeInKB = totalSize / 1024;
    expect(totalSizeInKB).toBeLessThan(500);
    console.log(`Total initial bundle: ${totalSizeInKB.toFixed(2)} KB`);
  });
});
```

---

### 시나리오 4: 청크 사전 로딩 검증

```gherkin
Scenario: 청크 사전 로딩 검증
  Given I load a page
  When the HTML is parsed
  Then Link preload tags should be present for critical chunks
  And the chunks should load in priority order
```

**Playwright 구현**:
```typescript
test('청크 사전 로딩 검증', async ({ page }) => {
  // Given: 페이지 로딩
  await page.goto('/teacher');

  // When: HTML 파싱 완료
  await page.waitForLoadState('domcontentloaded');

  // Then: Link preload 태그 확인
  const preloadLinks = await page.locator('link[rel="preload"][as="script"]').all();

  const preloadHrefs = await Promise.all(
    preloadLinks.map((link) => link.getAttribute('href'))
  );

  // 필수 청크 사전 로딩 확인
  expect(preloadHrefs.some((href) => href?.includes('framework'))).toBe(true);
  expect(preloadHrefs.some((href) => href?.includes('commons'))).toBe(true);

  console.log('Preloaded chunks:', preloadHrefs);
});
```

---

## 품질 게이트 (Quality Gates)

### 기능 품질

- **ChunkLoadError 발생률**: 0%
- **페이지 로딩 성공률**: 100%
- **자동 재로딩 성공률**: 100%

### 성능 품질

- **빌드 시간**: < 60초
- **초기 번들 크기**: < 500KB (gzip 압축 후)
- **각 청크 크기**: < 250KB
- **페이지 로딩 시간**: < 3초 (네트워크: Fast 3G)

### 안정성 품질

- **빌드 성공률**: 100%
- **청크 로딩 재시도 성공률**: 100% (3회 이내)

---

## 테스트 커버리지 목표

### Unit Tests
- **커버리지**: 100% (핵심 로직)
- **대상 파일**:
  - `lib/utils/chunk-retry.ts`

### Integration Tests
- **커버리지**: 100% (빌드 설정)
- **대상 시나리오**:
  - Webpack splitChunks 설정 검증
  - 청크 크기 제약 확인
  - Link preload 태그 생성

### E2E Tests
- **커버리지**: 100% (사용자 시나리오)
- **대상 시나리오**:
  - 정상 페이지 로딩
  - ChunkLoadError 자동 복구
  - 네트워크 불안정 시 재시도

---

## Definition of Done

### 기능 완료 조건
- ✅ 모든 수락 기준 (AC-1 ~ AC-5) 충족
- ✅ Given-When-Then 시나리오 100% 통과
- ✅ 품질 게이트 기준 만족

### 테스트 통과 조건
- ✅ Unit Tests 100% 커버리지
- ✅ Integration Tests 100% 통과
- ✅ E2E Tests 100% 통과 (모든 시나리오)

### 문서화 조건
- ✅ Webpack 설정 가이드 작성
- ✅ 빌드 최적화 베스트 프랙티스 문서화
- ✅ ChunkLoadError 트러블슈팅 가이드

### 코드 품질 조건
- ✅ ESLint 에러 0개
- ✅ TypeScript 컴파일 에러 0개
- ✅ 코드 리뷰 승인

---

## 검증 체크리스트

### 동적 임포트 제거
- [ ] Header 컴포넌트 정적 임포트로 변경
- [ ] Sidebar 컴포넌트 정적 임포트로 변경
- [ ] Footer 컴포넌트 정적 임포트로 변경
- [ ] `next/dynamic` 사용 최소화 (Modal 등만 유지)

### Webpack 최적화
- [ ] splitChunks 전략 구현
- [ ] cacheGroups 설정 완료 (framework, commons, ui)
- [ ] 청크 크기 제약 설정 (maxSize: 250000)
- [ ] 청크 네이밍 전략 적용 ([name].[contenthash].js)

### ChunkLoadError 처리
- [ ] error.tsx 구현 (페이지 레벨)
- [ ] global-error.tsx 구현 (루트 레벨)
- [ ] 자동 재로딩 로직 작동
- [ ] 재시도 횟수 제한 (무한 루프 방지)

### 청크 사전 로딩
- [ ] Link preload 태그 추가
- [ ] 필수 청크 우선순위 설정
- [ ] 빌드 분석 리포트 생성

### 빌드 성능
- [ ] 빌드 시간 < 60초
- [ ] 초기 번들 크기 < 500KB
- [ ] 각 청크 크기 < 250KB

---

**작성자**: @claude
**최종 수정**: 2025-10-20
