---
spec_id: SPEC-UI-005
version: 0.1.0
status: draft
---

# SPEC-UI-005 인수 기준 (Acceptance Criteria)

## 시나리오 (Given-When-Then)

### Scenario 1: 랜딩 히어로 CTA 클릭 → 회원가입 진입

- **Given** 사용자가 `/` 랜딩 페이지에 접속한 상태에서
- **When** 히어로 섹션의 Primary CTA 버튼을 클릭하면
- **Then** 브라우저는 `/signup` 페이지로 이동하고, 회원가입 Step 1(계정 정보)이 렌더링된다.

### Scenario 2: 회원가입 Step 진행 시 Progress Bar 업데이트

- **Given** 사용자가 `/signup` 페이지의 Step 1(account)에서 필수 필드를 입력한 상태에서
- **When** '다음' 버튼을 클릭하면
- **Then** Step 2(profile)로 전환되고, Progress Bar가 25% → 50% 위치로 업데이트되며, 상단에 현재 step 라벨이 표시된다.

### Scenario 3: 로그인 실패 시 Inline Error 표시

- **Given** 사용자가 `/login` 페이지에 접속한 상태에서
- **When** 잘못된 이메일/비밀번호 조합으로 제출하면
- **Then** 폼 하단에 inline error message가 표시되고, 해당 필드에 aria-invalid 속성이 설정되며, 비밀번호 찾기 링크가 강조된다.

### Scenario 4: 공유 리포트 공개 뷰 — PII 보호

- **Given** 공개 공유 링크를 통해 `/shared-reports/[token]`에 접속한 비인증 사용자
- **When** 페이지가 렌더링되면
- **Then** 상단 네비게이션 바와 사용자 프로필 영역은 숨겨지고, 상담 당사자 이름/연락처 등 PII는 마스킹되며, 인쇄 버튼(또는 브라우저 인쇄 시) A4 레이아웃이 보존된다.

### Scenario 5: 404 오류 페이지

- **Given** 사용자가 존재하지 않는 경로(`/nonexistent`)에 접속한 상태
- **When** Next.js가 not-found를 트리거하면
- **Then** 브랜드 친화적인 404 페이지(일러스트 + "홈으로" CTA)가 렌더링되고, 스택 트레이스나 내부 경로는 노출되지 않는다.

## Edge Cases

- **EC-1**: 랜딩 페이지 접속 시 JavaScript 비활성 환경에서도 히어로 헤드라인과 Primary CTA 링크가 정상 동작 (Server Component 우선)
- **EC-2**: 회원가입 도중 페이지 새로고침 시 현재 step 유지 여부 — 본 SPEC 범위에서는 초기화 허용, 단 사용자에게 혼란 최소화(step 1 복귀 명시)
- **EC-3**: 협회 선택(association) step에서 협회 목록이 비어있는 경우 fallback UI 표시
- **EC-4**: 공유 리포트 토큰이 만료되었거나 유효하지 않은 경우 "만료됨" 상태 페이지(오류 아님) 표시
- **EC-5**: 다크모드 전환 시 랜딩 히어로 배경/텍스트 대비 WCAG AA 충족
- **EC-6**: 모바일 375px 환경에서 히어로 헤드라인이 2~3줄로 자연스럽게 접히고 CTA가 전체 폭 버튼으로 전환

## 품질 게이트 기준 (Quality Gate Criteria)

- **EARS 준수**: UR-1 ~ UR-4, ER-1 ~ ER-4, SR-1 ~ SR-3, UW-1 ~ UW-3 전 항목 검증 가능
- **디자인 토큰 순수성**: SPEC-UI-001 토큰 외 임의 hex/색상 상수 사용 금지 (lint 규칙 또는 코드 리뷰)
- **Lorem ipsum 부재**: 전체 공개 페이지에서 "lorem", "ipsum" 문자열 검색 결과 0건
- **Lighthouse 점수**: Performance ≥ 85, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 95
- **E2E 테스트**: Playwright 기준 Scenario 1, 2, 3 최소 커버리지
- **반응형 검증**: 375px / 768px / 1440px 3개 뷰포트에서 레이아웃 파손 없음

## Definition of Done (DoD)

- [ ] M1 랜딩 페이지 구현 및 Meta/OG 태그 반영
- [ ] M2 로그인/회원가입 폼 리디자인 (progress bar, inline error)
- [ ] M3 공유 리포트 공개 뷰 + 404/500 오류 페이지
- [ ] SPEC-UI-001 디자인 토큰 순수 적용 (임의 상수 0건)
- [ ] 반응형 3개 뷰포트 검증 완료
- [ ] Playwright E2E: Scenario 1~3 통과
- [ ] Lighthouse 4개 지표 목표 점수 달성
- [ ] Lorem ipsum/placeholder 잔존 검사 통과
- [ ] PII 노출 없음 (공유 리포트 수동 검증)
- [ ] 인쇄(A4) 레이아웃 수동 검증 (공유 리포트)
- [ ] 접근성: 키보드 네비게이션, ARIA labels, color contrast 검증
- [ ] 코드 리뷰 승인 및 main 브랜치 병합
