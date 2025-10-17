---
id: AUTH-006
version: 0.0.1
status: draft
created: 2025-10-17
updated: 2025-10-17
author: @user
priority: medium
category: feature
labels:
  - session-management
  - concurrent-sessions
  - remote-logout
scope:
  packages:
    - lib/auth
    - app/api/auth/sessions
  files:
    - session-manager.ts
    - active-sessions-service.ts
---

# SPEC-AUTH-006: 동시 세션 제한 및 관리

## @TAG:AUTH-006 TAG BLOCK

**SPEC ID**: AUTH-006
**Title**: 동시 세션 제한 및 관리
**Priority**: MEDIUM
**Status**: Draft (v0.0.1)

---

## HISTORY

### v0.0.1 (2025-10-17)
- **INITIAL**: 동시 세션 제한 및 관리 SPEC 작성
- **AUTHOR**: @user

---

## Requirements (요구사항)

### @SPEC:AUTH-006-REQ-001 Ubiquitous Requirements

#### UR-001: 최대 세션 제한
- 시스템은 사용자당 최대 3개의 동시 세션을 허용해야 한다

#### UR-002: 오래된 세션 자동 종료
- 시스템은 3개 초과 시 가장 오래된 세션을 자동으로 종료해야 한다

#### UR-003: 활성 세션 목록 조회
- 시스템은 사용자가 활성 세션 목록을 조회할 수 있는 기능을 제공해야 한다

#### UR-004: 원격 로그아웃
- 시스템은 사용자가 특정 세션을 원격으로 종료할 수 있는 기능을 제공해야 한다

---

## Specifications (상세 명세)

### 데이터베이스 스키마

#### sessions 테이블
```sql
CREATE TABLE sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  session_token TEXT NOT NULL UNIQUE,
  device_info TEXT,
  ip_address TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_active_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

**문서 끝**
