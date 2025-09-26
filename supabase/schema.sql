-- 교권119 데이터베이스 스키마
-- 4-tier user system: super_admin, admin, lawyer, teacher

-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Drop existing tables if they exist (for development)
drop table if exists public.consultation_comments cascade;
drop table if exists public.consultation_posts cascade;
drop table if exists public.report_comments cascade;
drop table if exists public.community_comments cascade;
drop table if exists public.community_posts cascade;
drop table if exists public.incident_reports cascade;
drop table if exists public.association_members cascade;
drop table if exists public.associations cascade;
drop table if exists public.user_profiles cascade;

-- Custom enum types
create type user_role as enum ('super_admin', 'admin', 'lawyer', 'teacher');
create type incident_status as enum ('submitted', 'investigating', 'consulting', 'resolved', 'closed');
create type consultation_status as enum ('pending', 'assigned', 'in_progress', 'completed');
create type post_category as enum ('general', 'experience', 'advice', 'legal', 'support');

-- 1. 교원단체/협회 테이블
create table public.associations (
  id uuid default uuid_generate_v4() primary key,
  name varchar(100) not null unique,
  description text,
  website varchar(255),
  contact_email varchar(255),
  contact_phone varchar(20),
  address text,
  is_active boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 2. 사용자 프로필 테이블 (Supabase auth.users 확장)
create table public.user_profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email varchar(255) not null unique,
  name varchar(100) not null,
  role user_role not null default 'teacher',
  phone varchar(20),
  school_name varchar(100), -- 교사용
  employee_id varchar(50), -- 교사 ID
  license_number varchar(50), -- 변호사 면허번호
  law_firm varchar(100), -- 변호사 소속 로펌
  specialization text, -- 변호사 전문분야
  is_active boolean default true,
  is_verified boolean default false, -- 관리자 승인 여부
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  last_login timestamp with time zone
);

-- 3. 협회 멤버십 테이블 (사용자-협회 다대다 관계)
create table public.association_members (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.user_profiles(id) on delete cascade,
  association_id uuid references public.associations(id) on delete cascade,
  is_admin boolean default false, -- 해당 협회의 관리자 여부
  joined_at timestamp with time zone default now(),
  approved_at timestamp with time zone,
  approved_by uuid references public.user_profiles(id),
  is_active boolean default true,
  unique(user_id, association_id)
);

-- 4. 신고/사건 접수 테이블
create table public.incident_reports (
  id uuid default uuid_generate_v4() primary key,
  reporter_id uuid references public.user_profiles(id) on delete cascade,
  association_id uuid references public.associations(id), -- 신고자 소속 협회
  title varchar(255) not null,
  content text not null,
  incident_date date,
  incident_location varchar(255),
  witnesses text, -- 목격자 정보
  evidence_files jsonb, -- 증거 파일 목록
  status incident_status default 'submitted',
  urgency_level integer default 1 check (urgency_level between 1 and 5),
  assigned_lawyer_id uuid references public.user_profiles(id),
  assigned_at timestamp with time zone,
  resolved_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 5. 커뮤니티 게시글 테이블
create table public.community_posts (
  id uuid default uuid_generate_v4() primary key,
  author_id uuid references public.user_profiles(id) on delete cascade,
  association_id uuid references public.associations(id), -- 작성자 소속 협회
  title varchar(255) not null,
  content text not null,
  category post_category default 'general',
  is_anonymous boolean default false,
  is_pinned boolean default false,
  view_count integer default 0,
  like_count integer default 0,
  liked_by uuid[] default '{}', -- 좋아요 누른 사용자 ID 배열
  tags varchar(50)[] default '{}',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 6. 커뮤니티 댓글 테이블
create table public.community_comments (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references public.community_posts(id) on delete cascade,
  author_id uuid references public.user_profiles(id) on delete cascade,
  parent_comment_id uuid references public.community_comments(id), -- 대댓글용
  content text not null,
  is_anonymous boolean default false,
  like_count integer default 0,
  liked_by uuid[] default '{}',
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 7. 변호사 상담 게시판 테이블
create table public.consultation_posts (
  id uuid default uuid_generate_v4() primary key,
  client_id uuid references public.user_profiles(id) on delete cascade, -- 상담 요청자
  lawyer_id uuid references public.user_profiles(id), -- 담당 변호사
  association_id uuid references public.associations(id), -- 클라이언트 소속 협회
  related_report_id uuid references public.incident_reports(id), -- 연관된 신고 건
  title varchar(255) not null,
  content text not null,
  status consultation_status default 'pending',
  is_urgent boolean default false,
  consultation_type varchar(50) default 'general', -- general, legal_review, document_review
  scheduled_at timestamp with time zone,
  completed_at timestamp with time zone,
  rating integer check (rating between 1 and 5), -- 상담 만족도
  feedback text, -- 상담 후기
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 8. 상담 댓글/대화 테이블
create table public.consultation_comments (
  id uuid default uuid_generate_v4() primary key,
  consultation_id uuid references public.consultation_posts(id) on delete cascade,
  author_id uuid references public.user_profiles(id) on delete cascade,
  content text not null,
  is_private boolean default false, -- 비공개 메모 (변호사만)
  attachments jsonb, -- 첨부파일 정보
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 9. 신고 진행사항 댓글 테이블
create table public.report_comments (
  id uuid default uuid_generate_v4() primary key,
  report_id uuid references public.incident_reports(id) on delete cascade,
  author_id uuid references public.user_profiles(id) on delete cascade,
  content text not null,
  is_internal boolean default false, -- 내부 메모 (관리자/변호사만)
  attachments jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- 인덱스 생성
create index idx_user_profiles_email on public.user_profiles(email);
create index idx_user_profiles_role on public.user_profiles(role);
create index idx_association_members_user_id on public.association_members(user_id);
create index idx_association_members_association_id on public.association_members(association_id);
create index idx_incident_reports_reporter_id on public.incident_reports(reporter_id);
create index idx_incident_reports_status on public.incident_reports(status);
create index idx_incident_reports_association_id on public.incident_reports(association_id);
create index idx_community_posts_author_id on public.community_posts(author_id);
create index idx_community_posts_category on public.community_posts(category);
create index idx_community_posts_association_id on public.community_posts(association_id);
create index idx_consultation_posts_client_id on public.consultation_posts(client_id);
create index idx_consultation_posts_lawyer_id on public.consultation_posts(lawyer_id);
create index idx_consultation_posts_status on public.consultation_posts(status);

-- Updated_at 트리거 함수
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Updated_at 트리거 적용
create trigger update_associations_updated_at before update on public.associations for each row execute function update_updated_at_column();
create trigger update_user_profiles_updated_at before update on public.user_profiles for each row execute function update_updated_at_column();
create trigger update_incident_reports_updated_at before update on public.incident_reports for each row execute function update_updated_at_column();
create trigger update_community_posts_updated_at before update on public.community_posts for each row execute function update_updated_at_column();
create trigger update_community_comments_updated_at before update on public.community_comments for each row execute function update_updated_at_column();
create trigger update_consultation_posts_updated_at before update on public.consultation_posts for each row execute function update_updated_at_column();
create trigger update_consultation_comments_updated_at before update on public.consultation_comments for each row execute function update_updated_at_column();
create trigger update_report_comments_updated_at before update on public.report_comments for each row execute function update_updated_at_column();

-- 기본 협회 데이터 삽입
insert into public.associations (name, description) values
('전국교직원노동조합', '전교조 - 교육 민주화와 교원의 권익 보호'),
('한국교원단체총연합회', '교총 - 교원의 경제적, 사회적 지위 향상'),
('한국교사노동조합', '한교조 - 교사의 노동권 보호와 교육 개혁'),
('서울특별시교육청교원노조', '서울교원노조 - 서울 지역 교원 권익 보호'),
('경기교사노동조합', '경기교사노조 - 경기 지역 교사 권익 보호');

-- 샘플 슈퍼관리자 계정 (실제 운영 시 수정 필요)
-- 주의: 실제 Supabase Auth에서 먼저 계정을 생성한 후 해당 UUID를 사용해야 함
-- insert into public.user_profiles (id, email, name, role, is_verified) values
-- ('00000000-0000-0000-0000-000000000001', 'admin@kk119.com', '시스템 관리자', 'super_admin', true);