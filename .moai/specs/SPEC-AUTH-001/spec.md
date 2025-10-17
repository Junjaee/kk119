---
id: AUTH-001
version: 0.0.1
status: draft
created: 2025-10-17
updated: 2025-10-17
author: @user
priority: critical
category: security
labels:
  - password-reset
  - email
  - token-management
  - security
scope:
  packages:
    - lib/auth
    - app/api/auth
  files:
    - password-reset-service.ts
    - email-service.ts
    - token-manager.ts
---

# SPEC-AUTH-001: 비밀번호 재설정 및 복구 시스템

## @TAG:AUTH-001 TAG BLOCK

**SPEC ID**: AUTH-001
**Title**: 비밀번호 재설정 및 복구 시스템
**Priority**: CRITICAL
**Status**: Draft (v0.0.1)

### TAG Chain
- **Parent**: N/A (독립 SPEC)
- **Depends On**: N/A
- **Blocks**: AUTH-002 (2FA는 비밀번호 재설정 후 설정 가능)
- **Related**: AUTH-004 (계정 잠금 해제 시 비밀번호 재설정 연계)

---

## HISTORY

### v0.0.1 (2025-10-17)
- **INITIAL**: 비밀번호 재설정 및 복구 시스템 SPEC 작성
- **AUTHOR**: @user
- **SECTIONS**: Environment, Assumptions, Requirements, Specifications, Traceability

---

## Environment (환경 및 전제 조건)

### 시스템 환경
- **프레임워크**: Next.js 14+ (App Router)
- **인증**: JWT 기반 세션 관리
- **데이터베이스**: SQLite (users, password_reset_tokens, password_history 테이블)
- **이메일**: SMTP 또는 이메일 전송 서비스 (예: SendGrid, Nodemailer)
- **암호화**: bcrypt (비밀번호 해싱), crypto (토큰 생성)

### 기존 시스템 통합
- 현재 JWT 기반 로그인 시스템 사용 중
- 사용자 테이블에 email 필드 존재
- 비밀번호는 bcrypt로 해싱하여 저장

---

## Assumptions (가정사항)

1. **이메일 시스템**: 이메일 전송 서비스가 정상 작동한다
2. **사용자 이메일**: 모든 사용자는 유효한 이메일 주소를 가지고 있다
3. **토큰 저장소**: 데이터베이스에 토큰 테이블을 추가할 수 있다
4. **보안 정책**: 비밀번호 히스토리 3개 보관 정책을 따른다
5. **시간 정확성**: 서버 시스템 시간이 정확하다 (토큰 만료 체크)

---

## Requirements (요구사항)

### @SPEC:AUTH-001-REQ-001 Ubiquitous Requirements (기본 요구사항)

#### UR-001: 비밀번호 재설정 요청
- 시스템은 사용자가 이메일 주소를 입력하여 비밀번호 재설정을 요청할 수 있는 기능을 제공해야 한다

#### UR-002: 토큰 발급 및 이메일 전송
- 시스템은 유효한 이메일 주소에 대해 1회용 재설정 토큰을 생성하고 이메일로 전송해야 한다

#### UR-003: 토큰 검증
- 시스템은 재설정 링크의 토큰 유효성을 검증해야 한다 (만료, 사용 여부)

#### UR-004: 새 비밀번호 설정
- 시스템은 유효한 토큰으로 새 비밀번호를 설정할 수 있는 기능을 제공해야 한다

#### UR-005: 비밀번호 히스토리 관리
- 시스템은 최근 3개의 비밀번호를 기록하고 재사용을 방지해야 한다

### @SPEC:AUTH-001-REQ-002 Event-driven Requirements (이벤트 기반)

#### ED-001: 재설정 요청 시
WHEN 사용자가 비밀번호 재설정을 요청하면,
- 시스템은 이메일 주소의 존재 여부를 확인해야 한다
- 존재하는 이메일이면, 시스템은 재설정 토큰을 생성하고 이메일을 발송해야 한다
- 존재하지 않는 이메일이라도, 시스템은 동일한 성공 메시지를 표시해야 한다 (이메일 노출 방지)

#### ED-002: 토큰 사용 시
WHEN 사용자가 재설정 링크를 클릭하면,
- 시스템은 토큰의 유효성을 검증해야 한다 (만료 시간, 사용 여부)
- 유효한 토큰이면, 시스템은 비밀번호 변경 폼을 표시해야 한다
- 만료/사용된 토큰이면, 시스템은 에러 메시지를 표시하고 새 요청을 안내해야 한다

#### ED-003: 비밀번호 변경 완료 시
WHEN 사용자가 새 비밀번호를 설정하면,
- 시스템은 토큰을 사용 완료 상태로 변경해야 한다
- 시스템은 비밀번호 히스토리에 이전 비밀번호를 저장해야 한다
- 시스템은 모든 활성 세션을 무효화해야 한다 (로그아웃 처리)
- 시스템은 변경 완료 이메일을 발송해야 한다

#### ED-004: 비밀번호 히스토리 체크
WHEN 사용자가 새 비밀번호를 입력하면,
- 시스템은 최근 3개의 비밀번호와 비교해야 한다
- 재사용된 비밀번호이면, 시스템은 에러 메시지를 표시하고 입력을 거부해야 한다

### @SPEC:AUTH-001-REQ-003 State-driven Requirements (상태 기반)

#### SD-001: 토큰 만료 상태
WHILE 토큰이 만료된 상태일 때,
- 시스템은 해당 토큰으로의 비밀번호 변경을 거부해야 한다
- 시스템은 새 토큰을 요청하도록 안내해야 한다

#### SD-002: 토큰 사용 완료 상태
WHILE 토큰이 이미 사용된 상태일 때,
- 시스템은 해당 토큰의 재사용을 차단해야 한다
- 시스템은 보안 경고를 로그에 기록해야 한다

### @SPEC:AUTH-001-REQ-004 Optional Features (선택적 기능)

#### OP-001: 재설정 링크 만료 알림
WHERE 사용자가 요청하면,
- 시스템은 토큰 만료 1시간 전 알림 이메일을 발송할 수 있다

#### OP-002: 재설정 이력 조회
WHERE 관리자 권한이면,
- 시스템은 사용자의 비밀번호 재설정 이력을 조회할 수 있는 기능을 제공할 수 있다

### @SPEC:AUTH-001-REQ-005 Constraints (제약사항)

#### CN-001: 토큰 유효 시간
IF 토큰이 생성되면,
- 토큰은 15분 후 자동으로 만료되어야 한다

#### CN-002: 토큰 일회성
IF 토큰이 사용되면,
- 토큰은 즉시 사용 완료 상태로 변경되어야 한다
- 동일 토큰으로는 재설정을 수행할 수 없어야 한다

#### CN-003: 비밀번호 히스토리 제한
IF 새 비밀번호가 입력되면,
- 최근 3개의 비밀번호와 동일하지 않아야 한다
- 비밀번호 히스토리는 최대 3개만 보관해야 한다

#### CN-004: 이메일 노출 방지
IF 존재하지 않는 이메일로 재설정을 요청하면,
- 시스템은 이메일 존재 여부를 노출하지 않아야 한다
- 시스템은 동일한 성공 메시지를 표시해야 한다

#### CN-005: 비밀번호 강도
IF 새 비밀번호가 설정되면,
- 최소 8자 이상이어야 한다
- 영문 대/소문자, 숫자, 특수문자 중 3종 이상 포함해야 한다

---

## Specifications (상세 명세)

### 데이터베이스 스키마

#### password_reset_tokens 테이블
```sql
CREATE TABLE password_reset_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  used_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_token ON password_reset_tokens(token);
CREATE INDEX idx_user_id ON password_reset_tokens(user_id);
CREATE INDEX idx_expires_at ON password_reset_tokens(expires_at);
```

#### password_history 테이블
```sql
CREATE TABLE password_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  password_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_id_created ON password_history(user_id, created_at DESC);
```

### API 엔드포인트

#### POST /api/auth/password-reset/request
**요청**:
```json
{
  "email": "user@example.com"
}
```

**응답** (200 OK, 존재 여부 무관):
```json
{
  "success": true,
  "message": "비밀번호 재설정 이메일이 전송되었습니다. (이메일이 존재하는 경우)"
}
```

#### GET /api/auth/password-reset/verify?token={token}
**응답** (200 OK):
```json
{
  "valid": true,
  "email": "u***@example.com"
}
```

**응답** (400 Bad Request - 만료/사용됨):
```json
{
  "valid": false,
  "error": "TOKEN_EXPIRED" | "TOKEN_USED" | "TOKEN_INVALID"
}
```

#### POST /api/auth/password-reset/confirm
**요청**:
```json
{
  "token": "abc123...",
  "newPassword": "NewP@ssw0rd123"
}
```

**응답** (200 OK):
```json
{
  "success": true,
  "message": "비밀번호가 성공적으로 변경되었습니다."
}
```

**응답** (400 Bad Request):
```json
{
  "success": false,
  "error": "PASSWORD_REUSED" | "PASSWORD_WEAK" | "TOKEN_INVALID"
}
```

### 이메일 템플릿

#### 재설정 이메일
```html
제목: [KK119] 비밀번호 재설정 요청

안녕하세요,

비밀번호 재설정을 요청하셨습니다.
아래 링크를 클릭하여 비밀번호를 재설정하세요:

{RESET_LINK}

이 링크는 15분 동안 유효합니다.
요청하지 않으셨다면 이 이메일을 무시하세요.

감사합니다.
```

#### 변경 완료 이메일
```html
제목: [KK119] 비밀번호 변경 완료

안녕하세요,

비밀번호가 성공적으로 변경되었습니다.
변경 시간: {TIMESTAMP}

본인이 변경하지 않았다면 즉시 고객센터로 연락하세요.

감사합니다.
```

### 보안 고려사항

1. **타이밍 공격 방지**: 이메일 존재 여부 확인 시간을 일정하게 유지
2. **토큰 무작위성**: crypto.randomBytes(32) 사용하여 예측 불가능한 토큰 생성
3. **HTTPS 필수**: 재설정 링크는 반드시 HTTPS 사용
4. **로그 기록**: 모든 재설정 시도와 성공/실패를 로그에 기록
5. **세션 무효화**: 비밀번호 변경 시 모든 활성 세션 강제 로그아웃

---

## Traceability (추적성)

### Parent TAG
- N/A (독립 SPEC)

### Child TAGs
- @SPEC:AUTH-001-REQ-001 (Ubiquitous Requirements)
- @SPEC:AUTH-001-REQ-002 (Event-driven Requirements)
- @SPEC:AUTH-001-REQ-003 (State-driven Requirements)
- @SPEC:AUTH-001-REQ-004 (Optional Features)
- @SPEC:AUTH-001-REQ-005 (Constraints)

### Cross-references
- @SPEC:AUTH-002 (2FA 시스템 - 비밀번호 재설정 후 2FA 설정 가능)
- @SPEC:AUTH-004 (계정 잠금 시스템 - 잠금 해제 시 비밀번호 재설정 연계)

---

**문서 끝**
