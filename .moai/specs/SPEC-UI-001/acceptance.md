---
spec_id: SPEC-UI-001
version: 0.1.0
created: 2026-04-15
updated: 2026-04-15
---

# SPEC-UI-001 Acceptance Criteria

## 1. Given-When-Then 시나리오

### Scenario 1: Primary color scale export
- **Given** `tailwind.config.js`가 확장된 theme을 가지고 있고
- **When** 개발자가 `theme.extend.colors.primary`를 참조할 때
- **Then** `50, 100, 200, 300, 400, 500, 600, 700, 800, 900` 10단계 key가 존재하고, `500` 값이 `#FF7210` 또는 그에 해당하는 OKLCH/HSL 표기를 가진다.

### Scenario 2: Design system 문서 완성
- **Given** SPEC 구현이 완료된 상태에서
- **When** 개발자가 `.moai/design/system.md`를 열람할 때
- **Then** 문서는 (a) 디자인 원칙 4개 (Modern/Calm/Trustworthy/Warm), (b) 모든 토큰 카테고리(color/typography/spacing/shadow/radius/z-index) 레퍼런스, (c) 사용 예시, (d) Defaults to avoid 리스트를 포함한다.

### Scenario 3: 도메인 간 시각 일관성
- **Given** teacher/lawyer/admin 3개 도메인 대시보드가 존재하고
- **When** 사용자가 각 대시보드의 Button, Card, Badge, Table을 비교할 때
- **Then** 동일 컴포넌트는 동일 color/radius/shadow/typography를 가지며, 도메인 간 차이는 컨텐츠에 한정된다.

### Scenario 4: Dark mode 토글 동작
- **Given** 앱이 light mode 상태이고
- **When** 사용자가 dark mode 토글을 실행할 때
- **Then** 모든 core 컴포넌트(Button, Card, Input, Badge, Dialog, Tabs 등)의 색상이 1프레임 내에 dark 토큰으로 전환되고, 대비비(contrast)는 body text 기준 4.5:1 이상을 만족한다.

### Scenario 5: 폰트 적용
- **Given** 페이지에 한글과 영문/숫자 텍스트가 혼재하고
- **When** 페이지가 로드될 때
- **Then** 한글 글리프는 Pretendard, 영문/숫자 글리프는 Inter로 렌더되고, 둘 다 로드 실패 시 system-ui fallback으로 표시된다. FOIT(invisible text) 현상은 발생하지 않는다 (`display: swap`).

### Scenario 6: 기존 플로우 regression 없음
- **Given** 기존 핵심 플로우(로그인, 대시보드 접근, 리포트 작성, 상담 조회)가 존재하고
- **When** SPEC-UI-001 구현 후 동일 플로우를 수행할 때
- **Then** 라우팅, 폼 제출, 데이터 표시가 모두 정상 동작하며, 레이아웃이 깨지거나 요소가 사라지는 broken state가 발생하지 않는다.

### Scenario 7: EmptyState / ErrorState 렌더
- **Given** 데이터가 없는 리스트 페이지 또는 에러 발생 컴포넌트에서
- **When** 해당 상태 조건이 충족될 때
- **Then** `EmptyState` 또는 `ErrorState` 컴포넌트가 아이콘 + 메시지 + (선택적) CTA와 함께 렌더된다.

### Scenario 8: Badge status variant
- **Given** Badge 컴포넌트가 `status` prop을 지원하고
- **When** `pending`, `in-progress`, `completed`, `urgent` 값이 전달될 때
- **Then** 각각 Indigo tint, Teal tint, Success(green) tint, Error(red) tint 계열로 렌더되고 텍스트 대비가 충분하다.

---

## 2. Edge Cases

- **EC1**. 사용자가 시스템 폰트 설치 없이(Pretendard/Inter 미설치) 접속 → `next/font`가 self-host 폰트 제공, 오프라인에서도 렌더.
- **EC2**. 사용자가 OS 수준에서 prefers-color-scheme: dark 설정 → 앱 초기 진입 시 dark mode 자동 적용 (기존 shadcn 동작 유지).
- **EC3**. 사용자가 긴 한글 라벨(20자 이상)을 가진 Button을 렌더 → 줄바꿈 대신 truncate 또는 width 자동 조정으로 레이아웃 유지.
- **EC4**. Badge `status` prop에 잘못된 값 전달 → 기본 neutral variant로 graceful fallback.
- **EC5**. 브라우저가 CSS custom properties를 지원하지 않는 레거시 IE → 명시적 미지원 (Next.js 14 baseline).
- **EC6**. 구형 모바일 Safari에서 font variable 미지원 → static Inter regular/bold weight fallback.

---

## 3. Quality Gate Criteria

### 3.1 코드 품질
- [ ] `components/ui/*` 내부에 하드코딩된 hex 색상(`#[0-9a-fA-F]{3,6}`) 0건
- [ ] `components/ui/*` 내부에 Tailwind `blue-*` / `gray-*` 클래스 0건 (primary/neutral로 대체)
- [ ] 모든 컴포넌트 파일 300 LOC 이하
- [ ] TypeScript 타입 에러 0건
- [ ] ESLint 에러 0건

### 3.2 디자인 토큰
- [ ] Primary scale 50-900 10단계 정의
- [ ] Neutral scale 50-900 10단계 정의 (warm stone)
- [ ] Semantic (success/warning/error/info) light + dark 쌍 정의
- [ ] Accent (indigo/teal) 정의
- [ ] Typography scale 11단계 정의
- [ ] Shadow 4단계, Radius 5단계, Z-index 6단계 정의

### 3.3 문서화
- [ ] `.moai/design/system.md` 존재
- [ ] 디자인 원칙 4개 기술
- [ ] 모든 토큰 카테고리에 사용 예시 포함
- [ ] "Defaults to avoid" 섹션 존재

### 3.4 기능 검증
- [ ] 로그인 플로우 정상
- [ ] teacher/lawyer/admin 대시보드 렌더 정상
- [ ] 리포트 작성 페이지 정상
- [ ] 상담 조회 페이지 정상
- [ ] Dark mode 토글 정상 (모든 core 컴포넌트)
- [ ] Pretendard(KO) / Inter(EN) 적용 확인

### 3.5 의존성
- [ ] `package.json`에 신규 npm 의존성 0건 추가
- [ ] 기존 shadcn/ui, Radix UI, Lucide React, Tailwind 3.4 유지

---

## 4. Definition of Done

다음 모든 조건이 충족되면 SPEC-UI-001을 `status: completed`로 전환할 수 있다.

1. **Scope 완결**
   - spec.md의 모든 Ubiquitous(U1-U5), Event-Driven(E1-E3), State-Driven(S1-S4), Optional(O1-O3), Unwanted(X1-X4) 요구사항 충족
   - Delta marker에 명시된 `[MODIFY]` `[NEW]` 파일 작업 완료
   - Exclusion 항목(E-1 ~ E-10)을 범위 밖으로 유지

2. **Quality Gate**
   - 상기 3.1 ~ 3.5 모든 체크박스 통과

3. **문서화**
   - `.moai/design/system.md` 확정 (변경 이력 포함)
   - spec.md HISTORY 업데이트
   - plan.md 마일스톤 전부 체크

4. **후속 SPEC 준비**
   - SPEC-UI-002 ~ UI-005가 참조할 수 있는 토큰/컴포넌트 안정화
   - 설계 결정 사항이 `.moai/design/system.md`에 모두 반영

5. **승인**
   - 시각 regression 수동 확인 완료 (before/after 비교)
   - 사용자(Shin) 리뷰 및 승인
