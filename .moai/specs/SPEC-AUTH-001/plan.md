---
id: AUTH-001
version: 0.0.1
status: draft
title: 비밀번호 재설정 및 복구 시스템 - 구현 계획
---

# SPEC-AUTH-001: 비밀번호 재설정 및 복구 시스템 - 구현 계획

## 개요

비밀번호 재설정 및 복구 시스템의 구현 계획서입니다.
이메일 기반 토큰 발급, 15분 만료, 비밀번호 히스토리 관리를 포함합니다.

---

## 구현 우선순위

### 1차 목표: 핵심 비밀번호 재설정 기능
- 데이터베이스 스키마 생성 (password_reset_tokens, password_history)
- 토큰 생성 및 이메일 발송 API (`POST /api/auth/password-reset/request`)
- 토큰 검증 API (`GET /api/auth/password-reset/verify`)
- 비밀번호 변경 API (`POST /api/auth/password-reset/confirm`)
- 비밀번호 히스토리 체크 로직

### 2차 목표: UI 및 사용자 경험
- 비밀번호 재설정 요청 페이지 (`/auth/password-reset`)
- 토큰 검증 및 비밀번호 변경 페이지 (`/auth/password-reset/confirm?token=...`)
- 이메일 템플릿 구현 (HTML + 텍스트)
- 에러 메시지 및 성공 메시지 UI

### 3차 목표: 보안 강화 및 운영
- 타이밍 공격 방지 (이메일 존재 여부 노출 방지)
- 로그 기록 시스템 (재설정 시도, 성공, 실패)
- 세션 무효화 (비밀번호 변경 시 모든 JWT 토큰 만료 처리)
- 모니터링 및 알림

---

## 기술적 접근 방법

### 아키텍처 설계

```
Client (Browser)
    ↓
Next.js App Router
    ↓
API Routes (/api/auth/password-reset/*)
    ↓
Services Layer
    ├─ PasswordResetService (토큰 생성, 검증, 사용 처리)
    ├─ EmailService (이메일 전송)
    └─ PasswordHistoryService (히스토리 관리)
    ↓
Database (SQLite)
    ├─ password_reset_tokens
    └─ password_history
```

### 핵심 모듈 구조

#### 1. PasswordResetService (`lib/auth/password-reset-service.ts`)
```typescript
interface PasswordResetService {
  // 토큰 생성 및 이메일 발송
  requestReset(email: string): Promise<void>

  // 토큰 검증
  verifyToken(token: string): Promise<{ valid: boolean; userId?: number; email?: string }>

  // 비밀번호 변경
  confirmReset(token: string, newPassword: string): Promise<void>

  // 만료된 토큰 정리 (Cron Job)
  cleanupExpiredTokens(): Promise<number>
}
```

**주요 로직**:
- **토큰 생성**: `crypto.randomBytes(32).toString('hex')`
- **만료 시간**: `new Date(Date.now() + 15 * 60 * 1000)` (15분 후)
- **이메일 존재 여부 체크**: 타이밍 공격 방지를 위해 항상 동일한 응답 시간 유지

#### 2. PasswordHistoryService (`lib/auth/password-history-service.ts`)
```typescript
interface PasswordHistoryService {
  // 비밀번호 히스토리 추가
  addToHistory(userId: number, passwordHash: string): Promise<void>

  // 최근 3개 비밀번호와 비교
  isPasswordReused(userId: number, newPassword: string): Promise<boolean>

  // 오래된 히스토리 정리 (최대 3개 유지)
  cleanupOldHistory(userId: number): Promise<void>
}
```

**주요 로직**:
- **히스토리 조회**: `SELECT password_hash FROM password_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 3`
- **재사용 체크**: bcrypt.compare()로 각 히스토리와 비교
- **히스토리 정리**: 3개 초과 시 오래된 순으로 삭제

#### 3. EmailService (`lib/auth/email-service.ts`)
```typescript
interface EmailService {
  // 재설정 이메일 발송
  sendPasswordResetEmail(email: string, token: string): Promise<void>

  // 변경 완료 이메일 발송
  sendPasswordChangedEmail(email: string): Promise<void>
}
```

**주요 로직**:
- **SMTP 설정**: Nodemailer 또는 SendGrid API 사용
- **이메일 템플릿**: HTML + 텍스트 버전 제공
- **재설정 링크**: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/password-reset/confirm?token=${token}`

### 데이터베이스 마이그레이션

#### Step 1: 테이블 생성 스크립트
```sql
-- scripts/db/create-password-reset-tables.sql

-- 비밀번호 재설정 토큰 테이블
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  used_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_expires_at ON password_reset_tokens(expires_at);

-- 비밀번호 히스토리 테이블
CREATE TABLE IF NOT EXISTS password_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  password_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_id_created ON password_history(user_id, created_at DESC);
```

#### Step 2: 마이그레이션 실행
```bash
# SQLite에 직접 실행
sqlite3 data/kyokwon119.db < scripts/db/create-password-reset-tables.sql
```

### API 구현

#### POST /api/auth/password-reset/request
```typescript
// app/api/auth/password-reset/request/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { PasswordResetService } from '@/lib/auth/password-reset-service'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    // 이메일 형식 검증
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      return NextResponse.json(
        { success: false, error: 'INVALID_EMAIL' },
        { status: 400 }
      )
    }

    // 재설정 요청 처리 (이메일 존재 여부 무관 동일 응답)
    await PasswordResetService.requestReset(email)

    return NextResponse.json({
      success: true,
      message: '비밀번호 재설정 이메일이 전송되었습니다. (이메일이 존재하는 경우)'
    })
  } catch (error) {
    console.error('Password reset request error:', error)
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
```

#### GET /api/auth/password-reset/verify
```typescript
// app/api/auth/password-reset/verify/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { PasswordResetService } from '@/lib/auth/password-reset-service'

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { valid: false, error: 'TOKEN_MISSING' },
        { status: 400 }
      )
    }

    const result = await PasswordResetService.verifyToken(token)

    if (result.valid) {
      return NextResponse.json({
        valid: true,
        email: result.email?.replace(/(.{1}).+(@.+)/, '$1***$2') // 이메일 마스킹
      })
    }

    return NextResponse.json(
      { valid: false, error: result.error },
      { status: 400 }
    )
  } catch (error) {
    console.error('Token verification error:', error)
    return NextResponse.json(
      { valid: false, error: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
```

#### POST /api/auth/password-reset/confirm
```typescript
// app/api/auth/password-reset/confirm/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { PasswordResetService } from '@/lib/auth/password-reset-service'

export async function POST(req: NextRequest) {
  try {
    const { token, newPassword } = await req.json()

    // 비밀번호 강도 검증
    if (!isPasswordStrong(newPassword)) {
      return NextResponse.json(
        { success: false, error: 'PASSWORD_WEAK' },
        { status: 400 }
      )
    }

    await PasswordResetService.confirmReset(token, newPassword)

    return NextResponse.json({
      success: true,
      message: '비밀번호가 성공적으로 변경되었습니다.'
    })
  } catch (error: any) {
    console.error('Password reset confirm error:', error)

    if (error.message === 'PASSWORD_REUSED') {
      return NextResponse.json(
        { success: false, error: 'PASSWORD_REUSED' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

function isPasswordStrong(password: string): boolean {
  // 최소 8자, 영문 대/소문자, 숫자, 특수문자 중 3종 이상
  const criteria = [
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^a-zA-Z0-9]/.test(password)
  ].filter(Boolean).length

  return password.length >= 8 && criteria >= 3
}
```

---

## 리스크 및 대응 방안

### 리스크 1: 이메일 전송 실패
- **영향도**: HIGH
- **대응**:
  - 재시도 메커니즘 구현 (최대 3회)
  - 이메일 큐 시스템 도입 (향후 확장)
  - 실패 로그 기록 및 모니터링 알림

### 리스크 2: 토큰 노출 (중간자 공격)
- **영향도**: CRITICAL
- **대응**:
  - HTTPS 필수 사용
  - 토큰 유효 시간 단축 (15분)
  - 1회용 토큰 정책 (사용 후 즉시 무효화)

### 리스크 3: 비밀번호 히스토리 무한 증가
- **영향도**: MEDIUM
- **대응**:
  - 최대 3개만 보관하는 정리 로직 구현
  - 주기적인 DB 정리 Cron Job

### 리스크 4: 타이밍 공격 (이메일 존재 여부 노출)
- **영향도**: MEDIUM
- **대응**:
  - 항상 동일한 응답 시간 유지 (존재하지 않는 이메일도 동일 처리 시간)
  - 응답 메시지 통일

---

## 테스트 전략

### 단위 테스트 (Unit Tests)
- PasswordResetService.requestReset()
- PasswordResetService.verifyToken()
- PasswordResetService.confirmReset()
- PasswordHistoryService.isPasswordReused()
- EmailService.sendPasswordResetEmail()

### 통합 테스트 (Integration Tests)
- API 엔드포인트 전체 흐름 테스트
- 데이터베이스 트랜잭션 테스트
- 이메일 전송 모킹 테스트

### E2E 테스트 (Playwright)
- 사용자가 비밀번호 재설정 요청 → 이메일 수신 → 토큰 클릭 → 비밀번호 변경 전체 플로우

---

## 완료 기준 (Definition of Done)

- [ ] 데이터베이스 테이블 생성 완료
- [ ] 3개 API 엔드포인트 구현 완료
- [ ] 비밀번호 히스토리 3개 재사용 방지 로직 구현
- [ ] 이메일 템플릿 구현 및 전송 테스트
- [ ] 단위 테스트 커버리지 80% 이상
- [ ] E2E 테스트 시나리오 3개 이상 통과
- [ ] 보안 체크리스트 100% 준수 (HTTPS, 토큰 만료, 세션 무효화)
- [ ] 문서화 완료 (API 문서, 사용자 가이드)

---

**문서 끝**
