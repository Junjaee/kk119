# Supabase Resources 설정 가이드 (Task 35.2)

## 📋 개요

교권 자료실 기능을 Supabase에 완전히 연동하기 위한 설정 가이드입니다.

## 🔧 설정 단계

### 1. SQL 스크립트 실행

1. Supabase Dashboard 접속: https://supabase.com/dashboard
2. 프로젝트 선택: `kk119` 프로젝트
3. 좌측 메뉴에서 **SQL Editor** 클릭
4. **New Query** 버튼 클릭
5. `supabase-resources-setup.sql` 파일의 전체 내용 복사하여 붙여넣기
6. **Run** 버튼 클릭하여 실행

### 2. Storage 버킷 설정

1. 좌측 메뉴에서 **Storage** 클릭
2. `resources` 버킷이 생성되었는지 확인
3. `resources` 버킷 클릭 → **Settings** 탭 이동
4. 다음 설정 적용:
   - **File size limit**: `52428800` (50MB)
   - **Allowed MIME types**:
     - `application/pdf`
     - `application/msword`
     - `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
     - `application/vnd.ms-powerpoint`
     - `application/vnd.openxmlformats-officedocument.presentationml.presentation`
     - `application/vnd.ms-excel`
     - `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
     - `application/x-hwp` (한글)
     - `image/*`
     - `text/*`

### 3. RLS 정책 확인

**중요**: 이 프로젝트는 Supabase Auth가 아닌 커스텀 JWT 인증을 사용합니다. 따라서 RLS 정책은 Service Role Key를 통해 자동으로 우회됩니다. API 레벨에서 모든 권한 검증이 이루어집니다.

1. 좌측 메뉴에서 **Authentication** → **Policies** 이동
2. `resources` 테이블의 정책 확인:
   - ✅ `resources_select_approved`: SELECT (승인된 자료)
   - ✅ `resources_select_own`: SELECT (모든 접근 허용 - Service Role)
   - ✅ `resources_insert`: INSERT (모든 접근 허용 - Service Role)
   - ✅ `resources_update_own`: UPDATE (모든 접근 허용 - Service Role)
   - ✅ `resources_delete_own`: DELETE (모든 접근 허용 - Service Role)
   - ✅ `resources_update_admin`: UPDATE (관리자 전용)

3. `storage.objects` 테이블의 `resources` 버킷 정책 확인:
   - ✅ `resources_storage_select_public`: SELECT (모든 다운로드)
   - ✅ `resources_storage_insert`: INSERT (Service Role 검증)
   - ✅ `resources_storage_update`: UPDATE (Service Role 검증)
   - ✅ `resources_storage_delete`: DELETE (Service Role 검증)

### 4. 테이블 구조 확인

**resources 테이블:**
- `id`: BIGSERIAL (Primary Key)
- `title`: VARCHAR(255) NOT NULL
- `description`: TEXT
- `category`: VARCHAR(50) NOT NULL
- `file_name`: VARCHAR(255) NOT NULL
- `file_size`: INTEGER NOT NULL
- `file_path`: VARCHAR(500) NOT NULL
- `download_count`: INTEGER DEFAULT 0
- `uploaded_by`: BIGINT (외래 키 to public.users)
- `is_approved`: BOOLEAN DEFAULT true
- `created_at`: TIMESTAMPTZ
- `updated_at`: TIMESTAMPTZ

**인덱스:**
- `idx_resources_category`
- `idx_resources_uploaded_by`
- `idx_resources_created_at`
- `idx_resources_is_approved`

**RPC 함수:**
- `increment_download_count(resource_id BIGINT)`: 다운로드 카운트 증가

## ✅ 검증 체크리스트

- [ ] `resources` 테이블이 생성되었는지 확인
- [ ] `resources` Storage 버킷이 생성되었는지 확인
- [ ] RLS 정책이 모두 적용되었는지 확인
- [ ] `increment_download_count` RPC 함수가 생성되었는지 확인
- [ ] Storage 버킷의 파일 크기 제한이 50MB로 설정되었는지 확인

## 🧪 테스트

### 테이블 조회 테스트
```sql
-- resources 테이블 확인
SELECT * FROM public.resources LIMIT 5;

-- RLS 정책 확인
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'resources';
```

### RPC 함수 테스트
```sql
-- 다운로드 카운트 증가 테스트 (resource_id = 1인 경우)
SELECT increment_download_count(1);

-- 카운트 증가 확인
SELECT id, title, download_count FROM public.resources WHERE id = 1;
```

## 📝 참고사항

- **Task 33 (커뮤니티)**의 RLS 정책 패턴을 참고하여 구현
- **커스텀 JWT 인증**: 이 프로젝트는 Supabase Auth가 아닌 자체 JWT 토큰 인증 사용
- **Service Role Key**: API에서 Service Role Key를 사용하므로 RLS 정책이 자동 우회됨
- Storage 버킷은 `private`으로 설정되어 있으며, Signed URL을 통해 다운로드
- 업로드 시 `uploaded_by` 필드는 API에서 JWT 토큰의 userId로 설정
- 모든 자료는 기본적으로 `is_approved = true`로 설정 (관리자 승인 시스템은 향후 구현 가능)

## 🔗 관련 파일

- `lib/db/supabase-database.ts`: resourceDb 함수 구현
- `app/api/resources/route.ts`: API 엔드포인트
- `app/api/resources/upload/route.ts`: 파일 업로드 엔드포인트
- `app/api/resources/[id]/download/route.ts`: 파일 다운로드 엔드포인트

## 🚀 다음 단계

Task 35.3: 파일 메타데이터 동기화 및 삭제 로직 구현
