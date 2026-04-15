---
spec_id: SPEC-UI-002
version: 0.1.0
created: 2026-04-15
updated: 2026-04-15
---

# SPEC-UI-002 Acceptance Criteria

모든 시나리오는 Given-When-Then 형식으로 기술된다. 본 SPEC은 UI 재디자인이므로, 검증은 주로 시각적 일관성, 상태별 UI, 반응형, 다크모드, 그리고 기존 기능 회귀 부재에 초점을 둔다.

---

## 1. Dashboard (대시보드)

### AC-1.1 대시보드 기본 렌더링 (정상 상태)
- **Given** 로그인한 교사가 신고 데이터가 존재하는 상태이고
- **When** `/teacher`에 접근하면
- **Then** 시스템은 3–4개의 StatCard(누적 신고, 진행 중, 완료, 이번 달 등), 최근 활동 피드, 프라이머리 CTA "신고하기"를 SPEC-UI-001 토큰 기반 스타일로 표시한다.

### AC-1.2 "신고하기" CTA 동작 (Event E1)
- **Given** 교사가 대시보드를 보고 있을 때
- **When** 프라이머리 CTA "신고하기" 버튼을 클릭하면
- **Then** 시스템은 `/teacher/reports/new`로 이동하여 멀티스텝 폼의 첫 단계를 표시한다.

### AC-1.3 빈 상태 (Empty)
- **Given** 교사가 아직 신고를 작성한 적이 없을 때
- **When** 대시보드에 접근하면
- **Then** 시스템은 EmptyState 컴포넌트로 "아직 신고 내역이 없습니다" 메시지와 "신고하기" CTA를 공감적 톤으로 표시한다.

### AC-1.4 로딩 상태 (Skeleton)
- **Given** 대시보드 데이터 로딩 중일 때
- **When** 페이지가 처음 그려지면
- **Then** 시스템은 StatCard 및 피드 영역에 해당하는 skeleton UI를 표시한다 (스피너 단독 금지).

---

## 2. Reports List (리포트 목록)

### AC-2.1 상태 Badge 표시 (S1–S4)
- **Given** 상태가 각각 접수/검토중/상담중/완료인 리포트가 존재할 때
- **When** `/teacher/reports`에 접근하면
- **Then** 각 행의 Badge variant는 정확히 default/outline/secondary/success(또는 muted)로 표시된다.

### AC-2.2 필터 pill 동작 (Event E3)
- **Given** 여러 상태의 리포트가 혼재한 목록을 보고 있을 때
- **When** "상담중" 필터 pill을 클릭하면
- **Then** 시스템은 해당 상태만 필터링하여 즉시 표시하고, pill의 활성 시각 상태(selected)를 primary 톤으로 표시한다.

### AC-2.3 urgent 플래그 (S5)
- **Given** urgent=true 리포트가 있을 때
- **When** 목록을 조회하면
- **Then** 해당 행에 urgent 아이콘과 primary 계열 강조가 표시된다.

---

## 3. Report New (신고 생성 멀티스텝 폼)

### AC-3.1 스텝 진행 (Event E2)
- **Given** 교사가 `/teacher/reports/new` 1단계(카테고리 선택)에 있을 때
- **When** 필수값 입력 후 "다음"을 클릭하면
- **Then** 시스템은 진행 표시기를 25% → 50%로 업데이트하고, 2단계(상세 내용)로 전환하며, 1단계 입력값을 상태에 임시 저장한다.

### AC-3.2 검토 단계
- **Given** 3단계(증빙 업로드)까지 완료했을 때
- **When** "다음"을 클릭하여 4단계(검토)로 진입하면
- **Then** 모든 입력값이 요약 카드에 표시되고, "제출" 프라이머리 버튼이 활성화된다.

### AC-3.3 모바일 full-screen step (O2)
- **Given** 뷰포트가 < 768px일 때
- **When** 신고 생성 폼에 접근하면
- **Then** 한 스텝이 한 화면 전체를 차지하고, 진행 표시기는 상단에 sticky로 표시된다.

### AC-3.4 기능 회귀 없음
- **Given** 기존 신고 제출 API와 동일한 payload 스키마를 유지할 때
- **When** 4단계에서 "제출"을 클릭하면
- **Then** 기존과 동일한 API 호출이 이루어지고, 성공 시 기존과 동일한 라우팅(리포트 상세 또는 목록)으로 이동한다.

---

## 4. Report Detail (리포트 상세)

### AC-4.1 2-column 레이아웃
- **Given** 뷰포트가 >= 1024px이고 리포트가 존재할 때
- **When** `/teacher/reports/[id]`에 접근하면
- **Then** 좌측에 리포트 상세 내용, 우측에 StatusTimeline과 변호사 답변 스레드가 표시된다.

### AC-4.2 StatusTimeline 상태 표시 (O3)
- **Given** 리포트가 "상담중" 단계일 때
- **When** 상세 페이지를 조회하면
- **Then** 접수/검토는 muted(완료), 상담중은 primary(현재), 완료는 dashed outline(미래)로 구분되어 표시된다.

### AC-4.3 변호사 답변 하이라이트 (Event E4)
- **Given** 교사가 이전 방문 이후 새 답변이 도착한 리포트를 열 때
- **When** 상세 페이지가 렌더링되면
- **Then** 신규 답변 항목에 subtle primary accent(좌측 border 또는 배지)가 표시된다.

### AC-4.4 개인정보 표식 (U4)
- **Given** 상세 페이지에 연락처 등 민감 필드가 포함될 때
- **When** 페이지를 조회하면
- **Then** 해당 필드 옆에 잠금 아이콘 또는 "비공개" 라벨이 표시된다.

---

## 5. Community (커뮤니티)

### AC-5.1 익명 기본값 (Event E5, N3)
- **Given** 교사가 커뮤니티 글 작성 폼을 열 때
- **When** 폼이 렌더링되면
- **Then** 작성자 표시는 익명 아바타 + "익명" 라벨이 기본값이며, 실명/이메일 필드는 노출되지 않는다.

### AC-5.2 카드 그리드 및 태그
- **Given** 커뮤니티 목록을 조회할 때
- **When** `/teacher/community`에 접근하면
- **Then** 포스트가 카드 그리드로 표시되고 각 카드에 카테고리 태그, 익명 아바타, 참여 메트릭(댓글 수, 공감 수)이 표시된다.

---

## 6. Responsive & Dark Mode

### AC-6.1 대시보드 반응형 (S7)
- **Given** 대시보드를 볼 때
- **When** 뷰포트가 < 768 / 768–1024 / >= 1024로 변할 때
- **Then** StatCard는 각각 1열 / 2열 / 3–4열로 배치된다.

### AC-6.2 다크모드 전수 (O1)
- **Given** 다크모드가 활성화되었을 때
- **When** 교사 도메인의 8개 페이지를 순회할 때
- **Then** 모든 페이지가 UI-001 dark palette로 정상 렌더링되고, 대비 부족으로 읽을 수 없는 영역이 없다.

---

## 7. Edge Cases & Error States

### AC-7.1 로딩 skeleton (N4)
- **Given** 네트워크가 느릴 때
- **When** 데이터 페이지에 접근하면
- **Then** 시스템은 skeleton을 표시하고, 2초 이상 스피너 단독 표시나 빈 화면을 보이지 않는다.

### AC-7.2 에러 상태 메시지 (N5)
- **Given** 리포트 상세 로딩이 실패할 때
- **When** 페이지가 에러 상태에 진입하면
- **Then** 사용자에게는 공감적 톤의 한국어 메시지("일시적으로 불러올 수 없습니다. 잠시 후 다시 시도해 주세요.")와 "다시 시도" 버튼이 표시되고, 스택 트레이스/내부 에러 코드는 노출되지 않는다.

### AC-7.3 하드코딩 컬러 금지 (N1)
- **Given** 재디자인이 완료되었을 때
- **When** `app/teacher/**/*.tsx`와 `components/teacher/**/*.tsx`를 hex 컬러 정규식으로 grep할 때
- **Then** 매칭 건수는 0건이다 (불가피한 SVG fill 등 예외는 SPEC에 명시적으로 기록).

---

## 8. Regression (회귀 방지)

### AC-8.1 비즈니스 로직 불변 (N2, X1)
- **Given** 재디자인 전후의 네트워크 기록을 비교할 때
- **When** 신고 제출, 리포트 조회, 커뮤니티 글 작성 등 주요 플로우를 실행하면
- **Then** 호출되는 API endpoint, HTTP method, payload 스키마, 응답 처리 로직이 모두 동일하다.

### AC-8.2 페이지 라우팅 불변
- **Given** 기존 라우팅 구조가 유지될 때
- **When** 사이드바/링크/CTA 이동을 수행하면
- **Then** 모든 경로(`/teacher`, `/teacher/reports`, ...)가 재디자인 전과 동일하게 유지된다.

---

## 9. Definition of Done (완료 정의)

- [ ] 8개 교사 페이지 모두 SPEC-UI-001 토큰/컴포넌트로 재구성됨
- [ ] 6개 신규 합성 컴포넌트 구현됨 (StatCard, ReportCard, StatusTimeline, MultiStepForm, EmptyState, LoadingSkeleton)
- [ ] 모든 데이터 페이지에 loading/empty/error 상태 구현됨
- [ ] 768 / 1024 / 1440 뷰포트에서 레이아웃 검증됨
- [ ] 다크모드 전수 검증됨
- [ ] 하드코딩 hex 컬러 grep 결과 0건(또는 문서화된 예외만)
- [ ] 기존 사용자 플로우(신고 제출, 상세 조회, 커뮤니티 작성) 수동 회귀 테스트 pass
- [ ] 모든 EARS 요구사항(U/E/S/O/N)의 대응 AC가 통과됨
- [ ] SPEC-UI-001 base 컴포넌트를 수정하지 않았음을 확인
