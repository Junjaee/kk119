# 교권119 시스템 관리자 가이드

## 📋 개요

교권119 시스템의 관리자 기능과 운영 가이드입니다. 4-tier 사용자 시스템(super_admin, admin, lawyer, teacher)의 관리 방법을 다룹니다.

## 🎯 관리자 권한 체계

### 권한 계층 구조

```
🔴 최고관리자 (super_admin)
├── 전체 시스템 관리
├── 모든 협회 및 사용자 관리
├── 시스템 설정 및 보안 정책
└── 데이터베이스 마이그레이션 총괄

🔵 협회관리자 (admin)
├── 소속 협회 내 사용자 관리
├── 협회 내 신고 내역 관리
├── 커뮤니티 모더레이션
└── 변호사 배정 및 상담 관리

🟣 변호사 (lawyer)
├── 법률 상담 제공
├── 신고 건 법적 검토
├── 전문 의견 제시
└── 상담 이력 관리

🟢 교사 (teacher)
├── 신고 접수 및 조회
├── 커뮤니티 참여
├── 변호사 상담 요청
└── 개인 데이터 관리
```

## 🚀 시스템 초기 설정

### 1. Supabase 프로젝트 설정

#### 1-1. 새 프로젝트 생성
```bash
1. https://supabase.com 접속
2. "New Project" 생성
3. 프로젝트명: kyokwon119-prod (또는 원하는 이름)
4. 데이터베이스 비밀번호 설정 (강력한 비밀번호 권장)
5. 지역: Northeast Asia (Seoul)
```

#### 1-2. 데이터베이스 스키마 설정
```sql
-- SQL Editor에서 실행
-- 1. 스키마 생성
\i supabase/schema.sql

-- 2. RLS 정책 적용
\i supabase/rls_policies.sql
```

#### 1-3. 환경 변수 설정
```bash
# .env.local 파일 업데이트
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 2. 기본 협회 및 관리자 계정 설정

#### 2-1. 테스트 계정 생성
```bash
# 계정 생성 스크립트 실행
node scripts/create-test-accounts.js

# 또는 수동으로 Supabase Auth에서 생성 후
# user_profiles 테이블에 프로필 정보 추가
```

#### 2-2. 최고관리자 계정 설정
```sql
-- Supabase SQL Editor에서 실행
UPDATE user_profiles
SET role = 'super_admin', is_verified = true, is_active = true
WHERE email = 'admin@kyokwon119.kr';
```

## 🏢 협회 관리

### 협회 생성 및 관리

#### 새 협회 추가
```sql
INSERT INTO associations (name, description, contact_email, contact_phone, address)
VALUES (
    '서울교사노조',
    '서울특별시 교사들의 권익 보호와 교육 발전을 위한 단체',
    'seoul@teacher-union.kr',
    '02-1234-5678',
    '서울특별시 중구 소월로 100'
);
```

#### 협회 상태 관리
```sql
-- 협회 비활성화
UPDATE associations SET is_active = false WHERE id = 'uuid';

-- 협회 정보 수정
UPDATE associations
SET contact_email = 'new-email@example.com',
    contact_phone = '02-9876-5432'
WHERE id = 'uuid';
```

### 협회 멤버십 관리

#### 사용자를 협회에 추가
```sql
INSERT INTO association_members (user_id, association_id, is_admin, is_active, approved_at, approved_by)
VALUES (
    'user-uuid',
    'association-uuid',
    false,  -- 일반 멤버
    true,   -- 활성화
    now(),  -- 승인 시간
    'approver-uuid'  -- 승인자
);
```

#### 협회 관리자 지정
```sql
UPDATE association_members
SET is_admin = true
WHERE user_id = 'user-uuid' AND association_id = 'association-uuid';
```

## 👥 사용자 관리

### 신규 사용자 승인 프로세스

#### 1. 승인 대기 사용자 조회
```sql
SELECT
    up.id, up.email, up.name, up.role, up.created_at,
    up.school_name, up.employee_id,
    up.license_number, up.law_firm  -- 변호사인 경우
FROM user_profiles up
WHERE up.is_verified = false AND up.is_active = true
ORDER BY up.created_at ASC;
```

#### 2. 사용자 승인/거부
```sql
-- 승인
UPDATE user_profiles
SET is_verified = true, updated_at = now()
WHERE id = 'user-uuid';

-- 거부 (계정 비활성화)
UPDATE user_profiles
SET is_active = false, updated_at = now()
WHERE id = 'user-uuid';
```

#### 3. 역할 변경
```sql
-- 교사를 관리자로 승격
UPDATE user_profiles
SET role = 'admin', updated_at = now()
WHERE id = 'user-uuid';

-- 동시에 협회 관리자 권한 부여
UPDATE association_members
SET is_admin = true
WHERE user_id = 'user-uuid';
```

### 사용자 상태 모니터링

#### 활성 사용자 통계
```sql
SELECT
    role,
    COUNT(*) as total_count,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_count,
    COUNT(CASE WHEN is_verified = true THEN 1 END) as verified_count
FROM user_profiles
GROUP BY role
ORDER BY
    CASE role
        WHEN 'super_admin' THEN 1
        WHEN 'admin' THEN 2
        WHEN 'lawyer' THEN 3
        WHEN 'teacher' THEN 4
    END;
```

#### 최근 가입자 목록
```sql
SELECT
    up.name, up.email, up.role, up.created_at,
    a.name as association_name
FROM user_profiles up
LEFT JOIN association_members am ON up.id = am.user_id AND am.is_active = true
LEFT JOIN associations a ON am.association_id = a.id
WHERE up.created_at > now() - interval '7 days'
ORDER BY up.created_at DESC;
```

## 📋 신고 내역 관리

### 신고 현황 모니터링

#### 전체 신고 통계
```sql
SELECT
    status,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM incident_reports
GROUP BY status
ORDER BY count DESC;
```

#### 긴급도별 미처리 신고
```sql
SELECT
    urgency_level,
    COUNT(*) as pending_count,
    AVG(EXTRACT(DAYS FROM now() - created_at)) as avg_days_pending
FROM incident_reports
WHERE status IN ('submitted', 'investigating')
GROUP BY urgency_level
ORDER BY urgency_level DESC;
```

### 신고 처리 워크플로우

#### 1. 신고 접수 → 조사
```sql
UPDATE incident_reports
SET
    status = 'investigating',
    assigned_lawyer_id = 'lawyer-uuid',
    assigned_at = now(),
    updated_at = now()
WHERE id = 'report-uuid';
```

#### 2. 조사 → 상담
```sql
UPDATE incident_reports
SET status = 'consulting', updated_at = now()
WHERE id = 'report-uuid';
```

#### 3. 상담 → 해결
```sql
UPDATE incident_reports
SET
    status = 'resolved',
    resolved_at = now(),
    updated_at = now()
WHERE id = 'report-uuid';
```

### 변호사 배정 관리

#### 업무량 기반 자동 배정
```sql
WITH lawyer_workload AS (
    SELECT
        up.id,
        up.name,
        COUNT(ir.id) as current_cases
    FROM user_profiles up
    LEFT JOIN incident_reports ir ON up.id = ir.assigned_lawyer_id
        AND ir.status IN ('investigating', 'consulting')
    WHERE up.role = 'lawyer' AND up.is_active = true AND up.is_verified = true
    GROUP BY up.id, up.name
)
SELECT id, name, current_cases
FROM lawyer_workload
ORDER BY current_cases ASC, name ASC
LIMIT 1;
```

## 🛡️ 보안 및 모니터링

### 시스템 보안 설정

#### RLS 정책 확인
```sql
-- 정책 상태 확인
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

#### 권한 없는 접근 시도 모니터링
```sql
-- 실패한 인증 시도 (로그 테이블이 있는 경우)
SELECT
    email,
    attempt_time,
    ip_address,
    user_agent
FROM auth_logs
WHERE success = false
    AND attempt_time > now() - interval '24 hours'
ORDER BY attempt_time DESC;
```

### 데이터 백업 및 복원

#### 정기 백업 설정
```bash
# Supabase CLI를 통한 백업
supabase db dump --db-url $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# 자동화된 백업 스크립트 (cron job)
0 2 * * * /path/to/backup-script.sh
```

#### 복원 절차
```bash
# 백업 파일로부터 복원
psql $DATABASE_URL < backup_20250922_020000.sql
```

## 📊 시스템 성능 모니터링

### 데이터베이스 성능

#### 느린 쿼리 식별
```sql
-- PostgreSQL 느린 쿼리 로그 확인
SELECT
    query,
    calls,
    total_time,
    mean_time,
    rows
FROM pg_stat_statements
WHERE mean_time > 1000  -- 1초 이상
ORDER BY mean_time DESC;
```

#### 테이블 사이즈 모니터링
```sql
SELECT
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats
WHERE schemaname = 'public'
ORDER BY tablename, attname;
```

### 애플리케이션 성능

#### API 응답 시간 모니터링
- Next.js 서버 로그 분석
- Vercel Analytics (배포 시)
- 사용자 보고 기반 성능 이슈 추적

## 🔧 시스템 유지보수

### 정기 점검 체크리스트

#### 주간 점검 (매주 월요일)
- [ ] 새로운 사용자 승인 요청 처리
- [ ] 긴급 신고 건 상태 확인
- [ ] 변호사 업무량 균형 검토
- [ ] 시스템 오류 로그 검토

#### 월간 점검 (매월 1일)
- [ ] 데이터베이스 백업 확인
- [ ] 사용자 활동 통계 리포트 생성
- [ ] 보안 업데이트 적용
- [ ] 성능 최적화 검토

#### 분기별 점검 (분기 마지막 주)
- [ ] 전체 시스템 보안 감사
- [ ] 데이터 정합성 검증
- [ ] 사용자 피드백 수집 및 분석
- [ ] 시스템 업그레이드 계획 수립

### 장애 대응 절차

#### 1. 긴급 상황 분류
```
🔴 Level 1: 시스템 전체 다운
🟠 Level 2: 주요 기능 장애
🟡 Level 3: 일부 기능 오류
🟢 Level 4: 성능 저하
```

#### 2. 대응 절차
```
1. 상황 파악 및 분류
2. 관련 팀원 즉시 알림
3. 임시 해결책 적용
4. 근본 원인 분석
5. 영구 해결책 구현
6. 사후 분석 보고서 작성
```

## 📞 지원 및 연락처

### 기술 지원팀
- **시스템 관리자**: admin@kyokwon119.kr
- **데이터베이스 관리자**: dba@kyokwon119.kr
- **보안 담당자**: security@kyokwon119.kr

### 외부 지원
- **Supabase 지원**: https://supabase.com/support
- **Next.js 커뮤니티**: https://nextjs.org/discord
- **Vercel 지원**: https://vercel.com/support

## 📚 추가 리소스

- [Supabase 관리자 가이드](https://supabase.com/docs/guides/getting-started)
- [PostgreSQL 성능 튜닝](https://wiki.postgresql.org/wiki/Performance_Optimization)
- [Next.js 프로덕션 체크리스트](https://nextjs.org/docs/deployment)
- [보안 모범 사례](./SECURITY_POLICY.md)

---

> **⚠️ 중요**: 이 가이드의 SQL 쿼리를 프로덕션 환경에서 실행하기 전에 반드시 테스트 환경에서 검증하세요.

**최종 업데이트**: 2025년 9월 22일