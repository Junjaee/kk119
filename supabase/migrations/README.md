# Supabase 마이그레이션 가이드

## 📋 마이그레이션 파일 목록

### 1. `001_initial_schema.sql`
- **목적**: 초기 PostgreSQL 스키마 생성
- **내용**: 17개 테이블 생성 (users, sessions, reports, consults, community, 등)
- **실행 시기**: 최초 1회 (이미 실행됨)

### 2. `002_clean_and_recreate.sql`
- **목적**: 기존 테이블 정리 및 재생성
- **내용**: 기존 테이블 삭제 후 깨끗한 스키마 재생성
- **실행 시기**: 스키마 충돌 발생 시 (이미 실행됨)
- **⚠️ 주의**: 기존 데이터가 모두 삭제됩니다!

### 3. `003_enable_rls.sql` ⭐ **현재 실행 필요**
- **목적**: Row Level Security (RLS) 정책 활성화
- **내용**:
  - 17개 테이블에 RLS 활성화
  - 역할별 접근 권한 정책 (teacher, admin, super_admin, lawyer)
  - 협회별 데이터 격리 정책
  - Helper 함수 (`auth.user_role()`, `auth.user_association_id()`)
- **실행 시기**: **지금 실행 필요** ⬇️

---

## 🚀 RLS 정책 적용 방법

### Step 1: Supabase 대시보드 접속

1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. 프로젝트 선택: `nzyncupzvwzhznbfnuvq`
3. 왼쪽 메뉴에서 **SQL Editor** 선택

### Step 2: RLS SQL 실행

1. **New query** 버튼 클릭
2. `supabase/migrations/003_enable_rls.sql` 파일 내용 복사
3. SQL Editor에 붙여넣기
4. **Run** 버튼 클릭 (또는 Ctrl+Enter)

### Step 3: 실행 결과 확인

성공 시 다음 메시지가 표시됩니다:
```
✅ Row Level Security (RLS) 정책 활성화 완료!
   - 17개 테이블에 RLS 활성화
   - 역할별 접근 권한 정책 적용 (teacher, admin, super_admin, lawyer)
   - 협회별 데이터 격리 정책 적용
   - Service Role Key 사용 시 RLS 자동 우회

⚠️  참고: 현재 서버 사이드에서 Service Role Key를 사용하므로
   RLS 정책이 서버 작업에는 적용되지 않습니다.
   클라이언트 사이드에서 직접 Supabase를 사용할 때만 적용됩니다.
```

### Step 4: RLS 정책 검증 (로컬)

터미널에서 다음 명령어 실행:
```bash
node scripts/verify-rls-policies.mjs
```

---

## 🔒 RLS 정책 개요

### 역할별 권한

#### 👨‍🏫 Teacher (교사)
- 자신의 프로필 조회/수정
- 자신의 신고서 생성/조회/수정
- 자신의 상담 요청 생성/조회
- 승인된 교육 자료 조회
- 커뮤니티 게시글/댓글 작성

#### 👔 Admin (관리자)
- 소속 협회 내 모든 사용자 조회
- 소속 협회 내 모든 신고서 조회/수정
- 교육 자료 승인
- 회원 관리
- 커뮤니티 관리 (게시글/댓글 삭제)

#### 🔧 Super Admin (최고 관리자)
- 모든 데이터 접근 권한
- 협회 생성/수정/삭제
- 모든 사용자 관리
- 시스템 전체 설정

#### ⚖️ Lawyer (변호사)
- 자신에게 배정된 신고서 조회/수정
- 상담 요청 조회 (미배정 상담)
- 상담 요청 클레임 및 답변
- 검증된 변호사 목록 조회

### 데이터 격리

- **협회별 격리**: 각 협회의 데이터는 다른 협회에서 접근 불가
- **소유자 권한**: 자신이 생성한 데이터만 수정/삭제 가능
- **역할 기반**: 역할에 따라 접근 가능한 데이터 범위 제한

---

## ⚠️ 중요 사항

### Service Role Key 사용

현재 서버 사이드 코드(`lib/db/supabase-database.ts`)에서는 **Service Role Key**를 사용합니다:

```typescript
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
```

**Service Role Key의 특징:**
- ✅ RLS 정책을 자동으로 우회
- ✅ 모든 테이블에 무제한 접근
- ✅ 서버 사이드 작업에 최적화
- ⚠️ 절대 클라이언트에 노출 금지

### 클라이언트 사이드 사용

향후 클라이언트 사이드에서 직접 Supabase를 사용할 경우:

```typescript
// Anon Key 사용 (RLS 정책 적용됨)
const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

이 경우 RLS 정책이 적용되어 사용자 역할과 권한에 따라 데이터 접근이 제한됩니다.

---

## 🧪 RLS 테스트

### 테스트 시나리오

1. **Teacher 계정 테스트**
   - 다른 교사의 신고서 접근 차단 확인
   - 자신의 신고서만 조회 가능 확인

2. **Admin 계정 테스트**
   - 소속 협회 내 모든 신고서 접근 가능 확인
   - 다른 협회 데이터 접근 차단 확인

3. **Lawyer 계정 테스트**
   - 배정된 상담만 접근 가능 확인
   - 미배정 상담 조회 가능 확인

4. **Super Admin 계정 테스트**
   - 모든 데이터 접근 가능 확인

---

## 📚 참고 자료

- [Supabase RLS 공식 문서](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS 문서](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase Auth Helpers](https://supabase.com/docs/guides/auth/auth-helpers)

---

## 🔄 마이그레이션 기록

| 날짜 | 파일 | 설명 | 상태 |
|------|------|------|------|
| 2025-10-27 | 001_initial_schema.sql | 초기 스키마 생성 | ✅ 완료 |
| 2025-10-27 | 002_clean_and_recreate.sql | 스키마 재생성 | ✅ 완료 |
| 2025-10-27 | 003_enable_rls.sql | RLS 정책 활성화 | ⏳ 실행 필요 |

---

## 💡 도움말

문제 발생 시:
1. Supabase 대시보드 → Database → Tables에서 테이블 확인
2. Supabase 대시보드 → Authentication → Policies에서 RLS 정책 확인
3. SQL Editor에서 쿼리 실행 로그 확인
4. `scripts/verify-rls-policies.mjs` 스크립트로 상태 검증
