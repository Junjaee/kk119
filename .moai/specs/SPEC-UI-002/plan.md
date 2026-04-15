---
spec_id: SPEC-UI-002
version: 0.1.0
created: 2026-04-15
updated: 2026-04-15
---

# SPEC-UI-002 Implementation Plan

## 1. Prerequisites (선행 조건)

- [필수] SPEC-UI-001 (Design System Foundation) 구현 완료
  - `components/ui/*` base 컴포넌트 토큰 기반으로 리파인됨
  - `tailwind.config.ts`에 design tokens (primary orange scale, warm stone neutrals) 정의됨
  - `.moai/design/system.md` 문서 존재
  - 다크모드 클래스 전략(`class`) 설정됨
- 교사 도메인 기존 페이지 동작 확인 (재디자인 전 기능 baseline)

## 2. Technical Approach (기술 접근)

- **컴포넌트 계층**: base (shadcn/ui from UI-001) → composed (`components/teacher/*`) → page (`app/teacher/**/page.tsx`)
- **스타일**: Tailwind utility + design token 변수만 사용, 하드코딩 금지
- **상태 관리**: 기존 로직(React state, fetcher) 유지, UI만 재배치
- **반응형**: Tailwind breakpoints `md:` (768), `lg:` (1024) 중심
- **다크모드**: `dark:` variant 활용, UI-001 palette 참조
- **에이전트**: expert-frontend (주도), designer (시각 검토)

## 3. Milestones (마일스톤)

마일스톤은 우선순위 기반이며 시간 추정치를 포함하지 않는다.

### M1 — Dashboard & Composed Components (Priority High)

1. 신규 컴포넌트 스캐폴드: StatCard, ReportCard, EmptyState, LoadingSkeleton
2. `app/teacher/page.tsx` 재디자인: 메트릭 카드 그리드 + 최근 활동 피드 + 프라이머리 CTA "신고하기"
3. 반응형(1/2/3–4 col) 및 다크모드 검증
4. Exit criteria: 대시보드 모든 상태(loading/empty/error/정상) 동작, 기존 데이터 페칭 회귀 없음

### M2 — Reports List & New (Priority High)

1. 신규 컴포넌트: MultiStepForm (진행 표시기 + step slot)
2. `app/teacher/reports/page.tsx`: 필터 pill, 상태 Badge 테이블, urgent 표식, 빈 상태
3. `app/teacher/reports/new/page.tsx`: 4-step 폼 (카테고리 → 상세 → 증빙 → 검토), 임시 저장, 모바일 full-screen step
4. Exit criteria: 신고 제출 엔드-투-엔드 기존 기능 회귀 없음, 필터 동작 확인

### M3 — Reports Detail & StatusTimeline (Priority High)

1. 신규 컴포넌트: StatusTimeline (접수→검토→상담→완료 단계 표시)
2. `app/teacher/reports/[id]/page.tsx`: 2-col 레이아웃(좌 상세 / 우 타임라인 + 변호사 답변 스레드)
3. urgent 상태 시각 처리
4. Exit criteria: 기존 상세 페이지 데이터 표시 100% 유지, 모바일에서 stack

### M4 — Community & Resources (Priority Medium)

1. `app/teacher/community/page.tsx`: 카테고리 태그, 카드 그리드, 익명 아바타, 참여 메트릭
2. `app/teacher/community/[id]/page.tsx`: 본문 + 댓글 스레드, 익명 기본 표시
3. `app/teacher/resources/page.tsx`: 카테고리 필터, 자료 카드, 다운로드 CTA
4. `app/teacher/settings/page.tsx` (존재 시): 섹션 카드화
5. Exit criteria: 개인정보 노출 요소 전수 점검, 다크모드 검증

### M5 — Mobile Polish & Regression Pass (Priority Medium)

1. 768px / 1024px / 1440px 뷰포트 전수 점검
2. 다크모드 전수 점검
3. 하드코딩 hex 컬러 grep 검증 (`grep -r "#[0-9a-fA-F]\{6\}" app/teacher components/teacher` → 0건 목표, 예외는 SVG fill 등 문서화)
4. 기존 플로우 수동 회귀 테스트 체크리스트 실행
5. Exit criteria: Success Criteria 전 항목 pass

## 4. Component Reuse Map (SPEC-UI-001 재사용)

| SPEC-UI-002 합성 컴포넌트 | 재사용 base 컴포넌트 (UI-001) |
|---|---|
| StatCard | Card, Typography, Icon |
| ReportCard | Card, Badge, Typography |
| StatusTimeline | Badge (variant), 기본 div + token-based border |
| MultiStepForm | Progress, Button, Separator, Card |
| EmptyState | Card (optional), Button, Icon |
| LoadingSkeleton | Skeleton (shadcn) |

## 5. Risks & Mitigations (리스크 및 대응)

- **R1. 기존 플로우 회귀**: 신고 제출, 상세 조회 등 핵심 플로우가 마크업 변경으로 깨질 가능성
  - 대응: 마일스톤별 exit criteria에 수동 회귀 테스트 포함, 비즈니스 로직/폼 필드 이름/API 호출 절대 변경 금지
- **R2. 모바일 엣지 케이스**: 멀티스텝 폼, 상세 페이지 2-col → 1-col 전환 시 레이아웃 깨짐
  - 대응: M5에 전용 폴리싱 마일스톤 배정, 768/1024 뷰포트 필수 점검
- **R3. 다크모드 대비**: 이미지, 아이콘, 배지 색 조합에서 대비 부족 가능성
  - 대응: UI-001의 dark palette 엄수, 대비 확인 시점을 각 마일스톤 exit에 포함
- **R4. SPEC-UI-001 지연**: 선행 SPEC 미완성 시 본 SPEC 진행 불가
  - 대응: [HARD] UI-001 완료 전 착수 금지, UI-001 공통 컴포넌트 변경 요구사항은 역으로 UI-001에 피드백
- **R5. 하드코딩 잔존**: 페이지/컴포넌트에 기존 hex가 남아있을 위험
  - 대응: M5 grep 검증 단계 필수

## 6. Agent Assignment (에이전트 할당)

- **Primary**: expert-frontend (Next.js/React/Tailwind 구현)
- **Supporting**: designer (M1, M3 시각 검토 및 UX 톤 확인)
- **Quality**: manager-quality (M5 회귀 및 TRUST 5 체크)

## 7. Out of Plan (계획 외)

- API/백엔드 변경 (SPEC-UI-002 범위 밖)
- Lawyer/Admin/Public 도메인 (후속 SPEC)
- 자동화 테스트 (E2E/접근성 감사)
- 신규 의존성 추가 (framer-motion, i18n 라이브러리 등)
