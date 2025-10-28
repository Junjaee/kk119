-- =====================================================
-- Unify Admin Roles: super_admin → admin
-- Task 39: Admin Account System Refactoring
-- =====================================================

-- ⚠️ 중요: 이 마이그레이션은 'super_admin' 역할을 'admin'으로 통합합니다.
-- 모든 super_admin 사용자는 admin으로 변경됩니다.

-- =====================================================
-- 1. Update existing super_admin users to admin
-- =====================================================
UPDATE users
SET role = 'admin'
WHERE role = 'super_admin';

-- =====================================================
-- 2. Verify the migration
-- =====================================================
DO $$
DECLARE
  super_admin_count INTEGER;
  admin_count INTEGER;
BEGIN
  -- Count remaining super_admin users (should be 0)
  SELECT COUNT(*) INTO super_admin_count FROM users WHERE role = 'super_admin';

  -- Count admin users
  SELECT COUNT(*) INTO admin_count FROM users WHERE role = 'admin';

  RAISE NOTICE '✅ Admin Role 통합 마이그레이션 완료!';
  RAISE NOTICE '   - super_admin 사용자 수: % (0이어야 함)', super_admin_count;
  RAISE NOTICE '   - admin 사용자 수: %', admin_count;
  RAISE NOTICE '   - 모든 super_admin → admin 변경 완료';
  RAISE NOTICE '';

  IF super_admin_count > 0 THEN
    RAISE WARNING '⚠️  아직 super_admin 사용자가 남아있습니다!';
  END IF;
END $$;
