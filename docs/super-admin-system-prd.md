# 슈퍼어드민 시스템 PRD (Product Requirements Document)

## 1. 프로젝트 개요

### 1.1 목적
교육자 플랫폼에 4단계 사용자 계층 시스템을 도입하여 효율적인 사용자 관리, 협회 관리, 및 권한 기반 콘텐츠 접근 제어를 구현한다.

### 1.2 범위
- 슈퍼어드민 계정을 통한 전체 시스템 관리
- 관리자 및 변호사 계정 생성/관리
- 협회 생성 및 관리
- 협회별 게시판 권한 설정
- 사용자 역할 기반 접근 제어

### 1.3 대상 사용자
- **슈퍼어드민**: 시스템 전체 관리자 (1명)
- **관리자**: 협회별 관리자 (협회당 다수)
- **변호사**: 법률 상담 제공자 (다수)
- **교사**: 일반 사용자 (다수)

## 2. 사용자 역할 및 권한 체계

### 2.1 슈퍼어드민 (Super Admin)
**권한:**
- 관리자 계정 생성/수정/삭제
- 변호사 계정 생성/수정/삭제
- 협회 생성/수정/삭제
- 협회별 게시판 접근 권한 설정
- 전체 시스템 설정 관리
- 모든 데이터 접근 및 관리

**접근 가능 페이지:**
- `/super-admin` - 슈퍼어드민 대시보드
- `/super-admin/accounts` - 계정 관리
- `/super-admin/associations` - 협회 관리
- `/super-admin/board-permissions` - 게시판 권한 관리
- 모든 기존 페이지

### 2.2 관리자 (Admin)
**권한:**
- 소속 협회 교사들의 회원 인증/승인
- 소속 협회 게시판 관리
- 소속 협회 교사 목록 조회
- 소속 협회 관련 보고서 관리

**접근 가능 페이지:**
- `/admin` - 관리자 대시보드
- `/admin/member-verification` - 회원 인증 관리
- `/admin/association-board` - 협회 게시판 관리
- 기본 공용 페이지

### 2.3 변호사 (Lawyer)
**권한:**
- 법률 상담 제공
- 상담 이력 관리
- 법률 리소스 업로드/관리

**접근 가능 페이지:**
- `/lawyer` - 변호사 대시보드
- `/lawyer/consultations` - 상담 관리
- `/lawyer/resources` - 법률 리소스 관리
- 기본 공용 페이지

### 2.4 교사 (Teacher)
**권한:**
- 개인 회원가입/로그인
- 협회별 게시판 접근 (인증된 경우)
- 법률 상담 신청
- 보고서 작성/조회
- 리소스 다운로드

**접근 가능 페이지:**
- 기존 모든 일반 사용자 페이지
- 협회별 제한된 게시판 (인증 후)

## 3. 핵심 기능 상세

### 3.1 슈퍼어드민 대시보드

#### 3.1.1 계정 관리 시스템
**관리자 계정 생성:**
```
- 이름 (필수)
- 이메일 (필수, 로그인 ID)
- 임시 비밀번호 자동 생성
- 소속 협회 선택 (필수)
- 권한 레벨 설정
- 연락처
- 계정 상태 (활성/비활성)
```

**변호사 계정 생성:**
```
- 이름 (필수)
- 이메일 (필수, 로그인 ID)
- 임시 비밀번호 자동 생성
- 변호사 등록번호
- 전문 분야 (복수 선택 가능)
- 경력
- 연락처
- 계정 상태 (활성/비활성)
```

#### 3.1.2 협회 관리 시스템
**협회 생성:**
```
- 협회명 (필수)
- 협회 코드 (자동 생성)
- 설명
- 주소
- 연락처
- 웹사이트
- 설립일
- 상태 (활성/비활성)
```

#### 3.1.3 게시판 권한 관리
**협회별 게시판 설정:**
```
- 기본 게시판 (모든 사용자 접근)
  ├── 공지사항
  ├── 자유게시판
  ├── 법률상담
  └── 자료실

- 협회별 제한 게시판
  ├── 협회 공지사항
  ├── 협회 회원 전용 게시판
  ├── 협회별 자료실
  └── 협회 내부 소통
```

### 3.2 협회 회원 인증 시스템

#### 3.2.1 교사 회원가입 프로세스
1. 기본 정보 입력
2. 소속 협회 선택 (슈퍼어드민이 생성한 협회 목록에서)
3. 협회 회원임을 증명할 수 있는 정보 입력
4. 관리자 승인 대기 상태
5. 협회 관리자의 승인/거부
6. 승인 시 협회 전용 게시판 접근 권한 부여

#### 3.2.2 관리자 승인 프로세스
- 대기 중인 회원 신청 목록 조회
- 신청자 정보 상세 보기
- 승인/거부 처리
- 승인 사유/거부 사유 입력
- 자동 이메일 알림 발송

## 4. 데이터베이스 스키마

### 4.1 사용자 관련 테이블

#### users 테이블 확장
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role ENUM('super_admin', 'admin', 'lawyer', 'teacher') NOT NULL,
    status ENUM('active', 'inactive', 'pending') DEFAULT 'active',
    association_id INTEGER NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (association_id) REFERENCES associations(id)
);
```

#### admins 테이블 (관리자 추가 정보)
```sql
CREATE TABLE admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    association_id INTEGER NOT NULL,
    permissions TEXT, -- JSON 형태로 권한 저장
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (association_id) REFERENCES associations(id)
);
```

#### lawyers 테이블 (변호사 추가 정보)
```sql
CREATE TABLE lawyers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    license_number VARCHAR(50),
    specialties TEXT, -- JSON 배열
    experience_years INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### 4.2 협회 관련 테이블

#### associations 테이블
```sql
CREATE TABLE associations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    established_date DATE,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### association_members 테이블 (협회 회원 관리)
```sql
CREATE TABLE association_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    association_id INTEGER NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    approved_by INTEGER NULL,
    approved_at DATETIME NULL,
    rejection_reason TEXT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (association_id) REFERENCES associations(id),
    FOREIGN KEY (approved_by) REFERENCES users(id)
);
```

### 4.3 게시판 권한 관리

#### board_categories 테이블
```sql
CREATE TABLE board_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_association_restricted BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### association_board_permissions 테이블
```sql
CREATE TABLE association_board_permissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    association_id INTEGER NOT NULL,
    board_category_id INTEGER NOT NULL,
    is_accessible BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (association_id) REFERENCES associations(id),
    FOREIGN KEY (board_category_id) REFERENCES board_categories(id)
);
```

## 5. UI/UX 요구사항

### 5.1 슈퍼어드민 대시보드 레이아웃

#### 5.1.1 메인 네비게이션
```
┌─────────────────────────────────────────────────────┐
│ 슈퍼어드민 대시보드                                    │
├─────────────────────────────────────────────────────┤
│ [대시보드] [계정관리] [협회관리] [게시판권한] [로그아웃] │
└─────────────────────────────────────────────────────┘
```

#### 5.1.2 계정 관리 페이지
```
┌─────────────────────────────────────────────────────┐
│ 계정 관리                              [+ 새 계정]    │
├─────────────────────────────────────────────────────┤
│ [관리자] [변호사] 탭                                  │
├─────────────────────────────────────────────────────┤
│ 검색: [____] [소속협회▼] [상태▼] [검색]              │
├─────────────────────────────────────────────────────┤
│ ┌───┬────────┬─────────┬────────┬────────┬──────┐ │
│ │선택│이름      │이메일    │소속협회  │상태    │액션  │ │
│ ├───┼────────┼─────────┼────────┼────────┼──────┤ │
│ │☐ │김관리자   │admin@.. │서울교사협│활성    │[수정]│ │
│ └───┴────────┴─────────┴────────┴────────┴──────┘ │
└─────────────────────────────────────────────────────┘
```

#### 5.1.3 협회 관리 페이지
```
┌─────────────────────────────────────────────────────┐
│ 협회 관리                              [+ 새 협회]    │
├─────────────────────────────────────────────────────┤
│ ┌───┬────────┬─────────┬────────┬──────┬──────┐    │
│ │선택│협회명    │협회코드  │회원수   │상태   │액션  │    │
│ ├───┼────────┼─────────┼────────┼──────┼──────┤    │
│ │☐ │서울교사협회│SEOUL001│120명   │활성  │[수정]│    │
│ │☐ │부산교사협회│BUSAN001│85명    │활성  │[수정]│    │
│ └───┴────────┴─────────┴────────┴──────┴──────┘    │
└─────────────────────────────────────────────────────┘
```

### 5.2 계정 생성 모달

#### 5.2.1 관리자 계정 생성
```
┌─────────────────────────────────────────────────────┐
│ 새 관리자 계정 생성                           [X]     │
├─────────────────────────────────────────────────────┤
│ 이름: [________________]                            │
│ 이메일: [________________]                          │
│ 소속협회: [서울교사협회 ▼]                          │
│ 연락처: [________________]                          │
│ 권한 레벨: [고급관리자 ▼]                           │
│                                                     │
│ ※ 임시 비밀번호가 자동 생성되어 이메일로 발송됩니다    │
│                                                     │
│                        [취소] [계정 생성]            │
└─────────────────────────────────────────────────────┘
```

#### 5.2.2 변호사 계정 생성
```
┌─────────────────────────────────────────────────────┐
│ 새 변호사 계정 생성                           [X]     │
├─────────────────────────────────────────────────────┤
│ 이름: [________________]                            │
│ 이메일: [________________]                          │
│ 변호사 등록번호: [________________]                  │
│ 경력 (년): [____]                                   │
│ 전문분야: [☐교육법] [☐노동법] [☐민사] [☐형사]        │
│ 연락처: [________________]                          │
│                                                     │
│ ※ 임시 비밀번호가 자동 생성되어 이메일로 발송됩니다    │
│                                                     │
│                        [취소] [계정 생성]            │
└─────────────────────────────────────────────────────┘
```

### 5.3 협회 생성/편집 모달
```
┌─────────────────────────────────────────────────────┐
│ 새 협회 생성                                 [X]     │
├─────────────────────────────────────────────────────┤
│ 협회명: [________________]                          │
│ 설명: [________________________________]            │
│      [________________________________]            │
│ 주소: [_________________________________]           │
│ 연락처: [________________]                          │
│ 이메일: [________________]                          │
│ 웹사이트: [________________]                        │
│ 설립일: [____/__/__]                               │
│                                                     │
│                        [취소] [협회 생성]            │
└─────────────────────────────────────────────────────┘
```

## 6. 기능별 상세 명세

### 6.1 인증 및 로그인 시스템

#### 6.1.1 로그인 프로세스 확장
1. 기존 로그인 폼 유지
2. 사용자 role 확인 후 리다이렉트
   - `super_admin` → `/super-admin`
   - `admin` → `/admin`
   - `lawyer` → `/lawyer`
   - `teacher` → `/` (기존 홈페이지)

#### 6.1.2 최초 로그인 처리
- 관리자/변호사 최초 로그인 시 비밀번호 변경 강제
- 2단계 인증 설정 권장

### 6.2 회원 승인 시스템

#### 6.2.1 교사 회원가입 확장
```javascript
// 회원가입 폼에 추가될 필드
{
  association_id: number, // 소속 협회 선택
  membership_proof: string, // 협회 회원임을 증명하는 정보
  teacher_id: string, // 교사 ID 또는 증명서 번호
}
```

#### 6.2.2 관리자 승인 대시보드
- 대기 중인 승인 요청 목록
- 신청자 상세 정보 조회
- 일괄 승인/거부 기능
- 승인 이력 관리

### 6.3 게시판 권한 시스템

#### 6.3.1 기본 게시판 구조
```
공개 게시판 (모든 사용자)
├── 공지사항
├── 자유게시판
├── 법률상담
└── 자료실

협회 제한 게시판 (인증된 협회 회원만)
├── 협회 공지사항
├── 협회 전용 게시판
├── 협회 자료실
└── 내부 소통
```

#### 6.3.2 권한 확인 로직
```javascript
function checkBoardAccess(userId, boardId) {
  const user = getUserById(userId);
  const board = getBoardById(boardId);

  if (!board.is_association_restricted) {
    return true; // 공개 게시판
  }

  if (user.role === 'super_admin') {
    return true; // 슈퍼어드민은 모든 접근 가능
  }

  if (user.role === 'teacher') {
    return checkAssociationMembership(userId, user.association_id);
  }

  return false;
}
```

## 7. 기술적 구현 사항

### 7.1 보안 요구사항
- 역할 기반 접근 제어 (RBAC) 구현
- 세션 기반 인증 강화
- API 엔드포인트별 권한 검증
- 비밀번호 정책 강화 (관리자/변호사)
- 감사 로그 구현 (슈퍼어드민 활동 기록)

### 7.2 API 엔드포인트 설계

#### 7.2.1 슈퍼어드민 API
```
POST /api/super-admin/accounts/admin    # 관리자 계정 생성
POST /api/super-admin/accounts/lawyer   # 변호사 계정 생성
PUT  /api/super-admin/accounts/:id      # 계정 수정
DELETE /api/super-admin/accounts/:id    # 계정 삭제

POST /api/super-admin/associations      # 협회 생성
PUT  /api/super-admin/associations/:id  # 협회 수정
DELETE /api/super-admin/associations/:id # 협회 삭제

GET  /api/super-admin/board-permissions # 게시판 권한 조회
PUT  /api/super-admin/board-permissions # 게시판 권한 업데이트
```

#### 7.2.2 관리자 API
```
GET  /api/admin/pending-approvals       # 승인 대기 목록
POST /api/admin/approve-member/:id      # 회원 승인
POST /api/admin/reject-member/:id       # 회원 거부
GET  /api/admin/association-members     # 협회 회원 목록
```

### 7.3 미들웨어 구현
```javascript
// 역할 기반 라우트 보호
function requireRole(roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    next();
  };
}

// 사용 예시
app.get('/api/super-admin/*', requireRole(['super_admin']));
app.get('/api/admin/*', requireRole(['super_admin', 'admin']));
```

## 8. 테스트 계획

### 8.1 단위 테스트
- 사용자 역할 검증 함수
- 권한 확인 로직
- 데이터베이스 쿼리 함수

### 8.2 통합 테스트
- 로그인 후 역할별 리다이렉트
- 회원 승인 프로세스
- 게시판 접근 권한 확인

### 8.3 사용자 테스트
- 슈퍼어드민 계정 생성 플로우
- 관리자 회원 승인 프로세스
- 협회 회원의 제한 게시판 접근

## 9. 배포 및 마이그레이션

### 9.1 데이터베이스 마이그레이션
1. 기존 사용자 테이블에 role 컬럼 추가
2. 새로운 테이블들 생성
3. 기존 데이터의 role을 'teacher'로 설정
4. 첫 번째 슈퍼어드민 계정 생성

### 9.2 배포 순서
1. 데이터베이스 스키마 업데이트
2. 백엔드 API 배포
3. 프론트엔드 UI 배포
4. 슈퍼어드민 계정 생성 및 테스트

## 10. 성공 지표

### 10.1 기능적 지표
- 슈퍼어드민이 관리자/변호사 계정 생성 가능
- 관리자가 회원 승인 처리 가능
- 협회별 게시판 접근 제어 정상 작동
- 역할별 대시보드 접근 제어 정상 작동

### 10.2 비기능적 지표
- 로그인 후 3초 이내 적절한 대시보드 이동
- 계정 생성 시 30초 이내 이메일 발송
- 보안 취약점 0건 유지

---

이 PRD는 슈퍼어드민 시스템의 완전한 구현 가이드라인을 제공하며, 개발팀이 단계별로 구현할 수 있도록 상세한 명세를 포함하고 있습니다.