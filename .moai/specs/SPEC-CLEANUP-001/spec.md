---
id: SPEC-CLEANUP-001
version: 0.1.0
status: draft
created: 2026-04-15
updated: 2026-04-15
author: Shin
priority: medium
issue_number: 0
---

# SPEC-CLEANUP-001: 코드베이스 전면 정리 및 Login 경량 리팩토링

## HISTORY

### v0.1.0 (2026-04-15)
- 최초 작성: `/moai plan` 요청에 따른 코드 리뷰/리팩토링/불필요 파일 삭제 범위 확정
- 사용자 승인(2026-04-15): Task Master 삭제 포함 / `.moai_/` 삭제 / Deleted SPEC 확정 / Login 경량 리팩토링
- 연관: SPEC-UI-006(자료실 제거) 이후 잔존 기술부채 정리

## 개요 (Overview)

이번 SPEC은 교권119 저장소에서 **실행 코드와 무관한 잔존 아티팩트**와 **이미 삭제된 기능의 dead 코드**를 체계적으로 제거하고, 인증 흐름에서 가장 비대해진 `app/login/page.tsx`를 **기능 동작 불변** 조건 하에 가볍게 정리한다. 기능 추가나 API 변경은 포함하지 않는다.

본질은 "저장소 위생(repo hygiene)"이며, 검증은 기존 `teacher-full-flow.spec.ts` E2E가 회귀 없이 통과하는 것으로 충분히 커버된다.

## 배경 (Background)

### 정리 트리거

- **Task Master 도구 체계(`.taskmaster/` 637K, `.claude/agents/task-*.md`, `.claude/commands/tm/`, `.mcp.json`의 task-master-ai)**: 현재 MoAI-ADK 기반 워크플로우로 전환하여 더 이상 사용하지 않음
- **`.moai_/` 디렉토리(716K)**: 언더스코어 접미는 백업 관례이며 `.moai/`가 정식 경로로 운영 중
- **Resources 기능 잔재**: SPEC-UI-006으로 `/teacher/resources` UI와 `/api/resources` 라우트는 삭제했으나 `lib/db/supabase-database.ts`, `lib/db/database-sqlite.ts`에 호출처가 없는 쿼리 메서드가 존재
- **Windows stray 파일**: `nul`(45 bytes), `"C:devkk119.taskmastertemp_tasks.json"`(224K) — 잘못된 셸 리다이렉션 산물
- **Test 아티팩트 git tracking**: `.playwright-mcp/` 20M + `tests/reports/` 6.4M + `tests/results-teacher/`, `test-results/`가 `.gitignore` 미등록
- **일회성 스크립트**: `scripts/` 하위 30개 중 다수가 패스워드 재설정, 테스트 계정 생성 등 일회성 운영 스크립트
- **Deleted SPEC**: `git status`에 13개 SPEC 디렉토리(`SPEC-API-001` ~ `SPEC-STATS-001`)가 D로 표시되어 working tree와 불일치
- **Login 디버그 로깅**: `app/login/page.tsx`에 `console.log` 22회, `useEffect` 중복 2회(이메일 기억 로드가 line 44-53과 238-244에 두 번 작성됨)

### 이전 상태와의 차이

SPEC-UI-005, SPEC-UI-006이 UI/API 레이어는 정리했으나, (1) DB 레이어 dead 코드, (2) 저장소 외부 도구 체계, (3) 개발 편의를 위해 과도하게 방치된 console.log/중복 훅, (4) gitignore 누락으로 인한 저장소 비대화는 남아있다. 이번 SPEC은 이 4축을 한 번의 SPEC으로 정리한다.

## 목표 (Goals)

1. **저장소 위생**: Task Master 잔재, `.moai_/`, Windows stray, 일회성 스크립트를 제거해 기여자 혼동을 없앤다
2. **Dead 코드 제거**: `/teacher/resources` 기능 삭제의 완전성을 확보해 DB 레이어에 호출처 없는 메서드가 남지 않게 한다
3. **gitignore 위생**: 런타임 생성 아티팩트(test reports, playwright screenshots)가 git에 추적되지 않게 한다
4. **Login 경량화**: 디버그 로그 전량 제거 + 중복 `useEffect` 통합으로 `app/login/page.tsx` 라인 수를 ≥20% 절감하되 기능 동작은 E2E로 불변 증명한다
5. **git tree 정합성**: `git status`의 `D` 표시 13개 SPEC 파일을 확정 삭제해 실제 working tree와 일치시킨다

## 비목표 (Non-Goals)

- DB `resources` 테이블/스키마 변경 (SPEC-UI-006 결정 유지 — 롤백 여지 보존)
- Login API 계약 변경 (`/api/auth/login` 엔드포인트 불변)
- `auth-sync.ts` 내부 구조 재설계 (다음 SPEC으로 분리)
- Radix UI Checkbox 하이드레이션 경고 수정 (업스트림 의존, 별도 SPEC 필요)
- 기능 추가, 성능 최적화, 디자인 변경

## 범위 (Scope)

### IN SCOPE

#### 그룹 A — 파일/디렉토리 전량 삭제 (무위험)
- `.taskmaster/` 디렉토리 전체
- `.claude/agents/task-checker.md`, `task-executor.md`, `task-orchestrator.md`
- `.claude/commands/tm/` 디렉토리 전체
- `.mcp.json`에서 `task-master-ai` 서버 엔트리 제거
- `.moai_/` 디렉토리 전체
- `nul` 파일 (root)
- `C:devkk119.taskmastertemp_tasks.json` (root, 잘못된 리다이렉션 산물)
- `MIGRATION_TASK36_SUMMARY.md` (일회성 마이그레이션 요약)
- `playwright.diag.config.ts`, `tests/e2e/login-diag.spec.ts` (진단용 임시 파일)

#### 그룹 B — Deleted SPEC 확정 (git 정합성)
- `git rm`으로 `.moai/specs/SPEC-API-001`, `SPEC-AUTH-001` ~ `SPEC-AUTH-004`, `SPEC-BUILD-001`, `SPEC-CONSULT-001`, `SPEC-FILE-001`, `SPEC-NOTIFY-001`, `SPEC-REPORT-001`, `SPEC-SESSION-001`, `SPEC-STATS-001` 확정
- 총 13개 디렉토리

#### 그룹 C — Scripts 정리 (일회성 운영 스크립트)
다음 패턴의 파일을 제거한다:
- `scripts/fix-*-password.{js,sql}` (3개)
- `scripts/generate-test-passwords.js`
- `scripts/check-*.js` (check-and-fix-admin-role, check-db-schema, check-db, check-lawyer-user, check-supabase-users)
- `scripts/test-*.{js,mjs}` (test-conditional-db, test-lawyer-password, test-pwa-icons, test-supabase-connection, test-supabase-quick)
- `scripts/create-association-tables.js`, `create-audit-tables.js`, `create-tables-only.js`, `create-test-accounts.js`
- `scripts/seed-mock-consults.js`, `seed-test-accounts.js`
- `scripts/init-consult-db.js`, `migrate-users-schema.js`, `replace-super-admin.js`, `add-claimed-at-column.js`, `insert-sample-association-data.js`, `fix-test-password.js`
- **보존**: `generate-icons.mjs`, `generate-og-image.mjs`, `optimize-icons.mjs`, `validate-pwa-assets.mjs` (package.json `scripts` 섹션에서 참조됨)

#### 그룹 D — Dead 코드 제거 (호출처 검증 후)
- `lib/db/supabase-database.ts`의 `resources` 관련 메서드 전체: lines 459–653 부근의 `.from('resources')` 사용 쿼리 및 이들을 감싸는 public 메서드
- `lib/db/database-sqlite.ts`의 `resources` 관련 메서드 전체: lines 493–557 부근의 `FROM resources` 쿼리 및 public 메서드
- **호출처 검증**: `grep -r "resources" app/ lib/ components/ --include=*.ts --include=*.tsx`로 UI/API 호출이 없음을 확인한 후에만 진행. SQL 주석이나 DB migration 파일의 `resources` 테이블 정의는 건드리지 않음

#### 그룹 E — gitignore 확장
`.gitignore`에 다음 패턴 추가:
```
# Playwright artifacts
.playwright-mcp/
playwright-report/
test-results/
tests/reports/
tests/results-teacher/
tests/results/

# Editor / OS
nul
```
추가 후 `git rm -r --cached`로 기존 추적 파일을 인덱스에서 제거 (디스크 보존).

#### 그룹 F — Login 경량 리팩토링 (`app/login/page.tsx`)
- 전체 22개 `console.log` / `console.error` 제거 (디버그 전용, 프로덕션 노이즈)
- 중복 `useEffect`(이메일 기억 로드, lines 44-53과 238-244) 통합 → 1회만 실행
- `if (oldToken) try { JSON.parse(atob(...)) } catch ...` 디버그 블록 제거 (토큰 페이로드 콘솔 로깅은 보안상 위험)
- `console.log('🔍 Login Success - User Data:', data.user)` 등 사용자 데이터 로깅 제거 (GDPR 관점)
- 기능 동작 불변: form submit, 역할별 redirect, remember me, toast, error alert 모두 보존
- 코드 스타일: 포매팅은 ESLint/Prettier 기본 규칙을 따름

### OUT OF SCOPE

- Login form 전체 구조 재작성, custom hook(`useLoginFlow`) 추출 (중량 리팩토링)
- `lib/auth/auth-sync.ts` 내부 재설계
- API 응답 형식 변경
- 디자인 시스템 토큰 변경
- Radix UI 버전 업그레이드
- 새로운 기능 추가

## 승인된 사용자 결정 (2026-04-15)

| 질의 | 선택 |
|------|------|
| Task Master 포함 여부 | 삭제 포함 |
| `.moai_/` 처리 | 삭제 |
| Deleted SPEC 처리 | 삭제 확정 |
| Login 리팩토링 강도 | 경량 |

## 참고 파일

- 현재 E2E 진단: `.playwright-mcp/teacher-e2e-20260415-154529/summary.json`
- 관련 최근 커밋: `bc67a3b chore(supabase): 구버전 마이그레이션 및 RLS 파일 정리`, `e6d4978 feat(ui): SPEC-UI-001`
