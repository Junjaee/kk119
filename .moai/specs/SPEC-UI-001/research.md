---
spec_id: SPEC-UI-001
version: 0.1.0
created: 2026-04-15
---

# SPEC-UI-001 Research Notes

현 코드베이스의 UI 관련 현황 분석과 참고 자료.

## 1. 현 코드베이스 상태

### 1.1 Tech Stack 확인
- `package.json`: Next.js 14, Tailwind CSS 3.4, shadcn/ui (Radix UI primitives), Lucide React, TypeScript
- 폰트 관련: 현재 `next/font` 사용 여부 / 커스텀 폰트 로딩 상태는 `app/layout.tsx`에서 확인 필요
- 테마 관리: shadcn 기본 `next-themes` 추정

### 1.2 Tailwind 설정
- `tailwind.config.js` (또는 `.ts`) 현재 상태:
  - shadcn 기본 CSS 변수 색상 매핑 사용 가능성 높음 (`primary`, `secondary`, `destructive` 등이 `hsl(var(--primary))` 형태)
  - 커스텀 primary color scale은 아직 미정의 추정
- 확인 필요: `darkMode`, `fontFamily`, `boxShadow`, `borderRadius` extension 상태

### 1.3 Components 디렉토리
- `components/ui/*`: shadcn/ui에서 생성된 40+ 컴포넌트 (Button, Input, Card, Dialog, ... 등)
- `components/layout/*`: DashboardLayout, Header, Sidebar 등 커스텀 레이아웃
- 현재 컴포넌트 파일 내부에 `blue-*`, `gray-*` 하드코딩 여부 확인 필요 (run phase에서 grep)

### 1.4 Global Styles
- `app/globals.css`: Tailwind directives + shadcn CSS 변수 정의
- 다크모드: `.dark` 클래스 기반

---

## 2. 디자인 레퍼런스

### 2.1 스타일 방향: Linear / Notion / Stripe
- **Linear**: 매우 부드러운 shadow (opacity 0.04~0.08), border 기반 정의, monochrome + accent 포인트
- **Notion**: 충분한 여백, warm neutral, 가독성 중심 타이포
- **Stripe**: 명확한 hierarchy, 세밀한 색상 단계, accent 사용 최소화

### 2.2 Warm tone의 구현
- Pure gray (Tailwind `gray-*`) 대신 `stone-*` 또는 warm-biased neutral
- Shadow에 warm tint 주입 (예: `rgba(255, 114, 16, 0.04)` 계열의 미세 tint 또는 warm black `rgba(41, 37, 36, ...)`)

### 2.3 Primary Color Scale 설계 가이드

`#FF7210` (RGB: 255, 114, 16) 분석:
- HSL: ~21°, 100%, 53%
- OKLCH 근사: L 0.72, C 0.18, H 45°

10단계 설계 방향 (가이드라인, 정확한 수치는 run phase에서 확정):
| Step | 역할 | 방향 |
|---|---|---|
| 50 | subtle bg, hover bg | 매우 연한 cream tint |
| 100 | selected bg, tag bg | 연한 peach |
| 200 | disabled primary, subtle border | 밝은 오렌지 |
| 300 | muted primary | 중간 밝기 |
| 400 | secondary emphasis | base보다 약간 밝음 |
| 500 | **base (#FF7210)** | 브랜드 primary |
| 600 | hover button | 약간 어둡게 |
| 700 | active/pressed | 더 어둡게 |
| 800 | text on light bg | 어두운 orange-brown |
| 900 | darkest, dark mode accent | 매우 어두운 |

검증 포인트:
- 500 on white: WCAG AA large text 3:1 이상
- 600 on white: AA normal text 4.5:1 이상 (button text 가독성)
- 50 on primary-500: button bg와 충분한 대비

---

## 3. Pretendard + Inter 적용

### 3.1 next/font 접근
- `next/font/local` 또는 `next/font/google` 사용
- Pretendard: variable font 지원, 한글 포함. Google Fonts 등재 X (2026 기준 확인) → `next/font/local`로 로컬 파일 로드
- Inter: `next/font/google`로 바로 사용 가능, variable 지원

### 3.2 Font fallback chain
```
font-family: var(--font-pretendard), var(--font-inter), system-ui, -apple-system,
             'Segoe UI', Roboto, sans-serif;
```

한글 글리프는 Pretendard에서 우선 해석, 영문/숫자도 Pretendard에 존재하나 Inter를 우선하려면 `unicode-range`로 분리하거나 Pretendard의 라틴 범위를 제외하는 방식 고려. 간단하게는 Pretendard가 라틴도 커버하므로 Inter를 보조로만 사용하는 것도 가능 (단순화 권장).

### 3.3 로컬 파일 위치
- `public/fonts/Pretendard-Variable.woff2` (또는 `app/fonts/`)
- 신규 npm 의존성 없음 (파일 자체는 정적 asset)

---

## 4. Shadow 설계 (Linear-style)

```
--shadow-xs: 0 1px 2px 0 rgba(41, 37, 36, 0.04);
--shadow-sm: 0 1px 3px 0 rgba(41, 37, 36, 0.06), 0 1px 2px -1px rgba(41, 37, 36, 0.04);
--shadow-md: 0 4px 6px -1px rgba(41, 37, 36, 0.06), 0 2px 4px -2px rgba(41, 37, 36, 0.04);
--shadow-lg: 0 10px 15px -3px rgba(41, 37, 36, 0.08), 0 4px 6px -4px rgba(41, 37, 36, 0.04);
```
- warm black base (stone-900: `#292524`)
- opacity 매우 낮음 (0.04-0.08)

---

## 5. Badge Status Variants

| Status | Color family | 사용처 |
|---|---|---|
| pending | indigo (신규 대기) | 신규 리포트, 미배정 상담 |
| in-progress | teal (진행 중) | 변호사 응대 중 상담 |
| completed | green (success) | 완료된 상담/리포트 |
| urgent | red (error) | 긴급 처리 필요 |

Primary orange와 충돌 없는 색상 조합 (warm orange + cool indigo/teal + neutral green/red).

---

## 6. 참조 문서
- `.moai/project/product.md` — 제품 목적
- `.moai/project/tech.md` — 기술 스택
- `.moai/project/structure.md` — 디렉토리 구조
- shadcn/ui docs: https://ui.shadcn.com/docs/theming
- Tailwind CSS 3.4 extension: https://tailwindcss.com/docs/theme
- next/font: https://nextjs.org/docs/app/api-reference/components/font

---

## 7. Run Phase 선행 확인 체크리스트

본격 구현 전 확인:
- [ ] 현재 `tailwind.config.js` (또는 `.ts`) 내용 파악
- [ ] 현재 `app/globals.css` CSS 변수 목록
- [ ] `components/ui/` 내부 `blue-*`, `gray-*`, 하드코딩 hex 검출 (grep)
- [ ] `app/layout.tsx` 현재 폰트 처리 방식
- [ ] 다크모드 provider/hook 위치 확인
- [ ] 기존 Badge 컴포넌트 variant API 파악 (기존 사용처 영향 최소화)
