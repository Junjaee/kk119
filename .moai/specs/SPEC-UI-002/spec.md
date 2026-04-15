---
id: SPEC-UI-002
version: 0.1.0
status: draft
created: 2026-04-15
updated: 2026-04-15
author: MoAI
priority: medium
issue_number: 0
---

# SPEC-UI-002: Teacher Domain UI Redesign

## HISTORY

### v0.1.0 (2026-04-15)
- 최초 작성 (MoAI)
- 교권119 UI 재디자인 Phase 2: Teacher 도메인 8개 페이지
- SPEC-UI-001(Design System Foundation) 의존
- Phase 2 of 5 (UI-002 teacher, UI-003 lawyer, UI-004 admin, UI-005 public 중 첫 도메인 적용)

---

## 1. Overview (개요)

### 1.1 목적 (Why)

교권119 서비스에서 교사(teacher)는 가장 중요한 사용자 그룹이다. 교권침해라는 민감하고 스트레스가 높은 상황에서 서비스를 이용하므로, **명확성(Clarity)**, **공감(Empathy)**, **속도(Speed)**, **신뢰(Trust)**, **프라이버시(Privacy)**를 핵심 가치로 하는 UI 재설계가 필요하다. 본 SPEC은 SPEC-UI-001에서 구축한 디자인 토큰/컴포넌트를 실제 교사 도메인 페이지에 적용한다.

### 1.2 배경 (Context)

- **Stack**: Next.js 14 + TypeScript + Tailwind CSS + shadcn/ui
- **Prerequisite**: SPEC-UI-001 (디자인 토큰, 공통 컴포넌트, warm stone neutrals, #FF7210 primary)
- **대상 경로**: `app/teacher/` 하위 8개 페이지
- **사용자 특성**: 스트레스 상황의 교사 → 모호함 제로, 다음 단계 명확, 따뜻한 톤
- **UX 스타일**: Linear/Notion 계열 modern clean + warm tone, 카드 기반 레이아웃, 소프트 섀도

### 1.3 범위 요약 (Scope Summary)

- IN: 8개 교사 페이지 재디자인, 교사 도메인 전용 컴포지션 컴포넌트, 상태별 UI(empty/loading/error), 모바일 반응형(768/1024), 다크모드
- OUT: 비즈니스 로직/API/데이터 모델 변경, 신규 기능 추가, 변호사/관리자 페이지, E2E 테스트

### 1.4 의존성 (Dependencies)

- **SPEC-UI-001** (필수 선행): design tokens, base components (Button, Card, Badge, Input, Dialog 등), Layout 컴포넌트, 다크모드 설정이 완료되어 있어야 함
- [HARD] SPEC-UI-001 토큰/컴포넌트만 사용. 이전 generic shadcn 테마 직접 사용 금지

---

## 2. EARS Requirements (EARS 요구사항)

### 2.1 Ubiquitous (상시 요구사항)

- **U1**. 시스템은 Teacher 도메인의 모든 페이지에 SPEC-UI-001에서 정의한 design tokens(color, typography, spacing, shadow, radius)과 공통 컴포넌트만을 사용한다.
- **U2**. 시스템은 Teacher 도메인의 모든 페이지에 일관된 네비게이션, 페이지 헤더, 공백(gutter), 카드 간격을 적용한다.
- **U3**. 시스템은 Teacher 도메인 전반에 warm, empathetic한 톤의 마이크로카피(빈 상태 문구, 에러 메시지, CTA 레이블)를 사용한다.
- **U4**. 시스템은 모든 교사 페이지에서 개인정보가 포함된 영역(신고자, 연락처 등)에 명시적 개인정보 보호 표식(잠금 아이콘 또는 "비공개" 라벨)을 표시한다.
- **U5**. 시스템은 모든 데이터 기반 페이지(대시보드, 리스트, 상세)에 loading, empty, error 3가지 상태 UI를 반드시 제공한다.

### 2.2 Event-Driven (이벤트 기반)

- **E1**. **When** 교사가 대시보드에서 "신고하기" CTA 버튼을 클릭할 때, 시스템은 `/teacher/reports/new` 멀티스텝 폼으로 이동한다.
- **E2**. **When** 교사가 신고 생성 폼의 한 단계를 완료하고 "다음" 버튼을 클릭할 때, 시스템은 진행 표시기(progress indicator)를 업데이트하고 다음 단계로 전환하며 입력값을 임시 저장한다.
- **E3**. **When** 교사가 리포트 리스트에서 필터 pill을 클릭할 때, 시스템은 해당 상태(접수/검토/상담/완료)로 즉시 필터링된 결과를 표시한다.
- **E4**. **When** 교사가 리포트 상세 페이지에서 새 댓글/답변이 도착할 때, 시스템은 답변 스레드에 실시간 또는 재방문 시점 기준으로 새 항목을 하이라이트한다.
- **E5**. **When** 교사가 커뮤니티 글을 작성할 때, 시스템은 익명 작성자 아이콘과 "익명" 라벨을 기본값으로 적용한다.

### 2.3 State-Driven (상태 기반)

- **S1**. **While** 리포트 상태가 "접수"일 때, 시스템은 `variant="default"` Badge로 표시한다.
- **S2**. **While** 리포트 상태가 "검토중"일 때, 시스템은 `variant="outline"` Badge로 표시한다.
- **S3**. **While** 리포트 상태가 "상담중"일 때, 시스템은 `variant="secondary"` Badge로 표시한다.
- **S4**. **While** 리포트 상태가 "완료"일 때, 시스템은 `variant="success"` (또는 muted tone) Badge로 표시한다.
- **S5**. **While** 리포트가 긴급(urgent) 플래그를 가질 때, 시스템은 목록과 상세에서 urgent 아이콘 및 primary 계열 강조를 표시한다.
- **S6**. **While** 페이지가 데이터 로딩 중일 때, 시스템은 skeleton UI를 표시한다(스피너 단독 사용 지양).
- **S7**. **While** 모바일 뷰포트(< 768px)일 때, 시스템은 대시보드 메트릭 카드를 세로 스택 1열로, 태블릿(768–1024px)에서는 2열, 데스크톱에서는 3–4열로 배치한다.

### 2.4 Optional (선택적 요구사항)

- **O1**. **Where** 다크모드가 활성화된 경우, 시스템은 SPEC-UI-001에서 정의한 dark palette를 모든 교사 페이지에 적용한다.
- **O2**. **Where** 모바일 환경인 경우, 시스템은 멀티스텝 신고 폼을 한 스텝당 한 화면(full-screen step) 패턴으로 전환한다.
- **O3**. **Where** 상태 타임라인이 표시되는 경우, 시스템은 현재 단계를 primary로, 완료 단계를 muted로, 미래 단계를 dashed outline으로 표시한다.

### 2.5 Unwanted (금지 요구사항)

- **N1**. 시스템은 SPEC-UI-001 이전의 generic shadcn 기본 토큰, 하드코딩된 hex 컬러, 또는 pure gray 팔레트를 교사 도메인에서 사용하지 않는다.
- **N2**. 시스템은 교사 도메인에서 비즈니스 로직(API endpoint, 데이터 모델, 상태 머신)을 변경하지 않는다.
- **N3**. 시스템은 커뮤니티 영역에서 작성자의 실명, 이메일, 학교명 등 식별정보를 기본값으로 노출하지 않는다.
- **N4**. 시스템은 로딩 상태에서 2초 이상 스피너만 표시하거나 빈 화면을 보여주지 않는다 (skeleton 필수).
- **N5**. 시스템은 에러 상태에서 기술적 스택 트레이스나 내부 에러 코드를 사용자에게 그대로 노출하지 않는다.

---

## 3. Target Pages (대상 페이지)

| # | Path | 페이지 역할 | 주요 컴포지션 |
|---|------|-----------|--------------|
| 1 | `app/teacher/page.tsx` | 메인 대시보드 | StatCard × 3–4, 최근 활동 피드, 프라이머리 CTA "신고하기" |
| 2 | `app/teacher/reports/page.tsx` | 리포트 목록 | 필터 pill, 상태 Badge 데이터 테이블, urgent 플래그 |
| 3 | `app/teacher/reports/new/page.tsx` | 신고 생성 | MultiStepForm (카테고리 → 상세 → 증빙 → 검토) + Progress |
| 4 | `app/teacher/reports/[id]/page.tsx` | 리포트 상세 | 좌: 상세 내용, 우: StatusTimeline + 변호사 답변 스레드 |
| 5 | `app/teacher/community/page.tsx` | 커뮤니티 목록 | 카테고리 태그 카드 그리드, 익명 아바타, 참여 메트릭 |
| 6 | `app/teacher/community/[id]/page.tsx` | 커뮤니티 상세 | 본문 + 댓글 스레드, 익명 표시 |
| 7 | `app/teacher/resources/page.tsx` | 자료실 | 카테고리 필터, 자료 카드, 다운로드/열람 버튼 |
| 8 | `app/teacher/settings/page.tsx` | 설정/프로필 | 섹션 카드(계정/알림/개인정보), 저장 액션 |

---

## 4. New Composed Components (신규 합성 컴포넌트)

SPEC-UI-001 base 컴포넌트를 조합하여 Teacher 도메인 전용 합성 컴포넌트를 구성한다.

- **StatCard**: 메트릭 수치 + 라벨 + 변화량 아이콘. 대시보드용.
- **ReportCard**: 제목 + 상태 Badge + 작성일 + urgent 플래그. 목록/최근 활동용.
- **StatusTimeline**: 접수 → 검토 → 상담 → 완료 단계 타임라인. 상세 페이지용.
- **MultiStepForm**: 진행 표시기 + 스텝 콘텐츠 슬롯 + 이전/다음 컨트롤. 신고 생성용.
- **EmptyState**: 아이콘 + 메시지 + (선택) CTA. 모든 데이터 페이지 공통.
- **LoadingSkeleton**: 페이지 유형별 skeleton (card-grid, table, form).

---

## 5. Exclusions (What NOT to Build)

- **X1**. 비즈니스 로직 및 API: `app/api/` 내 어떠한 라우트 핸들러, DB 쿼리, 데이터 모델도 변경하지 않는다.
- **X2**. 신규 기능: 기존에 없던 새로운 사용자 기능(예: 실시간 채팅, 푸시 알림 설정 신규 추가 등)은 본 SPEC 범위 밖이다.
- **X3**. Lawyer/Admin 도메인 페이지: `app/lawyer/**`, `app/admin/**`는 각각 SPEC-UI-003, UI-004에서 다룬다.
- **X4**. E2E 테스트 작성: Playwright/Cypress 시나리오는 별도 SPEC에서 다룬다.
- **X5**. 접근성(WCAG) 전면 감사: 컴포넌트 기본 접근성은 유지하되, 풀 감사 리포트는 범위 밖.
- **X6**. i18n 다국어 리소스 전환: 한국어 UI 고정, 다국어화는 별도 SPEC.
- **X7**. 애니메이션 라이브러리 도입: Tailwind 기본 transition만 사용, framer-motion 등 신규 의존성 추가 금지.

---

## 6. Delta Markers (변경 분류)

- **[MODIFY]** `app/teacher/page.tsx`, `app/teacher/reports/page.tsx`, `app/teacher/reports/new/page.tsx`, `app/teacher/reports/[id]/page.tsx`, `app/teacher/community/page.tsx`, `app/teacher/community/[id]/page.tsx`, `app/teacher/resources/page.tsx`, `app/teacher/settings/page.tsx` (페이지 마크업/스타일만 변경)
- **[NEW]** `components/teacher/stat-card.tsx`, `components/teacher/report-card.tsx`, `components/teacher/status-timeline.tsx`, `components/teacher/multi-step-form.tsx`, `components/teacher/empty-state.tsx`, `components/teacher/loading-skeleton.tsx`
- **[EXISTING]** `components/ui/*` (SPEC-UI-001에서 정비된 base 컴포넌트) — 재사용만 하고 수정 금지

---

## 7. Success Criteria (성공 기준)

- 교사 8개 페이지 모두 SPEC-UI-001 토큰/컴포넌트만으로 렌더링
- 하드코딩된 hex 컬러 0건 (grep 검증)
- 각 페이지에 loading/empty/error 상태 UI 존재
- 768px, 1024px 브레이크포인트에서 레이아웃 깨짐 없음
- 다크모드 토글 시 모든 교사 페이지 정상 표시
- 기존 사용자 플로우(신고 제출, 리포트 조회 등) 기능 회귀 없음
