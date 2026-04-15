---
id: SPEC-CLEANUP-001
artifact: acceptance
version: 0.1.0
created: 2026-04-15
---

# SPEC-CLEANUP-001 수용 기준 (EARS)

## UBIQUITOUS (범용 요구사항)

**U1.** 시스템은 이번 SPEC 적용 후에도 `teacher-full-flow.spec.ts` E2E 5 journey를 모두 PASS해야 한다.

**U2.** 시스템은 이번 SPEC 적용 후에도 4xx/5xx 응답이 0건이어야 한다.

**U3.** 시스템은 `npm run build`와 `npm run lint`를 오류 0건으로 통과해야 한다.

**U4.** 모든 커밋 메시지는 `chore:` 또는 `refactor:` 타입이어야 하며, 기능 추가(`feat:`)나 버그 수정(`fix:`)이 포함되어서는 안 된다.

## EVENT-DRIVEN (이벤트 기반 요구사항)

**E1.** `/moai run SPEC-CLEANUP-001`이 시작되면, 시스템은 `teacher-full-flow.spec.ts` 베이스라인 E2E를 먼저 실행해 통과를 확인해야 한다.

**E2.** 그룹 A 삭제(Task Master, `.moai_/`, stray 파일)가 완료되면, 시스템은 `.taskmaster/`, `.moai_/`, `nul`, `"C:devkk119.taskmastertemp_tasks.json"`, `MIGRATION_TASK36_SUMMARY.md`, `.claude/agents/task-*.md`, `.claude/commands/tm/`가 working tree에 존재하지 않아야 한다.

**E3.** `.mcp.json`에서 `task-master-ai` 엔트리가 제거되면, 파일은 여전히 유효한 JSON 구조여야 하고 다른 MCP 서버 설정(있는 경우)은 보존되어야 한다.

**E4.** 그룹 B 확정이 완료되면, `git status` 출력에서 `.moai/specs/` 하위 `D` 플래그 라인이 0건이어야 한다.

**E5.** 그룹 C 스크립트 삭제가 완료되면, `package.json`의 `scripts` 섹션이 참조하는 스크립트 파일은 모두 `scripts/` 하위에 존재해야 한다(`generate-icons.mjs`, `generate-og-image.mjs`, `optimize-icons.mjs`, `validate-pwa-assets.mjs`).

**E6.** 그룹 D DB 코드 제거가 완료되면, `grep -rn "from.*resources\|FROM resources" lib/db/supabase-database.ts lib/db/database-sqlite.ts`의 결과는 0건이어야 한다.

**E7.** 그룹 E gitignore 확장이 완료되면, `git check-ignore .playwright-mcp/test.png tests/reports/test.html test-results/test.json`가 모든 경로에서 정상적으로 ignore된다고 응답해야 한다.

**E8.** 그룹 F Login 리팩토링이 완료되면, `grep -c "console\." app/login/page.tsx`의 결과는 0이어야 한다.

**E9.** 그룹 F Login 리팩토링이 완료되면, `wc -l app/login/page.tsx`의 결과가 변경 전 451행 대비 최소 20% 절감(≤360행)되어야 한다.

## STATE-DRIVEN (상태 기반 요구사항)

**S1.** 모든 그룹 작업이 완료된 상태에서, 저장소 루트 크기(`du -sh . --exclude=node_modules --exclude=.next --exclude=.git`)는 작업 시작 전보다 감소해야 한다.

**S2.** 모든 그룹 작업이 완료된 상태에서, `.gitignore`는 `.playwright-mcp/`, `tests/reports/`, `tests/results-teacher/`, `test-results/` 패턴을 포함해야 한다.

**S3.** Login 리팩토링이 완료된 상태에서, `app/login/page.tsx`는 여전히 다음 모든 기능을 보유해야 한다:
- email/password form with `onSubmit` handler
- remember me checkbox with localStorage persistence
- show/hide password toggle
- loading spinner during submit
- error alert on failure
- toast on success
- 역할별 redirect (admin → `/admin`, lawyer → `/lawyer`, teacher → `/teacher`)
- test accounts 안내 카드
- signup, forgot-password, privacy, terms 링크

## OPTIONAL (선택 요구사항)

**O1.** 시스템은 작업 완료 후 `.moai/specs/SPEC-CLEANUP-001/progress.md`에 before/after 메트릭(파일 수, 저장소 크기, login 라인 수)을 기록할 수 있다.

**O2.** 시스템은 Phase 7 전후 E2E 실행 결과 차이를 progress.md에 기록할 수 있다.

## UNWANTED BEHAVIOR (금지 동작)

**N1.** 시스템은 DB 스키마 정의 파일(migration, schema.sql)에서 `resources` 테이블 정의를 제거해서는 안 된다 (SPEC-UI-006 결정: 롤백 여지 보존).

**N2.** 시스템은 `package.json`의 `scripts` 섹션에서 참조되는 스크립트(`validate-pwa-assets.mjs` 등)를 삭제해서는 안 된다.

**N3.** 시스템은 `/api/auth/login` 엔드포인트 계약(요청/응답 스키마)을 변경해서는 안 된다.

**N4.** 시스템은 `lib/auth/auth-sync.ts`, `lib/auth/storage.ts`, `lib/auth/storage-keys.ts`의 내부 구조를 이번 SPEC에서 변경해서는 안 된다.

**N5.** 시스템은 `.claude/rules/`, `.claude/skills/`, `.claude/agents/`(task-* 제외), `.claude/commands/`(tm/ 제외) 하위의 MoAI-ADK 자체 파일을 삭제해서는 안 된다.

**N6.** 시스템은 `.moai/specs/SPEC-AUTH-005`, `SPEC-UI-001` ~ `SPEC-UI-006` 등 **현재 유지 중인 SPEC**을 삭제해서는 안 된다.

**N7.** 시스템은 로그인 UI의 시각적 모양, 색상 토큰, 레이아웃을 변경해서는 안 된다 (기존 CSS 클래스 및 JSX 구조 유지).

## 검증 스크립트 (참고)

SPEC 완료 시 다음 쉘 스크립트가 전부 exit 0이어야 한다:

```bash
# E1 check
test -d .taskmaster || exit 0  # should fail — directory must be gone
[ ! -d .taskmaster ] && [ ! -d .moai_ ] && [ ! -f nul ]

# E6 check
! grep -qE "from\('resources'\)|FROM resources" lib/db/supabase-database.ts lib/db/database-sqlite.ts

# E8 check
[ "$(grep -c 'console\.' app/login/page.tsx)" = "0" ]

# E9 check
[ "$(wc -l < app/login/page.tsx)" -le 360 ]

# U1, U2 check
BASE_URL=http://localhost:4000 node_modules/.bin/playwright test --config=playwright.teacher.config.ts
```
