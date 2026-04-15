---
id: SPEC-UI-002
version: 0.1.0
status: draft
created: 2026-04-15
updated: 2026-04-15
author: MoAI
priority: medium
issue_number: 0
depends_on: [SPEC-UI-001]
---

# SPEC-UI-002 (Compact): Teacher Domain UI Redesign

## Goal
교권119 `app/teacher/` 하위 8개 페이지를 SPEC-UI-001 디자인 시스템으로 재구성. Clarity / Empathy / Speed / Trust / Privacy 5대 UX 가치.

## Scope
- **IN**: 8 teacher pages + 6 composed components + states(loading/empty/error) + responsive(768/1024) + dark mode
- **OUT**: business logic/API, new features, lawyer/admin pages, E2E tests, i18n, a11y full audit, animation libs

## Target Pages
`app/teacher/{page, reports/page, reports/new/page, reports/[id]/page, community/page, community/[id]/page, resources/page, settings/page}.tsx`

## New Composed Components
`components/teacher/{stat-card, report-card, status-timeline, multi-step-form, empty-state, loading-skeleton}.tsx`

## EARS Summary
- **U**: UI-001 토큰/컴포넌트만 사용, warm empathetic 톤, 개인정보 표식, 3-state UI 필수
- **E**: "신고하기" CTA → multi-step 이동 / 스텝 진행 시 progress 갱신+임시저장 / 필터 pill 즉시 반영 / 신규 답변 하이라이트 / 커뮤니티 익명 기본
- **S**: 상태별 Badge variant (접수=default, 검토=outline, 상담=secondary, 완료=success/muted), urgent 강조, skeleton 필수, 반응형 1/2/3–4 col
- **O**: 다크모드, 모바일 full-screen step, StatusTimeline 3단계 시각 구분
- **N (금지)**: 이전 generic shadcn 토큰/하드코딩 hex, 비즈니스 로직 변경, 실명 노출, 스피너 단독, 스택 트레이스 노출

## Milestones
1. M1 Dashboard + core composed components
2. M2 Reports list + new (multi-step form)
3. M3 Reports detail + StatusTimeline
4. M4 Community + Resources + Settings
5. M5 Mobile/dark polish + regression grep 검증

## Key Risks
- R1 기능 회귀 / R2 모바일 엣지 / R3 다크 대비 / R4 UI-001 지연 / R5 하드코딩 잔존

## Agents
Primary: expert-frontend / Support: designer / Quality: manager-quality

## Delta
- [MODIFY] 8 teacher pages
- [NEW] 6 composed components
- [EXISTING] UI-001 base components (재사용, 수정 금지)

## Dependencies
- **SPEC-UI-001** (required): design tokens, base components, dark palette

## Exclusions
API/백엔드, 신규 기능, 타 도메인, E2E, i18n, 접근성 감사, 애니메이션 라이브러리
