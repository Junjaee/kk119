-- =====================================================
-- Row Level Security (RLS) Policies
-- 역할별, 협회별 데이터 접근 권한 제어
-- =====================================================

-- ⚠️ Important Note:
-- Service Role Key를 사용하는 서버 사이드 작업은 RLS를 자동으로 우회합니다.
-- 따라서 lib/db/supabase-database.ts의 모든 작업은 RLS 정책의 영향을 받지 않습니다.
-- 이 RLS 정책은 향후 클라이언트 사이드에서 직접 Supabase 클라이언트를 사용할 때를 대비한 것입니다.

-- =====================================================
-- Helper Function: Get Current User's Role
-- =====================================================
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM users
  WHERE id = auth.uid()::BIGINT;

  RETURN COALESCE(user_role, 'teacher');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Helper Function: Get Current User's Association ID
-- =====================================================
CREATE OR REPLACE FUNCTION auth.user_association_id()
RETURNS BIGINT AS $$
DECLARE
  assoc_id BIGINT;
BEGIN
  SELECT association_id INTO assoc_id
  FROM users
  WHERE id = auth.uid()::BIGINT;

  RETURN assoc_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 1. USERS TABLE - RLS
-- =====================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "users_select_own"
  ON users FOR SELECT
  USING (id = auth.uid()::BIGINT);

-- Super admins can view all users
CREATE POLICY "users_select_super_admin"
  ON users FOR SELECT
  USING (auth.user_role() = 'super_admin');

-- Admins can view users in their association
CREATE POLICY "users_select_admin"
  ON users FOR SELECT
  USING (
    auth.user_role() = 'admin' AND
    association_id = auth.user_association_id()
  );

-- Users can update their own profile (except role and association)
CREATE POLICY "users_update_own"
  ON users FOR UPDATE
  USING (id = auth.uid()::BIGINT)
  WITH CHECK (
    id = auth.uid()::BIGINT AND
    role = (SELECT role FROM users WHERE id = auth.uid()::BIGINT) AND
    association_id = (SELECT association_id FROM users WHERE id = auth.uid()::BIGINT)
  );

-- =====================================================
-- 2. SESSIONS TABLE - RLS
-- =====================================================
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Users can only access their own sessions
CREATE POLICY "sessions_all_own"
  ON sessions FOR ALL
  USING (user_id = auth.uid()::BIGINT);

-- =====================================================
-- 3. VERIFICATION TOKENS - RLS
-- =====================================================
ALTER TABLE verification_tokens ENABLE ROW LEVEL SECURITY;

-- Users can only access their own verification tokens
CREATE POLICY "verification_tokens_all_own"
  ON verification_tokens FOR ALL
  USING (user_id = auth.uid()::BIGINT);

-- =====================================================
-- 4. PASSWORD RESET TOKENS - RLS
-- =====================================================
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Users can only access their own password reset tokens
CREATE POLICY "password_reset_tokens_all_own"
  ON password_reset_tokens FOR ALL
  USING (user_id = auth.uid()::BIGINT);

-- =====================================================
-- 5. RESOURCES TABLE - RLS
-- =====================================================
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;

-- Everyone can view approved resources
CREATE POLICY "resources_select_approved"
  ON resources FOR SELECT
  USING (is_approved = TRUE);

-- Users can view their own resources (even if not approved)
CREATE POLICY "resources_select_own"
  ON resources FOR SELECT
  USING (uploaded_by = auth.uid()::BIGINT);

-- Users can create resources
CREATE POLICY "resources_insert"
  ON resources FOR INSERT
  WITH CHECK (uploaded_by = auth.uid()::BIGINT);

-- Users can update their own resources
CREATE POLICY "resources_update_own"
  ON resources FOR UPDATE
  USING (uploaded_by = auth.uid()::BIGINT);

-- Users can delete their own resources
CREATE POLICY "resources_delete_own"
  ON resources FOR DELETE
  USING (uploaded_by = auth.uid()::BIGINT);

-- Admins can approve resources
CREATE POLICY "resources_update_admin"
  ON resources FOR UPDATE
  USING (auth.user_role() IN ('admin', 'super_admin'));

-- =====================================================
-- 6. REPORTS TABLE - RLS
-- =====================================================
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Teachers can view their own reports
CREATE POLICY "reports_select_own"
  ON reports FOR SELECT
  USING (teacher_id = auth.uid()::BIGINT);

-- Admins can view reports in their association
CREATE POLICY "reports_select_admin"
  ON reports FOR SELECT
  USING (
    auth.user_role() IN ('admin', 'super_admin') AND
    (teacher_id IN (
      SELECT id FROM users
      WHERE association_id = auth.user_association_id()
    ) OR auth.user_role() = 'super_admin')
  );

-- Lawyers can view reports assigned to them
CREATE POLICY "reports_select_lawyer"
  ON reports FOR SELECT
  USING (
    auth.user_role() = 'lawyer' AND
    lawyer_id = auth.uid()::BIGINT
  );

-- Teachers can create their own reports
CREATE POLICY "reports_insert"
  ON reports FOR INSERT
  WITH CHECK (teacher_id = auth.uid()::BIGINT);

-- Teachers can update their own reports (before review)
CREATE POLICY "reports_update_own"
  ON reports FOR UPDATE
  USING (
    teacher_id = auth.uid()::BIGINT AND
    status = 'received'
  );

-- Admins and lawyers can update reports
CREATE POLICY "reports_update_admin_lawyer"
  ON reports FOR UPDATE
  USING (auth.user_role() IN ('admin', 'super_admin', 'lawyer'));

-- =====================================================
-- 7. REPORT STATUS HISTORY - RLS
-- =====================================================
ALTER TABLE report_status_history ENABLE ROW LEVEL SECURITY;

-- Users can view status history of reports they can access
CREATE POLICY "report_history_select"
  ON report_status_history FOR SELECT
  USING (
    report_id IN (
      SELECT id FROM reports
      WHERE teacher_id = auth.uid()::BIGINT
         OR (auth.user_role() IN ('admin', 'super_admin'))
         OR (auth.user_role() = 'lawyer' AND lawyer_id = auth.uid()::BIGINT)
    )
  );

-- Authorized users can insert status history
CREATE POLICY "report_history_insert"
  ON report_status_history FOR INSERT
  WITH CHECK (
    changed_by = auth.uid()::BIGINT AND
    auth.user_role() IN ('admin', 'super_admin', 'lawyer')
  );

-- =====================================================
-- 8. FILES TABLE - RLS
-- =====================================================
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- Users can view files they uploaded
CREATE POLICY "files_select_own"
  ON files FOR SELECT
  USING (uploader_id = auth.uid()::BIGINT);

-- Users can view files attached to reports they can access
CREATE POLICY "files_select_report"
  ON files FOR SELECT
  USING (
    report_id IN (
      SELECT id FROM reports
      WHERE teacher_id = auth.uid()::BIGINT
         OR (auth.user_role() IN ('admin', 'super_admin'))
         OR (auth.user_role() = 'lawyer' AND lawyer_id = auth.uid()::BIGINT)
    )
  );

-- Users can insert their own files
CREATE POLICY "files_insert"
  ON files FOR INSERT
  WITH CHECK (uploader_id = auth.uid()::BIGINT);

-- Users can delete their own files (soft delete)
CREATE POLICY "files_update_delete_own"
  ON files FOR UPDATE
  USING (uploader_id = auth.uid()::BIGINT);

-- =====================================================
-- 9. LAWYERS TABLE - RLS
-- =====================================================
ALTER TABLE lawyers ENABLE ROW LEVEL SECURITY;

-- Everyone can view verified lawyers
CREATE POLICY "lawyers_select_verified"
  ON lawyers FOR SELECT
  USING (is_verified = TRUE);

-- Lawyers can view their own profile
CREATE POLICY "lawyers_select_own"
  ON lawyers FOR SELECT
  USING (user_id = auth.uid()::BIGINT);

-- Admins can view all lawyers
CREATE POLICY "lawyers_select_admin"
  ON lawyers FOR SELECT
  USING (auth.user_role() IN ('admin', 'super_admin'));

-- Lawyers can update their own profile
CREATE POLICY "lawyers_update_own"
  ON lawyers FOR UPDATE
  USING (user_id = auth.uid()::BIGINT);

-- Admins can update lawyer verification status
CREATE POLICY "lawyers_update_admin"
  ON lawyers FOR UPDATE
  USING (auth.user_role() IN ('admin', 'super_admin'));

-- =====================================================
-- 10. CONSULTS TABLE - RLS
-- =====================================================
ALTER TABLE consults ENABLE ROW LEVEL SECURITY;

-- Users can view their own consults
CREATE POLICY "consults_select_own"
  ON consults FOR SELECT
  USING (user_id = auth.uid()::BIGINT);

-- Lawyers can view consults they claimed
CREATE POLICY "consults_select_lawyer"
  ON consults FOR SELECT
  USING (
    auth.user_role() = 'lawyer' AND
    lawyer_id = auth.uid()::BIGINT
  );

-- Lawyers can view unclaimed consults
CREATE POLICY "consults_select_unclaimed"
  ON consults FOR SELECT
  USING (
    auth.user_role() = 'lawyer' AND
    lawyer_id IS NULL
  );

-- Users can create consults
CREATE POLICY "consults_insert"
  ON consults FOR INSERT
  WITH CHECK (user_id = auth.uid()::BIGINT);

-- Users can update their own pending consults
CREATE POLICY "consults_update_own"
  ON consults FOR UPDATE
  USING (
    user_id = auth.uid()::BIGINT AND
    status = 'pending'
  );

-- Lawyers can update consults they claimed
CREATE POLICY "consults_update_lawyer"
  ON consults FOR UPDATE
  USING (
    auth.user_role() = 'lawyer' AND
    lawyer_id = auth.uid()::BIGINT
  );

-- Lawyers can claim consults
CREATE POLICY "consults_claim_lawyer"
  ON consults FOR UPDATE
  USING (
    auth.user_role() = 'lawyer' AND
    lawyer_id IS NULL
  )
  WITH CHECK (
    lawyer_id = auth.uid()::BIGINT
  );

-- =====================================================
-- 11. CONSULT REPLIES - RLS
-- =====================================================
ALTER TABLE consult_replies ENABLE ROW LEVEL SECURITY;

-- Users can view replies on their consults
CREATE POLICY "consult_replies_select_own"
  ON consult_replies FOR SELECT
  USING (
    consult_id IN (
      SELECT id FROM consults WHERE user_id = auth.uid()::BIGINT
    )
  );

-- Lawyers can view replies on consults they claimed
CREATE POLICY "consult_replies_select_lawyer"
  ON consult_replies FOR SELECT
  USING (
    auth.user_role() = 'lawyer' AND
    consult_id IN (
      SELECT id FROM consults WHERE lawyer_id = auth.uid()::BIGINT
    )
  );

-- Users can create replies on their own consults or consults they're involved in
CREATE POLICY "consult_replies_insert"
  ON consult_replies FOR INSERT
  WITH CHECK (
    user_id = auth.uid()::BIGINT AND
    (
      consult_id IN (SELECT id FROM consults WHERE user_id = auth.uid()::BIGINT) OR
      (is_lawyer = TRUE AND consult_id IN (SELECT id FROM consults WHERE lawyer_id = auth.uid()::BIGINT))
    )
  );

-- =====================================================
-- 12. CONSULT ATTACHMENTS - RLS
-- =====================================================
ALTER TABLE consult_attachments ENABLE ROW LEVEL SECURITY;

-- Users can view attachments on consults they have access to
CREATE POLICY "consult_attachments_select"
  ON consult_attachments FOR SELECT
  USING (
    consult_id IN (
      SELECT id FROM consults
      WHERE user_id = auth.uid()::BIGINT
         OR (lawyer_id = auth.uid()::BIGINT AND auth.user_role() = 'lawyer')
    )
  );

-- Users can insert attachments on their consults
CREATE POLICY "consult_attachments_insert"
  ON consult_attachments FOR INSERT
  WITH CHECK (
    consult_id IN (
      SELECT id FROM consults WHERE user_id = auth.uid()::BIGINT
    )
  );

-- =====================================================
-- 13. ASSOCIATIONS - RLS
-- =====================================================
ALTER TABLE associations ENABLE ROW LEVEL SECURITY;

-- Everyone can view all associations
CREATE POLICY "associations_select_all"
  ON associations FOR SELECT
  USING (TRUE);

-- Only super admins can modify associations
CREATE POLICY "associations_modify_super_admin"
  ON associations FOR ALL
  USING (auth.user_role() = 'super_admin');

-- =====================================================
-- 14. MEMBERSHIPS - RLS
-- =====================================================
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;

-- Users can view their own membership
CREATE POLICY "memberships_select_own"
  ON memberships FOR SELECT
  USING (user_id = auth.uid()::BIGINT);

-- Admins can view memberships in their association
CREATE POLICY "memberships_select_admin"
  ON memberships FOR SELECT
  USING (
    auth.user_role() IN ('admin', 'super_admin') AND
    (association_id = auth.user_association_id() OR auth.user_role() = 'super_admin')
  );

-- Only admins can modify memberships
CREATE POLICY "memberships_modify_admin"
  ON memberships FOR ALL
  USING (auth.user_role() IN ('admin', 'super_admin'));

-- =====================================================
-- 15. COMMUNITY POSTS - RLS
-- =====================================================
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;

-- Everyone can view community posts
CREATE POLICY "community_posts_select_all"
  ON community_posts FOR SELECT
  USING (TRUE);

-- Users can create community posts
CREATE POLICY "community_posts_insert"
  ON community_posts FOR INSERT
  WITH CHECK (author_id = auth.uid()::TEXT);

-- Users can update their own posts
CREATE POLICY "community_posts_update_own"
  ON community_posts FOR UPDATE
  USING (author_id = auth.uid()::TEXT);

-- Users can delete their own posts
CREATE POLICY "community_posts_delete_own"
  ON community_posts FOR DELETE
  USING (author_id = auth.uid()::TEXT);

-- Admins can moderate all posts
CREATE POLICY "community_posts_moderate_admin"
  ON community_posts FOR ALL
  USING (auth.user_role() IN ('admin', 'super_admin'));

-- =====================================================
-- 16. COMMUNITY COMMENTS - RLS
-- =====================================================
ALTER TABLE community_comments ENABLE ROW LEVEL SECURITY;

-- Everyone can view comments
CREATE POLICY "community_comments_select_all"
  ON community_comments FOR SELECT
  USING (TRUE);

-- Users can create comments
CREATE POLICY "community_comments_insert"
  ON community_comments FOR INSERT
  WITH CHECK (author_id = auth.uid()::TEXT);

-- Users can update their own comments
CREATE POLICY "community_comments_update_own"
  ON community_comments FOR UPDATE
  USING (author_id = auth.uid()::TEXT);

-- Users can delete their own comments
CREATE POLICY "community_comments_delete_own"
  ON community_comments FOR DELETE
  USING (author_id = auth.uid()::TEXT);

-- Admins can moderate all comments
CREATE POLICY "community_comments_moderate_admin"
  ON community_comments FOR ALL
  USING (auth.user_role() IN ('admin', 'super_admin'));

-- =====================================================
-- 17. AUDIT LOGS - RLS
-- =====================================================
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own audit logs
CREATE POLICY "audit_logs_select_own"
  ON audit_logs FOR SELECT
  USING (user_id = auth.uid()::BIGINT);

-- Admins can view all audit logs in their association
CREATE POLICY "audit_logs_select_admin"
  ON audit_logs FOR SELECT
  USING (
    auth.user_role() IN ('admin', 'super_admin') AND
    (user_id IN (
      SELECT id FROM users WHERE association_id = auth.user_association_id()
    ) OR auth.user_role() = 'super_admin')
  );

-- System can insert audit logs (no user restriction)
CREATE POLICY "audit_logs_insert_system"
  ON audit_logs FOR INSERT
  WITH CHECK (TRUE);

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '✅ Row Level Security (RLS) 정책 활성화 완료!';
    RAISE NOTICE '   - 17개 테이블에 RLS 활성화';
    RAISE NOTICE '   - 역할별 접근 권한 정책 적용 (teacher, admin, super_admin, lawyer)';
    RAISE NOTICE '   - 협회별 데이터 격리 정책 적용';
    RAISE NOTICE '   - Service Role Key 사용 시 RLS 자동 우회';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  참고: 현재 서버 사이드에서 Service Role Key를 사용하므로';
    RAISE NOTICE '   RLS 정책이 서버 작업에는 적용되지 않습니다.';
    RAISE NOTICE '   클라이언트 사이드에서 직접 Supabase를 사용할 때만 적용됩니다.';
END $$;
