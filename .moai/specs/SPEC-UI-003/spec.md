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

# SPEC-UI-003: 변호사 도메인 UI 재설계 (Lawyer Domain UI Redesign)

## HISTORY

- **2026-04-15 (v1.0.0)**: 초안 작성 — 변호사 도메인 6개 페이지 재설계 범위 정의
- 의존성: SPEC-UI-001 (디자인 시스템 토큰/기초 컴포넌트 완료)
- 선행 단계: Phase 3 of 5 (UI 재설계 시리즈)

---

## 1. 개요 (Overview)

교권119 플랫폼의 변호사(Lawyer) 도메인 전체 UI를 SPEC-UI-001에서 정의된 디자인 시스템 토큰 기반으로 재설계한다. 변호사는 다수의 사건을 효율적으로 처리해야 하므로, 교사 도메인 대비 **데이터 밀도**, **우선순위 시그널링**, **컨텍스트 전환 속도**를 핵심 UX 목표로 삼는다.

### 대상 페이지

1. `app/lawyer/page.tsx` — 메인 대시보드 (배정 사건, 워크로드, 통계)
2. `app/lawyer/consult/page.tsx` — 상담 목록 (배정됨 + 가용)
3. `app/lawyer/consult/[id]/page.tsx` — 상담 상세 (사건 정보, 메시지 스레드, 첨부)
4. `app/lawyer/consult/reply/[id]/page.tsx` — 답변 작성 (TipTap 리치 에디터)
5. `app/lawyer/cases/page.tsx` — 사건 관리 개요
6. `app/lawyer/my-cases/page.tsx` — 내 배정 사건 목록

### 디자인 방향 (SPEC-UI-001 상속)

- Primary: `#FF7210` + warm stone neutrals
- Linear/Notion 스타일 (modern, clean, data-dense)
- Pretendard (한글) + Inter (영문)
- Soft shadows, 8–12px border radius

---

## 2. EARS 요구사항 (Requirements)

### 2.1 Ubiquitous (항시 적용)

- **UBI-01**: 시스템(Lawyer 도메인 UI)은 **shall** SPEC-UI-001의 디자인 토큰(color, spacing, typography, radius, shadow)만을 사용하여 렌더링한다.
- **UBI-02**: 시스템은 **shall** 모든 페이지에서 Empty / Loading / Error 상태를 일관된 컴포넌트로 제공한다.
- **UBI-03**: 시스템은 **shall** 교사 도메인 대비 높은 데이터 밀도(테이블 row padding 축소, compact spacing)를 유지한다.
- **UBI-04**: 시스템은 **shall** 변호사가 보는 모든 사건 데이터에 실제 데이터베이스 값만 바인딩한다.

### 2.2 Event-Driven (이벤트 기반)

- **EVT-01**: **When** 변호사가 상담 목록에서 "이 사건 맡기" 버튼을 클릭하면, 시스템은 **shall** confirmation dialog를 표시하고 명시적 확인 후에만 claim API를 호출한다.
- **EVT-02**: **When** 변호사가 상담 상세 페이지에 진입하면, 시스템은 **shall** 좌측에 사건 정보, 중앙에 메시지 스레드, 우측에 quick facts/actions 사이드바를 렌더링한다.
- **EVT-03**: **When** 변호사가 답변 폼에서 템플릿 스니펫을 선택하면, 시스템은 **shall** 현재 커서 위치에 템플릿 텍스트를 삽입한다.
- **EVT-04**: **When** 새 사건이 available 큐에 등록되면, 대시보드는 **shall** 실시간 또는 폴링 기반으로 큐 카운트를 갱신한다.

### 2.3 State-Driven (상태 기반)

- **STATE-01**: **While** 사건의 urgency 등급이 `urgent`인 동안, 시스템은 **shall** red accent 색상과 warning 아이콘을 배지/row highlight로 표시한다.
- **STATE-02**: **While** 사건이 변호사 본인에게 배정된 상태인 동안, 시스템은 **shall** "claim" 버튼 대신 "상세 보기" CTA를 표시한다.
- **STATE-03**: **While** 변호사의 워크로드가 임계치(예: 10건)를 초과한 동안, 대시보드 WorkloadMeter는 **shall** warning 색상으로 표시한다.
- **STATE-04**: **While** 답변 작성 중 draft가 저장되지 않은 동안, 시스템은 **shall** 페이지 이탈 시 확인 dialog를 표시한다.

### 2.4 Optional (선택적)

- **OPT-01**: **Where** 키보드 단축키 기능이 구현되어 있으면, 시스템은 **shall** 사건 목록에서 `j/k` 네비게이션, `Enter` 진입, `c` 클레임을 지원한다 (향후 확장).
- **OPT-02**: **Where** 모바일 뷰포트(< 768px)로 접근하면, 시스템은 **shall** 읽기 전용 레이아웃(3-pane → stacked single column)을 제공한다.

### 2.5 Unwanted Behavior (금지 사항)

- **UNW-01**: **If** 실제 DB 데이터가 없음에도, **then** 시스템은 **shall not** fake / Lorem ipsum / placeholder 더미 데이터를 테이블이나 카드에 표시하지 않는다. 대신 명시적 Empty State 컴포넌트를 사용한다.
- **UNW-02**: **If** 변호사가 claim 버튼을 중복 클릭, **then** 시스템은 **shall not** 중복 API 호출을 허용하지 않는다 (버튼 비활성화).
- **UNW-03**: **If** 사건이 다른 변호사에게 이미 배정됨, **then** 시스템은 **shall not** 해당 row에 claim 버튼을 노출하지 않는다.

---

## 3. 구성 컴포넌트 (Components)

### 3.1 [NEW] Lawyer-Specific Composed Components

- `CasePriorityBadge` — urgency 등급(normal / high / urgent)별 색상·아이콘 배지
- `WorkloadMeter` — 변호사 현재 사건 수 / 처리 가능 한도 시각화
- `MessageThread` — 상담 상세의 메시지 스레드 뷰 (내 메시지/상대 메시지 정렬)
- `ClaimButton` — confirmation dialog 내장, 중복 방지 로직 포함
- `CaseHeader` — 사건명 + priority + status + meta 정보 일괄 표시
- `CaseQuickActionsSidebar` — 상세 페이지 우측 사이드바 (답변 쓰기, 상태 변경, 첨부 다운로드)
- `CaseTable` — high-density table (age-of-case, urgency, status 컬럼 포함)

### 3.2 [MODIFY] 기존 페이지 6종 재설계

위 1절 "대상 페이지" 참조.

### 3.3 [EXISTING] shadcn/ui 기초 컴포넌트 재사용

SPEC-UI-001에서 이미 설치/토큰화된 Button, Card, Dialog, Input, Badge, Table, Tabs, Toast 등을 사용한다.

---

## 4. Exclusions (What NOT to Build)

- **EXC-01**: API / 도메인 모델 / 비즈니스 로직 변경은 범위에 포함되지 않는다. UI layer 한정.
- **EXC-02**: 변호사 자동 매칭 알고리즘 / 배정 규칙 변경은 대상이 아니다.
- **EXC-03**: 교사(Teacher) 및 관리자(Admin) 도메인 페이지는 별도 SPEC에서 다룬다.
- **EXC-04**: 리치 텍스트 에디터 라이브러리 교체(TipTap 유지)는 하지 않는다. 스타일 재정의만 수행.
- **EXC-05**: 키보드 단축키의 실제 구현은 본 SPEC 범위에 포함되지 않음 (향후 SPEC으로 분리).
- **EXC-06**: 실시간 웹소켓 인프라 구축은 제외 (폴링 또는 기존 실시간 채널 재사용 허용).
- **EXC-07**: 신규 데이터베이스 테이블 / 컬럼 추가 없음.

---

## 5. 비기능 요구사항 (Non-Functional Requirements)

- **NFR-01**: 디자인 토큰 준수율 100% (hard-coded color / spacing 0건).
- **NFR-02**: 목록 페이지 LCP < 2.5s (기존 대비 회귀 없음).
- **NFR-03**: a11y — WCAG 2.1 AA 준수 (color contrast, focus ring, keyboard focus order).
- **NFR-04**: 반응형 — ≥ 1024px 주 타겟, 768–1023px 사용 가능, < 768px 읽기 전용 허용.

---

## 6. 의존성 (Dependencies)

- **SPEC-UI-001**: 디자인 시스템 파운데이션 (필수 선행)
- 기존 `app/lawyer/*` 페이지 및 관련 API 라우트 (변경 없음)
- TipTap 에디터 (유지)
