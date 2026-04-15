---
id: SPEC-UI-003
version: 1.0.0
status: draft
created: 2026-04-15
updated: 2026-04-15
author: Shin
priority: medium
issue_number: 0
---

# SPEC-UI-003 Compact Summary — Lawyer Domain UI Redesign

## 핵심 (One-Liner)

교권119 변호사 도메인 6개 페이지를 SPEC-UI-001 디자인 토큰 기반으로 재설계. 데이터 밀도 + 우선순위 시그널링 + 3-pane 상세 레이아웃이 중심.

## 대상 페이지 (6)

`app/lawyer/{page, consult/page, consult/[id]/page, consult/reply/[id]/page, cases/page, my-cases/page}.tsx`

## 신규 컴포넌트 (7, `components/lawyer/`)

CasePriorityBadge, WorkloadMeter, MessageThread, ClaimButton, CaseHeader, CaseQuickActionsSidebar, CaseTable

## 핵심 EARS

- **UBI**: SPEC-UI-001 토큰만 사용, 실 DB 데이터만 바인딩
- **EVT**: "맡기" 클릭 → confirmation dialog 필수 / 상세 진입 → 3-pane 렌더
- **STATE**: urgent 사건 → red accent + warning icon / 워크로드 초과 → warning color
- **UNW**: fake/Lorem 데이터 금지, claim 중복 호출 금지, 이미 배정된 사건 claim 버튼 비노출

## 마일스톤

- M1: Dashboard + Consult List (High)
- M2: Consult Detail 3-pane (High)
- M3: Reply + Claim UX (Medium)
- M4: My Cases / Cases + Regression (Medium)

## 에이전트

Primary: `expert-frontend` · Supporting: `designer`

## 제외 (Exclusions)

API/DB/비즈니스 로직 변경 없음 · 매칭 알고리즘 변경 없음 · 교사/관리자 도메인 별도 SPEC · TipTap 교체 없음 · 키보드 단축키 실구현 없음(향후) · 웹소켓 신규 구축 없음

## 의존성

- [필수 선행] SPEC-UI-001 (Design System Foundation)
- Phase 3 of 5 (UI 재설계 시리즈)
