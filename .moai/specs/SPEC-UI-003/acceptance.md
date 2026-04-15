---
spec_id: SPEC-UI-003
version: 1.0.0
created: 2026-04-15
updated: 2026-04-15
---

# Acceptance Criteria — SPEC-UI-003 Lawyer Domain UI Redesign

## Given-When-Then 시나리오

### Scenario 1: 대시보드 KPI 및 활성 사건 표시

- **Given** 변호사 계정으로 로그인하여 `/lawyer`에 진입했고, DB에 배정된 사건이 3건 존재할 때
- **When** 페이지가 렌더링되면
- **Then** 상단에 4–5개의 KPI(활성 사건, 대기, 완료, 이번 달 처리 등) strip이 표시되고, 실제 DB 값이 바인딩되며, 하드코딩 수치는 0이다.
- **And** WorkloadMeter가 현재 사건 수 / 임계치 대비 상태 색상으로 표시된다.

### Scenario 2: Urgent 사건의 시각적 시그널

- **Given** 상담 목록 페이지에서 urgency가 `urgent`인 사건이 1건 이상 존재할 때
- **When** 목록이 렌더링되면
- **Then** 해당 row는 red accent 색상과 warning 아이콘을 가진 `CasePriorityBadge`로 표시되고, 일반 사건과 시각적으로 명확히 구분된다.

### Scenario 3: 사건 클레임 확인 흐름

- **Given** 변호사가 available 상태의 사건을 보고 있을 때
- **When** "이 사건 맡기" 버튼을 클릭하면
- **Then** confirmation dialog가 표시되고, 사용자가 확인을 누르기 전까지 claim API는 호출되지 않는다.
- **And** 확인 후 API가 1회만 호출되고, 버튼은 진행 중 비활성화된다.

### Scenario 4: 상담 상세 3-pane 레이아웃

- **Given** 변호사가 배정된 사건의 상세 페이지(`/lawyer/consult/[id]`)에 진입한 뷰포트가 ≥ 1024px일 때
- **When** 페이지가 로드되면
- **Then** 좌측 pane에 `CaseHeader` 및 사건 정보, 중앙 pane에 `MessageThread`, 우측 pane에 `CaseQuickActionsSidebar`가 동시에 렌더링된다.

### Scenario 5: 답변 작성 중 이탈 보호

- **Given** `/lawyer/consult/reply/[id]`에서 답변 내용을 입력했으나 저장하지 않은 상태에서
- **When** 페이지 이탈을 시도하면
- **Then** 브라우저/앱 레벨 확인 dialog가 표시되어 의도치 않은 손실을 방지한다.

### Scenario 6: Empty State 처리 (Fake 데이터 금지)

- **Given** DB에 배정된 사건이 0건인 변호사 계정으로 로그인했을 때
- **When** `/lawyer/my-cases`에 진입하면
- **Then** Lorem ipsum, placeholder 사건, fake row는 표시되지 않고, 전용 Empty State 컴포넌트("아직 배정된 사건이 없습니다" 등)가 렌더링된다.

## Edge Cases

- **EC-01**: 사건이 100건 이상일 때 테이블 가상화 또는 페이지네이션이 동작하며 성능 저하 없음.
- **EC-02**: 다른 변호사가 동일 사건을 먼저 claim한 경우, 서버 에러 응답을 받으면 Toast로 사용자에게 알리고 목록을 새로고침한다.
- **EC-03**: 네트워크 실패 시 Error State 컴포넌트 + 재시도 버튼이 표시된다.
- **EC-04**: 모바일 뷰포트(< 768px) 접근 시 3-pane이 stacked single column으로 전환되며, 읽기 위주 동작만 허용된다 (답변 작성 CTA는 데스크톱 안내 노출 또는 축약).
- **EC-05**: TipTap 기존 저장 포맷이 본 스타일 재정의 후에도 정상 렌더링 (regression).

## 품질 게이트 (Quality Gates)

- [ ] 모든 6개 페이지가 SPEC-UI-001 토큰만 사용 (하드코딩 hex/px 0건, lint check 통과)
- [ ] 신규 composed 컴포넌트 7종 모두 구현 및 사용됨
- [ ] Empty / Loading / Error 상태 각 페이지 구현
- [ ] a11y 검사 통과: focus ring, WCAG AA color contrast, keyboard focus order
- [ ] 반응형: 1024px+ 주 레이아웃, 768–1023 사용 가능, < 768 읽기 전용
- [ ] 기존 API / DB / 비즈니스 로직 변경 없음 (diff 검증)
- [ ] LCP 회귀 없음 (< 2.5s 목록 페이지)
- [ ] TypeScript 타입 에러 0건, ESLint 에러 0건

## Definition of Done

1. 6개 lawyer 페이지가 재설계되어 병합 가능한 상태
2. 7개 신규 composed components가 `components/lawyer/` 하위에 존재하며 재사용 가능
3. acceptance.md의 Scenario 1–6 전부 수동 검증 완료
4. Edge Case EC-01 ~ EC-05 처리 확인
5. 품질 게이트 체크리스트 전부 통과
6. SPEC-UI-001 토큰 외 신규 토큰/하드코딩 없음 (코드 리뷰 승인)
7. 기존 e2e / 단위 테스트 회귀 통과 (API 변경이 없으므로 기존 테스트 스펙 유지)
