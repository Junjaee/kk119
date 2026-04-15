---
id: SPEC-UI-004
version: 1.0.0
status: planned
created: 2026-04-15
updated: 2026-04-15
author: Shin
priority: medium
issue_number: 0
---

# SPEC-UI-004: Admin Domain UI Redesign

## HISTORY

### v1.0.0 (2026-04-15)
- 최초 작성: 관리자 도메인 11개 페이지 재설계 사양 정의
- SPEC-UI-001 (Design System Foundation) 기반 구축
- Phase 4 of 5 (UI 리디자인 시리즈)

---

## 1. Overview (개요)

교권119 관리자 도메인의 11개 페이지를 SPEC-UI-001에서 정의한 디자인 시스템 토큰 및 컴포넌트를 사용하여 재설계한다. 데이터 밀도가 높은 운영자 관점의 대시보드, 테이블 중심 관리 화면, 모니터링 및 설정 화면을 Linear/Notion/Stripe Dashboard 수준의 모던하고 전문적인 UI로 전환한다.

### 1.1 Business Context

- **사용자**: 교권119 플랫폼 운영 관리자 (데스크톱 환경 중심)
- **목적**: 운영 효율성 증대, 데이터 가시성 향상, 일괄 작업 지원, 안전한 파괴적 작업 흐름
- **전제 조건**: SPEC-UI-001 (Design System Foundation) 완료

### 1.2 Target Pages (11개)

1. `app/admin/page.tsx` — 관리자 메인 대시보드
2. `app/admin/dashboard/page.tsx` — 분석 대시보드 (차트, 통계)
3. `app/admin/user-management/page.tsx` — 사용자 CRUD
4. `app/admin/associations/page.tsx` — 협회 관리
5. `app/admin/lawyers/page.tsx` — 변호사 관리 (인증, 배정)
6. `app/admin/reports/page.tsx` — 신고 모니터링 + 배정
7. `app/admin/consultations/page.tsx` — 상담 관리
8. `app/admin/notifications/page.tsx` — 알림 발송 + 큐 관리
9. `app/admin/permissions/page.tsx` — 권한 매트릭스
10. `app/admin/settings/page.tsx` — 시스템 설정
11. `app/admin/stats/page.tsx` — 통계 개요

---

## 2. EARS Requirements (요구사항)

### 2.1 Ubiquitous (항상 적용)

- **REQ-U-001**: 관리자 페이지 전체는 SPEC-UI-001에서 정의한 Primary `#FF7210` + warm stone neutrals 토큰을 사용해야 한다 (The system **shall** use SPEC-UI-001 design tokens).
- **REQ-U-002**: 모든 목록형 페이지(사용자, 협회, 변호사, 신고, 상담)는 일관된 DataTable 패턴(정렬, 검색, 페이지네이션, 컬럼 설정)을 사용해야 한다.
- **REQ-U-003**: 모든 테이블은 Empty / Loading / Error 세 가지 상태를 반드시 구현해야 한다.
- **REQ-U-004**: 관리자 페이지는 데스크톱 우선(min-width 1280px 기준) 레이아웃을 사용하되 1024px 이상에서 가독성을 유지해야 한다.
- **REQ-U-005**: 모든 페이지는 Pretendard(한글) + Inter(영문/숫자) 폰트 스택을 사용해야 한다.

### 2.2 Event-Driven (이벤트 기반)

- **REQ-E-001**: **When** 관리자가 테이블 행의 체크박스를 하나 이상 선택하면, the system **shall** BulkActionBar를 화면 하단에 고정 표시해야 한다.
- **REQ-E-002**: **When** 관리자가 리스트 페이지의 행을 클릭하면, the system **shall** Sheet(사이드 드로어) 컴포넌트로 상세 정보를 표시해야 한다.
- **REQ-E-003**: **When** 관리자가 FilterPanel에서 필터를 변경하면, the system **shall** URL query string을 업데이트하여 새로고침 후에도 상태를 유지해야 한다.
- **REQ-E-004**: **When** 관리자가 분석 대시보드에서 날짜 범위(Date Range Picker)를 변경하면, the system **shall** 모든 차트를 해당 범위로 즉시 재렌더링해야 한다.
- **REQ-E-005**: **When** 관리자가 권한 매트릭스의 셀을 토글하면, the system **shall** 변경사항을 Dirty 상태로 표시하고 "저장" 버튼을 활성화해야 한다.

### 2.3 State-Driven (상태 기반)

- **REQ-S-001**: **While** 사용자가 "삭제 대기(pending deletion)" 상태일 때, the system **shall** 해당 행에 strikethrough + muted color(stone-400)를 적용해야 한다.
- **REQ-S-002**: **While** DataTable이 로딩 중일 때, the system **shall** Skeleton 플레이스홀더(최소 5행)를 표시해야 한다.
- **REQ-S-003**: **While** 데이터가 없는 상태일 때, the system **shall** 일러스트 + 설명 + 주요 액션 버튼을 포함한 EmptyState 컴포넌트를 표시해야 한다.
- **REQ-S-004**: **While** 알림 큐에 발송 대기 항목이 존재할 때, the system **shall** 상단 뱃지에 pending 개수를 실시간 표시해야 한다.

### 2.4 Optional (선택적)

- **REQ-O-001**: **Where** Recharts 의존성이 프로젝트에 이미 존재하면, the system **shall** Recharts를 사용하여 차트를 렌더링해야 한다. 없다면 Tremor 또는 간단한 SVG 구현으로 대체할 수 있다.
- **REQ-O-002**: **Where** 관리자 권한이 `super_admin`이 아닌 일반 `admin`인 경우, the system **shall** 시스템 설정 페이지의 민감한 섹션(시스템 전체 설정)을 숨길 수 있다.

### 2.5 Unwanted (금지)

- **REQ-N-001**: **If** 관리자가 삭제/권한 회수/계정 비활성화 등 파괴적 액션 버튼을 클릭하면, **then** the system **shall** 즉시 실행하지 않고 ConfirmDialog를 통해 명시적 확인을 받아야 한다.
- **REQ-N-002**: **If** 관리자가 ConfirmDialog에서 확인 문자열(예: "DELETE")을 정확히 입력하지 않으면, **then** the system **shall** 실행 버튼을 비활성화 상태로 유지해야 한다.
- **REQ-N-003**: **If** 대량(10건 이상) 파괴적 일괄 작업이 요청되면, **then** the system **shall** 추가 경고(영향 받는 레코드 수 명시)를 포함한 확장 확인 다이얼로그를 표시해야 한다.
- **REQ-N-004**: The system **shall not** 관리자 페이지에 비즈니스 로직(API 변경, 인증 로직)을 도입하지 않아야 한다 — 본 SPEC은 UI 재설계에 한정된다.

### 2.6 Complex (복합)

- **REQ-C-001**: **While** 신고 모니터링 페이지에서 사이드바 필터가 활성화된 상태에서, **when** 관리자가 새로운 필터 조합을 적용하면, the system **shall** URL 업데이트, 테이블 재조회, 필터 뱃지 카운트 갱신을 동시에 처리해야 한다.

---

## 3. Non-Functional Requirements

### 3.1 Performance
- 초기 렌더링: 테이블 50행 기준 1.5초 이내 (LCP)
- 차트 렌더링: 데이터 포인트 100개 기준 500ms 이내
- 필터 적용 후 재렌더: 300ms 이내 (체감 즉시)

### 3.2 Accessibility
- 모든 대화형 요소: WCAG 2.1 AA 키보드 내비게이션 지원
- 차트: aria-label 및 테이블 폴백 제공
- ConfirmDialog: focus trap 및 ESC 취소 지원

### 3.3 Responsive Design
- 1280px 이상: 최적 레이아웃 (사이드바 + 메인)
- 1024–1279px: 사이드바 축소 모드 지원
- 1024px 미만: 경고 배너 표시 ("데스크톱 권장")

---

## 4. Design Constraints

- **Tech Stack**: Next.js 14 App Router, TypeScript, Tailwind CSS, shadcn/ui
- **Design Tokens**: SPEC-UI-001 토큰 (Primary `#FF7210`, warm stone neutrals, 8–12px radius, soft shadows)
- **Typography**: Pretendard + Inter
- **Icons**: lucide-react (SPEC-UI-001 기준)
- **Charts**: Recharts 우선, 부재 시 Tremor 또는 순수 SVG

---

## 5. Exclusions (What NOT to Build)

본 SPEC은 다음을 명시적으로 제외한다:

- **EX-001**: 비즈니스 로직 변경 — API 엔드포인트 수정, 인증/권한 로직 변경, 데이터베이스 스키마 변경은 일체 포함하지 않는다.
- **EX-002**: 신규 관리 기능 — AI 요약, 자동 배정 알고리즘, 실시간 협업 등 새로운 기능은 제외한다 (별도 SPEC).
- **EX-003**: 교사(Teacher) 및 변호사(Lawyer) 도메인 페이지 재설계 — 별도 SPEC(UI-002, UI-003)에서 다룬다.
- **EX-004**: `super_admin` 역할 복원 — SPEC-AUTH-005에서 제거되었으며 본 SPEC에서 복원하지 않는다.
- **EX-005**: 모바일 전용 최적화 — 관리자 도구는 데스크톱 우선이며, 모바일 전용 레이아웃은 구현하지 않는다.
- **EX-006**: 국제화(i18n) — 본 SPEC은 한국어 UI에 한정한다.
- **EX-007**: 디자인 시스템 토큰 변경 — 토큰은 SPEC-UI-001에서 관리되며 본 SPEC에서는 소비만 한다.
- **EX-008**: 구현 레벨의 함수명/클래스 구조/API 스키마 — Run 단계에서 결정한다.

---

## 6. Dependencies

- **Prerequisite SPEC**: SPEC-UI-001 (Design System Foundation) — 토큰, 기본 컴포넌트, 타이포그래피 제공
- **Related SPECs**: SPEC-UI-002 (Teacher Domain), SPEC-UI-003 (Lawyer Domain), SPEC-UI-005 (추후 예정)
- **External Libraries**: shadcn/ui (Sheet, Dialog, Table, Checkbox, Select), Recharts (optional), lucide-react

---

## 7. Success Metrics

- 11개 페이지 모두 SPEC-UI-001 토큰 준수 (수동 리뷰)
- Empty/Loading/Error 상태 100% 구현
- 파괴적 액션 ConfirmDialog 100% 적용
- Lighthouse Performance 스코어 85점 이상 (데스크톱)
- 기능 회귀 0건 (기존 API 호출/동작 보존)
