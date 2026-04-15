---
spec_id: SPEC-UI-005
version: 0.1.0
status: draft
---

# SPEC-UI-005 구현 계획 (Implementation Plan)

## 기술 접근 (Technical Approach)

### 아키텍처 원칙

- **레이아웃 분리**: `app/(public)` 그룹 또는 루트 레벨 공개 페이지 전용 레이아웃 유지, 인증 리다이렉트 방지
- **컴포넌트 계층**:
  - `components/public/` (신규) — `HeroSection`, `FeatureCard`, `TestimonialCard`, `FAQSection`, `AuthCard`, `ErrorPage`
  - SPEC-UI-001의 `components/ui/*` (shadcn base) 재사용
- **번들 경량화**: 랜딩 히어로는 Server Component 우선, 인터랙션 블록만 Client Component
- **스타일**: Tailwind + CSS Custom Properties (디자인 토큰 변수)

### 디자인 패턴

- **Hero**: Large headline (text-5xl ~ text-7xl) + sub + Primary CTA + anchor link
- **Sections order**: Problem → Solution → Features (3-grid) → Testimonials → FAQ → Final CTA
- **AuthCard**: 456px max-width, centered, `<Card>` + logo + form
- **Multi-step Signup**: step state (`useState`) + `<Progress>` 컴포넌트 + step content conditional render
- **Shared Report**: no-nav layout, print-friendly CSS(`@media print`), anonymized content

## 마일스톤 (Milestones)

### M1: Landing Page (Priority: High)

**범위**
- `app/page.tsx` 재구성
- 신규 컴포넌트: `HeroSection`, `FeatureCard`, `TestimonialCard`, `FAQSection`
- Meta tags + Open Graph + structured data
- 반응형 검증 (모바일/태블릿/데스크톱)

**검증**
- LCP < 2.5s, CLS < 0.1
- 디자인 토큰 순수 사용 (임의 색상 금지)
- Lorem ipsum 잔존 없음

### M2: Auth Forms (Priority: High)

**범위**
- `app/login/page.tsx` 리디자인 — `AuthCard` 적용, inline error, signup 링크
- `app/signup/page.tsx` 리디자인 — multi-step (account → profile → association → confirm) + progress bar
- 폼 유효성 검증 UX (react-hook-form 또는 기존 방식 유지)
- 소셜 로그인(있다면) 스타일 정렬

**검증**
- 각 step 전환 시 progress bar 업데이트
- 로그인 실패 시 inline error 표시
- 기존 인증 API 호환 (서버 로직 무변경)

### M3: Shared Report + Error Pages (Priority: Medium)

**범위**
- `app/shared-reports/*` 공개 뷰 리디자인 — no-nav, 익명화, 인쇄 친화
- `app/not-found.tsx` (404) 신규 또는 리디자인
- `app/error.tsx` 또는 전역 `error.tsx` (500) 신규 또는 리디자인
- `ErrorPage` 컴포넌트 (일러스트 placeholder + Home CTA)

**검증**
- 공유 리포트 PII 노출 없음
- A4 인쇄 시 레이아웃 보존
- 오류 페이지에 스택 트레이스/내부 경로 미노출

## Delta Markers

- `[MODIFY]` `app/page.tsx`, `app/login/page.tsx`, `app/signup/page.tsx`, `app/shared-reports/*`
- `[NEW]` `components/public/HeroSection.tsx`, `FeatureCard.tsx`, `TestimonialCard.tsx`, `FAQSection.tsx`, `AuthCard.tsx`, `ErrorPage.tsx`
- `[NEW]` `app/not-found.tsx`, `app/error.tsx`
- `[EXISTING]` `components/ui/*` (shadcn base, SPEC-UI-001에서 확립)

## 에이전트 역할 (Agent Roles)

- **expert-frontend** (primary): 컴포넌트 구현, Next.js App Router 패턴, 반응형/접근성
- **designer** (optional): 히어로 레이아웃, 시그니처 요소, 일러스트 방향성
- **copywriter** (optional): 히어로 1줄 카피, benefit 카드 문구 (단, 본 SPEC은 기존 카피/placeholder 허용)

## 리스크 (Risks)

| ID | 리스크 | 영향 | 완화 |
|----|--------|------|------|
| R1 | SEO regression (URL/meta 변경으로 검색 유입 감소) | High | canonical URL 유지, meta description 키워드 보존, 301 리다이렉트 불필요 확인 |
| R2 | 로그인 실패로 인한 가입 드롭 | Medium | inline error UX 명확화, "비밀번호 찾기" 링크 상시 노출 |
| R3 | 다단계 회원가입 이탈률 증가 | Medium | progress bar로 진행률 시각화, 각 step 필드 최소화 |
| R4 | 인쇄 레이아웃 깨짐 (공유 리포트) | Low | `@media print` 전용 CSS 작성, A4 수동 검증 |
| R5 | 랜딩 번들 크기 증가 | Medium | Server Component 우선, 동적 import, 이미지 최적화(next/image) |

## 품질 게이트 (Quality Gates)

- TRUST 5: 랜딩 페이지 E2E(Playwright) 최소 1개, 폼 유효성 단위 테스트
- LSP: 0 errors, 0 type errors
- Lighthouse: Performance ≥ 85, Accessibility ≥ 95, SEO ≥ 95
- 반응형: 375px / 768px / 1440px 스냅샷 검증
