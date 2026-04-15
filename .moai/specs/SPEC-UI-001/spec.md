---
id: SPEC-UI-001
version: 0.1.0
status: draft
created: 2026-04-15
updated: 2026-04-15
author: MoAI
priority: high
issue_number: 0
---

# SPEC-UI-001: Design System Foundation

## HISTORY

### v0.1.0 (2026-04-15)
- 최초 작성 (MoAI)
- 교권119 디자인 시스템 Phase 1 기반 정의
- Primary color #FF7210 유지, Modern + Clean 스타일 방향 확정
- 후속 SPEC-UI-002~005 시리즈의 기반 SPEC으로 설계

---

## 1. Overview (개요)

### 1.1 목적 (Why)

교권119 (Kyokwon119) 서비스는 현재 기능은 동작하지만, 4개 도메인(teacher, lawyer, admin, public)에 걸쳐 UI 일관성이 부족하고 통합 디자인 시스템이 부재한 상태이다. 본 SPEC은 도메인 전반의 재디자인을 위한 **Phase 1: 디자인 시스템 기반(foundation)**을 구축한다.

- 브랜드 컬러 `#FF7210`(warm orange)을 보존하면서 Modern + Clean 스타일 확립
- 토큰(색상/타이포/간격/그림자/라운드/z-index) 중앙화
- 공통 UI/Layout 컴포넌트 통일
- 후속 SPEC(UI-002 teacher, UI-003 lawyer, UI-004 admin, UI-005 public)의 기반 제공

### 1.2 배경 (Context)

- **Stack**: Next.js 14 + TypeScript + Tailwind CSS 3.4 + shadcn/ui + Radix UI + Lucide React
- **현황**: shadcn/ui 기본 테마에 의존하여 generic blue/gray 색이 혼재, 토큰 중앙화 부재
- **브랜드 아이덴티티**: Warm orange (#FF7210) — 반드시 유지
- **디자인 지향**: Linear/Notion/Stripe 계열의 minimal & clean, 단 warm tone

### 1.3 범위 요약 (Scope Summary)

- IN: Design tokens, 문서화(`.moai/design/system.md`), 핵심 UI 컴포넌트 리파인, Layout 컴포넌트 정비, 글로벌 스타일
- OUT: 도메인별 페이지 재디자인, 신규 기능, 애니메이션 라이브러리, 풀 WCAG 감사, 반응형 오버홀

---

## 2. EARS Requirements (EARS 요구사항)

### 2.1 Ubiquitous (상시 요구사항)

- **U1**. 시스템은 모든 UI 컴포넌트에 중앙화된 design tokens(color, typography, spacing, shadow, radius, z-index)을 기반으로 한 일관된 스타일을 적용한다.
- **U2**. 시스템은 Primary color scale을 `#FF7210`을 기준으로 50~900 단계로 제공하며, 모든 primary 액션과 브랜드 요소에 본 스케일만을 사용한다.
- **U3**. 시스템은 Neutral palette로 순수 회색(pure gray) 대신 warm stone(warm gray) 계열을 사용한다.
- **U4**. 시스템은 `components/ui/`의 모든 핵심 컴포넌트가 design token 변수만을 참조하도록 한다. (하드코딩된 hex 금지)
- **U5**. 시스템은 `.moai/design/system.md`에 모든 토큰, 사용 가이드, 컴포넌트 구성 규칙, "지양 패턴" 리스트를 문서화한다.

### 2.2 Event-Driven (이벤트 기반)

- **E1**. 사용자가 다크모드 토글을 수행하면 모든 core 컴포넌트의 색상이 CSS 변수 전환을 통해 즉시 light/dark로 반영된다.
- **E2**. 사용자가 interactive Card 또는 Button에 hover할 때, 시스템은 토큰 기반 hover state(예: `bg-primary-600` → `bg-primary-700`)를 적용한다.
- **E3**. 사용자가 Sidebar collapse 버튼을 클릭하면, Sidebar가 축소/확장 상태로 전환되고 role-aware navigation 항목은 유지된다.

### 2.3 State-Driven (상태 기반)

- **S1**. 비동기 데이터 로딩 상태에서, 시스템은 Skeleton 컴포넌트를 표시한다.
- **S2**. 데이터가 없는 상태(empty)에서, 시스템은 `EmptyState` 컴포넌트(아이콘 + 메시지 + 선택적 CTA)를 표시한다.
- **S3**. 에러 바운더리 상태에서, 시스템은 `ErrorState` 컴포넌트를 표시한다.
- **S4**. Badge 컴포넌트는 status prop(`pending`, `in-progress`, `completed`, `urgent`)에 따라 대응되는 색상 variant(Indigo/Teal/Success/Error 계열)를 자동 적용한다.

### 2.4 Optional (선택 요구사항)

- **O1**. Pretendard 폰트는 한글 텍스트에 우선 적용되고, Inter는 영문/숫자에 우선 적용된다. (font fallback chain으로 구현)
- **O2**. Shadow는 Linear 스타일의 매우 부드러운 단계(xs/sm/md/lg)로 제공되며, 경계 정의는 그림자보다 border에 우선 의존한다.
- **O3**. Accent colors(Indigo, Teal)은 status indicator(report/consult state)에 한해 사용된다.

### 2.5 Unwanted (지양 요구사항)

- **X1**. shadcn/ui 기본 테마의 순수 회색(`gray-*`)과 기본 파란색(`blue-*`)이 최종 빌드에 남아있지 않아야 한다.
- **X2**. 컴포넌트 내부에 design token을 우회한 하드코딩된 hex 색상, px 단위 shadow, 임의의 radius 값이 존재하지 않아야 한다.
- **X3**. 기존 페이지의 라우팅/레이아웃 구조가 깨지거나, 로그인/대시보드/리포트 작성/상담 조회 핵심 플로우에서 시각적 regression이 발생하지 않아야 한다.
- **X4**. 본 SPEC 범위에 domain-specific page redesign, 신규 비즈니스 로직, 새로운 npm 의존성 추가는 포함되지 않는다.

---

## 3. Design Tokens (디자인 토큰)

### 3.1 Color

- **Primary scale (from `#FF7210`)**: `primary-50` ~ `primary-900` (10단계)
  - 500 = `#FF7210` (base)
  - OKLCH 기준 lightness/chroma 검증 후 수동 튜닝
- **Neutral scale (warm stone)**: `neutral-50` ~ `neutral-900`
  - pure gray 지양, warm hue bias (Tailwind `stone` 계열 준거)
- **Semantic**:
  - `success` (green), `warning` (amber), `error` (red), `info` (indigo)
- **Accent**:
  - `indigo` (report status), `teal` (consult status)

### 3.2 Typography

- **Fonts**: Pretendard (KO primary), Inter (EN/numeric primary), system fallback
- **Scale**: `display`, `h1`, `h2`, `h3`, `h4`, `h5`, `h6`, `body`, `small`, `caption`, `mono`
- **Loading**: `next/font` 사용 (외부 CDN 의존 최소화, 번들 관리)

### 3.3 Spacing

- Tailwind 기본 4px base scale 유지
- 세부 spacing 규칙은 `.moai/design/system.md`에 문서화

### 3.4 Shadow

- `shadow-xs`, `shadow-sm`, `shadow-md`, `shadow-lg` 4단계
- Linear 스타일: 낮은 opacity, 작은 blur, warm-neutral tinted

### 3.5 Radius

- `radius-sm` = 6px, `radius-md` = 8px, `radius-lg` = 12px, `radius-xl` = 16px, `radius-full` = 9999px
- 기본 컴포넌트는 `radius-md`(8) ~ `radius-lg`(12) 범위 사용

### 3.6 Z-Index

- `z-dropdown` (1000), `z-sticky` (1020), `z-modal` (1040), `z-popover` (1060), `z-tooltip` (1080), `z-toast` (1100)

---

## 4. Components In Scope (대상 컴포넌트)

### 4.1 Core UI (`components/ui/`)

- Button (variant: primary, secondary, ghost, destructive / size: sm, md, lg)
- Input, Textarea, Select, Checkbox, Radio
- Card (plain, interactive, with header/footer)
- Badge (status variants: pending, in-progress, completed, urgent)
- Table (responsive, sortable header)
- Dialog, Sheet (side drawer)
- Toast (via Sonner)
- Tabs, Tooltip
- Skeleton, Avatar

### 4.2 Layout (`components/layout/`)

- DashboardLayout (refined)
- Sidebar (collapsible, role-aware navigation)
- Header (user menu, notifications, search)
- PageHeader (title + description + actions slot) `[NEW]`
- EmptyState `[NEW]`
- ErrorState `[NEW]`

### 4.3 Global Styles

- `app/globals.css`: CSS variables, font-face, base styles
- `app/layout.tsx`: next/font 등록
- `tailwind.config.js`: theme extension

---

## 5. Delta Markers (Brownfield)

- `[MODIFY]` `tailwind.config.js` — theme 확장 (colors, fontFamily, boxShadow, borderRadius, zIndex)
- `[MODIFY]` `app/globals.css` — CSS 변수, 폰트 face, base styles
- `[MODIFY]` `app/layout.tsx` — next/font 등록 (Pretendard, Inter)
- `[MODIFY]` `components/ui/*` — 기존 shadcn 기반 refine (Button, Input, Card, Badge, Table, Dialog, Sheet, Tabs, Tooltip, Skeleton, Avatar, Textarea, Select, Checkbox, Radio)
- `[MODIFY]` `components/layout/header.tsx`, `sidebar.tsx`, `DashboardLayout`
- `[NEW]` `.moai/design/system.md`
- `[NEW]` `components/ui/empty-state.tsx`
- `[NEW]` `components/ui/error-state.tsx`
- `[NEW]` `components/ui/page-header.tsx`
- `[EXISTING]` `app/teacher/**`, `app/lawyer/**`, `app/admin/**`, `app/(public)/**` — 구조 변경 없음, 토큰 상속만

---

## 6. Constraints (제약 사항)

### 6.1 기술 제약

- Tailwind CSS 3.4, shadcn/ui, Radix UI, Lucide React 유지
- 신규 npm 의존성 추가 금지 (Pretendard/Inter는 `next/font`로 해결)
- 개별 컴포넌트 파일은 300 LOC 이하 유지

### 6.2 하위 호환성

- 기존 라우트/페이지/API 변경 없음
- 시각적 변경은 허용되나 레이아웃 깨짐(broken) 금지
- Dark mode light mode 모두 정상 동작

### 6.3 브랜드 제약

- Primary `#FF7210` 보존 (HARD)
- Warm tone 유지, pure gray 및 기본 blue 제거

---

## 7. Exclusions (What NOT to Build)

[HARD] 다음 항목은 본 SPEC 범위에서 명시적으로 제외된다.

- **E-1**. teacher/lawyer/admin 도메인별 페이지 재디자인 → SPEC-UI-002, UI-003, UI-004
- **E-2**. public landing page 재디자인 → SPEC-UI-005
- **E-3**. 신규 비즈니스 로직/기능 추가 (API, DB, 상태관리 변경 없음)
- **E-4**. Framer Motion 등 애니메이션 라이브러리 도입
- **E-5**. 풀 WCAG 2.1 AA 준수 감사 (keyboard nav, ARIA, contrast audit)
- **E-6**. 모바일 앱 또는 Tailwind 기본 breakpoint 오버홀
- **E-7**. 기존 페이지의 구조적 리팩터링 (라우트 변경, 파일 이동)
- **E-8**. 신규 npm 패키지 추가 (Pretendard CDN 로컬 번들링 포함)
- **E-9**. 아이콘 라이브러리 교체 (Lucide React 유지)
- **E-10**. 테스트 프레임워크/E2E 시각 회귀(visual regression) 자동화 도구 도입

---

## 8. Dependencies (의존 관계)

- **선행**: 없음 (Phase 1 foundation)
- **후행**: SPEC-UI-002 (teacher), SPEC-UI-003 (lawyer), SPEC-UI-004 (admin), SPEC-UI-005 (public landing)
- **참고 문서**: `.moai/project/product.md`, `.moai/project/tech.md`, `.moai/project/structure.md`

---

## 9. Success Criteria Summary

- Tailwind config가 `#FF7210` 기반 primary 50-900 스케일을 export
- `.moai/design/system.md` 문서가 모든 토큰과 예시를 포함
- teacher/lawyer/admin 대시보드가 동일한 토큰 기반 스타일로 시각 일관성 확보
- Dark mode 토글 시 모든 core 컴포넌트 정상 동작
- Pretendard (KO) / Inter (EN) 폰트 정상 로드
- 로그인/대시보드/리포트 작성/상담 조회 플로우에서 시각 regression 0건

상세 acceptance 기준은 `acceptance.md` 참조.
