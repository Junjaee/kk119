---
spec_id: SPEC-UI-004
version: 1.0.0
---

# SPEC-UI-004 Compact Summary

**Title**: Admin Domain UI Redesign (교권119)
**Phase**: 4 of 5 (UI Redesign Series)
**Prerequisite**: SPEC-UI-001 (Design System Foundation)
**Priority**: medium
**Status**: planned

## Scope
- **Target**: 11 admin pages under `app/admin/`
- **Goal**: Apply SPEC-UI-001 tokens, introduce admin-specific composed components, data-dense & desktop-first UX.

## Key Requirements (EARS summary)
- **U**: Consistent DataTable, Empty/Loading/Error states, SPEC-UI-001 tokens, desktop-first (1280+).
- **E**: Checkbox selection → BulkActionBar, row click → Sheet, filter change → URL sync, date range → chart rerender.
- **S**: Pending deletion → strikethrough+muted, loading → Skeleton (≥5 rows), empty → EmptyState.
- **O**: Recharts if present else Tremor/SVG.
- **N**: Destructive actions REQUIRE ConfirmDialog; bulk ≥10 requires confirmation string ("DELETE"); NO business logic changes.

## New Components
DataTable (advanced), KPICard, BulkActionBar, FilterPanel, ChartContainer, ConfirmDialog.

## Milestones
- **M1** (High): Composed components + main dashboard + analytics + stats
- **M2** (High): User management + associations
- **M3** (Medium): Lawyers + reports + consultations
- **M4** (Medium): Notifications + permissions + settings
- **M5** (Low): Bulk ops verification + a11y + perf polish

## Agents
- Primary: expert-frontend
- Supporting: designer, manager-quality

## Exclusions
- No API/auth changes, no new features, no teacher/lawyer pages, no super_admin restore, no mobile layout, no i18n, no token changes.

## Success Metrics
- 100% token compliance, 100% destructive-action confirmation, Lighthouse ≥85, 0 a11y critical, 0 regression.
