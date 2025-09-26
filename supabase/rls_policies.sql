-- Row Level Security (RLS) 정책
-- 4-tier 사용자 시스템 및 협회 기반 권한 제어

-- RLS 활성화
alter table public.user_profiles enable row level security;
alter table public.associations enable row level security;
alter table public.association_members enable row level security;
alter table public.incident_reports enable row level security;
alter table public.community_posts enable row level security;
alter table public.community_comments enable row level security;
alter table public.consultation_posts enable row level security;
alter table public.consultation_comments enable row level security;
alter table public.report_comments enable row level security;

-- 헬퍼 함수들
create or replace function auth.current_user_id()
returns uuid
language sql
security definer
as $$
  select auth.uid();
$$;

create or replace function public.get_user_role()
returns text
language sql
security definer
as $$
  select role::text from public.user_profiles where id = auth.uid();
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
security definer
as $$
  select exists(
    select 1 from public.user_profiles
    where id = auth.uid() and role = 'super_admin'
  );
$$;

create or replace function public.is_association_admin(association_id uuid)
returns boolean
language sql
security definer
as $$
  select exists(
    select 1 from public.association_members
    where user_id = auth.uid()
      and association_id = $1
      and is_admin = true
      and is_active = true
  );
$$;

create or replace function public.is_association_member(association_id uuid)
returns boolean
language sql
security definer
as $$
  select exists(
    select 1 from public.association_members
    where user_id = auth.uid()
      and association_id = $1
      and is_active = true
  );
$$;

create or replace function public.get_user_associations()
returns uuid[]
language sql
security definer
as $$
  select array_agg(association_id) from public.association_members
  where user_id = auth.uid() and is_active = true;
$$;

-- 1. USER_PROFILES 정책
-- 모든 사용자는 자신의 프로필 조회 가능
create policy "Users can view own profile"
  on public.user_profiles for select
  using (auth.uid() = id);

-- 사용자는 자신의 프로필 업데이트 가능 (role 제외)
create policy "Users can update own profile"
  on public.user_profiles for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id and
    role = (select role from public.user_profiles where id = auth.uid())
  );

-- Super admin은 모든 프로필 조회/수정 가능
create policy "Super admin can manage all profiles"
  on public.user_profiles for all
  using (public.is_super_admin());

-- Admin은 자신의 협회 멤버들 조회 가능
create policy "Admin can view association members"
  on public.user_profiles for select
  using (
    exists(
      select 1 from public.association_members am1, public.association_members am2
      where am1.user_id = auth.uid()
        and am1.is_admin = true
        and am1.is_active = true
        and am2.user_id = public.user_profiles.id
        and am1.association_id = am2.association_id
        and am2.is_active = true
    )
  );

-- 2. ASSOCIATIONS 정책
-- 모든 인증된 사용자는 협회 목록 조회 가능
create policy "Authenticated users can view associations"
  on public.associations for select
  using (auth.role() = 'authenticated');

-- Super admin만 협회 생성/수정/삭제 가능
create policy "Super admin can manage associations"
  on public.associations for all
  using (public.is_super_admin());

-- 3. ASSOCIATION_MEMBERS 정책
-- 사용자는 자신의 멤버십 정보 조회 가능
create policy "Users can view own memberships"
  on public.association_members for select
  using (auth.uid() = user_id);

-- Admin은 자신의 협회 멤버들 조회 가능
create policy "Admin can view association members"
  on public.association_members for select
  using (public.is_association_admin(association_id));

-- Super admin과 협회 admin은 멤버십 관리 가능
create policy "Admin can manage association memberships"
  on public.association_members for all
  using (
    public.is_super_admin() or
    public.is_association_admin(association_id)
  );

-- 사용자는 협회 가입 신청 가능
create policy "Users can apply for membership"
  on public.association_members for insert
  with check (auth.uid() = user_id);

-- 4. INCIDENT_REPORTS 정책
-- 신고자는 자신의 신고 조회 가능
create policy "Users can view own reports"
  on public.incident_reports for select
  using (auth.uid() = reporter_id);

-- 같은 협회 admin/lawyer는 해당 협회 신고 조회 가능
create policy "Association staff can view association reports"
  on public.incident_reports for select
  using (
    public.is_super_admin() or
    (public.is_association_member(association_id) and
     public.get_user_role() in ('admin', 'lawyer'))
  );

-- 교사는 신고 작성 가능
create policy "Teachers can create reports"
  on public.incident_reports for insert
  with check (
    auth.uid() = reporter_id and
    public.get_user_role() = 'teacher'
  );

-- 신고자는 자신의 신고 수정 가능 (제출 후 24시간 내)
create policy "Users can update own recent reports"
  on public.incident_reports for update
  using (
    auth.uid() = reporter_id and
    created_at > now() - interval '24 hours'
  );

-- Admin/lawyer는 협회 신고 상태 업데이트 가능
create policy "Association staff can update report status"
  on public.incident_reports for update
  using (
    public.is_super_admin() or
    (public.is_association_member(association_id) and
     public.get_user_role() in ('admin', 'lawyer'))
  );

-- 5. COMMUNITY_POSTS 정책
-- 같은 협회 멤버들만 게시글 조회 가능
create policy "Association members can view posts"
  on public.community_posts for select
  using (
    public.is_super_admin() or
    public.is_association_member(association_id)
  );

-- 협회 멤버는 게시글 작성 가능
create policy "Association members can create posts"
  on public.community_posts for insert
  with check (
    public.is_association_member(association_id) and
    auth.uid() = author_id
  );

-- 작성자는 자신의 게시글 수정/삭제 가능
create policy "Authors can update own posts"
  on public.community_posts for update
  using (auth.uid() = author_id);

create policy "Authors can delete own posts"
  on public.community_posts for delete
  using (auth.uid() = author_id);

-- Admin은 협회 게시글 관리 가능
create policy "Admin can manage association posts"
  on public.community_posts for all
  using (
    public.is_super_admin() or
    public.is_association_admin(association_id)
  );

-- 6. COMMUNITY_COMMENTS 정책
-- 게시글을 볼 수 있는 사용자는 댓글도 조회 가능
create policy "Users can view comments on accessible posts"
  on public.community_comments for select
  using (
    exists(
      select 1 from public.community_posts cp
      where cp.id = post_id and (
        public.is_super_admin() or
        public.is_association_member(cp.association_id)
      )
    )
  );

-- 게시글을 볼 수 있는 사용자는 댓글 작성 가능
create policy "Users can create comments on accessible posts"
  on public.community_comments for insert
  with check (
    auth.uid() = author_id and
    exists(
      select 1 from public.community_posts cp
      where cp.id = post_id and (
        public.is_super_admin() or
        public.is_association_member(cp.association_id)
      )
    )
  );

-- 댓글 작성자는 자신의 댓글 수정/삭제 가능
create policy "Authors can update own comments"
  on public.community_comments for update
  using (auth.uid() = author_id);

create policy "Authors can delete own comments"
  on public.community_comments for delete
  using (auth.uid() = author_id);

-- 7. CONSULTATION_POSTS 정책
-- 상담 요청자와 담당 변호사는 상담 조회 가능
create policy "Consultation participants can view"
  on public.consultation_posts for select
  using (
    public.is_super_admin() or
    auth.uid() = client_id or
    auth.uid() = lawyer_id or
    (public.is_association_member(association_id) and
     public.get_user_role() in ('admin', 'lawyer'))
  );

-- 교사는 상담 요청 생성 가능
create policy "Teachers can create consultation requests"
  on public.consultation_posts for insert
  with check (
    auth.uid() = client_id and
    public.get_user_role() = 'teacher'
  );

-- 상담 요청자는 자신의 요청 수정 가능
create policy "Clients can update own consultations"
  on public.consultation_posts for update
  using (auth.uid() = client_id);

-- 변호사와 admin은 상담 상태 업데이트 가능
create policy "Lawyers can update consultation status"
  on public.consultation_posts for update
  using (
    public.is_super_admin() or
    auth.uid() = lawyer_id or
    (public.is_association_member(association_id) and
     public.get_user_role() in ('admin', 'lawyer'))
  );

-- 8. CONSULTATION_COMMENTS 정책
-- 상담 참여자들은 댓글 조회 가능
create policy "Consultation participants can view comments"
  on public.consultation_comments for select
  using (
    exists(
      select 1 from public.consultation_posts cp
      where cp.id = consultation_id and (
        public.is_super_admin() or
        auth.uid() = cp.client_id or
        auth.uid() = cp.lawyer_id or
        (public.is_association_member(cp.association_id) and
         public.get_user_role() in ('admin', 'lawyer'))
      )
    )
  );

-- 상담 참여자들은 댓글 작성 가능
create policy "Consultation participants can create comments"
  on public.consultation_comments for insert
  with check (
    auth.uid() = author_id and
    exists(
      select 1 from public.consultation_posts cp
      where cp.id = consultation_id and (
        public.is_super_admin() or
        auth.uid() = cp.client_id or
        auth.uid() = cp.lawyer_id or
        (public.is_association_member(cp.association_id) and
         public.get_user_role() in ('admin', 'lawyer'))
      )
    )
  );

-- 9. REPORT_COMMENTS 정책
-- 신고 관련자들은 댓글 조회 가능
create policy "Report participants can view comments"
  on public.report_comments for select
  using (
    exists(
      select 1 from public.incident_reports ir
      where ir.id = report_id and (
        public.is_super_admin() or
        auth.uid() = ir.reporter_id or
        (public.is_association_member(ir.association_id) and
         public.get_user_role() in ('admin', 'lawyer'))
      )
    )
  );

-- 신고 관련자들은 댓글 작성 가능
create policy "Report participants can create comments"
  on public.report_comments for insert
  with check (
    auth.uid() = author_id and
    exists(
      select 1 from public.incident_reports ir
      where ir.id = report_id and (
        public.is_super_admin() or
        auth.uid() = ir.reporter_id or
        (public.is_association_member(ir.association_id) and
         public.get_user_role() in ('admin', 'lawyer'))
      )
    )
  );

-- 실시간 알림용 함수 (선택사항)
create or replace function public.notify_new_report()
returns trigger
language plpgsql
security definer
as $$
begin
  -- 새 신고 알림 로직 (추후 구현)
  perform pg_notify(
    'new_report',
    json_build_object(
      'report_id', new.id,
      'association_id', new.association_id,
      'reporter_id', new.reporter_id,
      'title', new.title
    )::text
  );
  return new;
end;
$$;

-- 신고 생성 시 알림 트리거
create trigger notify_new_report_trigger
  after insert on public.incident_reports
  for each row execute function public.notify_new_report();