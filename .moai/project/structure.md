---
id: STRUCTURE-001
version: 1.0.0
status: active
created: 2025-10-01
updated: 2025-10-17
authors: ["@architect", "@user"]
---

# 교권119 Structure Design

## HISTORY

### v1.0.0 (2025-10-17)
- **UPDATE**: 실제 Next.js 아키텍처 및 하이브리드 인증 시스템 반영
- **AUTHOR**: @user
- **SECTIONS**: Architecture, Modules, Integration, Traceability

### v0.1.0 (2025-10-01)
- **INITIAL**: 프로젝트 구조 설계 문서 작성
- **AUTHOR**: @architect
- **SECTIONS**: Architecture, Modules, Integration, Traceability

---

## @DOC:ARCHITECTURE-001 시스템 아키텍처

### 아키텍처 전략

**Next.js 14+ 풀스택 아키텍처**

```
교권119 Architecture
├── Presentation Layer (Frontend)          # React 18 + Next.js 14 App Router
│   ├── app/                              # 페이지 라우팅 및 레이아웃
│   ├── components/                       # 재사용 가능한 UI 컴포넌트
│   └── lib/hooks/                        # 커스텀 React Hooks
│
├── API Layer (Backend)                    # Next.js API Routes
│   ├── app/api/auth/                     # 인증 엔드포인트
│   ├── app/api/admin/                    # 관리자 API
│   ├── app/api/lawyer/                   # 변호사 API
│   ├── app/api/consult/                  # 상담 API
│   └── app/api/community/                # 커뮤니티 API
│
├── Business Logic Layer                   # 서비스 및 도메인 로직
│   ├── lib/auth/                         # 인증 서비스
│   ├── lib/services/                     # 비즈니스 로직
│   └── lib/middleware/                   # 요청 처리 미들웨어
│
└── Data Layer                            # SQLite 데이터베이스
    ├── data/kyokwon119.db               # 메인 DB (사용자, 신고, 커뮤니티)
    └── data/consult.db                  # 상담 전용 DB
```

**선택 이유**:
- **SSR/SSG 지원**: Next.js의 하이브리드 렌더링으로 SEO 및 초기 로딩 최적화
- **API Routes**: 별도 백엔드 서버 없이 풀스택 개발 가능
- **File-based Routing**: App Router 방식의 직관적인 라우팅 구조
- **SQLite**: 경량 DB로 초기 개발 및 배포 용이, 추후 PostgreSQL 마이그레이션 가능
- **TypeScript**: 타입 안전성으로 런타임 에러 최소화

## @DOC:MODULES-001 모듈별 책임 구분

### 1. 인증 모듈 (Authentication Module)

**책임**: 사용자 인증, 세션 관리, 역할 기반 접근 제어

**입력**: 로그인 요청 (이메일, 비밀번호), JWT 토큰

**처리**:
- bcrypt 기반 비밀번호 검증
- JWT 토큰 생성 및 검증
- 세션 동기화 (localStorage + 쿠키)
- 역할별 권한 검증

**출력**: JWT 토큰, 사용자 정보, 권한 검증 결과

| 컴포넌트 | 역할 | 주요 기능 |
|----------|------|-----------|
| `auth-service.ts` | 인증 핵심 로직 | 로그인, 로그아웃, 토큰 검증 |
| `auth-sync.ts` | 세션 동기화 | localStorage-쿠키 동기화, 중복 요청 방지 |
| `jwt.ts` | JWT 관리 | 토큰 생성, 검증, 갱신 |
| `middleware.ts` | 요청 인터셉터 | 자동 인증 검증, 리다이렉션 |

**@TAG 관련**:
- `@SPEC:AUTH-001` - 비밀번호 재설정 및 복구 시스템
- `@SPEC:AUTH-002` - 2FA 인증 시스템
- `@SPEC:AUTH-003` - 세션 관리 시스템
- `@SPEC:AUTH-004` - 계정 잠금 시스템
- `@SPEC:AUTH-005` - 로그인 이력 추적
- `@SPEC:AUTH-006` - 역할 기반 접근 제어
- `@SPEC:AUTH-007` - 소셜 로그인 통합

### 2. 신고 관리 모듈 (Reports Module)

**책임**: 교권 침해 신고 접수, 처리, 상태 관리

**입력**: 신고 작성 데이터 (제목, 내용, 카테고리, 증거자료)

**처리**:
- 신고번호 자동 생성
- 증거 파일 업로드 및 저장
- 신고 상태 변경 관리
- 담당자 배정 로직

**출력**: 신고 접수 확인, 처리 상태, 신고 이력

| 컴포넌트 | 역할 | 주요 기능 |
|----------|------|-----------|
| `report-service.ts` | 신고 비즈니스 로직 | CRUD, 상태 변경, 통계 |
| `report-validator.ts` | 입력 검증 | 필수 필드, 카테고리 검증 |
| `/reports/new` | 신고 작성 페이지 | 폼 UI, 파일 업로드 |
| `/reports` | 신고 목록 페이지 | 목록 조회, 필터링, 상세 보기 |

### 3. 변호사 상담 모듈 (Consultation Module)

**책임**: 상담 매칭, 실시간 메시징, 상담 완료 처리

**입력**: 상담 신청, 변호사 답변, 추가 메시지

**처리**:
- 전문 분야별 변호사 자동 매칭
- 상담 대화 저장 및 조회
- 파일 첨부 및 공유
- 상담 상태 관리 (대기/진행/완료)

**출력**: 상담 매칭 결과, 대화 이력, 상담 통계

| 컴포넌트 | 역할 | 주요 기능 |
|----------|------|-----------|
| `consult-service.ts` | 상담 비즈니스 로직 | 매칭, 메시징, 상태 관리 |
| `lawyer-assignment.ts` | 변호사 배정 | 전문 분야 매칭, 워크로드 균등 |
| `/lawyer` | 변호사 대시보드 | 배정된 상담 목록 |
| `/lawyer/consult/[id]` | 상담 세부 페이지 | 대화 이력, 답변 작성 |

### 4. 커뮤니티 모듈 (Community Module)

**책임**: 게시판 운영, 경험 공유, 댓글 관리

**입력**: 게시물 작성, 댓글, 좋아요

**처리**:
- 게시물 CRUD 작업
- 카테고리별 분류 및 검색
- 익명 게시 처리
- 댓글 및 좋아요 관리

**출력**: 게시물 목록, 게시물 상세, 댓글 목록

| 컴포넌트 | 역할 | 주요 기능 |
|----------|------|-----------|
| `community-service.ts` | 커뮤니티 로직 | CRUD, 검색, 통계 |
| `/community` | 커뮤니티 목록 | 게시물 조회, 필터링 |
| `/community/new` | 글 작성 페이지 | 에디터, 카테고리 선택 |
| `/community/[id]` | 게시물 상세 | 댓글, 좋아요 |

### 5. 관리자 모듈 (Admin Module)

**책임**: 사용자 관리, 협회 관리, 시스템 설정

**입력**: 관리자 명령 (사용자 생성/수정, 협회 관리)

**처리**:
- 사용자 계정 관리 (생성, 수정, 삭제, 역할 변경)
- 협회 생성 및 설정
- 신고 및 상담 모니터링
- 시스템 통계 집계

**출력**: 사용자 목록, 협회 목록, 통계 리포트

| 컴포넌트 | 역할 | 주요 기능 |
|----------|------|-----------|
| `admin-service.ts` | 관리자 로직 | 사용자/협회 관리 |
| `/admin` | 슈퍼관리자 대시보드 | 전체 시스템 현황 |
| `/admin/user-management` | 사용자 관리 | 계정 CRUD, 역할 배정 |
| `/admin/associations` | 협회 관리 | 협회 CRUD, 설정 |
| `/associadmin` | 협회 관리자 대시보드 | 소속 협회 회원 관리 |

## @DOC:INTEGRATION-001 외부 시스템 통합

### 이메일 전송 서비스 연동

**인증 방식**: SMTP 또는 SendGrid API Key

**데이터 교환**:
- **발송 트리거**: 비밀번호 재설정, 상담 알림, 신고 상태 변경
- **템플릿**: HTML 이메일 템플릿
- **첨부파일**: PDF 문서 및 증거 자료

**장애 시 대체**:
- 로컬 큐에 이메일 저장 후 재시도
- 관리자 대시보드에서 실패 이메일 수동 재발송

**위험도**: 중간 (이메일 미발송 시 사용자 알림 부재)

### 파일 저장소 연동 (향후 계획)

**용도**: 증거 자료 및 법률 문서 저장

**의존성 수준**: 현재는 로컬 파일 시스템, 추후 AWS S3 또는 클라우드 스토리지 연동

**성능 요구사항**: 업로드 10MB 이하, 응답시간 3초 이내

### 실시간 알림 시스템 (향후 계획)

**용도**: WebSocket 기반 실시간 알림

**의존성 수준**: 선택적 (폴링 방식으로 대체 가능)

**성능 요구사항**: 메시지 전달 지연 1초 이내

## @DOC:DATABASE-001 데이터베이스 설계

### 메인 데이터베이스 (kyokwon119.db)

#### users 테이블
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL, -- teacher, lawyer, admin, super_admin
  association_id INTEGER,
  school TEXT,
  position TEXT,
  phone TEXT,
  is_verified INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### sessions 테이블
```sql
CREATE TABLE sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

#### reports 테이블
```sql
CREATE TABLE reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL, -- parent_complaint, student_violence, defamation, etc.
  priority TEXT DEFAULT 'normal', -- low, normal, high, urgent
  status TEXT DEFAULT 'received', -- received, reviewing, consulting, completed
  incident_date DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

#### community_posts 테이블
```sql
CREATE TABLE community_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL, -- free, experience, tip, qna
  likes_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### 상담 데이터베이스 (consult.db)

#### consults 테이블
```sql
CREATE TABLE consults (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  lawyer_id INTEGER,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, assigned, in_progress, completed, closed
  priority TEXT DEFAULT 'normal',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### consult_replies 테이블
```sql
CREATE TABLE consult_replies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  consult_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  is_lawyer_reply INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (consult_id) REFERENCES consults(id) ON DELETE CASCADE
);
```

#### lawyers 테이블
```sql
CREATE TABLE lawyers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  license_number TEXT UNIQUE NOT NULL,
  specialties TEXT, -- JSON array of specialties
  experience_years INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

## @DOC:TRACEABILITY-001 추적성 전략

### TAG 체계 적용

**TDD 완벽 정렬**: SPEC → 테스트 → 구현 → 문서
- `@SPEC:ID` (.moai/specs/) → `@TEST:ID` (tests/) → `@CODE:ID` (src/) → `@DOC:ID` (docs/)

**구현 세부사항**: @CODE:ID 내부 주석 레벨
- `@CODE:ID:API` - REST API, GraphQL 엔드포인트
- `@CODE:ID:UI` - 컴포넌트, 뷰, 화면
- `@CODE:ID:DATA` - 데이터 모델, 스키마, 타입
- `@CODE:ID:DOMAIN` - 비즈니스 로직, 도메인 규칙
- `@CODE:ID:INFRA` - 인프라, 데이터베이스, 외부 연동

### TAG 추적성 관리 (코드 스캔 방식)

- **검증 방법**: `/alfred:3-sync` 실행 시 `rg '@(SPEC|TEST|CODE|DOC):' -n`으로 코드 전체 스캔
- **추적 범위**: 프로젝트 전체 소스코드 (.moai/specs/, tests/, src/, docs/)
- **유지 주기**: 코드 변경 시점마다 실시간 검증
- **CODE-FIRST 원칙**: TAG의 진실은 코드 자체에만 존재

### 현재 구현된 TAG 예시

```typescript
// @CODE:AUTH-001 | SPEC: SPEC-AUTH-001.md | 비밀번호 재설정 API
export async function POST(request: Request) {
  // ...
}

// @CODE:AUTH-003 | SPEC: SPEC-AUTH-003.md | 세션 동기화
export class AuthSync {
  // ...
}
```

## Legacy Context

### 기존 시스템 현황

**현재 구현 상태**:

```
교권119 프로젝트/
├── app/                          # Next.js 14 App Router
│   ├── api/                     # API 라우트 (완료)
│   ├── login/                   # 로그인 페이지 (완료)
│   ├── signup/                  # 회원가입 페이지 (완료)
│   ├── teacher/                 # 교사 대시보드 (완료)
│   ├── lawyer/                  # 변호사 대시보드 (완료)
│   ├── admin/                   # 관리자 페이지 (완료)
│   ├── reports/                 # 신고 페이지 (완료)
│   └── community/               # 커뮤니티 (완료)
│
├── components/                   # UI 컴포넌트
│   ├── ui/                      # shadcn/ui 컴포넌트
│   ├── layout/                  # 헤더, 사이드바 (완료)
│   ├── auth/                    # 인증 컴포넌트
│   └── editor/                  # 에디터 (Tiptap)
│
├── lib/                         # 비즈니스 로직
│   ├── auth/                    # 인증 서비스 (완료)
│   ├── db/                      # DB 연결 (완료)
│   ├── services/                # 서비스 레이어 (진행 중)
│   └── middleware/              # 미들웨어 (완료)
│
└── data/                        # SQLite 데이터베이스
    ├── kyokwon119.db           # 메인 DB (운영 중)
    └── consult.db              # 상담 DB (운영 중)
```

### 마이그레이션 고려사항

1. **SQLite → PostgreSQL**: 사용자 증가 시 PostgreSQL로 마이그레이션
2. **로컬 파일 저장소 → S3**: 파일 용량 증가 시 클라우드 스토리지 전환
3. **폴링 방식 알림 → WebSocket**: 실시간 알림 기능 추가
4. **모노리스 → 마이크로서비스**: 트래픽 증가 시 서비스 분리

## TODO:STRUCTURE-001 구조 개선 계획

1. **모듈 간 인터페이스 정의** - 서비스 레이어 타입 정의 및 계약 명확화
2. **의존성 관리 전략** - DI 컨테이너 도입 검토
3. **확장성 확보 방안** - 캐싱 레이어 추가 (Redis 검토)
4. **테스트 커버리지 증대** - 단위 테스트 및 E2E 테스트 확대
5. **API 버전 관리** - API v1, v2 네임스페이스 분리

## EARS 아키텍처 요구사항 작성법

### 구조 설계에서의 EARS 활용

아키텍처와 모듈 설계 시 EARS 구문을 활용하여 명확한 요구사항을 정의하세요:

#### 시스템 아키텍처 EARS 예시
```markdown
### Ubiquitous Requirements (아키텍처 기본 요구사항)
- 시스템은 Next.js App Router 기반 풀스택 아키텍처를 채택해야 한다
- 시스템은 모듈 간 느슨한 결합을 유지해야 한다
- 시스템은 SQLite 이중 DB 구조를 사용해야 한다

### Event-driven Requirements (이벤트 기반 구조)
- WHEN API 호출이 실패하면, 시스템은 에러 로그를 기록하고 사용자에게 알림을 표시해야 한다
- WHEN 데이터베이스 연결이 끊기면, 시스템은 자동 재연결을 시도해야 한다

### State-driven Requirements (상태 기반 구조)
- WHILE 개발 모드일 때, 시스템은 상세한 디버그 정보를 제공해야 한다
- WHILE 프로덕션 모드일 때, 시스템은 에러 스택을 숨기고 일반 메시지만 표시해야 한다

### Optional Features (선택적 구조)
- WHERE 트래픽이 증가하면, 시스템은 Redis 캐싱을 활용할 수 있다
- WHERE 파일 용량이 증가하면, 시스템은 S3 스토리지로 전환할 수 있다

### Constraints (구조적 제약사항)
- 각 모듈의 파일은 300 LOC를 초과하지 않아야 한다
- 함수 복잡도는 10을 초과하지 않아야 한다
- API 응답 시간은 200ms 이내여야 한다
```

---

_이 구조는 `/alfred:2-build` 실행 시 TDD 구현의 가이드라인이 됩니다._
