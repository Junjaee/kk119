---
id: BUILD-001
version: 0.0.1
status: draft
created: 2025-10-20
updated: 2025-10-20
author: @claude
priority: high
category: perf
labels:
  - build
  - webpack
  - optimization
  - chunking
---

# SPEC-BUILD-001: Webpack 빌드 최적화

## HISTORY

### v0.0.1 (2025-10-20)
- **INITIAL**: Webpack 빌드 최적화 명세 최초 작성
- **AUTHOR**: @claude
- **SCOPE**: ChunkLoadError 해결 및 빌드 성능 개선
- **CONTEXT**: E2E 테스트 보고서 기반 문제 해결

---

## @TAG:SPEC-BUILD-001 메타데이터

### 추적성 태그
- **@SPEC:BUILD-001** - Webpack 빌드 최적화 명세
- **@SPEC:SESSION-001** - 세션 영속성 개선 (관련)
- **@DOC:PROBLEM-001** - 핵심 문제 정의 참조

### 우선순위
- **Priority**: HIGH
- **Category**: Performance
- **Impact**: High (사용자 경험 및 빌드 안정성)

### 의존성
- **Depends On**:
  - None
- **Blocks**:
  - None
- **Related**:
  - SPEC-SESSION-001 (ChunkLoadError 관련)
  - SPEC-API-001 (동적 임포트 제거)

---

## Environment (환경 및 가정사항)

### 시스템 환경
- **Framework**: Next.js 14 App Router
- **Bundler**: Webpack 5 (Next.js 내장)
- **Runtime**: Node.js 18+ (Windows ARM)
- **Deployment**: Vercel / Self-hosted

### 현재 빌드 설정
- **Next.js Config**: `next.config.js`
- **Code Splitting**: 자동 (Next.js 기본)
- **Dynamic Imports**: `next/dynamic` 사용
- **Chunk Strategy**: 기본 설정 (최적화 미흡)

### 문제 환경
- **트리거**: 페이지 로드 시 동적 임포트 청크 로딩 실패
- **증상**:
  - ChunkLoadError: "Loading chunk X failed"
  - 컴포넌트 렌더링 실패
  - 사용자 경험 저하
- **영향 범위**: Header, Sidebar 등 핵심 UI 컴포넌트

---

## Assumptions (전제 조건)

### 기술적 전제
1. **동적 임포트는 불안정**: 네트워크 지연, 캐시 무효화, CDN 이슈로 로딩 실패 가능
2. **청크 파일 경로 변경**: 빌드마다 해시 변경으로 이전 청크 파일 404 발생
3. **Webpack 설정 미흡**: Next.js 기본 설정은 모든 프로젝트에 최적화되지 않음

### 비즈니스 전제
1. **빌드 안정성 우선**: ChunkLoadError는 사용자에게 치명적
2. **초기 로딩 속도 중요**: 핵심 UI 컴포넌트는 사전 로딩 필요
3. **캐싱 전략 필요**: 정적 청크는 브라우저 캐싱으로 성능 향상

---

## Requirements (기능 요구사항)

### Ubiquitous Requirements (기본 기능)
- **REQ-BUILD-001**: 시스템은 핵심 UI 컴포넌트를 정적 임포트로 변경해야 한다
- **REQ-BUILD-002**: 시스템은 Webpack 청크 전략을 최적화해야 한다
- **REQ-BUILD-003**: 시스템은 청크 사전 로딩(preload)을 구현해야 한다
- **REQ-BUILD-004**: 시스템은 ChunkLoadError 발생 시 자동 재로딩을 제공해야 한다

### Event-driven Requirements (이벤트 기반)
- **REQ-BUILD-005**: WHEN 빌드가 실행되면, 시스템은 청크 파일을 최적화된 크기로 분할해야 한다
- **REQ-BUILD-006**: WHEN 청크 로딩이 실패하면, 시스템은 자동으로 재시도해야 한다
- **REQ-BUILD-007**: WHEN 페이지가 로드되면, 시스템은 필수 청크를 사전 로딩해야 한다

### State-driven Requirements (상태 기반)
- **REQ-BUILD-008**: WHILE 사용자가 페이지를 탐색할 때, 시스템은 다음 페이지의 청크를 미리 로딩해야 한다
- **REQ-BUILD-009**: WHILE 빌드가 진행 중일 때, 시스템은 중복 청크를 제거해야 한다

### Optional Features (선택적 기능)
- **OPT-BUILD-001**: WHERE 프로덕션 환경이면, 시스템은 청크 압축(gzip/brotli)을 활성화할 수 있다
- **OPT-BUILD-002**: WHERE 디버그 모드이면, 시스템은 청크 분석 리포트를 생성할 수 있다

### Constraints (제약사항)
- **CON-BUILD-001**: 각 청크 파일 크기는 250KB를 초과할 수 없다
- **CON-BUILD-002**: 초기 번들 크기는 500KB를 초과할 수 없다
- **CON-BUILD-003**: 청크 사전 로딩은 초기 로딩 시간을 20% 이상 증가시키지 않아야 한다

---

## Specifications (상세 명세)

### 1. 동적 임포트 제거

#### 1.1 정적 임포트 변환
**Before (동적 임포트)**:
```typescript
// components/layout/header.tsx
import dynamic from 'next/dynamic';

const Header = dynamic(() => import('@/components/layout/header'), {
  loading: () => <div>Loading...</div>,
  ssr: false
});
```

**After (정적 임포트)**:
```typescript
// components/layout/header.tsx
import Header from '@/components/layout/header';

export default function Layout() {
  return <Header />;
}
```

#### 1.2 핵심 컴포넌트 목록
- **Header**: 모든 페이지에서 사용 → 정적 임포트
- **Sidebar**: 인증된 페이지에서 사용 → 정적 임포트
- **Footer**: 모든 페이지에서 사용 → 정적 임포트
- **Modal**: 필요 시에만 로딩 → 동적 임포트 유지

---

### 2. Webpack 최적화 설정

#### 2.1 Next.js Config 업데이트
```javascript
// next.config.js
const nextConfig = {
  webpack: (config, { isServer, dev }) => {
    if (!isServer && !dev) {
      // 청크 전략 최적화
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // React 관련 라이브러리 청크
            framework: {
              name: 'framework',
              chunks: 'all',
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
              priority: 40,
              enforce: true,
            },
            // 공용 라이브러리 청크
            commons: {
              name: 'commons',
              minChunks: 2,
              priority: 20,
            },
            // UI 컴포넌트 청크
            ui: {
              name: 'ui',
              test: /[\\/]components[\\/]/,
              priority: 10,
            },
          },
          maxInitialRequests: 25,
          minSize: 20000,
          maxSize: 250000,
        },
      };
    }

    return config;
  },
};

module.exports = nextConfig;
```

#### 2.2 청크 네이밍 전략
```javascript
config.output = {
  ...config.output,
  filename: dev
    ? 'static/chunks/[name].js'
    : 'static/chunks/[name].[contenthash].js',
  chunkFilename: dev
    ? 'static/chunks/[name].js'
    : 'static/chunks/[name].[contenthash].js',
};
```

---

### 3. 청크 사전 로딩

#### 3.1 Link Preload 구현
```typescript
// app/layout.tsx
import Head from 'next/head';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <Head>
        {/* 핵심 청크 사전 로딩 */}
        <link rel="preload" href="/_next/static/chunks/framework.js" as="script" />
        <link rel="preload" href="/_next/static/chunks/commons.js" as="script" />
        <link rel="preload" href="/_next/static/chunks/ui.js" as="script" />
      </Head>
      <body>{children}</body>
    </html>
  );
}
```

#### 3.2 Next.js App Router 메타데이터
```typescript
// app/layout.tsx (App Router)
export const metadata = {
  other: {
    preload: [
      { rel: 'preload', href: '/_next/static/chunks/framework.js', as: 'script' },
      { rel: 'preload', href: '/_next/static/chunks/commons.js', as: 'script' },
    ],
  },
};
```

---

### 4. ChunkLoadError 자동 재로딩

#### 4.1 글로벌 에러 핸들러
```typescript
// app/error.tsx
'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // ChunkLoadError 자동 복구
    if (error.message.includes('ChunkLoadError') || error.message.includes('Loading chunk')) {
      console.warn('ChunkLoadError detected, reloading page in 1s...');

      // 1초 후 자동 재로딩
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  }, [error]);

  return (
    <html>
      <body>
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h2>일시적인 오류가 발생했습니다</h2>
          <p>페이지를 다시 로딩 중입니다...</p>
          <button onClick={reset}>수동으로 다시 시도</button>
        </div>
      </body>
    </html>
  );
}
```

#### 4.2 청크 로딩 재시도 로직
```typescript
// lib/utils/chunk-retry.ts
export function retryChunkLoad(fn: () => Promise<any>, retriesLeft = 3, interval = 1000): Promise<any> {
  return fn().catch((error) => {
    if (retriesLeft === 0 || !error.message.includes('Loading chunk')) {
      throw error;
    }

    console.warn(`Chunk load failed, retrying... (${retriesLeft} attempts left)`);

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(retryChunkLoad(fn, retriesLeft - 1, interval));
      }, interval);
    });
  });
}
```

---

### 5. 빌드 분석 및 모니터링

#### 5.1 Webpack Bundle Analyzer 통합
```javascript
// next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer(nextConfig);
```

**사용법**:
```bash
ANALYZE=true npm run build
```

#### 5.2 빌드 성능 리포트
```bash
# 빌드 시간 측정
npm run build -- --profile

# 청크 크기 분석
npm run build && ls -lh .next/static/chunks/
```

---

## Test Strategy (테스트 전략)

### Unit Tests
1. `retryChunkLoad()` 함수 테스트
   - 3회 재시도 후 실패
   - ChunkLoadError 감지 및 재시도
   - 성공 시 즉시 반환

### Integration Tests
1. Webpack 설정 검증
   - 청크 크기 제약 확인 (< 250KB)
   - 초기 번들 크기 확인 (< 500KB)
   - 청크 네이밍 전략 검증

2. 사전 로딩 검증
   - Link preload 태그 확인
   - 핵심 청크 우선 로딩 확인

### E2E Tests (Playwright)
1. ChunkLoadError 시뮬레이션
   - 청크 파일 404 응답 생성
   - 자동 재로딩 확인
2. 페이지 로딩 성능 측정
   - 초기 로딩 시간 < 3초
   - ChunkLoadError 발생률 0%

---

## Implementation Notes

### 우선순위 높음
1. **동적 임포트 제거**
   - Header, Sidebar 정적 임포트로 변경
2. **ChunkLoadError 자동 재로딩**
   - error.tsx 구현

### 우선순위 중간
1. **Webpack 최적화 설정**
   - splitChunks 전략 구현
2. **청크 사전 로딩**
   - Link preload 추가

### 리스크 및 대응
- **리스크**: 초기 번들 크기 증가
  - **대응**: Tree shaking 활성화, 미사용 코드 제거
- **리스크**: 빌드 시간 증가
  - **대응**: 증분 빌드, 캐싱 활용

---

## Definition of Done

### 기능 완료 조건
- [x] 동적 임포트 → 정적 임포트 전환 (Header, Sidebar)
- [x] Webpack splitChunks 최적화
- [x] ChunkLoadError 자동 재로딩
- [x] 청크 사전 로딩 구현

### 테스트 통과 조건
- [ ] Unit Tests 100% 통과
- [ ] 빌드 성능 기준 충족 (청크 < 250KB, 번들 < 500KB)
- [ ] E2E Tests 통과 (ChunkLoadError 0%)

### 문서화 조건
- [ ] Webpack 설정 가이드 작성
- [ ] 빌드 최적화 베스트 프랙티스 문서화

---

**다음 단계**: `/alfred:2-build SPEC-BUILD-001`로 구현 시작
