# SPEC-BUILD-001 구현 계획서

## 개요

이 문서는 **SPEC-BUILD-001: Webpack 빌드 최적화**의 구체적인 구현 계획과 기술적 접근 방법을 설명합니다.

---

## 목표

**핵심 목표**: ChunkLoadError를 완전히 해결하고 빌드 성능을 최적화합니다.

**측정 가능한 성과**:
- ChunkLoadError 발생률 0%
- 초기 번들 크기 < 500KB
- 각 청크 파일 크기 < 250KB
- 빌드 시간 < 60초

---

## 구현 마일스톤

### 1차 목표: 동적 임포트 제거

**범위**:
- Header, Sidebar, Footer 컴포넌트를 정적 임포트로 변경
- 불필요한 `next/dynamic` 사용 제거

**구현 파일**:
```
app/layout.tsx                        # Header, Footer 정적 임포트
components/layout/header.tsx          # dynamic() 제거
components/layout/sidebar.tsx         # dynamic() 제거
components/layout/footer.tsx          # dynamic() 제거
```

**구현 순서**:
1. 기존 `next/dynamic` 사용 검색
2. 핵심 UI 컴포넌트 정적 임포트로 변경
3. 선택적 컴포넌트는 동적 임포트 유지 (Modal, Dialog 등)
4. 빌드 테스트 및 오류 확인

**의존성**:
- None

---

### 2차 목표: Webpack 최적화 설정

**범위**:
- `next.config.js`에 Webpack splitChunks 전략 추가
- 청크 크기 제약 설정
- 청크 네이밍 전략 구현

**구현 파일**:
```
next.config.js                        # Webpack 설정 추가
```

**구현 순서**:
1. `next.config.js` 백업
2. Webpack 설정 추가 (splitChunks, cacheGroups)
3. 청크 크기 제약 설정 (maxSize: 250000)
4. 빌드 실행 및 청크 크기 검증

**의존성**:
- 1차 목표 완료 (동적 임포트 제거)

---

### 3차 목표: ChunkLoadError 자동 재로딩

**범위**:
- 글로벌 에러 핸들러 구현
- ChunkLoadError 감지 및 자동 재로딩
- 재시도 로직 구현

**구현 파일**:
```
app/error.tsx                         # 글로벌 에러 핸들러
app/global-error.tsx                  # 루트 에러 핸들러
lib/utils/chunk-retry.ts              # 청크 로딩 재시도 로직
```

**구현 순서**:
1. `error.tsx` 작성 (ChunkLoadError 감지)
2. `global-error.tsx` 작성 (루트 레벨 에러)
3. `chunk-retry.ts` 작성 (재시도 로직)
4. E2E 테스트로 자동 재로딩 검증

**의존성**:
- None (독립적)

---

### 최종 목표: 청크 사전 로딩

**범위**:
- Link preload 태그 추가
- 핵심 청크 우선 로딩
- 빌드 분석 및 최적화

**구현 파일**:
```
app/layout.tsx                        # Link preload 추가
next.config.js                        # Bundle Analyzer 통합
```

**구현 순서**:
1. `app/layout.tsx`에 Link preload 추가
2. `@next/bundle-analyzer` 설치 및 설정
3. 빌드 분석 리포트 생성
4. 청크 크기 최적화 (250KB 이하)

**의존성**:
- 2차 목표 완료 (Webpack 최적화)

---

## 기술적 접근 방법

### 아키텍처 설계

#### 청크 분할 전략
```
┌─────────────────────────────────────────┐
│  Initial Bundle (< 500KB)               │
├─────────────────────────────────────────┤
│  1. framework.js (React, React-DOM)     │
│     - Priority: 40                      │
│     - Size: ~150KB                      │
│                                          │
│  2. commons.js (Shared Libraries)       │
│     - Priority: 20                      │
│     - Size: ~100KB                      │
│                                          │
│  3. ui.js (UI Components)               │
│     - Priority: 10                      │
│     - Size: ~80KB                       │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Lazy-loaded Chunks (< 250KB each)      │
├─────────────────────────────────────────┤
│  - Modal.js (~50KB)                     │
│  - Dialog.js (~30KB)                    │
│  - Chart.js (~200KB)                    │
└─────────────────────────────────────────┘
```

#### ChunkLoadError 복구 플로우
```
Page Load
  ↓
Load Chunk
  ↓ (success)      ↓ (fail: ChunkLoadError)
Render           Error Boundary
                   ↓
                 Retry (3 attempts)
                   ↓ (success)       ↓ (fail)
                 Render           Auto Reload
```

### 주요 기술 스택

1. **Webpack 5 (Next.js 내장)**
   - splitChunks: 청크 분할 전략
   - cacheGroups: 청크 그룹핑
   - maxSize: 청크 크기 제약

2. **Next.js Error Boundary**
   - error.tsx: 페이지 레벨 에러
   - global-error.tsx: 루트 레벨 에러

3. **Link Preload**
   - HTML `<link rel="preload">` 태그
   - 핵심 청크 우선 로딩

4. **Bundle Analyzer**
   - @next/bundle-analyzer
   - Webpack Bundle Analyzer

---

## 리스크 및 대응 방안

### 리스크 1: 초기 번들 크기 증가

**영향도**: 높음

**대응 방안**:
1. Tree shaking 활성화
2. 미사용 코드 제거 (ESLint unused-vars)
3. 선택적 임포트 (named imports)

**구현 예시**:
```typescript
// Before: 전체 라이브러리 임포트
import _ from 'lodash';

// After: 필요한 함수만 임포트
import { debounce } from 'lodash-es';
```

---

### 리스크 2: 빌드 시간 증가

**영향도**: 중간

**대응 방안**:
1. 증분 빌드 활용 (Next.js 캐싱)
2. 병렬 빌드 활성화
3. Webpack 캐시 설정

**구현 예시**:
```javascript
// next.config.js
module.exports = {
  webpack: (config) => {
    config.cache = {
      type: 'filesystem',
      buildDependencies: {
        config: [__filename],
      },
    };
    return config;
  },
};
```

---

### 리스크 3: 청크 로딩 순서 문제

**영향도**: 중간

**대응 방안**:
1. 청크 우선순위 명확히 설정
2. Link preload로 필수 청크 우선 로딩
3. 의존성 그래프 검증

**구현 예시**:
```javascript
config.optimization.splitChunks.cacheGroups = {
  framework: {
    priority: 40, // 가장 높은 우선순위
  },
  commons: {
    priority: 20,
  },
  ui: {
    priority: 10,
  },
};
```

---

### 리스크 4: 자동 재로딩으로 인한 무한 루프

**영향도**: 높음

**대응 방안**:
1. 재시도 횟수 제한 (최대 1회)
2. 재로딩 전 사용자 동의 요청 (옵션)
3. 로컬 스토리지에 재로딩 카운트 저장

**구현 예시**:
```typescript
useEffect(() => {
  if (error.message.includes('ChunkLoadError')) {
    const reloadCount = parseInt(localStorage.getItem('chunk_reload_count') || '0');

    if (reloadCount < 1) {
      localStorage.setItem('chunk_reload_count', (reloadCount + 1).toString());
      setTimeout(() => window.location.reload(), 1000);
    } else {
      console.error('ChunkLoadError persists after retry, manual intervention required');
      localStorage.removeItem('chunk_reload_count');
    }
  }
}, [error]);
```

---

## 구현 순서 (Dependency Order)

```
1. 동적 임포트 제거 (독립)
   ↓
2. error.tsx, global-error.tsx 작성 (독립)
   ↓
3. next.config.js Webpack 설정 (의존: 1)
   ↓
4. chunk-retry.ts 작성 (독립)
   ↓
5. Link preload 추가 (의존: 3)
   ↓
6. Bundle Analyzer 통합 (의존: 3)
```

---

## 테스트 계획

### Unit Tests (Jest)

**테스트 파일**: `__tests__/lib/utils/`

1. `chunk-retry.test.ts`
   - ✅ 3회 재시도 로직 검증
   - ✅ ChunkLoadError 감지
   - ✅ 성공 시 즉시 반환

---

### Integration Tests

**테스트 파일**: `__tests__/build/`

1. `webpack-config.test.ts`
   - ✅ splitChunks 설정 검증
   - ✅ 청크 크기 제약 확인 (< 250KB)
   - ✅ 초기 번들 크기 확인 (< 500KB)

2. `chunk-loading.test.ts`
   - ✅ Link preload 태그 확인
   - ✅ 청크 로딩 순서 검증

---

### E2E Tests (Playwright)

**테스트 파일**: `e2e/chunk-load-error.spec.ts`

1. **시나리오 1: 정상 페이지 로딩**
   ```typescript
   test('페이지 로딩 시 ChunkLoadError 없음', async ({ page }) => {
     await page.goto('/teacher');

     // ChunkLoadError 발생하지 않음
     const errors = [];
     page.on('pageerror', (error) => {
       if (error.message.includes('ChunkLoadError')) {
         errors.push(error);
       }
     });

     await page.waitForLoadState('networkidle');

     expect(errors).toHaveLength(0);
   });
   ```

2. **시나리오 2: ChunkLoadError 자동 복구**
   ```typescript
   test('ChunkLoadError 발생 시 자동 재로딩', async ({ page }) => {
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
   });
   ```

---

## 성능 최적화

### 빌드 성능 목표

- **빌드 시간**: < 60초 (프로덕션 빌드)
- **초기 번들 크기**: < 500KB (gzip 압축 후)
- **각 청크 크기**: < 250KB

### 측정 방법

```bash
# 빌드 시간 측정
time npm run build

# 번들 크기 분석
ANALYZE=true npm run build

# 압축 후 크기 확인
ls -lh .next/static/chunks/*.js | awk '{print $5, $9}'
```

---

## 문서화 계획

### 업데이트 대상 문서

1. **Webpack 설정 가이드**
   - splitChunks 전략 설명
   - cacheGroups 설정 예시

2. **빌드 최적화 베스트 프랙티스**
   - 동적 임포트 사용 가이드
   - 청크 크기 관리 전략

3. **ChunkLoadError 트러블슈팅**
   - 자동 재로딩 로직 설명
   - 수동 해결 방법

---

## Definition of Done

### 구현 완료 기준
- [x] 모든 마일스톤 코드 작성 완료
- [x] Unit Tests 100% 통과
- [x] E2E Tests 100% 통과
- [x] 코드 리뷰 승인

### 배포 준비 기준
- [ ] 빌드 성능 기준 충족
- [ ] ChunkLoadError 발생률 0%
- [ ] 문서화 완료

---

**작성자**: @claude
**최종 수정**: 2025-10-20
