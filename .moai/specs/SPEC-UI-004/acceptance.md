---
spec_id: SPEC-UI-004
version: 1.0.0
created: 2026-04-15
updated: 2026-04-15
---

# SPEC-UI-004 Acceptance Criteria

## 1. Given-When-Then Scenarios

### Scenario 1: DataTable 일관성
- **Given** 관리자가 사용자 관리 페이지에 접속했을 때
- **When** 페이지가 렌더링되면
- **Then** DataTable은 검색 입력, 정렬 가능한 컬럼 헤더, 페이지네이션, 행 체크박스, 컬럼 설정 버튼을 모두 표시해야 한다.

### Scenario 2: BulkActionBar 표시
- **Given** 관리자가 사용자 목록에서 3개의 행 체크박스를 선택했을 때
- **When** 선택이 완료되면
- **Then** 화면 하단에 "3명 선택됨" 텍스트와 일괄 활성화/비활성화/삭제 버튼을 포함한 BulkActionBar가 고정 표시되어야 한다.

### Scenario 3: 파괴적 액션 확인
- **Given** 관리자가 사용자 한 명의 "삭제" 버튼을 클릭했을 때
- **When** 즉시
- **Then** 시스템은 삭제를 실행하지 않고 사용자명과 경고 메시지를 포함한 ConfirmDialog를 표시하며, "취소" 버튼에 기본 포커스를 둬야 한다.
- **And** "삭제" 버튼은 확인 입력 또는 재확인 클릭 전까지 실행되지 않아야 한다.

### Scenario 4: 대량 삭제 추가 경고
- **Given** 관리자가 15명의 사용자를 선택하고 BulkActionBar에서 "삭제"를 클릭했을 때
- **When** ConfirmDialog가 나타나면
- **Then** 다이얼로그는 "15명의 사용자가 영구 삭제됩니다" 경고와 함께 "DELETE" 문자열 입력 필드를 표시하고, 정확히 입력되기 전까지 실행 버튼은 비활성화되어야 한다.

### Scenario 5: Sheet 기반 상세 보기
- **Given** 관리자가 신고 목록에서 한 행을 클릭했을 때
- **When** 클릭 이벤트가 발생하면
- **Then** 화면 우측에서 Sheet 컴포넌트가 슬라이드 인되어 신고 상세 정보를 표시해야 한다.
- **And** ESC 키 또는 배경 클릭 시 Sheet가 닫혀야 한다.

### Scenario 6: FilterPanel URL 동기화
- **Given** 관리자가 신고 페이지에서 상태 필터를 "처리 중"으로 변경했을 때
- **When** 필터 변경이 완료되면
- **Then** URL의 query string이 `?status=in_progress`로 업데이트되어야 한다.
- **And** 페이지 새로고침 후에도 동일 필터가 유지되어야 한다.

### Scenario 7: 분석 대시보드 날짜 변경
- **Given** 관리자가 분석 대시보드에서 날짜 범위를 "최근 30일"에서 "최근 7일"로 변경했을 때
- **When** Date Range Picker가 변경되면
- **Then** 모든 차트가 500ms 이내에 새 데이터로 재렌더링되어야 한다.

### Scenario 8: 권한 매트릭스 Dirty 상태
- **Given** 관리자가 권한 매트릭스 페이지에 진입하여 셀 하나를 토글했을 때
- **When** 토글이 발생하면
- **Then** 해당 셀에 Dirty 표시(예: 점 인디케이터)가 나타나고, 상단의 "저장" 버튼이 활성화되어야 한다.
- **And** 페이지 이탈 시 확인 다이얼로그가 표시되어야 한다.

### Scenario 9: Empty State
- **Given** 상담 목록에 데이터가 하나도 없을 때
- **When** 페이지가 로드되면
- **Then** 일러스트, "아직 상담 내역이 없습니다" 메시지, 관련 도움말 링크를 포함한 EmptyState가 표시되어야 한다.

### Scenario 10: Loading Skeleton
- **Given** 관리자가 사용자 관리 페이지에 처음 진입했을 때
- **When** 데이터 로드가 진행 중이면
- **Then** DataTable 영역에 최소 5행의 Skeleton 플레이스홀더가 표시되어야 한다.

### Scenario 11: 디자인 토큰 준수
- **Given** 임의의 관리자 페이지에서
- **When** Primary 액션 버튼을 검사하면
- **Then** 배경색은 `#FF7210` (SPEC-UI-001 primary token)이어야 한다.
- **And** border radius, shadow, typography가 SPEC-UI-001 토큰 값과 일치해야 한다.

---

## 2. Edge Cases

- **EC-01**: 체크박스로 전체 선택 후 일부 행이 필터링으로 숨겨지는 경우 — 선택 상태는 필터 적용 전 행에 대해서만 유지되어야 한다.
- **EC-02**: 차트 라이브러리(Recharts) 미설치 시 — ChartContainer는 "차트 라이브러리가 설치되지 않았습니다" placeholder와 숫자 테이블 폴백을 제공해야 한다.
- **EC-03**: 네트워크 오류로 데이터 로드 실패 시 — Error 상태 UI에 재시도 버튼이 포함되어야 한다.
- **EC-04**: 1024px 미만 뷰포트 접근 시 — 상단에 "데스크톱 환경을 권장합니다" 배너가 표시되어야 한다.
- **EC-05**: 권한 매트릭스에서 Dirty 상태로 페이지를 떠나려 할 때 — `beforeunload` 이벤트로 확인 경고를 표시해야 한다.
- **EC-06**: Sheet가 열린 상태에서 다른 행 클릭 시 — 기존 Sheet 내용이 새 행으로 교체되어야 한다 (중첩 아님).
- **EC-07**: 알림 발송 중 네트워크 끊김 — 큐 상태 패널에 "전송 실패" 상태로 표시되고 재시도 가능해야 한다.

---

## 3. Quality Gate Criteria

### 3.1 TRUST 5

- **Tested**: 핵심 복합 컴포넌트(DataTable, ConfirmDialog, FilterPanel) 단위 테스트 작성; 11개 페이지 스모크 테스트 통과
- **Readable**: 컴포넌트명/props 일관성, SPEC-UI-001 네이밍 컨벤션 준수
- **Unified**: Tailwind 클래스 순서 일관성 (Prettier plugin); 모든 페이지 동일 레이아웃 패턴
- **Secured**: 파괴적 액션 100% ConfirmDialog 적용; XSS 방지 (dangerouslySetInnerHTML 미사용)
- **Trackable**: 모든 변경은 `feat(admin-ui): ...` 또는 `refactor(admin-ui): ...` Conventional Commit

### 3.2 Performance

- Lighthouse Performance (desktop): ≥ 85
- LCP (50행 DataTable): ≤ 1.5s
- 필터 재적용 응답 시간: ≤ 300ms

### 3.3 Accessibility

- axe DevTools: 0 critical issues
- 키보드만으로 모든 대화형 요소 접근 가능
- ConfirmDialog focus trap 검증
- 차트에 aria-label 또는 테이블 폴백 제공

### 3.4 Visual Consistency

- SPEC-UI-001 토큰 이외의 하드코딩 색상 0건 (grep 검증)
- 11개 페이지 레이아웃 프레임 일관성 (사이드바 + 헤더 + 메인)

---

## 4. Definition of Done

- [ ] 11개 관리자 페이지 모두 재설계 완료
- [ ] 6개 신규 복합 컴포넌트 (DataTable, KPICard, BulkActionBar, FilterPanel, ChartContainer, ConfirmDialog) 구현 완료
- [ ] 모든 테이블에 Empty / Loading / Error 3종 상태 구현
- [ ] 모든 파괴적 액션에 ConfirmDialog 적용
- [ ] 대량(10+) 파괴적 작업에 확인 문자열 입력 요구
- [ ] URL 기반 필터/정렬/페이지 상태 구현
- [ ] SPEC-UI-001 토큰 100% 준수 (하드코딩 색상 0건)
- [ ] 기존 API 호출/비즈니스 로직 무변경 (회귀 테스트 통과)
- [ ] Lighthouse Performance ≥ 85
- [ ] axe Accessibility 0 critical issues
- [ ] 데스크톱(1280+) 및 중간 뷰포트(1024–1279) 수동 검수 완료
- [ ] 1024px 미만 경고 배너 표시 확인
- [ ] Conventional Commit 메시지로 변경 이력 기록
- [ ] 리뷰어 승인 (expert-frontend + designer)

---

## 5. Out of Scope Verification

다음 항목은 본 SPEC의 승인 기준에 **포함되지 않음**을 확인:

- ❌ 모바일(<1024px) 전용 레이아웃
- ❌ 신규 관리자 기능 (AI 요약 등)
- ❌ 교사/변호사 도메인 페이지
- ❌ API 또는 인증 로직 변경
- ❌ i18n 다국어 지원
- ❌ 디자인 시스템 토큰 변경
