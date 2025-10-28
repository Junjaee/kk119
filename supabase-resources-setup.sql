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
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
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

-- 6. RLS 활성화
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- 7. SELECT 정책: 승인된 자료는 모든 사용자가 조회 가능
DROP POLICY IF EXISTS "resources_select_approved" ON public.resources;
CREATE POLICY "resources_select_approved"
ON public.resources
FOR SELECT
TO public
USING (is_approved = true);

-- 8. INSERT 정책: 인증된 사용자만 업로드 가능
DROP POLICY IF EXISTS "resources_insert_authenticated" ON public.resources;
CREATE POLICY "resources_insert_authenticated"
ON public.resources
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

-- 9. UPDATE 정책: 업로더 본인 또는 관리자만 수정 가능
DROP POLICY IF EXISTS "resources_update_owner" ON public.resources;
CREATE POLICY "resources_update_owner"
ON public.resources
FOR UPDATE
TO authenticated
USING (
  auth.uid() = uploaded_by
  OR
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
)
WITH CHECK (
  auth.uid() = uploaded_by
  OR
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

-- 10. DELETE 정책: 업로더 본인 또는 관리자만 삭제 가능
DROP POLICY IF EXISTS "resources_delete_owner" ON public.resources;
CREATE POLICY "resources_delete_owner"
ON public.resources
FOR DELETE
TO authenticated
USING (
  auth.uid() = uploaded_by
  OR
  EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role IN ('admin', 'super_admin')
  )
);

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
TO public
USING (bucket_id = 'resources');

-- 14. Storage INSERT 정책: 인증된 사용자만 업로드 가능
DROP POLICY IF EXISTS "resources_storage_insert_authenticated" ON storage.objects;
CREATE POLICY "resources_storage_insert_authenticated"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'resources'
  AND auth.uid() IS NOT NULL
);

-- 15. Storage UPDATE 정책: 업로더 본인만 수정 가능
DROP POLICY IF EXISTS "resources_storage_update_owner" ON storage.objects;
CREATE POLICY "resources_storage_update_owner"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'resources'
  AND auth.uid()::text = owner
)
WITH CHECK (
  bucket_id = 'resources'
  AND auth.uid()::text = owner
);

-- 16. Storage DELETE 정책: 업로더 본인만 삭제 가능
DROP POLICY IF EXISTS "resources_storage_delete_owner" ON storage.objects;
CREATE POLICY "resources_storage_delete_owner"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'resources'
  AND auth.uid()::text = owner
);

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
