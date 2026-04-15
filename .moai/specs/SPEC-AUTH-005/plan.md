---
spec_id: SPEC-AUTH-005
version: 1.0.0
status: draft
created: 2026-04-15
updated: 2026-04-15
---

# SPEC-AUTH-005 구현 계획 (Plan)

## 1. 구현 전략 (Approach)

단계적 레이어별 정리 방식을 채택한다. DB → 서버 로직 → 공유 라이브러리 → 컴포넌트/페이지 → 라우팅 순으로 하향식(top-down)으로 정리하여, 각 단계의 검증이 완료된 후 다음 단계로 진행한다. 각 단계는 독립적으로 빌드/테스트가 가능하도록 커밋을 분리한다.

**핵심 원칙**:
- 타입 레이어를 먼저 강화(이미 `UserRole` narrowing 완료)하여 TypeScript 컴파일러가 나머지 참조를 오류로 보고하도록 유도.
- `super_admin` 문자열 리터럴을 컴파일 타임에 잡을 수 있도록 `strict` 모드 유지.
- 각 파일 수정 후 `tsc --noEmit`과 `grep -r "super_admin"` 두 가지 기준으로 진행률 확인.

## 2. 마일스톤 (Priority-based)

### M1 (Priority: High) — DB 및 타입 기반 마이그레이션

**목표**: 데이터 불변성 확보 및 타입 시스템을 통한 남은 참조 식별.

- Task M1.1: Supabase 마이그레이션 SQL 작성 (`supabase/migrations/{ts}_consolidate_super_admin_to_admin.sql`)
- Task M1.2: `lib/types/statistics.ts`에서 `super_admin: number` 필드 제거
- Task M1.3: `lib/types/user.ts`의 `ROLE_PERMISSIONS`에 `admin`이 기존 super_admin 권한 전체를 포함하는지 확인 및 보강
- Task M1.4: 스테이징 DB에서 마이그레이션 드라이런 수행, 레코드 수 감사 로그 확인

### M2 (Priority: High) — 라이브러리 레이어 정리

**목표**: 공유 로직에서 `super_admin` 분기 제거.

- Task M2.1: `lib/auth/auth-state-manager.ts` — super_admin 권한 리스트 분기 삭제
- Task M2.2: `lib/auth/storage-keys.ts` — legacy 키 정의 제거 + 1회성 이관 유틸 추가
- Task M2.3: `lib/constants/consult-constants.ts` — super_admin 레이블/키 제거
- Task M2.4: `lib/middleware/path-classification-service.ts` — super_admin 경로 분류 제거
- Task M2.5: `lib/middleware/redirect-service.ts` — super_admin → /admin 리다이렉트 분기 삭제
- Task M2.6: `lib/services/file-service.ts` — `admin` 단독 권한 검사로 단순화
- Task M2.7: `lib/services/statistics-service.ts` — super_admin 카운트를 admin에 합산

### M3 (Priority: High) — 페이지 및 컴포넌트 정리

**목표**: UI 레이어에서 `super_admin` 참조 제거.

- Task M3.1: `app/super-admin/` 디렉토리 전체 삭제 (`page.tsx`, `users/page.tsx`)
- Task M3.2: `app/login/page.tsx`, `app/page.tsx` — 로그인 후 리다이렉트 분기 정리
- Task M3.3: `app/admin/**/page.tsx` (9개 파일) — role 비교문 및 레이블 정리
- Task M3.4: `app/lawyer/page.tsx`, `app/teacher/page.tsx` — guard 조건 정리
- Task M3.5: `components/layout/header.tsx` — 네비게이션 분기 정리
- Task M3.6: `components/auth/permission-guard.tsx` — 권한 체크 통합
- Task M3.7: `components/admin/association-manager.tsx` — 관리자 판별 로직 정리
- Task M3.8: `components/lawyer-consultation/ConsultationTimeline.tsx` — 표시 분기 정리

### M4 (Priority: Medium) — 라우팅 및 호환성

**목표**: 외부 레거시 접근에 대한 처리 및 검증.

- Task M4.1: (선택) `next.config.js`에 `/super-admin/:path*` → `/admin/:path*` 308 리다이렉트 추가
- Task M4.2: 전역 `grep -r "super_admin"` 결과가 0건임을 CI에서 강제하는 린트 규칙 또는 스크립트 추가

### M5 (Priority: High) — 검증 및 배포

**목표**: 회귀 방지 및 배포 안정성.

- Task M5.1: 타입체크 (`pnpm tsc --noEmit`) 통과
- Task M5.2: 단위/통합 테스트 실행, 인증 관련 회귀 테스트 추가
- Task M5.3: 수동 QA: admin/lawyer/teacher 3개 역할 로그인 플로우 검증
- Task M5.4: 스테이징 배포 → 운영 배포 (DB 마이그레이션 선행)

## 3. 기술 접근 (Technical Approach)

### 3.1 역할 비교 리팩토링 패턴

- `role === 'super_admin'` → 삭제 (절대 true가 될 수 없음)
- `role === 'admin' || role === 'super_admin'` → `role === 'admin'`
- `role !== 'admin' && role !== 'super_admin'` → `role !== 'admin'`
- `case 'super_admin':` → 인접 `case 'admin':`에 병합 또는 삭제

### 3.2 스토리지 키 마이그레이션

`lib/auth/storage-keys.ts`의 초기화 시점에 다음 로직을 한 번 실행:

```typescript
const LEGACY_KEYS = ['token_super_admin', 'storage_super_admin'] as const;
function migrateLegacyStorage() {
  for (const legacy of LEGACY_KEYS) {
    const value = localStorage.getItem(legacy);
    if (value) {
      const adminKey = legacy.replace('super_admin', 'admin');
      if (!localStorage.getItem(adminKey)) {
        localStorage.setItem(adminKey, value);
      }
      localStorage.removeItem(legacy);
    }
  }
}
```

### 3.3 CI Guard

`package.json`에 스크립트 추가:

```json
"lint:no-super-admin": "! grep -rE \"super_admin\" --include=\"*.{ts,tsx,js,jsx,sql}\" --exclude-dir=node_modules --exclude-dir=.next ."
```

## 4. 위험 요소 (Risks)

| 위험 | 영향 | 완화 방안 |
|------|------|-----------|
| DB 마이그레이션 중 실패 | 운영 다운타임 | 트랜잭션 래핑, 사전 `pg_dump` 백업 |
| 클라이언트 캐시된 세션이 super_admin 포함 | 일부 사용자 권한 혼선 | 로그인 시 서버에서 role 재검증, 필요 시 세션 무효화 |
| 누락된 참조로 런타임 오류 | 관리자 페이지 일부 기능 장애 | TypeScript strict + grep 기반 이중 검증 |
| 외부 북마크 `/super-admin` 접근 | 404 경험 | M4.1의 308 리다이렉트로 완화 |
| 권한 누락 (admin에 super_admin 권한 미흡) | 관리자 기능 접근 불가 | M1.3에서 권한 매트릭스 선행 점검 |
| 스토리지 키 이관 실패 | 로그아웃 유발 | 실패 시 조용히 로그인 페이지로 폴백, UX 영향 최소 |

## 5. 의존성 (Dependencies)

- Supabase 마이그레이션 실행 권한
- `lib/types/user.ts`의 `UserRole` 타입 narrowing (이미 완료)
- 선행 PR: `2635d77 refactor: Remove associadmin and super_admin references from middleware constants`

## 6. 완료 기준 (Exit Criteria)

- `grep -rE "super_admin" --exclude-dir=node_modules --exclude-dir=.next` 결과 0건
- `pnpm tsc --noEmit` 오류 0건
- DB에서 `SELECT COUNT(*) FROM users WHERE role = 'super_admin'` 결과 0
- admin 역할 사용자가 기존 모든 관리자 페이지에 접근 가능
- `/super-admin/*` 접근 시 404 또는 `/admin/*`로 308 리다이렉트
