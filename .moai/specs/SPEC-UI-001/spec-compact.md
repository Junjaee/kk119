---
spec_id: SPEC-UI-001
version: 0.1.0
created: 2026-04-15
---

# SPEC-UI-001 (Compact)

**Title**: Design System Foundation for 교권119
**Status**: draft | **Priority**: high | **Phase**: Phase 1 of UI series (002-005)

## Goal
교권119 4개 도메인(teacher/lawyer/admin/public) 재디자인의 기반이 되는 design system foundation 구축. Primary `#FF7210` 보존, Modern+Clean (Linear/Notion/Stripe 계열, warm tone).

## Key Requirements (EARS summary)
- **U1-U5**: 중앙화된 design tokens 적용, `#FF7210` 기반 primary 50-900, warm stone neutral, 토큰 기반 컴포넌트, `.moai/design/system.md` 문서화
- **E1-E3**: dark mode 즉시 전환, hover state, sidebar collapse
- **S1-S4**: Skeleton(loading), EmptyState, ErrorState, Badge status variants
- **O1-O3**: Pretendard(KO) + Inter(EN), Linear-style soft shadow, Indigo/Teal accent
- **X1-X4**: pure gray/blue 제거, 하드코딩 금지, regression 금지, scope creep 금지

## Scope
**IN**: tokens (color/typography/spacing/shadow/radius/z-index), `.moai/design/system.md`, core UI refine (Button/Input/Card/Badge/Table/Dialog/Sheet/Toast/Tabs/Tooltip/Skeleton/Avatar), Layout (Header/Sidebar/DashboardLayout + PageHeader/EmptyState/ErrorState), global styles + fonts.

**OUT**: domain page redesign (→UI-002+), landing (→UI-005), new features, animation lib, full WCAG audit, responsive overhaul, new npm deps.

## Delta
- `[MODIFY]` tailwind.config.js, app/globals.css, app/layout.tsx, components/ui/*, components/layout/*
- `[NEW]` .moai/design/system.md, components/ui/{empty-state,error-state,page-header}.tsx
- `[EXISTING]` app/teacher/**, app/lawyer/**, app/admin/**

## Key Decisions
- Primary scale: 수동 튜닝 + OKLCH 검증
- Font: next/font + Pretendard variable + Inter
- Dark mode: CSS 변수 (shadcn 표준)
- shadcn refine: 기존 파일 직접 수정
- Docs: 단일 파일 `.moai/design/system.md`

## Milestones (priority order)
M1 Tokens → M2 Fonts/Global → M3 Docs → M4 Core UI → M5 Layout → M6 Regression check

## Agents
- expert-frontend (lead), agency-designer (tokens + docs), manager-quality (regression)

## Files
- `.moai/specs/SPEC-UI-001/spec.md`
- `.moai/specs/SPEC-UI-001/plan.md`
- `.moai/specs/SPEC-UI-001/acceptance.md`
- `.moai/specs/SPEC-UI-001/research.md`

## DoD
10-item quality gate (tokens complete, 0 hardcoded hex, 0 blue/gray legacy, docs complete, dark mode works, fonts load, no regression, no new npm deps).
