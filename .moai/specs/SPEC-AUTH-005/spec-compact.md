---
spec_id: SPEC-AUTH-005
version: 1.0.0
status: draft
created: 2026-04-15
updated: 2026-04-15
---

# SPEC-AUTH-005 (Compact) — super_admin → admin 통합

## 목표
`super_admin` 역할을 `admin`으로 완전 병합. 코드/DB/스토리지/라우팅 전 영역에서 `super_admin` 식별자 0건 달성.

## 상태
- `UserRole` 타입은 이미 `'admin' | 'lawyer' | 'teacher'` (완료)
- 잔여: 27개 파일, 47개 문자열 참조

## 핵심 작업 (우선순위 순)

### P1 — DB & Types
1. `supabase/migrations/{ts}_consolidate_super_admin_to_admin.sql` 신규
   - `UPDATE users SET role='admin' WHERE role='super_admin'`
   - `users_role_check` CHECK 제약을 `('admin','lawyer','teacher')`로 갱신
   - 트랜잭션 래핑 + 감사 카운트 로그
2. `lib/types/statistics.ts`: `super_admin: number` 필드 **제거**
3. `lib/types/user.ts` `ROLE_PERMISSIONS.admin` 권한 점검 (super_admin 전용 권한 흡수 확인)

### P2 — Library Layer (8 files)
- `lib/auth/auth-state-manager.ts`: super_admin 권한 리스트 분기 **삭제**
- `lib/auth/storage-keys.ts`:
  - `token_super_admin`, `storage_super_admin` 정의 **삭제**
  - 1회성 legacy 이관 유틸 **추가** (bootstrap 시 admin 키로 값 이관 후 legacy 삭제)
- `lib/constants/consult-constants.ts`: super_admin 키/레이블 제거
- `lib/middleware/path-classification-service.ts`: super_admin 분류 제거
- `lib/middleware/redirect-service.ts`: super_admin→/admin 분기 제거
- `lib/services/file-service.ts`: `admin` 단독 체크로 단순화
- `lib/services/statistics-service.ts`: super_admin 카운트를 admin에 합산

### P3 — Pages & Components (19 files)
- **삭제**: `app/super-admin/page.tsx`, `app/super-admin/users/page.tsx`, 디렉토리 전체
- **수정**: 9개 `app/admin/**/page.tsx` + `app/login/page.tsx` + `app/page.tsx` + `app/lawyer/page.tsx` + `app/teacher/page.tsx`
- **수정**: `components/layout/header.tsx`, `components/auth/permission-guard.tsx`, `components/admin/association-manager.tsx`, `components/lawyer-consultation/ConsultationTimeline.tsx`

### P4 — Routing Compatibility (Optional)
- `next.config.js` `redirects()`에 `/super-admin/:path*` → `/admin/:path*` (308) 추가

### P5 — Guard
- `package.json`: `"lint:no-super-admin": "! grep -rE 'super_admin' --include='*.{ts,tsx,sql}' --exclude-dir=node_modules --exclude-dir=.next ."`
- CI에 통합

## 리팩토링 패턴 치트시트
| Before | After |
|--------|-------|
| `role === 'super_admin'` | 삭제 (dead branch) |
| `role === 'admin' \|\| role === 'super_admin'` | `role === 'admin'` |
| `role !== 'admin' && role !== 'super_admin'` | `role !== 'admin'` |
| `case 'super_admin':` | `case 'admin':`에 병합 또는 삭제 |
| `{ admin: x, super_admin: y }` (stats) | `{ admin: x + y }` |
| `token_super_admin` | `token_admin` + legacy 마이그레이션 |

## 완료 기준
- `grep -rE "super_admin" --exclude-dir=node_modules --exclude-dir=.next` → 0건
- `tsc --noEmit` → 0 오류
- DB `SELECT COUNT(*) FROM users WHERE role='super_admin'` → 0
- 수동 QA: admin/lawyer/teacher 3역할 전 페이지 회귀 테스트 PASS

## 제외
- 신규 역할 추가 금지
- admin 권한 축소 금지
- RBAC 재설계 금지
- lawyer/teacher 변경 금지

## 배포 순서
1. DB 마이그레이션 (트랜잭션, 백업 후)
2. 백엔드 배포 (API가 admin으로 정규화 응답)
3. 프론트엔드 배포 (UI 분기 제거)
4. (선택) `/super-admin` 리다이렉트 설정 배포

## 위험 & 완화
- DB 롤백 필요 시: 사전 `pg_dump users` → role 컬럼 복원 스크립트
- 세션 혼선: 서버 role 재검증 (JWT만 의존 금지)
- 누락 참조: `lint:no-super-admin` CI 가드로 회귀 차단
