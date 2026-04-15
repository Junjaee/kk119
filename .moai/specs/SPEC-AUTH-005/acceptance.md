---
spec_id: SPEC-AUTH-005
version: 1.0.0
status: draft
created: 2026-04-15
updated: 2026-04-15
---

# SPEC-AUTH-005 수용 기준 (Acceptance Criteria)

## 1. Given-When-Then 시나리오

### 시나리오 1: 코드베이스 식별자 제거 검증

- **Given**: SPEC-AUTH-005의 모든 구현 태스크가 완료되고 PR이 머지된 상태이다.
- **When**: 프로젝트 루트에서 `grep -rE "super_admin" --include="*.{ts,tsx,js,jsx,sql}" --exclude-dir=node_modules --exclude-dir=.next` 명령을 실행한다.
- **Then**: 매칭되는 결과가 0건이다. (historical changelog, 본 SPEC 문서 제외)

### 시나리오 2: DB 마이그레이션 검증

- **Given**: Supabase users 테이블에 마이그레이션 이전 `role = 'super_admin'`인 사용자 N명이 존재했다.
- **When**: `supabase/migrations/{ts}_consolidate_super_admin_to_admin.sql`이 적용된다.
- **Then**:
  - `SELECT COUNT(*) FROM users WHERE role = 'super_admin'`의 결과는 0이다.
  - `SELECT COUNT(*) FROM users WHERE role = 'admin'`의 결과는 마이그레이션 이전 admin 수 + N이다.
  - `users_role_check` 제약조건은 `role IN ('admin', 'lawyer', 'teacher')`로 갱신되어 있다.

### 시나리오 3: 기존 super_admin 사용자 로그인

- **Given**: 마이그레이션 이전에 `role = 'super_admin'`이었던 사용자가 마이그레이션 이후 로그인한다.
- **When**: 사용자가 이메일/비밀번호로 인증을 성공한다.
- **Then**:
  - 서버는 DB 기준으로 role을 `admin`으로 반환한다.
  - 사용자는 `/admin/dashboard`로 리다이렉트된다.
  - 기존 super_admin 전용이었던 협회 관리, 권한 관리, 시스템 설정 페이지에 모두 접근할 수 있다.

### 시나리오 4: 기존 admin 사용자 회귀 없음

- **Given**: 마이그레이션 이전부터 `role = 'admin'`이었던 사용자가 존재한다.
- **When**: 해당 사용자가 로그인하여 모든 관리자 페이지를 탐색한다.
- **Then**:
  - 기존과 동일한 페이지 집합에 접근 가능하다.
  - 세션, JWT, 프로필 데이터에 변경이 없다.
  - 권한 거부(403/리다이렉트)가 발생하지 않는다.

### 시나리오 5: `/super-admin` 경로 접근

- **Given**: 외부 북마크 또는 구버전 링크로 사용자가 `/super-admin/users`에 접근한다.
- **When**: Next.js 라우팅이 해당 요청을 처리한다.
- **Then**: 다음 중 하나가 성립한다.
  - (기본) 404 페이지가 반환된다.
  - (옵션 M4.1 적용 시) `/admin/users`로 308 영구 리다이렉트된다.

### 시나리오 6: 스토리지 키 이관

- **Given**: 브라우저 localStorage에 `token_super_admin` 키로 유효 토큰이 저장되어 있다.
- **When**: 사용자가 애플리케이션을 다시 로드한다.
- **Then**:
  - 부팅 시 1회 이관 로직이 실행되어 `token_admin` 키에 값이 복사된다.
  - `token_super_admin` 키는 localStorage에서 삭제된다.
  - 사용자는 재로그인 없이 admin 세션을 유지한다.

### 시나리오 7: 통계 응답 스키마

- **Given**: 관리자가 통계 API(`/api/admin/stats` 등)를 호출한다.
- **When**: 서버가 통계 객체를 반환한다.
- **Then**:
  - 응답 객체에 `super_admin` 필드가 존재하지 않는다.
  - `admin` 카운트는 마이그레이션 이전 admin + super_admin 합계와 일치한다.
  - 통계 페이지 UI에 숫자가 정상 렌더링된다.

### 시나리오 8: TypeScript 타입 안전성

- **Given**: 모든 구현이 완료된 소스 트리가 있다.
- **When**: `pnpm tsc --noEmit`을 실행한다.
- **Then**: 타입 오류가 0건이며, `UserRole` 타입에 `'super_admin'`을 할당하려는 시도는 모두 컴파일 타임에 차단된다.

## 2. 엣지 케이스 (Edge Cases)

### EC-1: 마이그레이션 중 동시 쓰기
- 상황: 마이그레이션 SQL 실행 중 새 사용자 가입이 발생.
- 기대: 트랜잭션 래핑으로 일관성 보장. 신규 row는 `users_role_check` 제약에 의해 super_admin 삽입 불가.

### EC-2: legacy 스토리지 키와 신규 키가 모두 존재
- 상황: `token_super_admin`과 `token_admin`이 동시에 존재 (과거 다중 로그인).
- 기대: 이관 로직은 신규 `token_admin`을 보존(덮어쓰지 않음)하고 legacy 키만 삭제.

### EC-3: DB는 마이그레이션되었으나 구버전 프론트 캐시가 남은 브라우저
- 상황: Service Worker 또는 CDN 캐시로 구버전 번들 로드.
- 기대: API 응답은 이미 admin으로 정규화되어 있으므로 구 번들도 `admin` 분기를 타서 정상 동작. 캐시 만료 후 신규 번들 로드.

### EC-4: 권한 매트릭스에 누락된 super_admin 전용 권한
- 상황: `ROLE_PERMISSIONS.admin`에 일부 권한(예: `manage_associations`)이 누락.
- 기대: M1.3 선행 점검에서 발견하여 추가. QA 시나리오 3에서 실제 접근 여부를 재검증.

### EC-5: 다중 탭 동시 세션
- 상황: 동일 사용자가 여러 탭에서 동시 접속 중 이관 로직이 병렬 실행.
- 기대: localStorage setItem/removeItem은 원자적이므로 마지막 쓰기 승리, 데이터 손실 없음.

### EC-6: SQL 마이그레이션 롤백 필요
- 상황: 배포 직후 예기치 않은 장애로 role 변경 롤백이 필요.
- 기대: 사전 `pg_dump` 백업에서 users.role 컬럼만 복원하는 스크립트 사전 준비.

## 3. 품질 게이트 (Quality Gates)

### QG-1: 정적 검증
- [ ] `grep -rE "super_admin"` 결과 0건 (제외: 본 SPEC 문서, CHANGELOG, git history)
- [ ] `pnpm tsc --noEmit` 오류 0건
- [ ] `pnpm lint` 경고 신규 0건
- [ ] CI의 `lint:no-super-admin` 스크립트 통과

### QG-2: 테스트
- [ ] 기존 테스트 스위트 100% 통과
- [ ] 신규 회귀 테스트: admin 로그인 → 관리자 페이지 9종 접근 성공
- [ ] 신규 회귀 테스트: teacher/lawyer 역할이 admin 페이지 접근 시 차단

### QG-3: DB 검증
- [ ] 스테이징에서 마이그레이션 드라이런 성공
- [ ] 마이그레이션 감사 로그에 이전 super_admin 수가 기록됨
- [ ] 운영 마이그레이션 이후 `role = 'super_admin'` 0건 확인

### QG-4: 수동 QA
- [ ] admin 계정 로그인 → 모든 `/admin/*` 페이지 접근 성공
- [ ] lawyer 계정 로그인 → `/lawyer` 대시보드 정상
- [ ] teacher 계정 로그인 → `/teacher` 대시보드 정상
- [ ] `/super-admin` 접근 → 404 또는 `/admin`으로 리다이렉트
- [ ] 통계 페이지의 관리자 수 카운트가 올바름

## 4. Definition of Done (DoD)

- [ ] 모든 EARS 요구사항(REQ-U, REQ-E, REQ-S, REQ-O, REQ-UN)이 충족됨
- [ ] 시나리오 1~8이 모두 통과
- [ ] 엣지 케이스 EC-1~EC-6이 문서화되고 처리 방식이 구현 또는 의도적으로 수용됨
- [ ] 품질 게이트 QG-1~QG-4 모두 PASS
- [ ] DB 마이그레이션이 스테이징과 운영에 적용됨
- [ ] PR이 코드 리뷰를 통과하고 main 브랜치에 머지됨
- [ ] 배포 이후 7일간 `super_admin` 관련 버그 리포트 0건
- [ ] 관련 런북/문서 업데이트 완료
