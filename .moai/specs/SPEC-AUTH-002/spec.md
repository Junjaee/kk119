---
id: AUTH-002
version: 0.0.1
status: draft
created: 2025-10-17
updated: 2025-10-17
author: @user
priority: high
category: security
labels:
  - 2fa
  - totp
  - authenticator
  - backup-codes
depends_on:
  - AUTH-001
scope:
  packages:
    - lib/auth
    - app/api/auth/2fa
  files:
    - totp-service.ts
    - backup-code-service.ts
    - 2fa-middleware.ts
---

# SPEC-AUTH-002: 2단계 인증 (2FA/TOTP) 시스템

## @TAG:AUTH-002 TAG BLOCK

**SPEC ID**: AUTH-002
**Title**: 2단계 인증 (2FA/TOTP) 시스템
**Priority**: HIGH
**Status**: Draft (v0.0.1)

### TAG Chain
- **Parent**: N/A
- **Depends On**: AUTH-001 (비밀번호 재설정 후 2FA 설정 가능)
- **Blocks**: N/A
- **Related**: AUTH-003 (소셜 로그인도 2FA 설정 가능)

---

## HISTORY

### v0.0.1 (2025-10-17)
- **INITIAL**: 2단계 인증 (2FA/TOTP) 시스템 SPEC 작성
- **AUTHOR**: @user
- **SECTIONS**: Environment, Assumptions, Requirements, Specifications, Traceability

---

## Environment (환경 및 전제 조건)

### 시스템 환경
- **프레임워크**: Next.js 14+ (App Router)
- **인증**: JWT 기반 세션 관리 + TOTP 2차 인증
- **데이터베이스**: SQLite (totp_secrets, backup_codes 테이블)
- **TOTP 라이브러리**: `otpauth` 또는 `speakeasy` (TOTP 생성/검증)
- **QR 코드**: `qrcode` (Google Authenticator용 QR 생성)
- **암호화**: `crypto` (백업 코드 생성, secret 암호화)

### 기존 시스템 통합
- 현재 JWT 기반 로그인 시스템 사용 중
- 사용자 테이블 존재 (users)
- 역할 기반 접근 제어 (role: teacher, lawyer, admin, super_admin)

---

## Assumptions (가정사항)

1. **TOTP 표준**: RFC 6238 TOTP 표준을 따른다 (Google Authenticator 호환)
2. **사용자 디바이스**: 사용자는 Google Authenticator 또는 호환 앱을 설치할 수 있다
3. **시간 동기화**: 서버와 사용자 디바이스의 시간이 동기화되어 있다 (최대 ±30초 허용)
4. **백업 코드**: 사용자는 백업 코드를 안전하게 보관한다
5. **역할별 강제**: 관리자 역할(admin, super_admin)은 2FA 필수 설정 가능

---

## Requirements (요구사항)

### @SPEC:AUTH-002-REQ-001 Ubiquitous Requirements (기본 요구사항)

#### UR-001: 2FA 설정
- 시스템은 사용자가 2FA를 활성화할 수 있는 기능을 제공해야 한다

#### UR-002: QR 코드 생성
- 시스템은 TOTP secret을 QR 코드로 생성하여 사용자에게 제공해야 한다

#### UR-003: 백업 코드 발급
- 시스템은 2FA 활성화 시 10개의 백업 코드를 생성하여 제공해야 한다

#### UR-004: TOTP 검증
- 시스템은 로그인 시 TOTP 코드를 검증해야 한다

#### UR-005: 백업 코드 검증
- 시스템은 TOTP 대신 백업 코드로 인증할 수 있는 기능을 제공해야 한다

### @SPEC:AUTH-002-REQ-002 Event-driven Requirements (이벤트 기반)

#### ED-001: 2FA 활성화 시
WHEN 사용자가 2FA를 활성화하면,
- 시스템은 32자리 랜덤 secret을 생성해야 한다
- 시스템은 secret을 암호화하여 데이터베이스에 저장해야 한다
- 시스템은 QR 코드를 생성하여 표시해야 한다
- 시스템은 10개의 백업 코드를 생성하여 표시해야 한다
- 시스템은 사용자가 TOTP 코드를 입력하여 설정을 확인하도록 요구해야 한다

#### ED-002: 로그인 시 (2FA 활성화된 계정)
WHEN 사용자가 아이디/비밀번호로 로그인하면 (2FA 활성화 계정),
- 시스템은 TOTP 입력 화면을 표시해야 한다
- 시스템은 6자리 TOTP 코드 또는 백업 코드를 입력받아야 한다
- 시스템은 코드 검증 후 JWT 토큰을 발급해야 한다

#### ED-003: TOTP 검증 실패 시
WHEN 사용자가 잘못된 TOTP 코드를 입력하면,
- 시스템은 에러 메시지를 표시해야 한다
- 시스템은 5회 실패 시 계정을 30분 동안 잠가야 한다
- 시스템은 실패 시도를 로그에 기록해야 한다

#### ED-004: 백업 코드 사용 시
WHEN 사용자가 백업 코드를 사용하면,
- 시스템은 해당 백업 코드를 사용 완료 상태로 변경해야 한다
- 시스템은 남은 백업 코드 개수를 알려야 한다
- 백업 코드가 3개 이하이면, 시스템은 경고 메시지를 표시해야 한다

#### ED-005: 2FA 비활성화 시
WHEN 사용자가 2FA를 비활성화하면,
- 시스템은 비밀번호 재확인을 요구해야 한다
- 시스템은 TOTP secret과 백업 코드를 모두 삭제해야 한다
- 시스템은 비활성화 알림 이메일을 발송해야 한다

### @SPEC:AUTH-002-REQ-003 State-driven Requirements (상태 기반)

#### SD-001: 2FA 활성화된 상태
WHILE 사용자가 2FA를 활성화한 상태일 때,
- 시스템은 로그인 시 반드시 TOTP 또는 백업 코드를 요구해야 한다
- 시스템은 2FA 없이는 로그인을 허용하지 않아야 한다

#### SD-002: 관리자 역할 상태
WHILE 사용자가 관리자 역할(admin, super_admin)일 때,
- 시스템은 2FA 활성화를 강제할 수 있어야 한다 (정책 설정 가능)
- 2FA 미설정 시, 시스템은 설정 화면으로 리다이렉트해야 한다

### @SPEC:AUTH-002-REQ-004 Optional Features (선택적 기능)

#### OP-001: 백업 코드 재생성
WHERE 사용자가 요청하면,
- 시스템은 기존 백업 코드를 무효화하고 새로운 10개의 코드를 생성할 수 있다

#### OP-002: 신뢰 디바이스
WHERE 사용자가 선택하면,
- 시스템은 특정 디바이스를 30일 동안 신뢰하고 2FA를 건너뛸 수 있다 (쿠키 기반)

### @SPEC:AUTH-002-REQ-005 Constraints (제약사항)

#### CN-001: TOTP 시간 창
IF TOTP 코드가 검증되면,
- ±30초 시간 창 내의 코드만 유효해야 한다 (RFC 6238 표준)
- 동일한 코드는 재사용할 수 없어야 한다 (replay attack 방지)

#### CN-002: 백업 코드 개수
IF 백업 코드가 생성되면,
- 정확히 10개의 코드가 생성되어야 한다
- 각 코드는 8자리 영숫자여야 한다

#### CN-003: Secret 암호화
IF TOTP secret이 저장되면,
- secret은 반드시 암호화되어야 한다
- 평문으로 저장되어서는 안 된다

#### CN-004: 2FA 설정 확인
IF 2FA를 활성화하면,
- 사용자는 반드시 첫 TOTP 코드를 입력하여 설정을 확인해야 한다
- 확인 없이는 2FA가 활성화되지 않아야 한다

---

## Specifications (상세 명세)

### 데이터베이스 스키마

#### totp_secrets 테이블
```sql
CREATE TABLE totp_secrets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  secret_encrypted TEXT NOT NULL,
  is_active BOOLEAN DEFAULT 0,
  verified_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_id ON totp_secrets(user_id);
```

#### backup_codes 테이블
```sql
CREATE TABLE backup_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  code_hash TEXT NOT NULL,
  used_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_id ON backup_codes(user_id);
CREATE INDEX idx_code_hash ON backup_codes(code_hash);
```

### API 엔드포인트

#### POST /api/auth/2fa/setup
**요청**:
```json
{
  "password": "user_password"
}
```

**응답** (200 OK):
```json
{
  "success": true,
  "qrCode": "data:image/png;base64,...",
  "secret": "JBSWY3DPEHPK3PXP",
  "backupCodes": ["12345678", "87654321", ...]
}
```

#### POST /api/auth/2fa/verify-setup
**요청**:
```json
{
  "totpCode": "123456"
}
```

**응답** (200 OK):
```json
{
  "success": true,
  "message": "2FA가 활성화되었습니다."
}
```

#### POST /api/auth/2fa/verify
**요청** (로그인 2단계):
```json
{
  "userId": 123,
  "totpCode": "123456"
}
```

**응답** (200 OK):
```json
{
  "success": true,
  "token": "jwt_token_here"
}
```

#### POST /api/auth/2fa/verify-backup
**요청**:
```json
{
  "userId": 123,
  "backupCode": "12345678"
}
```

**응답** (200 OK):
```json
{
  "success": true,
  "token": "jwt_token_here",
  "remainingCodes": 7
}
```

#### POST /api/auth/2fa/disable
**요청**:
```json
{
  "password": "user_password"
}
```

**응답** (200 OK):
```json
{
  "success": true,
  "message": "2FA가 비활성화되었습니다."
}
```

### TOTP 구현 상세

#### Secret 생성
```typescript
import { authenticator } from 'otpauth'

const secret = authenticator.generateSecret(32) // 32자리 Base32
```

#### QR 코드 생성
```typescript
import QRCode from 'qrcode'

const otpauth = `otpauth://totp/KK119:${email}?secret=${secret}&issuer=KK119`
const qrCode = await QRCode.toDataURL(otpauth)
```

#### TOTP 검증
```typescript
import { authenticator } from 'otpauth'

const isValid = authenticator.verify({
  token: userInputCode,
  secret: decryptedSecret,
  window: 1 // ±30초 허용
})
```

### 백업 코드 생성
```typescript
import crypto from 'crypto'

function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = []
  for (let i = 0; i < count; i++) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase()
    codes.push(code)
  }
  return codes
}
```

---

## Traceability (추적성)

### Parent TAG
- N/A

### Child TAGs
- @SPEC:AUTH-002-REQ-001 (Ubiquitous Requirements)
- @SPEC:AUTH-002-REQ-002 (Event-driven Requirements)
- @SPEC:AUTH-002-REQ-003 (State-driven Requirements)
- @SPEC:AUTH-002-REQ-004 (Optional Features)
- @SPEC:AUTH-002-REQ-005 (Constraints)

### Cross-references
- @SPEC:AUTH-001 (비밀번호 재설정 - 2FA 설정 전 비밀번호 재설정 가능)
- @SPEC:AUTH-003 (소셜 로그인 - OAuth 연동 후 2FA 설정 가능)
- @SPEC:AUTH-004 (계정 잠금 - 2FA 실패 5회 시 계정 잠금)

---

**문서 끝**
