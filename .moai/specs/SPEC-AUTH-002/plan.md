---
id: AUTH-002
version: 0.0.1
status: draft
title: 2단계 인증 (2FA/TOTP) 시스템 - 구현 계획
---

# SPEC-AUTH-002: 2단계 인증 (2FA/TOTP) 시스템 - 구현 계획

## 개요

2단계 인증 (2FA/TOTP) 시스템의 구현 계획서입니다.
TOTP 기반 인증, QR 코드 생성, 백업 코드 10개 발급을 포함합니다.

---

## 구현 우선순위

### 1차 목표: 핵심 2FA 기능
- 데이터베이스 스키마 생성 (totp_secrets, backup_codes)
- TOTP secret 생성 및 QR 코드 생성 (`POST /api/auth/2fa/setup`)
- 백업 코드 10개 생성 및 저장
- TOTP 검증 API (`POST /api/auth/2fa/verify`)
- 백업 코드 검증 API (`POST /api/auth/2fa/verify-backup`)
- 2FA 설정 확인 API (`POST /api/auth/2fa/verify-setup`)

### 2차 목표: UI 및 사용자 경험
- 2FA 설정 페이지 (`/settings/2fa`)
- QR 코드 스캔 안내 UI
- 백업 코드 다운로드/인쇄 기능
- 로그인 2단계 TOTP 입력 페이지 (`/auth/2fa-verify`)
- 백업 코드 입력 UI (TOTP 대체)

### 3차 목표: 보안 강화 및 고급 기능
- 2FA 비활성화 기능 (`POST /api/auth/2fa/disable`)
- 백업 코드 재생성 기능
- 신뢰 디바이스 기능 (30일 2FA 건너뛰기)
- 역할별 2FA 강제 정책 (관리자 필수)
- 2FA 활동 로그 및 모니터링

---

## 기술적 접근 방법

### 아키텍처 설계

```
Client (Browser)
    ↓
Next.js App Router
    ↓
API Routes (/api/auth/2fa/*)
    ↓
Services Layer
    ├─ TOTPService (TOTP 생성, 검증)
    ├─ BackupCodeService (백업 코드 생성, 검증)
    └─ CryptoService (secret 암호화/복호화)
    ↓
Database (SQLite)
    ├─ totp_secrets
    └─ backup_codes
```

### 핵심 모듈 구조

#### 1. TOTPService (`lib/auth/totp-service.ts`)
```typescript
interface TOTPService {
  // TOTP secret 생성 및 QR 코드
  generateSecret(email: string): Promise<{
    secret: string
    qrCode: string
  }>

  // TOTP 검증
  verifyToken(userId: number, token: string): Promise<boolean>

  // 2FA 활성화
  enableTOTP(userId: number, secret: string): Promise<void>

  // 2FA 비활성화
  disableTOTP(userId: number): Promise<void>

  // 사용자 2FA 상태 확인
  is2FAEnabled(userId: number): Promise<boolean>
}
```

**주요 로직**:
- **Secret 생성**: `authenticator.generateSecret(32)` (Base32 32자리)
- **QR 코드**: `QRCode.toDataURL('otpauth://totp/KK119:${email}?secret=${secret}&issuer=KK119')`
- **검증**: `authenticator.verify({ token, secret, window: 1 })` (±30초 허용)
- **암호화**: `CryptoService.encrypt(secret)` (저장 전)

#### 2. BackupCodeService (`lib/auth/backup-code-service.ts`)
```typescript
interface BackupCodeService {
  // 백업 코드 10개 생성
  generateCodes(userId: number): Promise<string[]>

  // 백업 코드 검증 및 사용 처리
  verifyCode(userId: number, code: string): Promise<{
    valid: boolean
    remainingCodes: number
  }>

  // 백업 코드 재생성
  regenerateCodes(userId: number): Promise<string[]>

  // 남은 백업 코드 개수
  getRemainingCount(userId: number): Promise<number>
}
```

**주요 로직**:
- **코드 생성**: `crypto.randomBytes(4).toString('hex').toUpperCase()` (8자리)
- **해시 저장**: `bcrypt.hash(code, 10)` (평문 저장하지 않음)
- **검증**: `bcrypt.compare(inputCode, codeHash)` + `used_at` null 체크
- **사용 처리**: `UPDATE backup_codes SET used_at = CURRENT_TIMESTAMP WHERE ...`

#### 3. CryptoService (`lib/auth/crypto-service.ts`)
```typescript
interface CryptoService {
  // Secret 암호화
  encrypt(plaintext: string): string

  // Secret 복호화
  decrypt(ciphertext: string): string
}
```

**주요 로직**:
- **암호화**: AES-256-GCM 사용, `crypto.createCipheriv()`
- **키 관리**: 환경 변수 `TOTP_ENCRYPTION_KEY` (32 bytes)
- **IV**: 각 암호화마다 랜덤 IV 생성

### 데이터베이스 마이그레이션

#### Step 1: 테이블 생성 스크립트
```sql
-- scripts/db/create-2fa-tables.sql

CREATE TABLE IF NOT EXISTS totp_secrets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  secret_encrypted TEXT NOT NULL,
  is_active BOOLEAN DEFAULT 0,
  verified_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_id ON totp_secrets(user_id);

CREATE TABLE IF NOT EXISTS backup_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  code_hash TEXT NOT NULL,
  used_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_id_backup ON backup_codes(user_id);
CREATE INDEX IF NOT EXISTS idx_code_hash ON backup_codes(code_hash);
```

#### Step 2: 마이그레이션 실행
```bash
sqlite3 data/kyokwon119.db < scripts/db/create-2fa-tables.sql
```

### API 구현

#### POST /api/auth/2fa/setup
```typescript
// app/api/auth/2fa/setup/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { TOTPService } from '@/lib/auth/totp-service'
import { BackupCodeService } from '@/lib/auth/backup-code-service'
import { verifyPassword } from '@/lib/auth/password-service'

export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req)
    if (!session) {
      return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 })
    }

    const { password } = await req.json()

    // 비밀번호 재확인
    const isPasswordValid = await verifyPassword(session.userId, password)
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: 'INVALID_PASSWORD' },
        { status: 400 }
      )
    }

    // TOTP secret 및 QR 코드 생성
    const { secret, qrCode } = await TOTPService.generateSecret(session.email)

    // 백업 코드 10개 생성
    const backupCodes = await BackupCodeService.generateCodes(session.userId)

    return NextResponse.json({
      success: true,
      qrCode,
      secret, // 화면에 표시 (스캔 실패 시 수동 입력)
      backupCodes
    })
  } catch (error) {
    console.error('2FA setup error:', error)
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
```

#### POST /api/auth/2fa/verify-setup
```typescript
// app/api/auth/2fa/verify-setup/route.ts
export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req)
    const { totpCode } = await req.json()

    // TOTP 검증
    const isValid = await TOTPService.verifyToken(session.userId, totpCode)

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'INVALID_CODE' },
        { status: 400 }
      )
    }

    // 2FA 활성화
    await TOTPService.enableTOTP(session.userId)

    return NextResponse.json({
      success: true,
      message: '2FA가 활성화되었습니다.'
    })
  } catch (error) {
    console.error('2FA verify setup error:', error)
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
```

#### POST /api/auth/2fa/verify
```typescript
// app/api/auth/2fa/verify/route.ts
export async function POST(req: NextRequest) {
  try {
    const { userId, totpCode } = await req.json()

    // TOTP 검증
    const isValid = await TOTPService.verifyToken(userId, totpCode)

    if (!isValid) {
      // 실패 시도 로그 기록
      await logFailedAttempt(userId, 'TOTP_FAILED')

      // 5회 실패 시 계정 잠금 (AUTH-004 연동)
      const failedAttempts = await getFailedAttempts(userId)
      if (failedAttempts >= 5) {
        await lockAccount(userId, 30) // 30분 잠금
      }

      return NextResponse.json(
        { success: false, error: 'INVALID_CODE' },
        { status: 400 }
      )
    }

    // JWT 토큰 발급
    const token = await generateJWT(userId)

    return NextResponse.json({
      success: true,
      token
    })
  } catch (error) {
    console.error('2FA verify error:', error)
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
```

---

## 리스크 및 대응 방안

### 리스크 1: 시간 동기화 문제
- **영향도**: HIGH
- **대응**:
  - ±30초 시간 창 허용 (RFC 6238 표준)
  - NTP 서버 동기화 권장 (서버 측)
  - 사용자 안내 문서 제공 (디바이스 시간 확인)

### 리스크 2: Secret 유출
- **영향도**: CRITICAL
- **대응**:
  - Secret 암호화 저장 (AES-256-GCM)
  - 환경 변수로 암호화 키 관리
  - QR 코드 표시 후 즉시 삭제 (DB에는 암호화된 secret만 저장)

### 리스크 3: 백업 코드 분실
- **영향도**: HIGH
- **대응**:
  - 백업 코드 재생성 기능 제공
  - 이메일로 임시 로그인 링크 제공 (AUTH-001 연동)
  - 관리자 수동 해제 기능

### 리스크 4: TOTP 앱 분실/삭제
- **영향도**: HIGH
- **대응**:
  - 백업 코드 10개 제공
  - 비밀번호 재설정 후 2FA 비활성화 가능
  - 고객 지원 채널 안내

---

## 테스트 전략

### 단위 테스트 (Unit Tests)
- TOTPService.generateSecret()
- TOTPService.verifyToken()
- BackupCodeService.generateCodes()
- BackupCodeService.verifyCode()
- CryptoService.encrypt() / decrypt()

### 통합 테스트 (Integration Tests)
- 2FA 설정 전체 플로우 (setup → verify-setup)
- TOTP 검증 실패 5회 시 계정 잠금 (AUTH-004 연동)
- 백업 코드 사용 후 재사용 방지

### E2E 테스트 (Playwright)
- 사용자가 2FA 설정 → QR 코드 스캔 → TOTP 입력 → 로그인 전체 플로우
- 백업 코드로 로그인
- 2FA 비활성화

---

## 완료 기준 (Definition of Done)

- [ ] 데이터베이스 테이블 생성 완료
- [ ] TOTP 생성/검증 API 구현 완료
- [ ] 백업 코드 생성/검증 API 구현 완료
- [ ] QR 코드 생성 및 표시 UI 구현
- [ ] 로그인 2단계 TOTP 입력 페이지 구현
- [ ] Secret 암호화 저장 구현
- [ ] 단위 테스트 커버리지 80% 이상
- [ ] E2E 테스트 시나리오 3개 이상 통과
- [ ] 보안 체크리스트 100% 준수
- [ ] 문서화 완료 (사용자 가이드, API 문서)

---

**문서 끝**
