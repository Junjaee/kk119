---
id: AUTH-004
version: 0.0.1
status: draft
title: 계정 잠금 및 자동 해제 - 구현 계획
---

# SPEC-AUTH-004: 계정 잠금 및 자동 해제 - 구현 계획

## 개요

계정 잠금 및 자동 해제 시스템의 구현 계획서입니다.
5회 실패 시 자동 잠금, 30분 후 자동 해제, 관리자 수동 해제를 포함합니다.

---

## 구현 우선순위

### 1차 목표: 핵심 계정 잠금 기능
- 데이터베이스 스키마 생성 (failed_login_attempts, account_locks)
- 실패 시도 추적 로직
- 5회 실패 시 자동 잠금
- 계정 잠금 이메일 발송

### 2차 목표: 자동 해제 및 UI
- Cron Job으로 30분 후 자동 해제
- 잠긴 계정 로그인 시도 시 에러 메시지 표시
- 남은 잠금 시간 표시

### 3차 목표: 관리자 기능
- 관리자 수동 해제 API
- 계정 잠금 이력 조회 UI

---

## 기술적 접근 방법

### 아키텍처 설계

```
Client (Browser)
    ↓
Login API (/api/auth/login)
    ↓
FailedAttemptTracker
    ├─ 실패 시도 기록
    ├─ 5회 체크
    └─ AccountLockService 호출
    ↓
AccountLockService
    ├─ 계정 잠금
    ├─ 이메일 발송
    └─ 로그 기록
    ↓
Cron Job (매 5분)
    └─ unlockExpiredAccounts()
```

### 핵심 모듈 구조

#### 1. FailedAttemptTracker (`lib/auth/failed-attempt-tracker.ts`)
```typescript
interface FailedAttemptTracker {
  // 실패 시도 기록
  recordFailure(userId: number, ipAddress: string): Promise<void>

  // 최근 5분 내 실패 횟수 조회
  getRecentFailures(userId: number): Promise<number>

  // 실패 시도 기록 삭제 (로그인 성공 시)
  clearFailures(userId: number): Promise<void>
}
```

#### 2. AccountLockService (`lib/auth/account-lock-service.ts`)
```typescript
interface AccountLockService {
  // 계정 잠금
  lockAccount(userId: number, reason: string): Promise<void>

  // 계정 잠금 여부 확인
  isLocked(userId: number): Promise<boolean>

  // 자동 해제 (Cron Job)
  unlockExpiredAccounts(): Promise<number>

  // 관리자 수동 해제
  unlockByAdmin(userId: number, adminId: number, reason: string): Promise<void>
}
```

---

## 완료 기준 (Definition of Done)

- [ ] 데이터베이스 테이블 생성 완료
- [ ] 실패 시도 추적 로직 구현
- [ ] 5회 실패 시 자동 잠금 구현
- [ ] 30분 후 자동 해제 Cron Job 구현
- [ ] 계정 잠금 이메일 발송
- [ ] 단위 테스트 커버리지 80% 이상
- [ ] E2E 테스트 시나리오 3개 이상 통과
- [ ] 문서화 완료

---

**문서 끝**
