---
id: AUTH-007
version: 0.0.1
status: draft
created: 2025-10-17
updated: 2025-10-17
author: @user
priority: medium
category: feature
labels:
  - notification
  - security-alert
  - email
  - suspicious-activity
scope:
  packages:
    - lib/auth
    - lib/notifications
  files:
    - login-notification-service.ts
    - anomaly-detector.ts
---

# SPEC-AUTH-007: 로그인 시도 알림 시스템

## @TAG:AUTH-007 TAG BLOCK

**SPEC ID**: AUTH-007
**Title**: 로그인 시도 알림 시스템
**Priority**: MEDIUM
**Status**: Draft (v0.0.1)

---

## HISTORY

### v0.0.1 (2025-10-17)
- **INITIAL**: 로그인 시도 알림 시스템 SPEC 작성
- **AUTHOR**: @user

---

## Requirements (요구사항)

### @SPEC:AUTH-007-REQ-001 Ubiquitous Requirements

#### UR-001: 실패 시도 알림
- 시스템은 3회 이상 로그인 실패 시 이메일 알림을 발송해야 한다

#### UR-002: 새 디바이스 알림
- 시스템은 새로운 디바이스에서 로그인 시 이메일 알림을 발송해야 한다

#### UR-003: 이상 IP 탐지
- 시스템은 의심스러운 IP 주소에서의 로그인 시도를 탐지하고 알림해야 한다

#### UR-004: 알림 설정 UI
- 시스템은 사용자가 알림 설정을 변경할 수 있는 UI를 제공해야 한다

---

## Specifications (상세 명세)

### 데이터베이스 스키마

#### login_notifications 테이블
```sql
CREATE TABLE login_notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  notification_type TEXT NOT NULL, -- 'FAILED_ATTEMPT', 'NEW_DEVICE', 'SUSPICIOUS_IP'
  sent_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  details TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

#### notification_settings 테이블
```sql
CREATE TABLE notification_settings (
  user_id INTEGER PRIMARY KEY,
  notify_failed_attempts BOOLEAN DEFAULT 1,
  notify_new_device BOOLEAN DEFAULT 1,
  notify_suspicious_ip BOOLEAN DEFAULT 1,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

**문서 끝**
