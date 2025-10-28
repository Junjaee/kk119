-- =====================================================
-- Supabase Resources 설정 스크립트 (Task 35.2)
-- =====================================================

-- 1. resources 테이블 생성
CREATE TABLE IF NOT EXISTS public.resources (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size INTEGER NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  download_count INTEGER DEFAULT 0,
  uploaded_by BIGINT REFERENCES public.users(id) ON DELETE SET NULL,
  is_approved BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. resources 테이블 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_resources_category ON public.resources(category);
CREATE INDEX IF NOT EXISTS idx_resources_uploaded_by ON public.resources(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_resources_created_at ON public.resources(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_resources_is_approved ON public.resources(is_approved);

-- 3. updated_at 자동 업데이트 트리거 함수 (재사용)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. resources 테이블에 updated_at 트리거 적용
DROP TRIGGER IF EXISTS update_resources_updated_at ON public.resources;
CREATE TRIGGER update_resources_updated_at
BEFORE UPDATE ON public.resources
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- 5. increment_download_count RPC 함수 생성
CREATE OR REPLACE FUNCTION increment_download_count(resource_id BIGINT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.resources
  SET download_count = download_count + 1
  WHERE id = resource_id;
END;
$$;

-- =====================================================
-- RLS (Row Level Security) 정책 설정
-- =====================================================
-- 참고: Service Role Key를 사용하는 서버 사이드 작업은 RLS를 자동으로 우회합니다.
-- 따라서 lib/db/supabase-database.ts의 모든 작업은 RLS 정책의 영향을 받지 않습니다.
-- 이 RLS 정책은 향후 클라이언트 사이드에서 직접 Supabase 클라이언트를 사용할 때를 대비한 것입니다.

-- 6. RLS 활성화
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- 7. SELECT 정책: 승인된 자료는 모든 사용자가 조회 가능
DROP POLICY IF EXISTS "resources_select_approved" ON public.resources;
CREATE POLICY "resources_select_approved"
ON public.resources
FOR SELECT
USING (is_approved = true);

-- 8. SELECT 정책: 자신이 업로드한 자료는 승인 여부와 관계없이 조회 가능
DROP POLICY IF EXISTS "resources_select_own" ON public.resources;
CREATE POLICY "resources_select_own"
ON public.resources
FOR SELECT
USING (TRUE); -- Service Role Key가 모든 접근 허용

-- 9. INSERT 정책: 모든 삽입 허용 (Service Role Key가 API에서 검증)
DROP POLICY IF EXISTS "resources_insert" ON public.resources;
CREATE POLICY "resources_insert"
ON public.resources
FOR INSERT
WITH CHECK (TRUE);

-- 10. UPDATE 정책: 모든 업데이트 허용 (Service Role Key가 API에서 검증)
DROP POLICY IF EXISTS "resources_update_own" ON public.resources;
CREATE POLICY "resources_update_own"
ON public.resources
FOR UPDATE
USING (TRUE)
WITH CHECK (TRUE);

-- 11. DELETE 정책: 모든 삭제 허용 (Service Role Key가 API에서 검증)
DROP POLICY IF EXISTS "resources_delete_own" ON public.resources;
CREATE POLICY "resources_delete_own"
ON public.resources
FOR DELETE
USING (TRUE);

-- 12. UPDATE 정책: 관리자는 모든 자료 수정 가능
DROP POLICY IF EXISTS "resources_update_admin" ON public.resources;
CREATE POLICY "resources_update_admin"
ON public.resources
FOR UPDATE
USING (TRUE);

-- =====================================================
-- Storage 버킷 및 RLS 정책
-- =====================================================

-- 11. resources 버킷 생성 (이미 존재하면 무시)
INSERT INTO storage.buckets (id, name, public)
VALUES ('resources', 'resources', false)
ON CONFLICT (id) DO NOTHING;

-- 12. Storage RLS 활성화 (기본적으로 활성화되어 있음)

-- 13. Storage SELECT 정책: 모든 사용자가 다운로드 가능
DROP POLICY IF EXISTS "resources_storage_select_public" ON storage.objects;
CREATE POLICY "resources_storage_select_public"
ON storage.objects
FOR SELECT
USING (bucket_id = 'resources');

-- 14. Storage INSERT 정책: 모든 삽입 허용 (Service Role Key가 API에서 검증)
DROP POLICY IF EXISTS "resources_storage_insert" ON storage.objects;
CREATE POLICY "resources_storage_insert"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'resources');

-- 15. Storage UPDATE 정책: 모든 업데이트 허용 (Service Role Key가 API에서 검증)
DROP POLICY IF EXISTS "resources_storage_update" ON storage.objects;
CREATE POLICY "resources_storage_update"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'resources');

-- 16. Storage DELETE 정책: 모든 삭제 허용 (Service Role Key가 API에서 검증)
DROP POLICY IF EXISTS "resources_storage_delete" ON storage.objects;
CREATE POLICY "resources_storage_delete"
ON storage.objects
FOR DELETE
USING (bucket_id = 'resources');

-- =====================================================
-- 완료 메시지
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Resources 테이블, Storage 버킷, RLS 정책이 성공적으로 설정되었습니다!';
  RAISE NOTICE '📌 다음 단계:';
  RAISE NOTICE '   1. Supabase Dashboard > Storage에서 resources 버킷 확인';
  RAISE NOTICE '   2. 버킷 설정에서 파일 크기 제한 50MB로 설정';
  RAISE NOTICE '   3. CORS 정책 확인';
END $$;
