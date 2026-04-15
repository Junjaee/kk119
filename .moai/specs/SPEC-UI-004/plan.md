---
spec_id: SPEC-UI-004
version: 1.0.0
created: 2026-04-15
updated: 2026-04-15
---

# SPEC-UI-004 Implementation Plan

## 1. Approach Overview (접근 방식)

SPEC-UI-001에서 구축한 디자인 시스템 토큰과 기본 컴포넌트를 기반으로, 관리자 도메인 특화 복합 컴포넌트(Composed Components)를 먼저 구축한 후, 이를 활용해 11개 페이지를 5개 마일스톤으로 순차 재설계한다. 데이터 밀도가 높은 관리자 UX 특성상 DataTable 고도화, BulkActionBar, FilterPanel 등이 핵심 재사용 자산이다.

### Delta Markers

- **[NEW]** 관리자 전용 복합 컴포넌트: DataTable Advanced, KPICard, BulkActionBar, FilterPanel, ChartContainer, ConfirmDialog
- **[MODIFY]** 관리자 페이지 11개 (`app/admin/**/page.tsx`)
- **[EXISTING]** SPEC-UI-001에서 제공하는 shadcn/ui 기반 Button, Input, Select, Sheet, Dialog, Table, Card, Badge

---

## 2. Primary Agents

- **expert-frontend** (primary): Next.js/React/Tailwind/shadcn/ui 구현 주도
- **designer**: 레이아웃/컴포넌트 비주얼 디자인 검토 및 차트 스타일 지정
- **manager-quality**: TRUST 5 검증 (접근성, 성능, 일관성)

---

## 3. Milestones (우선순위 기반)

### M1 (Priority: High) — 기반 복합 컴포넌트 + 대시보드/통계

**Scope**: 관리자 전용 재사용 컴포넌트 구축 및 데이터 가시성이 가장 중요한 대시보드/통계 페이지 재설계

**Deliverables**:
- [NEW] `components/admin/DataTable.tsx` — 정렬, 검색, 페이지네이션, 컬럼 설정, 체크박스 선택, Empty/Loading/Error 상태
- [NEW] `components/admin/KPICard.tsx` — 수치, 변화율, 스파크라인(선택), 아이콘
- [NEW] `components/admin/ChartContainer.tsx` — 차트 래퍼 (타이틀, 범례, 로딩, 빈 상태)
- [NEW] `components/admin/FilterPanel.tsx` — 사이드바형 필터 UI + URL 동기화 훅
- [NEW] `components/admin/ConfirmDialog.tsx` — 파괴적 액션 확인 다이얼로그 (확인 문자열 입력 모드 지원)
- [NEW] `components/admin/BulkActionBar.tsx` — 선택 항목 수, 일괄 액션 버튼, 취소
- [MODIFY] `app/admin/page.tsx` — 8-KPI 그리드 + 알림 리스트 + 활동 피드 + 빠른 링크
- [MODIFY] `app/admin/dashboard/page.tsx` — Date Range Picker + 4–6개 차트 (line/bar/pie)
- [MODIFY] `app/admin/stats/page.tsx` — 통계 개요 (KPI + 주요 지표 테이블)

### M2 (Priority: High) — 사용자/협회 관리

**Scope**: CRUD 중심 관리 페이지

**Deliverables**:
- [MODIFY] `app/admin/user-management/page.tsx` — DataTable + 검색 + 역할 필터 + 벌크 액션(활성화/비활성화/삭제) + Sheet 상세
- [MODIFY] `app/admin/associations/page.tsx` — 협회 목록 DataTable + 생성/편집 Sheet + 삭제 ConfirmDialog

### M3 (Priority: Medium) — 신고/상담 모니터링

**Scope**: 운영 모니터링 및 배정 플로우

**Deliverables**:
- [MODIFY] `app/admin/lawyers/page.tsx` — 변호사 목록 + 인증 상태 필터 + 배정 가능 여부 토글 + Sheet 상세
- [MODIFY] `app/admin/reports/page.tsx` — FilterPanel(사이드바) + 신고 테이블 + Sheet 상세 + 변호사 배정 액션
- [MODIFY] `app/admin/consultations/page.tsx` — 상담 테이블 + 상태별 탭 + Sheet 상세

### M4 (Priority: Medium) — 알림/권한/설정

**Scope**: 시스템 운영 화면

**Deliverables**:
- [MODIFY] `app/admin/notifications/page.tsx` — 발송 Compose 폼 + 큐 상태 패널 + 발송 이력 DataTable
- [MODIFY] `app/admin/permissions/page.tsx` — 역할 × 리소스 매트릭스 그리드 + Dirty 상태 + 저장 플로우
- [MODIFY] `app/admin/settings/page.tsx` — 섹션형 설정 레이아웃 (카테고리 사이드바 + 폼)

### M5 (Priority: Low) — 일괄 작업 + 폴리싱

**Scope**: 최종 품질 검수 및 UX 향상

**Deliverables**:
- 11개 페이지 일괄 작업 흐름 검증 (대량 액션 경고 ConfirmDialog 포함)
- 접근성 감사 (키보드 내비게이션, aria-label, focus trap)
- 성능 프로파일링 (LCP, 재렌더 최적화)
- 스토리북(선택) 또는 컴포넌트 사용 예시 문서화
- 1024–1279px 반응형 검증

---

## 4. Technical Approach (기술 접근)

### 4.1 Component Layering

```
app/admin/*/page.tsx            ← Page-level composition
  └── components/admin/*        ← Admin-specific composed (DataTable, KPICard, ...)
      └── components/ui/*       ← shadcn/ui primitives (from SPEC-UI-001)
          └── design tokens     ← Tailwind config (from SPEC-UI-001)
```

### 4.2 State Management

- URL 기반 필터/정렬/페이지 상태 (searchParams) — 공유 가능한 링크, 새로고침 안정성
- 서버 상태: 기존 API 호출 유지 (변경 금지, REQ-N-004)
- 클라이언트 상태: React useState (체크박스 선택, Dirty flag 등 로컬 상태)

### 4.3 Chart Strategy

1. `package.json`에서 `recharts` 존재 확인
2. 있으면 Recharts 사용 (LineChart, BarChart, PieChart)
3. 없으면 Tremor(`@tremor/react`) 또는 최소 SVG 차트로 대체
4. ChartContainer로 공통 인터페이스 제공하여 추후 교체 용이

### 4.4 ConfirmDialog Safety Pattern

- 일반 파괴적 액션: 메시지 + "취소"/"삭제" 버튼
- 10건 이상 일괄 삭제: 영향 받는 레코드 수 명시 + 확인 문자열("DELETE") 입력 필수
- focus trap + ESC = 취소 + 기본 포커스는 "취소" 버튼

---

## 5. Risks & Mitigations

| 리스크 | 영향도 | 완화 방안 |
|--------|--------|-----------|
| Recharts 미설치 시 차트 구현 지연 | High | M1 시작 시 의존성 확인, Tremor 대안 준비 |
| DataTable 범용성 부족으로 페이지별 커스터마이징 폭증 | Medium | Generic prop 패턴 + render prop 지원 설계 |
| 권한 매트릭스 대량 데이터 렌더 성능 저하 | Medium | Virtualization (react-window) 고려 |
| 기존 API 응답 구조 변경 누락 | High | 기존 fetch 로직 그대로 유지, UI 레이어만 교체 |
| 파괴적 액션 실수 발생 | Critical | ConfirmDialog 필수 + 확인 문자열 + 일괄 작업 추가 경고 |

---

## 6. Definition of Ready (착수 조건)

- [x] SPEC-UI-001 디자인 시스템 토큰 배포 완료
- [x] shadcn/ui 기반 컴포넌트 사용 가능
- [x] Pretendard + Inter 폰트 로드 완료
- [ ] Recharts 또는 대체 차트 라이브러리 결정

---

## 7. Cross-References

- **Prerequisite**: `.moai/specs/SPEC-UI-001/spec.md`
- **Acceptance**: `.moai/specs/SPEC-UI-004/acceptance.md`
- **Compact Summary**: `.moai/specs/SPEC-UI-004/spec-compact.md`
