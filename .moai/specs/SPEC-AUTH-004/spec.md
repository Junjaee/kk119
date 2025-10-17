---
id: AUTH-004
version: 0.0.1
status: draft
created: 2025-10-17
updated: 2025-10-17
author: @user
priority: medium
category: security
labels:
  - account-lock
  - brute-force-protection
  - auto-unlock
  - email-notification
related_specs:
  - AUTH-001
  - AUTH-002
scope:
  packages:
    - lib/auth
    - app/api/auth
  files:
    - account-lock-service.ts
    - failed-attempt-tracker.ts
---

# SPEC-AUTH-004: 계정 잠금 및 자동 해제

## @TAG:AUTH-004 TAG BLOCK

**SPEC ID**: AUTH-004
**Title**: 계정 잠금 및 자동 해제
**Priority**: MEDIUM
**Status**: Draft (v0.0.1)

### TAG Chain
- **Parent**: N/A
- **Depends On**: N/A
- **Blocks**: N/A
- **Related**: AUTH-001 (비밀번호 재설정 시 계정 잠금 해제), AUTH-002 (2FA 실패 시 계정 잠금)

---

## HISTORY

### v0.0.1 (2025-10-17)
- **INITIAL**: 계정 잠금 및 자동 해제 SPEC 작성
- **AUTHOR**: @user
- **SECTIONS**: Environment, Assumptions, Requirements, Specifications, Traceability

---

## Environment (환경 및 전제 조건)

### 시스템 환경
- **프레임워크**: Next.js 14+ (App Router)
- **인증**: JWT 기반 세션 관리
- **데이터베이스**: SQLite (failed_login_attempts, account_locks 테이블)
- **이메일**: SMTP 또는 이메일 전송 서비스 (잠금 알림)
- **Cron Job**: Node-cron 또는 Vercel Cron (자동 해제)

### 기존 시스템 통합
- 현재 JWT 기반 로그인 시스템 사용 중
- 사용자 테이블 존재 (users)

---

## Assumptions (가정사항)

1. **실패 횟수**: 5회 연속 로그인 실패 시 계정 잠금
2. **잠금 시간**: 30분 후 자동 해제
3. **IP 추적**: 실패 시도 시 IP 주소 기록
4. **이메일 알림**: 계정 잠금 시 사용자에게 이메일 발송
5. **관리자 권한**: 관리자는 수동으로 계정 잠금 해제 가능

---

## Requirements (요구사항)

### @SPEC:AUTH-004-REQ-001 Ubiquitous Requirements (기본 요구사항)

#### UR-001: 실패 시도 추적
- 시스템은 로그인 실패 시도를 기록해야 한다 (IP, 시간, 사용자)

#### UR-002: 계정 자동 잠금
- 시스템은 5회 연속 실패 시 계정을 자동으로 잠가야 한다

#### UR-003: 자동 해제
- 시스템은 30분 후 계정을 자동으로 해제해야 한다

#### UR-004: 잠금 알림 이메일
- 시스템은 계정 잠금 시 사용자에게 이메일을 발송해야 한다

#### UR-005: 관리자 수동 해제
- 시스템은 관리자가 계정 잠금을 수동으로 해제할 수 있는 기능을 제공해야 한다

### @SPEC:AUTH-004-REQ-002 Event-driven Requirements (이벤트 기반)

#### ED-001: 로그인 실패 시
WHEN 사용자가 잘못된 비밀번호로 로그인하면,
- 시스템은 `failed_login_attempts` 테이블에 실패 시도를 기록해야 한다
- 시스템은 최근 5분 내 실패 횟수를 확인해야 한다
- 5회 이상이면, 시스템은 계정을 잠가야 한다

#### ED-002: 계정 잠금 시
WHEN 계정이 잠기면,
- 시스템은 `account_locks` 테이블에 잠금 기록을 생성해야 한다
- 시스템은 잠금 이메일을 발송해야 한다
- 시스템은 로그에 "계정 잠금" 이벤트를 기록해야 한다

#### ED-003: 잠긴 계정 로그인 시도 시
WHEN 잠긴 계정으로 로그인을 시도하면,
- 시스템은 로그인을 거부해야 한다
- 시스템은 "계정이 잠겼습니다. 30분 후 다시 시도하세요." 메시지를 표시해야 한다
- 시스템은 남은 잠금 시간을 표시해야 한다

#### ED-004: 로그인 성공 시
WHEN 사용자가 로그인에 성공하면,
- 시스템은 해당 사용자의 모든 실패 시도 기록을 삭제해야 한다

#### ED-005: 자동 해제 시
WHEN 잠금 시간이 30분 경과하면,
- 시스템은 자동으로 계정 잠금을 해제해야 한다
- 시스템은 `account_locks` 테이블의 `unlocked_at` 필드를 업데이트해야 한다

### @SPEC:AUTH-004-REQ-003 State-driven Requirements (상태 기반)

#### SD-001: 계정 잠금 상태
WHILE 계정이 잠긴 상태일 때,
- 시스템은 모든 로그인 시도를 거부해야 한다
- 시스템은 비밀번호 재설정을 통한 잠금 해제를 허용해야 한다 (AUTH-001 연동)

### @SPEC:AUTH-004-REQ-004 Optional Features (선택적 기능)

#### OP-001: IP 기반 차단
WHERE 동일 IP에서 여러 계정 공격 시도가 감지되면,
- 시스템은 해당 IP를 일시적으로 차단할 수 있다

#### OP-002: 잠금 이력 조회
WHERE 관리자 권한이면,
- 시스템은 계정 잠금 이력을 조회할 수 있는 기능을 제공할 수 있다

### @SPEC:AUTH-004-REQ-005 Constraints (제약사항)

#### CN-001: 실패 횟수 제한
IF 로그인 실패가 발생하면,
- 최근 5분 내 5회 실패 시 계정을 잠가야 한다

#### CN-002: 자동 해제 시간
IF 계정이 잠기면,
- 정확히 30분 후 자동으로 해제되어야 한다

#### CN-003: 관리자 수동 해제
IF 관리자가 계정을 수동으로 해제하면,
- 즉시 로그인이 가능해야 한다
- 실패 시도 기록이 모두 삭제되어야 한다

---

## Specifications (상세 명세)

### 데이터베이스 스키마

#### failed_login_attempts 테이블
```sql
CREATE TABLE failed_login_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  ip_address TEXT NOT NULL,
  attempted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_user_id_time ON failed_login_attempts(user_id, attempted_at DESC);
CREATE INDEX idx_ip_time ON failed_login_attempts(ip_address, attempted_at DESC);
```

#### account_locks 테이블
```sql
CREATE TABLE account_locks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  locked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  unlock_at DATETIME NOT NULL,
  unlocked_at DATETIME,
  reason TEXT, -- 'FAILED_ATTEMPTS', '2FA_FAILED', 'ADMIN_MANUAL'
  unlocked_by INTEGER, -- admin user_id (if manual unlock)
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (unlocked_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_user_id_lock ON account_locks(user_id);
CREATE INDEX idx_unlock_at ON account_locks(unlock_at);
```

### API 엔드포인트

#### POST /api/auth/login (수정)
로그인 실패 추적 로직 추가

**실패 시 응답** (400 Bad Request):
```json
{
  "success": false,
  "error": "INVALID_CREDENTIALS",
  "remainingAttempts": 3
}
```

**계정 잠금 시 응답** (423 Locked):
```json
{
  "success": false,
  "error": "ACCOUNT_LOCKED",
  "unlockAt": "2025-10-17T13:30:00Z",
  "remainingMinutes": 25
}
```

#### GET /api/auth/account-lock/status
**응답** (200 OK):
```json
{
  "locked": true,
  "unlockAt": "2025-10-17T13:30:00Z",
  "remainingMinutes": 25
}
```

#### POST /api/admin/account-lock/unlock
**요청**:
```json
{
  "userId": 123,
  "reason": "사용자 요청"
}
```

**응답** (200 OK):
```json
{
  "success": true,
  "message": "계정 잠금이 해제되었습니다."
}
```

### 이메일 템플릿

#### 계정 잠금 이메일
```html
제목: [KK119] 보안 경고: 계정이 일시적으로 잠겼습니다

안녕하세요,

보안상의 이유로 귀하의 계정이 일시적으로 잠겼습니다.

잠금 이유: 5회 이상의 로그인 실패 시도
자동 해제 시간: {UNLOCK_TIME} (약 30분 후)

본인이 로그인을 시도하지 않았다면, 아래 조치를 취하세요:
1. 비밀번호를 즉시 변경하세요
2. 계정 활동을 확인하세요
3. 의심스러운 활동이 있으면 고객센터에 연락하세요

감사합니다.
```

### Cron Job (자동 해제)

```typescript
// lib/cron/unlock-accounts.ts
import cron from 'node-cron'
import { AccountLockService } from '@/lib/auth/account-lock-service'

// 매 5분마다 실행
cron.schedule('*/5 * * * *', async () => {
  console.log('Running account unlock cron job...')
  const unlockedCount = await AccountLockService.unlockExpiredAccounts()
  console.log(`Unlocked ${unlockedCount} accounts`)
})
```

---

## Traceability (추적성)

### Parent TAG
- N/A

### Child TAGs
- @SPEC:AUTH-004-REQ-001 (Ubiquitous Requirements)
- @SPEC:AUTH-004-REQ-002 (Event-driven Requirements)
- @SPEC:AUTH-004-REQ-003 (State-driven Requirements)
- @SPEC:AUTH-004-REQ-004 (Optional Features)
- @SPEC:AUTH-004-REQ-005 (Constraints)

### Cross-references
- @SPEC:AUTH-001 (비밀번호 재설정 - 잠금 해제 연계)
- @SPEC:AUTH-002 (2FA - 2FA 실패 5회 시 계정 잠금)

---

**문서 끝**
