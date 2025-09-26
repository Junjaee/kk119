# 교권119 데이터베이스 스키마 설계

## 개요
4-tier 사용자 시스템을 기반으로 한 교원 권익 보호 플랫폼의 데이터베이스 스키마입니다.

## 사용자 역할 (4-Tier System)
1. **super_admin**: 시스템 전체 관리자
2. **admin**: 협회별 관리자
3. **lawyer**: 변호사 (법적 상담 제공)
4. **teacher**: 교사 (일반 사용자)

## 핵심 테이블 구조

### 1. 사용자 관리
- `user_profiles`: 사용자 기본 정보 및 역할
- `associations`: 교원단체/협회 정보
- `association_members`: 사용자-협회 매핑 (다대다 관계)

### 2. 신고/사건 관리
- `incident_reports`: 교권 침해 신고 접수
- `report_comments`: 신고 진행사항 및 댓글

### 3. 커뮤니티
- `community_posts`: 커뮤니티 게시글
- `community_comments`: 커뮤니티 댓글 (대댓글 지원)

### 4. 변호사 상담
- `consultation_posts`: 법적 상담 요청
- `consultation_comments`: 상담 대화 및 메모

## 주요 특징

### 협회 기반 권한 시스템
- 각 사용자는 하나 이상의 협회에 소속
- 협회별로 관리자(admin) 권한 부여 가능
- 게시판 및 데이터 접근이 협회별로 제한

### 데이터 보안
- Row Level Security (RLS) 정책 적용 예정
- 협회별 데이터 격리
- 역할 기반 접근 제어

### 확장성 고려
- UUID 기본키 사용
- JSONB 타입으로 유연한 데이터 구조
- 인덱스 최적화
- Updated_at 자동 업데이트 트리거

## 다음 단계
1. RLS 정책 구현
2. LocalStorage 데이터 마이그레이션 스크립트 작성
3. API 엔드포인트 개발
4. 권한 매트릭스 구현

## 파일 구조
```
supabase/
├── schema.sql          # 기본 테이블 스키마
├── rls_policies.sql    # Row Level Security 정책 (예정)
├── functions.sql       # 커스텀 데이터베이스 함수 (예정)
└── seed_data.sql       # 샘플 데이터 (예정)
```