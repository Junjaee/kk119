---
id: SPEC-CLEANUP-001
artifact: plan
version: 0.1.0
created: 2026-04-15
---

# SPEC-CLEANUP-001 구현 계획

## 원칙

1. **회귀 0건**: 모든 단계 후 `teacher-full-thread.spec.ts` E2E가 통과해야 한다
2. **증분 커밋**: 그룹 단위로 커밋해 롤백 단위를 작게 유지한다
3. **파괴 작업 우선 검증**: 삭제 전 호출처 grep으로 반드시 0건 확인한 뒤에만 삭제
4. **Git 추적 보존**: 삭제 파일은 working tree와 git history 모두 합치시킨다(`git rm` 우선, 단순 `rm`은 불가)

## 단계별 실행 순서

`/moai run SPEC-CLEANUP-001` 실행 시 아래 순서대로 진행한다. 각 단계 끝에 E2E 또는 build 검증 게이트를 둔다.

### Phase 1 — 안전 사전 작업

1.1. 현재 브랜치에서 `git status` 스냅샷 저장 (`.moai/specs/SPEC-CLEANUP-001/progress.md`에 기록)
1.2. E2E 베이스라인 1회 실행 (`BASE_URL=http://localhost:4000 playwright test --config=playwright.teacher.config.ts`) → 통과 확인
1.3. `.next/` 캐시 유지(이미 복구 상태). `package.json` 스크립트가 참조하는 `validate-pwa-assets.mjs`, `generate-icons.mjs`, `optimize-icons.mjs`, `generate-og-image.mjs`가 유지 대상임을 확인

### Phase 2 — 그룹 A (무위험 삭제)

2.1. `.taskmaster/` 디렉토리 `git rm -rf .taskmaster`
2.2. `.claude/agents/task-checker.md`, `task-executor.md`, `task-orchestrator.md` `git rm`
2.3. `.claude/commands/tm/` 디렉토리 `git rm -rf`
2.4. `.mcp.json`에서 `task-master-ai` 서버 엔트리를 Edit 도구로 제거 (JSON 구조 보존, 다른 서버 설정 무영향)
2.5. `.moai_/` 디렉토리 `rm -rf .moai_/` (git tracked가 아닌 경우) 또는 `git rm -rf` (tracked인 경우) — git status에서 `??` 여부로 분기
2.6. Root stray 삭제: `rm -f nul "C:devkk119.taskmastertemp_tasks.json" MIGRATION_TASK36_SUMMARY.md`
2.7. 진단 임시 파일 삭제: `rm -f playwright.diag.config.ts tests/e2e/login-diag.spec.ts`

**검증 게이트 2**: `git status`에 의도한 변경만 있는지 육안 확인, `npm run build`로 빌드 통과 확인

### Phase 3 — 그룹 B (Deleted SPEC 확정)

3.1. `git status | grep '^ D' | grep 'SPEC-'` 리스트 확보
3.2. 각 경로에 대해 `git rm -r .moai/specs/SPEC-XXX-YYY/` 실행 (13개)

**검증 게이트 3**: `git status`에서 `D` 플래그 0건 확인

### Phase 4 — 그룹 C (Scripts 정리)

4.1. 삭제 전 `grep -rn "scripts/check-\|scripts/test-\|scripts/fix-\|scripts/seed-\|scripts/create-\|scripts/init-\|scripts/migrate-\|scripts/generate-test" --include=*.json --include=*.md --include=*.ts --include=*.js --include=*.yaml --include=*.yml .` 로 참조 0건 확인
4.2. 참조가 발견되면 해당 스크립트는 제거 목록에서 제외하고 progress.md에 기록
4.3. 남은 목록을 `rm -f`로 일괄 삭제

**검증 게이트 4**: `npm run build` 통과, `npm run lint` 통과 (단순 파일 삭제이므로 통과해야 함)

### Phase 5 — 그룹 D (Dead DB 코드 제거)

5.1. `grep -rn "resources" app/ lib/auth/ components/ --include=*.ts --include=*.tsx`로 resources 호출처 확인. DB 레이어 외부에서 호출처가 0건이어야 함
5.2. 호출처 발견 시 중단하고 해당 호출을 먼저 제거 또는 `@MX:TODO` 태깅 후 SPEC 범위 확장 요청
5.3. 0건 확인 후:
   - `lib/db/supabase-database.ts`의 `resources` 관련 메서드(그리고 그 메서드를 위한 타입 import)만 Edit으로 제거
   - `lib/db/database-sqlite.ts`의 동일 메서드 제거
   - 삭제된 메서드가 인터페이스에 선언되어 있다면 인터페이스에서도 제거
5.4. `npm run build`로 TypeScript 타입 에러 0건 확인

**검증 게이트 5**: `npm run build` 통과, `teacher-full-flow.spec.ts` E2E 통과

### Phase 6 — 그룹 E (gitignore 확장)

6.1. `.gitignore`에 spec.md의 "그룹 E" 섹션 패턴 추가 (Edit 도구로 기존 구조 보존)
6.2. `git rm -r --cached .playwright-mcp tests/reports tests/results-teacher test-results 2>/dev/null || true` — 이미 tracked인 아티팩트를 인덱스에서만 제거 (디스크 보존)
6.3. `git status`로 unstaged 아티팩트가 더 이상 없음을 확인

**검증 게이트 6**: `git status | grep -E "playwright-mcp|tests/reports|test-results"`가 빈 출력

### Phase 7 — 그룹 F (Login 경량 리팩토링)

7.1. `app/login/page.tsx` Read
7.2. 변경 대상 식별:
   - 모든 `console.log`, `console.error` 라인 (22개)
   - 중복 `useEffect`(lines 44-53, 238-244) → 하나만 남김
   - `try { atob(oldToken.split('.')[1]) } catch` 디버그 블록 (lines 108-150 부근)
7.3. Edit 도구로 변경 적용 — 기능 로직(`handleSubmit`의 `fetch`, `storeToken`, `setUser`, `router.replace`, `toast.success/error`)은 보존
7.4. TypeScript 빌드 확인
7.5. E2E 재실행

**검증 게이트 7**: E2E 5 journey 전부 PASS, 4xx/5xx 0건, 라인 수 ≥20% 절감

### Phase 8 — 최종 검증

8.1. 전체 `npm run build` 1회
8.2. 전체 `npm run lint` 1회
8.3. E2E `playwright test --config=playwright.teacher.config.ts` 1회
8.4. `git log --stat`로 커밋 개수와 diff 사이즈 확인
8.5. `du -sh .` 저장소 크기 before/after 비교 기록

## 리스크 및 완화

| 리스크 | 가능성 | 영향 | 완화 |
|--------|-------|------|------|
| 스크립트 중 하나가 package.json에 숨겨진 참조 | 낮음 | 빌드 실패 | Phase 4.1의 grep 확인 필수, 누락 시 progress.md에 기록 |
| DB 레이어 메서드 제거 시 인터페이스 위반 | 중간 | TypeScript 에러 | Phase 5.4 빌드 확인, 인터페이스도 함께 업데이트 |
| `.moai_/`가 git tracked인 경우 `rm -rf`만 하면 git에 stale 엔트리 | 중간 | git 정합성 오류 | Phase 2.5에서 `??` 확인으로 분기 |
| Login 리팩토링 중 이벤트 핸들러 순서 변경으로 race | 낮음 | 로그인 실패 | Phase 7.5 E2E 필수 |
| Task Master 제거 후 `.claude/agents/`나 `.claude/commands/` 참조 남음 | 낮음 | 명령 실행 오류 | Phase 2 후 `grep -rn "task-master\|task-checker\|task-executor\|task-orchestrator"` 확인 |

## 커밋 전략

그룹별로 1커밋 원칙:

1. `chore: remove Task Master tooling and related scripts`
2. `chore: remove .moai_ legacy backup and Windows stray files`
3. `chore: finalize deletion of 13 unused SPEC directories`
4. `chore: remove one-shot maintenance scripts`
5. `refactor(db): remove dead resources queries after SPEC-UI-006`
6. `chore: extend gitignore for playwright and test artifacts`
7. `refactor(login): remove debug logging and consolidate useEffect`

전부 `chore`/`refactor` 타입. 기능 변경 없음.

## 에이전트 위임 전략

| Phase | 권장 에이전트 | 이유 |
|-------|-------------|------|
| 2, 3, 6 | MoAI 직접 실행 | 단순 파일 삭제/Edit |
| 4 | expert-refactoring | 스크립트 참조 탐색 경험 |
| 5 | expert-backend | DB 레이어 타입/인터페이스 정합성 |
| 7 | expert-frontend | React 훅/컴포넌트 안전 수정 |
| 8 | manager-quality | TRUST 5 최종 게이트 |

각 위임은 이 plan.md를 참조해서 실행한다.
