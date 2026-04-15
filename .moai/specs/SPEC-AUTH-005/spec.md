---
id: SPEC-AUTH-005
version: 1.0.0
status: draft
created: 2026-04-15
updated: 2026-04-15
author: Shin
priority: High
issue_number: 0
---

# SPEC-AUTH-005: super_admin → admin 역할 통합 마이그레이션

## HISTORY

### v1.0.0 (2026-04-15)
- 최초 작성
- `UserRole` 타입에서 `super_admin`이 이미 제거된 상태(부분 완료)에서 나머지 27개 파일 47개 참조 정리
- DB 마이그레이션, 라우팅, 권한, 통계, 스토리지 키 등 전 영역 범위 정의

---

## 1. 개요 (Overview)

### 1.1 배경 (Context)

교권119 플랫폼은 초기 설계에서 `super_admin`, `admin`, `associadmin` 등 다수의 관리자 역할을 두었으나, 운영 단순화와 권한 모델 정합성 확보를 위해 단일 `admin` 역할로 통합하는 리팩토링이 진행 중이다. `lib/types/user.ts`의 `UserRole` 타입은 이미 `'admin' | 'lawyer' | 'teacher'`로 좁혀졌지만, 코드베이스 전반에는 여전히 `super_admin` 문자열이 47곳, 27개 파일에 남아 있어 TypeScript 런타임 불일치와 죽은 코드 경로를 야기한다.

### 1.2 목표 (Goal)

- 코드, DB, 라우팅, 스토리지, 통계의 모든 계층에서 `super_admin` 식별자를 제거한다.
- 기존 `super_admin` 사용자와 데이터는 데이터 손실 없이 `admin`으로 병합된다.
- 단일 `admin` 역할이 기존 `super_admin`이 가지던 전체 권한을 상속한다.

### 1.3 범위 (Scope)

- IN: 27개 영향 파일의 식별자 정리, Supabase users 테이블 role 마이그레이션, `app/super-admin/` 경로 처리, 스토리지 키 통합, 통계 필드 제거
- OUT: 새로운 역할 도입, `admin` 권한 축소, RBAC 전면 재설계

---

## 2. 요구사항 (EARS Requirements)

### 2.1 Ubiquitous (시스템 불변 요구사항)

- **REQ-U-001**: 시스템은 사용자 역할로 오직 `'admin' | 'lawyer' | 'teacher'` 세 가지만 허용한다.
- **REQ-U-002**: 시스템은 기존 `super_admin`이 보유하던 모든 기능적 권한을 `admin` 역할에 병합하여 제공한다.
- **REQ-U-003**: 시스템의 어떤 소스코드, 설정, DB 레코드에도 `super_admin` 리터럴이 남아 있지 않아야 한다.

### 2.2 Event-driven (이벤트 기반 요구사항)

- **REQ-E-001**: 마이그레이션 스크립트가 실행될 때, 시스템은 users 테이블의 `role = 'super_admin'` 행을 `role = 'admin'`으로 업데이트한다.
- **REQ-E-002**: 사용자가 `/super-admin` 또는 `/super-admin/*` 경로로 접근할 때, 시스템은 해당 요청을 `/admin`의 동일 기능 경로로 영구 리다이렉트(308)하거나 404를 반환한다. (결정 사항 §3.1 참조)
- **REQ-E-003**: 이전 세션에서 `token_super_admin` 또는 `storage_super_admin` 키로 저장된 데이터가 감지되면, 시스템은 해당 데이터를 `admin` 키로 1회 이관한 뒤 원본 키를 삭제한다.
- **REQ-E-004**: 로그인 성공 시, 시스템은 DB의 role 값을 기준으로 `admin/lawyer/teacher` 경로로 라우팅하며, `super_admin` 분기는 존재하지 않는다.

### 2.3 State-driven (상태 기반 요구사항)

- **REQ-S-001**: 사용자의 role이 `admin`인 동안, 시스템은 과거 `super_admin`에게만 허용되던 모든 페이지(협회 관리, 권한 관리, 시스템 설정 등)에 대한 접근을 허용한다.
- **REQ-S-002**: 통계 응답 객체가 반환되는 동안, `super_admin` 카운트 필드는 존재하지 않고 `admin` 카운트에 통합된 값만 노출된다.

### 2.4 Optional (선택 요구사항)

- **REQ-O-001**: `app/super-admin/` 디렉토리는 삭제한다. (기본 결정) 하위 호환이 필요한 경우에 한해 Next.js `redirects()` 설정으로 `/admin` 경로 매핑을 제공한다.
- **REQ-O-002**: 마이그레이션 전 `users` 테이블의 `role = 'super_admin'` 행 수를 로그로 남겨 감사 증적을 확보한다.

### 2.5 Unwanted (금지 요구사항)

- **REQ-UN-001**: 시스템은 `super_admin` 문자열을 비교, 할당, 렌더링, 로깅하는 어떠한 코드 경로도 포함해서는 안 된다.
- **REQ-UN-002**: 시스템은 `super_admin` role을 가진 DB row를 마이그레이션 이후 유지해서는 안 된다.
- **REQ-UN-003**: 시스템은 마이그레이션 과정에서 기존 `admin` 사용자의 권한, 세션, 데이터를 변경해서는 안 된다.

---

## 3. 핵심 설계 결정 (Key Decisions)

### 3.1 `app/super-admin/` 디렉토리 처리

**결정**: 디렉토리 삭제 (REMOVE). 페이지 내용은 이미 `app/admin/` 하위에 기능이 존재하므로 중복 제거.

**근거**:
- `app/super-admin/page.tsx`와 `app/super-admin/users/page.tsx`는 `app/admin/dashboard/page.tsx`, `app/admin/user-management/page.tsx`와 기능이 중복된다.
- `app/admin/` 계층은 이미 현역이며 테스트 커버리지가 존재.
- 외부 링크 호환이 필요한 경우에 한해 `next.config.js`의 `redirects()`로 308 리다이렉트 추가 (REQ-O-001).

### 3.2 DB 마이그레이션 전략

**결정**: Supabase SQL 마이그레이션 파일 1개 추가.

```sql
-- supabase/migrations/{timestamp}_consolidate_super_admin_to_admin.sql
BEGIN;

-- 감사 로그용 선 집계
DO $$
DECLARE cnt INTEGER;
BEGIN
  SELECT COUNT(*) INTO cnt FROM users WHERE role = 'super_admin';
  RAISE NOTICE 'Migrating % super_admin rows to admin', cnt;
END $$;

-- 실제 마이그레이션
UPDATE users SET role = 'admin', updated_at = NOW()
WHERE role = 'super_admin';

-- CHECK 제약 갱신 (존재 시)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('admin', 'lawyer', 'teacher'));

COMMIT;
```

**롤백 전략**: 운영 전에 `pg_dump`로 users 테이블 백업. 문제 발생 시 백업에서 role 필드만 복원.

### 3.3 스토리지 키 처리

**결정**: 런타임 1회 마이그레이션 + 키 정의 삭제.

- `lib/auth/storage-keys.ts`의 `token_super_admin`, `storage_super_admin` 정의 제거.
- 앱 부팅 시점(클라이언트 초기화 Hook)에서 legacy 키 감지 → admin 키로 값 이관 → legacy 키 삭제 (REQ-E-003).
- 2개 릴리스 이후 이관 코드 자체도 제거 (본 SPEC 범위 외, 후속 티켓).

### 3.4 통계 필드 제거

**결정**: `lib/types/statistics.ts`에서 `super_admin: number` 필드를 제거하고, 서버의 `statistics-service.ts`가 `super_admin` 카운트를 `admin` 카운트에 합산하도록 수정.

- API 응답 스키마 변경이므로 프론트엔드 소비자(관리자 통계 페이지)도 동시에 업데이트.
- 기존 `admin` 카운트와 동일 의미이므로 UI 레이블 변경은 최소.

### 3.5 권한 매트릭스 확인

**결정**: `lib/types/user.ts`의 `ROLE_PERMISSIONS` 테이블이 `admin`에 과거 `super_admin` 권한(협회 관리, 권한 관리, 시스템 설정 등)을 포함하는지 명시적으로 검증.

- 누락된 권한이 있으면 `admin` 엔트리에 추가.
- `components/auth/permission-guard.tsx`의 분기 제거 후 권한 검사가 동일 결과를 내는지 단위 테스트.

---

## 4. Delta Markers (Brownfield Change Map)

- **[REMOVE]** `app/super-admin/page.tsx`, `app/super-admin/users/page.tsx`, `app/super-admin/` 디렉토리
- **[REMOVE]** `lib/auth/storage-keys.ts` 내 `token_super_admin`, `storage_super_admin` 키 정의
- **[REMOVE]** `lib/types/statistics.ts` 내 `super_admin: number` 필드
- **[REMOVE]** `lib/auth/auth-state-manager.ts` 내 `super_admin` 권한 리스트 분기
- **[MODIFY]** 27개 파일의 47개 `super_admin` 문자열 참조 (페이지 15, 라이브러리 8, 컴포넌트 4)
  - 역할 비교문: `=== 'super_admin'` 및 `!== 'super_admin'` 제거 또는 `=== 'admin'`에 흡수
  - switch/case 분기의 `case 'super_admin':` 제거 또는 `case 'admin':`과 병합
  - 레이블 및 라우팅 맵의 `super_admin` 키 제거
- **[MODIFY]** `lib/middleware/redirect-service.ts`: `super_admin → /admin` 매핑 삭제 (더 이상 도달 불가)
- **[MODIFY]** `lib/services/statistics-service.ts`: 카운트 집계 로직에서 `super_admin` 제거, `admin`에 합산
- **[NEW]** `supabase/migrations/{timestamp}_consolidate_super_admin_to_admin.sql`
- **[NEW]** 클라이언트 부팅 1회성 스토리지 키 마이그레이션 로직 (storage-keys 모듈 내부)
- **[NEW]** (선택) `next.config.js`의 `redirects()` 엔트리 — `/super-admin/:path*` → `/admin/:path*`
- **[EXISTING]** `lib/types/user.ts`의 `UserRole` 타입 (`'admin' | 'lawyer' | 'teacher'`) — 변경 없음
- **[EXISTING]** `admin` 역할의 라우팅 경로(`app/admin/*`) 구조 — 변경 없음

---

## 5. 제약 사항 (Constraints)

- **기술 스택**: Next.js 14 App Router, TypeScript strict, Supabase Postgres, Next.js middleware
- **보안**: 세션 토큰은 서버 검증을 유지, 클라이언트 스토리지 마이그레이션은 토큰을 평문 로깅하지 않음
- **하위 호환**: 기존 admin 사용자의 JWT/세션은 그대로 유효
- **배포**: DB 마이그레이션 → 백엔드 배포 → 프론트 배포 순으로 무중단 롤아웃

---

## 6. Exclusions (What NOT to Build)

- 새로운 관리자 서브롤(예: `billing_admin`, `content_admin`) 도입 금지
- `admin`의 기존 권한 축소 또는 세분화 금지
- RBAC 엔진 전면 재설계, ABAC 도입 금지
- `lawyer`, `teacher` 역할에 대한 변경 금지
- 회원가입/로그인 플로우 UI 전면 개편 금지
- `associadmin`, `super_admin` 외 다른 legacy 역할 정리(이미 별도 티켓에서 완료)

---

## 7. 참조 (References)

- `lib/types/user.ts`: 현재 `UserRole` 정의
- `CLAUDE.md` 최근 커밋(`2635d77 refactor: Remove associadmin and super_admin references from middleware constants`): 동일 방향의 선행 작업
- Supabase users 테이블 스키마
