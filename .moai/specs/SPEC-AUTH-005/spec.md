---
id: AUTH-005
version: 0.0.1
status: draft
created: 2025-10-17
updated: 2025-10-17
author: @user
priority: medium
category: feature
labels:
  - remember-me
  - long-term-token
  - trusted-device
scope:
  packages:
    - lib/auth
    - app/api/auth
  files:
    - remember-me-service.ts
    - trusted-device-service.ts
---

# SPEC-AUTH-005: Remember Me 기능

## @TAG:AUTH-005 TAG BLOCK

**SPEC ID**: AUTH-005
**Title**: Remember Me 기능
**Priority**: MEDIUM
**Status**: Draft (v0.0.1)

---

## HISTORY

### v0.0.1 (2025-10-17)
- **INITIAL**: Remember Me 기능 SPEC 작성
- **AUTHOR**: @user

---

## Environment (환경 및 전제 조건)

### 시스템 환경
- **프레임워크**: Next.js 14+ (App Router)
- **인증**: JWT 기반 세션 관리 + 장기 토큰
- **데이터베이스**: SQLite (remember_me_tokens, trusted_devices 테이블)

---

## Requirements (요구사항)

### @SPEC:AUTH-005-REQ-001 Ubiquitous Requirements

#### UR-001: Remember Me 체크박스
- 시스템은 로그인 페이지에 "로그인 상태 유지" 체크박스를 제공해야 한다

#### UR-002: 장기 토큰 발급
- 시스템은 체크박스 선택 시 30일 유효한 장기 토큰을 발급해야 한다

#### UR-003: 디바이스 신뢰 목록
- 시스템은 신뢰 디바이스 목록을 저장하고 관리해야 한다

---

## Specifications (상세 명세)

### 데이터베이스 스키마

#### remember_me_tokens 테이블
```sql
CREATE TABLE remember_me_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  device_info TEXT,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_used_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

#### trusted_devices 테이블
```sql
CREATE TABLE trusted_devices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  device_fingerprint TEXT NOT NULL,
  device_name TEXT,
  trusted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, device_fingerprint)
);
```

---

## Traceability (추적성)

### Child TAGs
- @SPEC:AUTH-005-REQ-001 (Ubiquitous Requirements)

---

**문서 끝**
