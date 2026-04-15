---
spec_id: SPEC-UI-005
version: 0.1.0
---

# SPEC-UI-005 (Compact)

**Title**: 공개 페이지 (랜딩 + 인증) UI 리디자인
**Depends on**: SPEC-UI-001
**Priority**: low
**Phase**: 5/5 (UI Redesign Series Final)

## 한 줄 요약

교권119 공개 도메인(랜딩, 로그인, 회원가입, 공유 리포트, 404/500)을 SPEC-UI-001 디자인 시스템(`#FF7210` + warm stone)에 맞춰 리디자인하여 신뢰·따뜻함·명확한 가치 제안을 전달한다.

## 핵심 EARS

- **U**: 공개 페이지는 SPEC-UI-001 토큰 준수 (color/typo/spacing)
- **E**: 회원가입 '다음' 클릭 → step 진행 + progress bar 업데이트
- **S**: 로그인 실패 상태일 때 inline error 표시
- **O**: Open Graph 이미지, 다크모드 랜딩 (선택)
- **UW**: 랜딩에 Lorem ipsum 잔존 금지 / 공유 리포트 PII 노출 금지 / 오류 페이지 스택 트레이스 노출 금지

## 마일스톤

- **M1** (High): Landing — `app/page.tsx` + HeroSection/FeatureCard/TestimonialCard/FAQSection + Meta/OG
- **M2** (High): Auth — login(AuthCard + inline error) + signup(multi-step + progress bar)
- **M3** (Medium): Shared Report 공개 뷰 (익명·인쇄 친화) + 404/500

## 주요 컴포넌트 (신규)

`HeroSection`, `FeatureCard`, `TestimonialCard`, `FAQSection`, `AuthCard`, `ErrorPage`

## Delta

- `[MODIFY]` app/page.tsx, app/login/page.tsx, app/signup/page.tsx, app/shared-reports/*
- `[NEW]` components/public/*, app/not-found.tsx, app/error.tsx
- `[EXISTING]` components/ui/* (shadcn base from SPEC-UI-001)

## 제외 (Exclusions)

마케팅 카피 창작, 블로그/뉴스, 비밀번호 재설정 UI, 서드파티 위젯, A/B 테스트 인프라, i18n 확장, 인증 API 변경.

## 에이전트

- Primary: expert-frontend
- Optional: designer (hero visual), copywriter (hero copy)

## 품질 목표

Lighthouse Perf ≥ 85 / A11y ≥ 95 / SEO ≥ 95 · LCP < 2.5s · WCAG 2.1 AA · 반응형 3 viewports (375/768/1440)
