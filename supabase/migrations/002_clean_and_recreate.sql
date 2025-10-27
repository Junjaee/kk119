-- =====================================================
-- Clean and Recreate Schema
-- 기존 테이블을 안전하게 삭제하고 재생성
-- =====================================================

-- DROP existing tables in reverse dependency order
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS community_comments CASCADE;
DROP TABLE IF EXISTS community_posts CASCADE;
DROP TABLE IF EXISTS consult_attachments CASCADE;
DROP TABLE IF EXISTS consult_replies CASCADE;
DROP TABLE IF EXISTS consults CASCADE;
DROP TABLE IF EXISTS memberships CASCADE;
DROP TABLE IF EXISTS associations CASCADE;
DROP TABLE IF EXISTS files CASCADE;
DROP TABLE IF EXISTS report_status_history CASCADE;
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS lawyers CASCADE;
DROP TABLE IF EXISTS resources CASCADE;
DROP TABLE IF EXISTS password_reset_tokens CASCADE;
DROP TABLE IF EXISTS verification_tokens CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- DROP functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- =====================================================
-- 1. USERS TABLE
-- =====================================================
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  school TEXT,
  school_code TEXT,
  position TEXT,
  subject TEXT,
  teaching_years INTEGER,
  phone TEXT,
  association TEXT, -- JSON array as TEXT for now
  association_id BIGINT,
  role TEXT DEFAULT 'teacher' CHECK (role IN ('teacher', 'admin', 'super_admin', 'lawyer')),
  is_verified BOOLEAN DEFAULT FALSE,
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP WITH TIME ZONE
);

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_association_id ON users(association_id);
CREATE INDEX idx_users_created_at ON users(created_at);

-- Users updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 2. SESSIONS TABLE
-- =====================================================
CREATE TABLE sessions (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Sessions indexes
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

-- =====================================================
-- 3. VERIFICATION TOKENS TABLE
-- =====================================================
CREATE TABLE verification_tokens (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Verification tokens indexes
CREATE INDEX idx_verification_tokens_token ON verification_tokens(token);
CREATE INDEX idx_verification_tokens_user_id ON verification_tokens(user_id);
CREATE INDEX idx_verification_tokens_expires_at ON verification_tokens(expires_at);

-- =====================================================
-- 4. PASSWORD RESET TOKENS TABLE
-- =====================================================
CREATE TABLE password_reset_tokens (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Password reset tokens indexes
CREATE INDEX idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

-- =====================================================
-- 5. RESOURCES TABLE
-- =====================================================
CREATE TABLE resources (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  uploaded_by BIGINT NOT NULL,
  download_count INTEGER DEFAULT 0,
  is_approved BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Resources indexes
CREATE INDEX idx_resources_category ON resources(category);
CREATE INDEX idx_resources_uploaded_by ON resources(uploaded_by);
CREATE INDEX idx_resources_created_at ON resources(created_at);
CREATE INDEX idx_resources_is_approved ON resources(is_approved);

-- Resources updated_at trigger
CREATE TRIGGER resources_updated_at
    BEFORE UPDATE ON resources
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 6. REPORTS TABLE
-- =====================================================
CREATE TABLE reports (
  id BIGSERIAL PRIMARY KEY,
  report_number TEXT UNIQUE NOT NULL,
  teacher_id BIGINT NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  incident_date DATE NOT NULL,
  location TEXT NOT NULL,
  witness_count INTEGER,
  is_emergency BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'received' CHECK (status IN ('received', 'reviewing', 'in_progress', 'resolved', 'closed', 'cancelled')),
  lawyer_id BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE,
  FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (lawyer_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Reports indexes
CREATE INDEX idx_reports_teacher ON reports(teacher_id);
CREATE INDEX idx_reports_lawyer ON reports(lawyer_id);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_created ON reports(created_at);
CREATE UNIQUE INDEX idx_reports_number ON reports(report_number);
CREATE INDEX idx_reports_is_emergency ON reports(is_emergency);

-- Reports updated_at trigger
CREATE TRIGGER reports_updated_at
    BEFORE UPDATE ON reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 7. REPORT STATUS HISTORY TABLE
-- =====================================================
CREATE TABLE report_status_history (
  id BIGSERIAL PRIMARY KEY,
  report_id BIGINT NOT NULL,
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_by BIGINT NOT NULL,
  changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  note TEXT,
  FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Report status history indexes
CREATE INDEX idx_report_history_report ON report_status_history(report_id);
CREATE INDEX idx_report_history_changed_at ON report_status_history(changed_at);
CREATE INDEX idx_report_history_changed_by ON report_status_history(changed_by);

-- =====================================================
-- 8. FILES TABLE
-- =====================================================
CREATE TABLE files (
  id TEXT PRIMARY KEY, -- UUID or custom ID
  original_filename TEXT NOT NULL,
  stored_filename TEXT UNIQUE NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  file_extension TEXT NOT NULL,
  uploader_id BIGINT NOT NULL,
  report_id BIGINT,
  consult_id BIGINT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP WITH TIME ZONE,
  FOREIGN KEY (uploader_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE
);

-- Files indexes
CREATE INDEX idx_files_uploader ON files(uploader_id);
CREATE INDEX idx_files_report ON files(report_id);
CREATE INDEX idx_files_consult ON files(consult_id);
CREATE UNIQUE INDEX idx_files_stored_filename ON files(stored_filename);
CREATE INDEX idx_files_deleted_at ON files(deleted_at);

-- =====================================================
-- 9. LAWYERS TABLE (from consult.db)
-- =====================================================
CREATE TABLE lawyers (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT UNIQUE,
  name TEXT NOT NULL,
  specialty TEXT NOT NULL,
  license_number TEXT UNIQUE,
  bio TEXT,
  years_of_experience INTEGER,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Lawyers indexes
CREATE INDEX idx_lawyers_user_id ON lawyers(user_id);
CREATE INDEX idx_lawyers_is_verified ON lawyers(is_verified);
CREATE UNIQUE INDEX idx_lawyers_license_number ON lawyers(license_number);

-- Lawyers updated_at trigger
CREATE TRIGGER lawyers_updated_at
    BEFORE UPDATE ON lawyers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 10. CONSULTS TABLE (from consult.db)
-- =====================================================
CREATE TABLE consults (
  id BIGSERIAL PRIMARY KEY,
  report_id BIGINT,
  user_id BIGINT NOT NULL,
  lawyer_id BIGINT,
  title TEXT NOT NULL,
  report_type TEXT NOT NULL,
  report_status TEXT DEFAULT 'pending',
  incident_date DATE NOT NULL,
  report_content TEXT NOT NULL,
  consult_content TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'claimed', 'answered', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  answered_at TIMESTAMP WITH TIME ZONE,
  claimed_at TIMESTAMP WITH TIME ZONE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (lawyer_id) REFERENCES lawyers(id) ON DELETE SET NULL,
  FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE SET NULL
);

-- Consults indexes
CREATE INDEX idx_consults_user_id ON consults(user_id);
CREATE INDEX idx_consults_lawyer_id ON consults(lawyer_id);
CREATE INDEX idx_consults_status ON consults(status);
CREATE INDEX idx_consults_report_id ON consults(report_id);
CREATE INDEX idx_consults_created_at ON consults(created_at);

-- Consults updated_at trigger
CREATE TRIGGER consults_updated_at
    BEFORE UPDATE ON consults
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 11. CONSULT REPLIES TABLE
-- =====================================================
CREATE TABLE consult_replies (
  id BIGSERIAL PRIMARY KEY,
  consult_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  is_lawyer BOOLEAN DEFAULT FALSE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (consult_id) REFERENCES consults(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Consult replies indexes
CREATE INDEX idx_consult_replies_consult_id ON consult_replies(consult_id);
CREATE INDEX idx_consult_replies_user_id ON consult_replies(user_id);
CREATE INDEX idx_consult_replies_created_at ON consult_replies(created_at);

-- =====================================================
-- 12. CONSULT ATTACHMENTS TABLE
-- =====================================================
CREATE TABLE consult_attachments (
  id BIGSERIAL PRIMARY KEY,
  consult_id BIGINT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (consult_id) REFERENCES consults(id) ON DELETE CASCADE
);

-- Consult attachments indexes
CREATE INDEX idx_consult_attachments_consult_id ON consult_attachments(consult_id);

-- =====================================================
-- 13. ASSOCIATIONS TABLE (moved before memberships)
-- =====================================================
CREATE TABLE associations (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  region TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Associations indexes
CREATE INDEX idx_associations_name ON associations(name);
CREATE INDEX idx_associations_region ON associations(region);

-- Associations updated_at trigger
CREATE TRIGGER associations_updated_at
    BEFORE UPDATE ON associations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 14. MEMBERSHIPS TABLE
-- =====================================================
CREATE TABLE memberships (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL UNIQUE,
  association_id BIGINT NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'admin')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (association_id) REFERENCES associations(id) ON DELETE CASCADE
);

-- Memberships indexes
CREATE INDEX idx_memberships_user_id ON memberships(user_id);
CREATE INDEX idx_memberships_association_id ON memberships(association_id);

-- =====================================================
-- 15. COMMUNITY POSTS TABLE (from localStorage)
-- =====================================================
CREATE TABLE community_posts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author TEXT NOT NULL,
  author_id TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('notice', 'experience', 'question', 'tip')),
  likes INTEGER DEFAULT 0,
  liked_by TEXT[] DEFAULT '{}', -- PostgreSQL array of user IDs
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Community posts indexes
CREATE INDEX idx_community_posts_author_id ON community_posts(author_id);
CREATE INDEX idx_community_posts_category ON community_posts(category);
CREATE INDEX idx_community_posts_created_at ON community_posts(created_at);

-- Community posts updated_at trigger
CREATE TRIGGER community_posts_updated_at
    BEFORE UPDATE ON community_posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 16. COMMUNITY COMMENTS TABLE (from localStorage)
-- =====================================================
CREATE TABLE community_comments (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL,
  content TEXT NOT NULL,
  author TEXT NOT NULL,
  author_id TEXT NOT NULL,
  parent_comment_id TEXT, -- For nested replies
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE,
  FOREIGN KEY (parent_comment_id) REFERENCES community_comments(id) ON DELETE CASCADE
);

-- Community comments indexes
CREATE INDEX idx_community_comments_post_id ON community_comments(post_id);
CREATE INDEX idx_community_comments_author_id ON community_comments(author_id);
CREATE INDEX idx_community_comments_parent_id ON community_comments(parent_comment_id);
CREATE INDEX idx_community_comments_created_at ON community_comments(created_at);

-- =====================================================
-- 17. AUDIT LOGS TABLE
-- =====================================================
CREATE TABLE audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Audit logs indexes
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource_type ON audit_logs(resource_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_details ON audit_logs USING GIN (details);

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '✅ Kyokwon119 스키마 재생성 완료!';
    RAISE NOTICE '   - 기존 테이블 삭제 완료';
    RAISE NOTICE '   - 총 17개 테이블 생성';
    RAISE NOTICE '   - 모든 인덱스 및 제약조건 적용';
    RAISE NOTICE '   - updated_at 자동 업데이트 트리거 설정';
END $$;
