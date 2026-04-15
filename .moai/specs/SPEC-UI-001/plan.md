---
spec_id: SPEC-UI-001
version: 0.1.0
created: 2026-04-15
updated: 2026-04-15
---

# SPEC-UI-001 Implementation Plan

## 1. 구현 전략 (Implementation Strategy)

본 SPEC은 **brownfield refactor**로, 기존 Next.js 14 + shadcn/ui 코드베이스에 design token layer를 주입하고 핵심 컴포넌트를 refine한다. 전략은 다음과 같다.

1. **Token-first**: 먼저 토큰을 정의(`tailwind.config.js`, CSS 변수)
2. **Documentation-parallel**: `.moai/design/system.md`를 토큰 작업과 병행 작성
3. **Component-incremental**: Core UI → Layout 순으로 점진 refine (변경 단위 작게)
4. **Visual regression watch**: 주요 플로우(로그인/대시보드/리포트/상담) 수동 확인 후 단계 종료

### 1.1 핵심 의사결정 (Key Decisions)

| 항목 | 선택 | 근거 |
|---|---|---|
| Primary color scale 생성 | 수동 튜닝 + OKLCH 검증 | 자동 생성은 warm orange에서 perceptual uniformity가 깨짐. lightness/chroma 수동 조정 필요 |
| Pretendard 배포 | `next/font` + Pretendard variable | 외부 CDN 의존 최소화, SSR-safe, 자동 최적화. 신규 npm 의존성 없음 |
| Dark mode 전략 | CSS 변수 기반 (shadcn 표준) | 기존 shadcn 관례 유지, 런타임 전환 비용 최소 |
| shadcn 컴포넌트 업데이트 | 기존 파일 수정 + git 추적 | variant 추가 방식은 generic 스타일이 잔존. 직접 수정 후 diff 리뷰 |
| 문서화 범위 | 단일 파일 `.moai/design/system.md` + examples 섹션 | Phase 1 범위에 맞는 단일 진실원. 다중 파일은 Phase 2+에서 분리 고려 |

---

## 2. 마일스톤 (Milestones)

우선순위 기반 (시간 추정 없음).

### Milestone M1 — Token Foundation (Priority: HIGH)
- Primary color scale 50-900 정의 (`#FF7210` 중심, OKLCH 검증)
- Neutral warm stone scale 정의
- Semantic (success/warning/error/info) 및 Accent (indigo/teal) 색상 정의
- Typography scale, Spacing 규칙, Shadow scale, Radius scale, Z-index scale 정의
- 산출물: `tailwind.config.js` 확장, `app/globals.css` CSS 변수

### Milestone M2 — Font & Global Styles (Priority: HIGH)
- `next/font`로 Pretendard + Inter 등록
- `app/layout.tsx`에 font variable 주입
- `app/globals.css` base styles (body, heading, link, focus ring) 정리
- 다크모드 CSS 변수 정비

### Milestone M3 — Design Documentation (Priority: HIGH)
- `.moai/design/system.md` 작성
- 디자인 원칙 (Modern, Calm, Trustworthy, Warm)
- 모든 토큰 레퍼런스 + 사용 예시
- 컴포넌트 구성 규칙 (Composition rules)
- "Defaults to avoid" 리스트 (generic blue, pure gray, heavy shadow 등)

### Milestone M4 — Core UI Component Refinement (Priority: HIGH)
- Button, Input, Textarea, Select, Checkbox, Radio
- Card, Badge, Table
- Dialog, Sheet, Toast, Tabs, Tooltip
- Skeleton, Avatar
- 모든 컴포넌트는 token-only 스타일 (하드코딩 hex 제거)

### Milestone M5 — Layout Component Refinement (Priority: MEDIUM)
- Header (user menu, notifications, search slot)
- Sidebar (collapsible, role-aware nav)
- DashboardLayout
- `[NEW]` PageHeader, EmptyState, ErrorState

### Milestone M6 — Regression Check & Polish (Priority: MEDIUM)
- 로그인 / 대시보드(4 domains) / 리포트 작성 / 상담 조회 수동 시각 확인
- Dark mode 토글 확인
- 한글(Pretendard)/영문(Inter) 폰트 적용 확인
- 하드코딩 잔재 grep 검사 (`#[0-9a-fA-F]{6}` 등)

---

## 3. 기술 접근 (Technical Approach)

### 3.1 Color scale generation

`#FF7210` → HSL/OKLCH 분석 후 50-900 스케일 설계:
- 50: 아주 밝은 warm cream tint (배경/subtle bg)
- 100-200: hover/selected background
- 300-400: disabled/muted primary
- 500: base (#FF7210)
- 600-700: hover/active primary button
- 800-900: text on light, dark mode primary accent

WCAG contrast ratio (4.5:1 for text) 검증 포인트: 500 on white, 600 on primary-50.

### 3.2 Tailwind config 확장 패턴

```js
// 예시 구조 (실제 구현은 run phase에서)
theme: {
  extend: {
    colors: { primary: { 50: '...', ..., 900: '...' }, neutral: {...}, ... },
    fontFamily: { sans: ['var(--font-pretendard)', 'var(--font-inter)', 'system-ui'] },
    boxShadow: { xs: '...', sm: '...', md: '...', lg: '...' },
    borderRadius: { sm: '6px', md: '8px', lg: '12px', xl: '16px' },
    zIndex: { dropdown: 1000, sticky: 1020, modal: 1040, popover: 1060, tooltip: 1080, toast: 1100 },
  }
}
```

### 3.3 CSS variables 전략

- `:root`에 light mode 토큰, `.dark`에 dark mode 토큰
- shadcn convention 유지 (`--background`, `--foreground`, `--primary`, ...)
- Tailwind의 `hsl(var(--primary))` 패턴 사용

### 3.4 컴포넌트 리파인 원칙

- variant 정의에서 generic `blue-*`, `gray-*` 제거 → `primary-*`, `neutral-*`
- focus ring: `ring-primary-500` 기반, offset 2px
- disabled: `opacity-50 cursor-not-allowed` + color token
- hover: 100 단계 증가 (500→600, 600→700)

---

## 4. 리스크 (Risks)

| 리스크 | 영향 | 완화 방안 |
|---|---|---|
| 기존 페이지에 shadcn 기본 색상(`text-blue-500` 등) 하드코딩 잔존 | 시각 inconsistency 잔존 | Phase 1 scope 유지 (toke layer만), 감지된 하드코딩은 `[EXISTING]` 페이지에 리스트만 기록하고 SPEC-UI-002+에서 정리 |
| Primary orange와 semantic red의 색상 충돌 (warm hue 유사) | 상태 인지 저하 | semantic error는 saturated red (예: `#E11D48` 계열)로 명확 차별화, shadow/icon으로 구분 보강 |
| Pretendard/Inter 폰트 로드 지연 (FOUT/FOIT) | 초기 렌더 깨짐 | `next/font` `display: swap` + variable fallback chain으로 system-ui 선행 표시 |
| Dark mode 토큰 누락 | 다크 테마 가독성 저하 | 모든 토큰에 light/dark 쌍 정의 의무화, `.moai/design/system.md`에 쌍 표기 |
| 신규 컴포넌트(EmptyState/ErrorState/PageHeader) 사용처 없어 검증 어려움 | dead code | 리포트/상담/회원관리 페이지의 empty/error 케이스 수동 재현 후 확인 (코드 변경 없이 시연만) |

---

## 5. 검증 전략 (Verification Strategy)

- **Token 검증**: grep으로 하드코딩 hex/rgb 탐지 (`components/` 하위)
- **시각 검증**: 로그인, 4개 대시보드, 리포트 작성, 상담 조회 스크린샷 대조 (before/after)
- **Dark mode 검증**: 모든 core 컴포넌트 Storybook-less 수동 확인 (dev 페이지 임시 활용 또는 기존 페이지에서 토글)
- **Font 검증**: 한글 UI 렌더에서 Pretendard 로드 DevTools 확인, 영문 숫자에서 Inter 확인
- **Regression 검증**: 기존 e2e/수동 플로우에서 broken layout 0건

---

## 6. Agent Delegation (후속 run phase용)

- **expert-frontend**: Tailwind config 확장, CSS variables, 컴포넌트 리파인 주도
- **agency-designer**: 토큰 수치 튜닝(OKLCH), `.moai/design/system.md` 작성
- **manager-quality**: 하드코딩 탐지/시각 regression 체크

백엔드/DB 변경 없음 → expert-backend 참여 불필요.

---

## 7. Out of Scope (이 Plan에서 다루지 않음)

- 도메인별 페이지 재작업
- 애니메이션/transition 정의 (hover/focus 기본 외)
- Storybook/Chromatic 도입
- 시각 회귀 자동화 도구 (Percy, Playwright visual)
