# 교권119 Design System

**SPEC**: SPEC-UI-001 (Design System Foundation)
**Version**: 0.1.0
**Last Updated**: 2026-04-15
**Status**: Production Foundation

This document is the single source of truth for design tokens, component composition rules, and UI craft decisions in 교권119. It is maintained by MoAI agents and updated whenever tokens or foundational patterns change.

---

## 1. 디자인 원칙

4가지 핵심 원칙을 모든 컴포넌트와 페이지에 일관되게 적용한다.

### Modern
모던한 UI는 불필요한 장식을 제거하고 본질적인 정보 계층을 드러낸다. 얇은 테두리, 부드러운 그림자, 넉넉한 여백을 사용한다. Linear, Notion, Stripe의 디자인 언어를 벤치마크로 삼는다.

### Calm
교권119는 교사가 힘든 순간에 찾는 서비스다. 과도한 대비나 강한 액센트를 피하고, 차분한 톤의 warm color를 기반으로 한다. 애니메이션은 짧고(150~300ms) 명확한 목적이 있을 때만 사용한다.

### Trustworthy
신뢰는 일관성에서 나온다. 모든 컴포넌트가 동일한 토큰을 사용하고, 동일한 상호작용 패턴을 따른다. 컬러/타이포/여백은 "왜 이 값인가"를 설명할 수 있어야 한다.

### Warm
Pure gray와 generic blue 대신 warm stone(뉴트럴)과 브랜드 오렌지(#FF7210)를 중심으로 구성한다. 차갑거나 기계적인 느낌을 피하고, 인간적이고 배려있는 분위기를 유지한다.

---

## 2. Color Tokens

### 2.1 Primary Scale (브랜드 오렌지)

`#FF7210`은 교권119의 코어 브랜드 컬러이며 `primary-500`으로 고정되어 있다. 수동 튜닝 + OKLCH 검증을 거쳤고, `primary-700` 이상에서 WCAG AA 4.5:1 대비를 만족한다.

| Token | Hex | CSS Variable | 주 용도 |
|---|---|---|---|
| `primary-50`  | `#FFF7F0` | `--primary-50`  | 매우 연한 배경 (카드 hover, alert bg) |
| `primary-100` | `#FFE9D6` | `--primary-100` | 연한 accent 배경 |
| `primary-200` | `#FFCFAB` | `--primary-200` | 테두리, divider |
| `primary-300` | `#FFAE7A` | `--primary-300` | 보조 강조 |
| `primary-400` | `#FF8C4A` | `--primary-400` | 다크모드 primary |
| `primary-500` | `#FF7210` | `--primary-500` | **브랜드 코어, CTA, 기본 primary** |
| `primary-600` | `#E65F0A` | `--primary-600` | Hover state |
| `primary-700` | `#C24B06` | `--primary-700` | Active state, text on light bg |
| `primary-800` | `#943804` | `--primary-800` | 깊은 강조 |
| `primary-900` | `#6B2803` | `--primary-900` | 다크모드 배경 |

사용 예:
```tsx
<Button className="bg-primary-500 hover:bg-primary-600 text-white">신고하기</Button>
<p className="text-primary-700">브랜드 톤의 링크 텍스트</p>
```

### 2.2 Neutral Scale (Warm Stone)

Pure gray(#808080 계열)가 아닌 warm stone을 사용하여 따뜻한 톤을 유지한다. Tailwind stone 팔레트 기반.

| Token | Hex | 주 용도 |
|---|---|---|
| `neutral-50`  | `#FAF9F7` | 배경 highlight |
| `neutral-100` | `#F5F3F0` | 카드 배경, divider bg |
| `neutral-200` | `#E8E4DF` | 기본 border |
| `neutral-300` | `#D5CFC8` | 입력 필드 border |
| `neutral-400` | `#A8A199` | placeholder, disabled text |
| `neutral-500` | `#78716C` | 보조 텍스트 (muted-foreground) |
| `neutral-600` | `#57524E` | 본문 보조 |
| `neutral-700` | `#44403C` | 다크모드 카드 배경 |
| `neutral-800` | `#292524` | 다크모드 표면 |
| `neutral-900` | `#1C1917` | 다크모드 배경 |
| `neutral-950` | `#0C0A0A` | 다크모드 깊은 배경 |

### 2.3 Semantic Colors

| 목적 | 팔레트 | 500 | 600 | 비고 |
|---|---|---|---|---|
| Success | emerald | `#10B981` | `#059669` | 완료, 승인, 긍정 |
| Warning | amber | `#F59E0B` | `#D97706` | 주의, 검토 필요 |
| Error | **rose** | `#F43F5E` | `#E11D48` | 오렌지 primary와 혼동 방지 — rose 계열 사용 |
| Info | indigo | `#6366F1` | `#4F46E5` | 안내, 진행 중 |

**중요**: Error는 red가 아닌 **rose**를 사용한다. Primary 오렌지와 시각적으로 충분히 구분되어야 한다.

### 2.4 Accent Colors

상태 표시와 차트에 사용.

| Token | Hex | 용도 |
|---|---|---|
| `indigo-500` | `#6366F1` | Info 아이콘, 링크 accent |
| `teal-500` | `#14B8A6` | 변호사/법률 섹션 accent |

### 2.5 Legacy Alias (호환용)

기존 컴포넌트 호환을 위해 다음 alias가 유지된다. **신규 코드는 직접 semantic 컬러 사용 권장.**

| Legacy | 실제 매핑 |
|---|---|
| `protection-*` | `info-*` (indigo) |
| `urgent-*`     | `error-*` (rose) |
| `trust-*`      | `success-*` (emerald) |

---

## 3. Typography

### 3.1 Font Stack

```
Pretendard Variable → Pretendard → Inter → -apple-system →
BlinkMacSystemFont → system-ui → Apple SD Gothic Neo → Malgun Gothic → sans-serif
```

**Pretendard**는 CDN(jsdelivr)으로 로드한다 (`app/layout.tsx`). 네트워크 실패 시 시스템 한글 폰트(Apple SD Gothic Neo, Malgun Gothic)로 graceful degradation.

> 결정: SPEC은 `next/font`를 권장하지만 현재 환경은 네트워크 다운로드 불가. 기존 CDN link 방식을 유지하고 variable 폰트 서브셋을 우선 로드하도록 업데이트함. 향후 `next/font/local` 마이그레이션을 SPEC-UI-002 범위로 추천.

### 3.2 Type Scale

| Token | Size / Line-height | Weight | Letter-spacing | 용도 |
|---|---|---|---|---|
| `text-display` | 36 / 44 | 700 | -0.02em  | 랜딩 hero, 큰 페이지 타이틀 |
| `text-h1`      | 30 / 38 | 700 | -0.02em  | 페이지 타이틀 |
| `text-h2`      | 24 / 32 | 600 | -0.015em | 섹션 타이틀 |
| `text-h3`      | 20 / 28 | 600 | -0.01em  | 카드 제목, 서브섹션 |
| `text-body`    | 16 / 24 | 400 | 0        | 본문 |
| `text-small`   | 14 / 20 | 400 | 0        | 보조 텍스트, 라벨 |
| `text-caption` | 12 / 16 | 500 | 0        | 메타 정보, 뱃지 |

사용 예:
```tsx
<h1 className="text-h1 md:text-display">교사의 권리, 우리가 지킵니다</h1>
<p className="text-body text-neutral-600">본문 내용은 여기에</p>
<span className="text-caption text-neutral-500">2026.04.15</span>
```

### 3.3 한글 최적화

- `word-break: keep-all` — 단어 중간 개행 방지
- `letter-spacing: -0.01em` — 한글 자간 미세 조정
- `line-height: 1.6` — 본문 기본, 헤딩은 1.25

유틸리티: `.word-break-keep-all`, `.text-korean`

---

## 4. Spacing

Tailwind 기본 4px 베이스 유지. 컴포넌트/레이아웃별 권장 값은 아래와 같다.

| 맥락 | 권장 스페이싱 |
|---|---|
| 아이콘과 텍스트 간격 | `gap-2` (8px) |
| 인라인 요소 사이 | `gap-2` ~ `gap-3` (8~12px) |
| 카드 내부 패딩 | `p-4` ~ `p-6` (16~24px) |
| 카드 사이 간격 | `gap-4` ~ `gap-6` (16~24px) |
| 섹션 사이 간격 | `py-8` ~ `py-12` (32~48px) |
| 페이지 수직 패딩 | `py-6` ~ `py-10` (24~40px) |
| 입력 필드 수직 | `py-2.5` (10px) |
| 버튼 수평 패딩 | `px-4` ~ `px-6` (16~24px) |

---

## 5. Shadow

Linear-style 매우 부드러운 그림자. 과도한 depth는 모던함을 해친다.

| Token | Value | 언제 사용 |
|---|---|---|
| `shadow-xs` | `0 1px 2px rgba(0,0,0,.04)` | 입력 필드, 살짝 들린 요소 |
| `shadow-sm` | `0 1px 3px .06, 0 1px 2px .04` | 기본 카드 |
| `shadow-md` | `0 4px 6px -1px .07, 0 2px 4px -2px .04` | Hover state, dropdown |
| `shadow-lg` | `0 10px 15px -3px .08, 0 4px 6px -4px .04` | 모달, 팝오버 |
| `shadow-xl` | `0 20px 25px -5px .08, 0 8px 10px -6px .03` | 강조 카드, floating action |
| `shadow-2xl` | `0 25px 50px -12px .15` | **거의 사용하지 않음** — 과한 depth |

권장 패턴: 기본은 `shadow-sm`, hover는 `shadow-md`. `shadow-xl` 이상은 특수 상황만.

---

## 6. Radius

| Token | Value | 용도 |
|---|---|---|
| `rounded-sm`   | 6px  | 인풋, 작은 뱃지 |
| `rounded-md`   | 8px  | **기본값** — 버튼, 카드, 입력 필드 |
| `rounded-lg`   | 12px | 대형 카드, 모달 |
| `rounded-xl`   | 16px | 히어로 카드, 프로모션 |
| `rounded-full` | 9999px | 아바타, pill 뱃지만 |

권장: 기본은 `rounded-md` 또는 `rounded-lg`. `rounded-full`은 원형 아바타나 status pill에만 한정.

---

## 7. Z-index Layers

| Token | Value | 용도 |
|---|---|---|
| `z-dropdown` | 1000 | Select, Dropdown menu |
| `z-sticky`   | 1020 | Sticky header, nav |
| `z-modal`    | 1040 | Dialog backdrop + content |
| `z-popover`  | 1060 | Popover, hover card |
| `z-tooltip`  | 1080 | Tooltip |
| `z-toast`    | 1100 | Toast notification (최상위) |

---

## 8. Component Composition Rules

### Buttons in Forms
- Primary action은 우측, secondary는 좌측 또는 primary 옆
- Cancel/Back 버튼은 `variant="ghost"` 또는 `variant="outline"`
- 폼 제출 버튼은 full width 지양, 컨테이너 폭 200~320px

### Card / List Rows
- 카드 hover: `hover:shadow-md hover:border-primary-200` (translate-y 지양)
- 리스트 행 hover: `hover:bg-neutral-50 dark:hover:bg-neutral-900`
- 카드 사이 간격: `gap-4` (기본), `gap-6` (여유)

### Modal / Dialog
- Backdrop: `bg-neutral-900/50 dark:bg-neutral-950/70 backdrop-blur-sm`
- Content: `bg-card shadow-xl rounded-lg max-w-md` (기본), `max-w-2xl` (큰 내용)
- 닫기 버튼은 우측 상단, `variant="ghost" size="icon"`

### Tables
- 헤더 배경: `bg-neutral-50 dark:bg-neutral-900`
- 행 구분: `divide-y divide-border` (border-bottom 패턴)
- 행 hover: `hover:bg-neutral-50/60 dark:hover:bg-neutral-900/40`
- 반응형 미지원 시 `overflow-x-auto` 컨테이너로 감싸기

### Status Indicators
- Badge + dot 조합으로 상태 표현: `<Badge variant="success" dot>완료</Badge>`
- 5가지 표준 상태: `pending`, `in-progress`, `completed`, `urgent`, `default`

---

## 9. Defaults to Avoid (명시적 거부)

다음 패턴은 **의도적으로 사용하지 않는다**. 유혹이 있을 때마다 상위 토큰으로 대체.

| 거부 패턴 | 이유 | 대체 |
|---|---|---|
| `text-gray-500`, `bg-gray-100` | Pure gray는 차갑고 기계적 | `text-neutral-500`, `bg-neutral-100` (warm stone) |
| `text-blue-600` (링크) | 기본 OS 링크 컬러, 브랜드 정체성 없음 | `text-primary-600` |
| `bg-red-500` (에러) | Primary 오렌지와 시각적 구분 약함 | `bg-error-500` (rose) |
| `shadow-2xl` | 과도한 depth, Linear-style과 상충 | `shadow-md` 또는 `shadow-lg` |
| `rounded-full` (버튼/카드) | 트렌드 편향, 정보 경계 흐림 | `rounded-md` 또는 `rounded-lg` |
| `animate-bounce`, 긴 애니메이션 | Calm 원칙 위배 | 150~300ms fade/slide만 |
| 하드코딩 hex (`#abcdef`) | 다크모드/테마 불가능 | CSS 변수 또는 토큰 클래스 |

---

## 10. Examples: Before / After

### 10.1 Button

Before (하드코딩, generic blue):
```tsx
<button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full shadow-2xl">
  신고하기
</button>
```

After (토큰 기반, 브랜드 준수):
```tsx
<Button variant="primary" size="default">신고하기</Button>
// 내부 구현:
// bg-primary-500 hover:bg-primary-600 text-white
// px-6 py-2 rounded-md shadow-sm hover:shadow-md
```

### 10.2 Card

Before (generic gray, 과도한 shadow):
```tsx
<div className="bg-white border border-gray-200 rounded-2xl shadow-2xl p-6">
  <h3 className="text-gray-900 font-bold">상담 내역</h3>
  <p className="text-gray-500">지난 주 요약입니다.</p>
</div>
```

After (token, warm neutral):
```tsx
<Card>
  <CardHeader>
    <CardTitle>상담 내역</CardTitle>
    <CardDescription>지난 주 요약입니다.</CardDescription>
  </CardHeader>
</Card>
// 내부:
// rounded-lg border border-border bg-card shadow-sm
// title: text-h3 text-foreground
// desc: text-small text-muted-foreground (neutral-500 기반)
```

### 10.3 Status Badge

Before:
```tsx
<span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
  완료
</span>
```

After:
```tsx
<Badge variant="success" dot>완료</Badge>
// 내부:
// bg-success-50 text-success-700 border border-success-200
// rounded-full px-2.5 py-0.5 text-caption
// dot: bg-success-500
```

---

## 부록: 토큰 파일 위치

- Tailwind 확장: `tailwind.config.js`
- CSS 변수: `app/globals.css` (`:root` + `.dark`)
- 폰트 로딩: `app/layout.tsx`
- 이 문서: `.moai/design/system.md`

SPEC 참조: `.moai/specs/SPEC-UI-001/`
