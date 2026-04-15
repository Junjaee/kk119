---
id: SPEC-UI-005
version: 0.1.0
status: draft
created: 2026-04-15
updated: 2026-04-15
author: Shin
priority: low
issue_number: 0
---

# SPEC-UI-005: 공개 페이지 (랜딩 + 인증) UI 리디자인

## HISTORY

### v0.1.0 (2026-04-15)
- 최초 작성: 교권119 공개 도메인(랜딩, 로그인, 회원가입, 공유 리포트, 오류 페이지) UI 리디자인 SPEC 초안
- SPEC-UI-001 디자인 시스템 토큰 계승
- UI 리디자인 시리즈 5단계 중 Phase 5 (최종 단계)

## 개요 (Overview)

교권119의 공개(Public) 페이지 영역을 SPEC-UI-001에서 정립된 디자인 시스템(Primary `#FF7210` + warm stone neutrals, Linear/Notion/Stripe 스타일)에 맞춰 재설계한다. 본 SPEC은 **마케팅 표면**(랜딩)과 **인증 진입점**(로그인/회원가입), **공개 공유 리포트**, **오류 페이지**를 다룬다.

공개 페이지는 내부 대시보드 대비 더 표현력 있는 톤(larger hero typography, signature element)을 허용하되, 교권 보호라는 민감한 주제의 특성상 **신뢰(Trust)**, **전문성(Professionalism)**, **따뜻함(Warmth)**을 중심 축으로 삼는다.

## 배경 (Background)

- 현재 랜딩/로그인/회원가입은 기능적으로 동작하나 SPEC-UI-001 디자인 토큰과 정렬되지 않음
- Phase 1~4(기반 토큰, 대시보드, 상담 플로우, 관리자)가 완료된 상태에서 공개 도메인만 레거시 잔존
- 회원가입은 다단계(account → profile → association → confirm) 구조이나 progress 피드백 부재
- `/shared-reports` 공개 뷰는 익명성/인쇄 적합성이 명시적으로 설계되지 않음
- 404/500 오류 페이지가 없거나 Next.js 기본 화면 노출

## 목표 (Goals)

1. **신뢰 전달**: 기밀성·전문성·레코드를 시각적으로 표현
2. **감정 공명**: 따뜻한 톤으로 교사 스트레스에 대한 이해 표현
3. **명확한 가치 제안**: 1줄 히어로 카피 + 3장의 benefit 카드
4. **저마찰 회원가입**: 최소 필드 + progressive disclosure + progress bar
5. **SEO/메타**: meta tags, Open Graph, structured data 정비
6. **빠른 초기 렌더링**: 랜딩에서 대용량 클라이언트 번들 제거, Critical CSS 전략

## 범위 (Scope)

### IN SCOPE

- 랜딩 페이지 리빌드 (마케팅 섹션 포함)
- 로그인 폼 리디자인 (SPEC-UI-001 토큰 기반)
- 회원가입 폼 리디자인 (multi-step + progress bar)
- 공유 리포트 공개 뷰 리디자인 (익명·인쇄 친화)
- 404/500 오류 페이지 (없으면 신규 생성)
- Meta tags 및 Open Graph 태그 정비
- 공개 도메인 전용 컴포넌트: `HeroSection`, `FeatureCard`, `TestimonialCard`, `FAQSection`, `AuthCard`

### OUT OF SCOPE

- 신규 마케팅 카피 창작 (기존 카피 또는 플레이스홀더 사용)
- 블로그/뉴스 섹션
- 비밀번호 재설정 플로우 리디자인 (필요 시 별도 SPEC)
- 서드파티 통합 (analytics, chat widget)
- A/B 테스트 인프라

## EARS 요구사항 (Requirements)

### Ubiquitous (항시)

- **UR-1**: 공개 페이지는 SPEC-UI-001에서 정의된 디자인 시스템 토큰(color, spacing, typography, radius)을 **shall** 준수한다.
- **UR-2**: 공개 페이지는 Pretendard(한글) + Inter(영문) 폰트 스택을 **shall** 사용한다.
- **UR-3**: 공개 페이지는 반응형(모바일/태블릿/데스크톱) 레이아웃을 **shall** 제공한다.
- **UR-4**: 공개 페이지는 적절한 meta tags와 Open Graph 태그를 **shall** 포함한다.

### Event-Driven (이벤트 기반)

- **ER-1**: **When** 사용자가 회원가입 '다음' 버튼을 클릭하면, 시스템은 다음 step으로 진행하고 progress bar를 **shall** 업데이트한다.
- **ER-2**: **When** 사용자가 랜딩 히어로의 Primary CTA를 클릭하면, 시스템은 `/signup` 페이지로 **shall** 이동한다.
- **ER-3**: **When** 사용자가 '자세히 보기' 링크를 클릭하면, 페이지는 Features 섹션으로 smooth scroll을 **shall** 수행한다.
- **ER-4**: **When** 로그인 폼이 성공적으로 제출되면, 시스템은 사용자를 대시보드로 **shall** 리다이렉트한다.

### State-Driven (상태 기반)

- **SR-1**: **While** 로그인이 실패 상태일 때, 시스템은 폼 하단에 inline error message를 **shall** 표시한다.
- **SR-2**: **While** 회원가입 step이 진행 중일 때, progress bar는 현재 step 위치를 시각적으로 **shall** 표시한다.
- **SR-3**: **While** 공유 리포트가 공개 뷰로 렌더링될 때, 네비게이션 바와 사용자 개인정보는 **shall** 숨겨진다.

### Optional (선택적)

- **OR-1**: **Where** Open Graph 이미지가 필요한 페이지에서, 시스템은 브랜드 정체성을 반영한 OG 이미지를 **shall** 제공한다.
- **OR-2**: **Where** 다크모드가 활성화된 경우, 랜딩 페이지는 다크모드 팔레트로 **shall** 렌더링한다.

### Unwanted (금지)

- **UW-1**: **If** 랜딩 페이지가 프로덕션에 배포되면, **then** Lorem ipsum 플레이스홀더 텍스트는 **shall not** 잔존한다.
- **UW-2**: **If** 공유 리포트가 공개 뷰로 렌더링되면, **then** 상담 당사자의 개인식별정보(PII)는 **shall not** 노출된다.
- **UW-3**: **If** 오류 페이지가 표시되면, **then** 스택 트레이스나 내부 시스템 경로는 **shall not** 노출된다.

## Exclusions (What NOT to Build)

- 신규 마케팅 카피 창작/카피라이팅 (별도 concern)
- 블로그, 뉴스룸, 프레스 섹션
- 비밀번호 재설정 UI 리디자인 (별도 SPEC 후보)
- Google Analytics, Hotjar, Intercom 등 서드파티 위젯 삽입
- A/B 테스트 프레임워크 구축
- 다국어(i18n) 확장 (한국어 단일 유지)
- 기존 인증 API/서버 로직 변경
- 랜딩 CMS화 (정적 컴포넌트 유지)

## 비기능 요구사항 (Non-Functional)

- **성능**: 랜딩 페이지 LCP < 2.5s, CLS < 0.1
- **접근성**: WCAG 2.1 AA 수준 (color contrast, keyboard navigation, ARIA labels)
- **인쇄**: `/shared-reports` 공개 뷰는 A4 인쇄 시 깨지지 않아야 함
- **SEO**: meta description, canonical URL, structured data(Organization schema)

## 의존성 (Dependencies)

- **필수 선행**: SPEC-UI-001 (Design System Foundation) — 토큰, 컴포넌트 베이스
- **참조**: shadcn/ui base primitives
- **무관**: SPEC-UI-002~004 (내부 도메인 페이지)
