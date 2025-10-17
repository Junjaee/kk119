---
id: TECH-001
version: 1.0.0
status: active
created: 2025-10-01
updated: 2025-10-17
authors: ["@tech-lead", "@user"]
---

# 교권119 Technology Stack

## HISTORY

### v1.0.0 (2025-10-17)
- **UPDATE**: 실제 기술 스택 및 package.json 의존성 반영
- **AUTHOR**: @user
- **SECTIONS**: Stack, Framework, Quality, Security, Deploy

### v0.1.0 (2025-10-01)
- **INITIAL**: 프로젝트 기술 스택 문서 작성
- **AUTHOR**: @tech-lead
- **SECTIONS**: Stack, Framework, Quality, Security, Deploy

---

## @DOC:STACK-001 언어 & 런타임

### 주 언어 선택

- **언어**: TypeScript
- **버전**: TypeScript 5.x
- **선택 이유**:
  - **타입 안전성**: 컴파일 타임 에러 검출로 런타임 버그 최소화
  - **개발자 경험**: IntelliSense 자동완성 및 리팩토링 지원
  - **코드 유지보수성**: 명시적 타입으로 코드 가독성 향상
  - **Next.js 공식 지원**: Next.js의 기본 TypeScript 지원
- **패키지 매니저**: npm (Node.js 18.0 이상)

### 멀티 플랫폼 지원

| 플랫폼 | 지원 상태 | 검증 도구 | 주요 제약 |
|--------|-----------|-----------|-----------|
| **Windows** | 완전 지원 | 로컬 개발 환경 | SQLite 경로 호환성 필요 |
| **macOS** | 완전 지원 | 로컬 개발 환경 | Node.js 네이티브 모듈 빌드 |
| **Linux** | 완전 지원 | Docker 배포 환경 | 없음 |

---

## @DOC:FRAMEWORK-001 핵심 프레임워크 & 라이브러리

### 1. 주요 의존성

```json
{
  "dependencies": {
    // Frontend Framework
    "next": "^14.2.15",                          // Next.js 14 (App Router)
    "react": "^18.3.1",                          // React 18 (안정 버전)
    "react-dom": "^18.3.1",                      // React DOM

    // UI Components & Styling
    "@radix-ui/react-alert-dialog": "^1.1.15",   // 접근성 우선 컴포넌트
    "@radix-ui/react-avatar": "^1.1.10",
    "@radix-ui/react-checkbox": "^1.3.3",
    "@radix-ui/react-dropdown-menu": "^2.1.16",
    "@radix-ui/react-progress": "^1.1.7",
    "@radix-ui/react-select": "^2.2.6",
    "@radix-ui/react-separator": "^1.1.7",
    "@radix-ui/react-switch": "^1.2.6",
    "@radix-ui/react-tabs": "^1.1.13",
    "tailwindcss": "^3.4.17",                    // 유틸리티 CSS
    "tailwindcss-animate": "^1.0.7",             // 애니메이션 확장
    "class-variance-authority": "^0.7.1",        // 컴포넌트 변형 관리
    "clsx": "^2.1.1",                            // 클래스 이름 유틸리티
    "tailwind-merge": "^3.3.1",                  // Tailwind 클래스 병합
    "lucide-react": "^0.446.0",                  // 아이콘 라이브러리

    // Rich Text Editor
    "@tiptap/react": "^3.4.0",                   // Tiptap 에디터
    "@tiptap/starter-kit": "^3.4.0",
    "@tiptap/extension-color": "^3.4.0",
    "@tiptap/extension-highlight": "^3.4.0",
    "@tiptap/extension-image": "^3.4.0",
    "@tiptap/extension-link": "^3.4.0",
    "@tiptap/extension-placeholder": "^3.4.0",
    "@tiptap/extension-text-align": "^3.4.0",
    "@tiptap/extension-text-style": "^3.4.0",
    "@tiptap/extension-underline": "^3.4.0",

    // State Management & Data Fetching
    "zustand": "^4.5.0",                         // 경량 상태 관리
    "@tanstack/react-query": "^5.51.0",          // 서버 상태 관리

    // Authentication & Security
    "bcryptjs": "^3.0.2",                        // 비밀번호 해싱 (bcrypt 구현)
    "jsonwebtoken": "^9.0.2",                    // JWT 토큰 생성/검증
    "jose": "^6.1.0",                            // 최신 JWT 처리 라이브러리

    // Database
    "better-sqlite3": "^12.2.0",                 // 고성능 SQLite 드라이버

    // Utilities
    "dayjs": "^1.11.0",                          // 날짜/시간 처리
    "react-hook-form": "^7.52.0",                // 폼 상태 관리
    "zod": "^3.23.0",                            // 스키마 검증
    "react-markdown": "^9.0.0",                  // 마크다운 렌더링
    "react-hot-toast": "^2.4.0",                 // 토스트 알림
    "sonner": "^2.0.7",                          // 알림 라이브러리
    "web-vitals": "^5.1.0"                       // 웹 성능 측정
  }
}
```

### 2. 개발 도구

```json
{
  "devDependencies": {
    // TypeScript
    "typescript": "^5",                          // TypeScript 5 안정 버전
    "@types/node": "^20",                        // Node.js 타입 정의
    "@types/react": "^19",                       // React 타입 정의
    "@types/react-dom": "^19",                   // React DOM 타입 정의
    "@types/bcryptjs": "^2.4.6",                 // bcryptjs 타입
    "@types/jsonwebtoken": "^9.0.10",            // JWT 타입
    "@types/better-sqlite3": "^7.6.13",          // SQLite 타입

    // Linting & Code Quality
    "eslint": "^9",                              // ESLint 최신 버전
    "eslint-config-next": "15.5.2",              // Next.js ESLint 설정
    "@eslint/eslintrc": "^3",                    // ESLint 설정

    // Testing
    "@playwright/test": "^1.55.1",               // E2E 테스트
    "playwright": "^1.55.1",                     // Playwright 브라우저

    // Build Tools
    "postcss": "^8.5.6",                         // CSS 후처리
    "autoprefixer": "^10.4.21",                  // CSS 벤더 프리픽스
    "sharp": "^0.34.4"                           // 이미지 최적화
  }
}
```

### 3. 빌드 시스템

- **빌드 도구**: Next.js 빌드 시스템 (Webpack / Turbopack)
- **번들링**:
  - **개발**: Turbopack (고속 개발 서버)
  - **프로덕션**: Webpack (최적화된 번들)
- **타겟**: 브라우저 (ES2020), Node.js (18.0+)
- **성능 목표**:
  - **개발 서버 시작**: < 3초
  - **HMR (Hot Module Replacement)**: < 100ms
  - **프로덕션 빌드**: < 2분

---

## @DOC:QUALITY-001 품질 게이트 & 정책

### 테스트 커버리지

- **목표**: 85% 이상
- **측정 도구**: Vitest (향후 도입 예정)
- **실패 시 대응**: 커버리지 미달 시 PR 리뷰 강화

### 정적 분석

| 도구 | 역할 | 설정 파일 | 실패 시 조치 |
|------|------|-----------|--------------|
| **ESLint** | 코드 품질 검사 | `.eslintrc.json` | 에러 수정 필수 |
| **TypeScript** | 타입 검증 | `tsconfig.json` | 컴파일 에러 수정 필수 |
| **Playwright** | E2E 테스트 | `playwright.config.ts` | 테스트 실패 시 배포 중단 |

### 자동화 스크립트

```bash
# 품질 검사 파이프라인
npm run lint                         # ESLint 코드 품질 검사
npm run build                        # TypeScript 컴파일 + Next.js 빌드
npm run test:e2e                     # Playwright E2E 테스트
```

### 코드 품질 규칙

- **파일당 최대 LOC**: 300줄
- **함수당 최대 LOC**: 50줄
- **함수 매개변수**: 최대 5개
- **복잡도 (Cyclomatic Complexity)**: 최대 10

---

## @DOC:SECURITY-001 보안 정책 & 운영

### 비밀 관리

- **정책**: 환경 변수 (.env.local)로 비밀 관리
- **도구**: `.env.local` (로컬), 환경변수 (프로덕션)
- **검증**: `.env.example` 템플릿 제공

```bash
# .env.local 예시
JWT_SECRET=your-secret-key-here
DATABASE_PATH=./data/kyokwon119.db
CONSULT_DB_PATH=./data/consult.db
```

### 의존성 보안

```json
{
  "security": {
    "audit_tool": "npm audit",
    "update_policy": "주간 보안 업데이트 확인",
    "vulnerability_threshold": "high 이상 즉시 수정"
  }
}
```

**보안 검사 명령어**:
```bash
npm audit                            # 보안 취약점 검사
npm audit fix                        # 자동 수정 가능한 취약점 수정
npm audit fix --force                # 강제 업데이트
```

### 로깅 정책

- **로그 수준**:
  - **개발**: `debug` (모든 로그 출력)
  - **프로덕션**: `warning` (경고 이상만 출력)
- **민감정보 마스킹**:
  - 비밀번호: 절대 로그 출력 금지
  - 이메일: 마스킹 처리 (`u***@example.com`)
  - JWT 토큰: 앞 6자리만 출력 (`abc123...`)
- **보존 정책**: 로컬 파일 로그 7일 보관

### 인증 보안

- **bcrypt**: 비밀번호 해싱 (salt rounds: 10)
- **JWT**: 토큰 만료 시간 15분 (리프레시 토큰: 7일)
- **세션 동기화**: localStorage + HttpOnly 쿠키 이중 저장
- **HTTPS**: 프로덕션 환경 필수
- **CORS**: 동일 출처 정책 적용

---

## @DOC:DEPLOY-001 배포 채널 & 전략

### 1. 배포 채널

- **주 채널**: Docker 컨테이너 기반 배포
- **릴리스 절차**:
  1. 로컬 테스트 (E2E 통과 확인)
  2. 프로덕션 빌드 (`npm run build`)
  3. Docker 이미지 생성 (`npm run docker:build`)
  4. 컨테이너 실행 (`npm run docker:run`)
- **버전 정책**: Semantic Versioning (v0.1.0 → v1.0.0)
- **rollback 전략**: Docker 이미지 태그 기반 이전 버전 롤백

### 2. 개발 설치

```bash
# 개발자 모드 설정
git clone https://github.com/Junjaee/kk119.git
cd kk119

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env.local

# 개발 서버 실행 (Turbopack 권장)
npm run dev:turbo
```

### 3. CI/CD 파이프라인

| 단계 | 목적 | 사용 도구 | 성공 조건 |
|------|------|-----------|-----------|
| **Lint** | 코드 품질 검사 | ESLint | 에러 0개 |
| **Build** | TypeScript 컴파일 | Next.js | 빌드 성공 |
| **Test** | E2E 테스트 | Playwright | 모든 테스트 통과 |
| **Deploy** | 배포 | Docker | 컨테이너 정상 실행 |

---

## 환경별 설정

### 개발 환경 (`dev`)

```bash
export NODE_ENV=development
export LOG_LEVEL=debug
npm run dev:turbo
```

**특징**:
- Turbopack 사용 (빠른 HMR)
- 디버그 로그 출력
- 소스맵 포함

### 테스트 환경 (`test`)

```bash
export NODE_ENV=test
export LOG_LEVEL=info
npm run test:e2e
```

**특징**:
- E2E 테스트 실행
- Mock 데이터 사용
- 테스트 커버리지 측정

### 프로덕션 환경 (`production`)

```bash
export NODE_ENV=production
export LOG_LEVEL=warning
npm run build && npm start
```

**특징**:
- 최적화된 번들
- 에러 로그만 출력
- HTTPS 필수

---

## @CODE:TECH-DEBT-001 기술 부채 관리

### 현재 기술 부채

1. **테스트 커버리지 부족** - 단위 테스트 미구현 (우선순위: 높음)
2. **API 버전 관리 부재** - API 엔드포인트 버전 네임스페이스 없음 (우선순위: 중간)
3. **로그 수집 시스템 부재** - 프로덕션 로그 중앙 집중화 필요 (우선순위: 중간)
4. **캐싱 레이어 부재** - Redis 등 캐시 시스템 미도입 (우선순위: 낮음)
5. **파일 업로드 최적화** - 클라우드 스토리지 미연동 (우선순위: 중간)

### 개선 계획

- **단기 (1개월)**:
  - Vitest 도입 및 핵심 로직 단위 테스트 작성
  - API 엔드포인트 버전 분리 (`/api/v1/...`)
  - 로그 포맷 표준화

- **중기 (3개월)**:
  - E2E 테스트 커버리지 80% 달성
  - AWS S3 또는 클라우드 파일 저장소 연동
  - Redis 캐싱 레이어 도입

- **장기 (6개월+)**:
  - PostgreSQL 마이그레이션 준비
  - WebSocket 실시간 알림 구현
  - 마이크로서비스 아키텍처 검토

---

## @DOC:LIBRARY-VERSIONS-001 라이브러리 버전 정책

### 버전 업데이트 정책

- **Major 버전**: 안정성 확인 후 3개월 이내 업데이트
- **Minor 버전**: 보안 패치 포함 시 즉시 업데이트
- **Patch 버전**: 주간 단위 검토 후 업데이트

### 주요 라이브러리 버전 확인 (2025-10-17 기준)

| 라이브러리 | 현재 버전 | 최신 안정 버전 | 업데이트 여부 |
|-----------|----------|---------------|--------------|
| Next.js | 14.2.15 | 15.5.2 | 검토 필요 (Major) |
| React | 18.3.1 | 19.1.0 | 검토 필요 (Major) |
| TypeScript | 5.x | 5.x | 최신 |
| Tailwind CSS | 3.4.17 | 3.4.17 | 최신 |
| Playwright | 1.55.1 | 1.55.1 | 최신 |

**참고**: package.json에 명시된 버전은 프로덕션 안정 버전 기준입니다.

---

## EARS 기술 요구사항 작성법

### 기술 스택에서의 EARS 활용

기술적 의사결정과 품질 게이트 설정 시 EARS 구문을 활용하여 명확한 기술 요구사항을 정의하세요:

#### 기술 스택 EARS 예시
```markdown
### Ubiquitous Requirements (기본 기술 요구사항)
- 시스템은 TypeScript 타입 안전성을 보장해야 한다
- 시스템은 Next.js 14 App Router 기반으로 구현해야 한다
- 시스템은 SQLite 데이터베이스를 사용해야 한다

### Event-driven Requirements (이벤트 기반 기술)
- WHEN 코드가 커밋되면, 시스템은 ESLint를 실행해야 한다
- WHEN 빌드가 실패하면, 시스템은 개발자에게 즉시 알림을 보내야 한다
- WHEN 보안 취약점이 발견되면, 시스템은 자동으로 이슈를 생성해야 한다

### State-driven Requirements (상태 기반 기술)
- WHILE 개발 모드일 때, 시스템은 hot-reload를 제공해야 한다
- WHILE 프로덕션 모드일 때, 시스템은 최적화된 빌드를 생성해야 한다
- WHILE 테스트 실행 중일 때, 시스템은 Mock 데이터를 사용해야 한다

### Optional Features (선택적 기술)
- WHERE Docker 환경이면, 시스템은 컨테이너 기반 배포를 지원할 수 있다
- WHERE 트래픽이 증가하면, 시스템은 Redis 캐싱을 적용할 수 있다
- WHERE 파일 용량이 증가하면, 시스템은 S3 스토리지로 전환할 수 있다

### Constraints (기술적 제약사항)
- IF 의존성에 보안 취약점이 발견되면, 시스템은 빌드를 중단해야 한다
- 파일당 LOC는 300줄을 초과하지 않아야 한다
- 함수 복잡도는 10을 초과하지 않아야 한다
- API 응답시간은 200ms를 초과하지 않아야 한다
```

---

_이 기술 스택은 `/alfred:2-build` 실행 시 TDD 도구 선택과 품질 게이트 적용의 기준이 됩니다._
