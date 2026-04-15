---
spec_id: SPEC-UI-003
version: 1.0.0
created: 2026-04-15
updated: 2026-04-15
---

# Implementation Plan — SPEC-UI-003 Lawyer Domain UI Redesign

## 개요

변호사 도메인 6개 페이지와 lawyer-specific composed components를 SPEC-UI-001 토큰 기반으로 재설계한다. 밀도·우선순위 시그널링·3-pane 상세 레이아웃을 핵심 패턴으로 삼는다.

## 담당 에이전트

- **Primary**: `expert-frontend` — Next.js 14 + TypeScript + Tailwind + shadcn/ui 구현
- **Supporting**: `designer` — 데이터 밀도 UX, 우선순위 시그널링, 3-pane 레이아웃 설계 컨설팅

## 기술 접근 (Technical Approach)

1. **토큰 소비**: SPEC-UI-001 토큰(`tailwind.config.ts`의 theme extension, CSS 변수)을 그대로 사용. 신규 토큰 정의 금지.
2. **Composed Components**: `components/lawyer/` 디렉토리에 신규 컴포넌트 집중 배치. shadcn/ui 기초 위에 composition.
3. **레이아웃 전략**:
   - Dashboard: 상단 KPI strip (4–5개) + 활성 사건 테이블 + claim 큐
   - List: high-density table (age-of-case, urgency, status)
   - Detail: 3-pane (case info | message thread | quick actions sidebar)
   - Reply: full-height TipTap + attachment + 템플릿 스니펫
4. **상태 관리**: 기존 패턴 유지 (SWR / React Query 등 프로젝트 기존 설정 활용). 신규 상태 라이브러리 도입 없음.
5. **반응형**: 1024px+ primary, 768–1023 graceful degrade, < 768 읽기 전용 stacked view.

## 마일스톤 (Priority-Based, 순차 실행)

### M1 — Dashboard + Consult List (Priority: High)

- `app/lawyer/page.tsx` 재설계 (KPI strip, active cases table, claim queue)
- `app/lawyer/consult/page.tsx` 재설계 (high-density table, urgency indicators)
- 신규 컴포넌트: `CasePriorityBadge`, `WorkloadMeter`, `CaseTable`
- 완료 조건: 두 페이지가 토큰 기반으로 렌더링, Empty/Loading/Error 상태 구현

### M2 — Consultation Detail View (Priority: High)

- `app/lawyer/consult/[id]/page.tsx` 재설계 (3-pane layout)
- 신규 컴포넌트: `CaseHeader`, `MessageThread`, `CaseQuickActionsSidebar`
- 완료 조건: 3-pane 데스크톱 렌더링, 반응형 fallback, 메시지 스레드 스크롤 동작

### M3 — Reply Form + Claim UX (Priority: Medium)

- `app/lawyer/consult/reply/[id]/page.tsx` 재설계 (TipTap 스타일 재정의 + 템플릿 스니펫 + 첨부)
- 신규 컴포넌트: `ClaimButton` (confirmation dialog 내장, 중복 방지)
- 완료 조건: draft 미저장 이탈 확인, 템플릿 삽입 동작, claim confirmation 흐름 완성

### M4 — My Cases / Cases Overview + Regression (Priority: Medium)

- `app/lawyer/cases/page.tsx` 및 `app/lawyer/my-cases/page.tsx` 재설계
- 6개 페이지 전체 회귀 테스트 (Empty/Loading/Error, a11y, 반응형)
- 하드코딩 컬러/스페이싱 린트 통과 확인
- 완료 조건: acceptance.md 시나리오 전부 통과

## 리스크 (Risks)

| ID | 리스크 | 영향 | 완화 |
|----|-------|------|------|
| R1 | TipTap 스타일 재정의 시 기존 저장 포맷 충돌 | 중 | CSS 클래스 수준 override, schema 변경 금지 |
| R2 | 3-pane 레이아웃 반응형 전환 복잡성 | 중 | 1024px breakpoint 기준 2-step graceful degrade |
| R3 | high-density table 가독성 저하 | 중 | designer 컨설팅, 실제 DB 볼륨으로 시각 확인 |
| R4 | 기존 claim API 중복 호출 방지 기존 로직 의존 | 저 | 프론트 버튼 비활성화 + 서버 idempotency 가정 확인 |
| R5 | SPEC-UI-001 토큰 부족/미비 발견 | 저 | SPEC-UI-001에 피드백 → 토큰 추가 후 재개 |

## 아웃풋

- 수정 파일: 6 pages + 기타 관련 component refactor
- 신규 파일: `components/lawyer/` 하위 7개 composed components
- 변경 없음: API routes, DB schema, 비즈니스 로직
