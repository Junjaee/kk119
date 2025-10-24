# Implementation Plan - SPEC-AUTH-004

## 개요

**SPEC ID:** AUTH-004
**제목:** 세션 지속성 및 역할별 토큰 감지 수정
**우선순위:** Critical
**복잡도:** Medium
**예상 영향 범위:** auth-sync.ts, storage.ts, auth/me API, auth-provider

---

## 구현 전략

### 접근 방식

이 SPEC은 **점진적 개선** 전략을 따릅니다:

1. **Phase 1**: 역할별 토큰 감지 로직 추가 (기존 로직 유지)
2. **Phase 2**: 이중 저장 메커니즘 구현
3. **Phase 3**: 자동 마이그레이션 로직 추가
4. **Phase 4**: 레거시 지원 종료 (6개월 후)

**핵심 원칙:**
- 기존 세션 중단 없음 (Zero Downtime)
- 점진적 롤아웃 (Feature Flag 활용 가능)
- 철저한 테스트 (E2E 시나리오 중심)

---

## 마일스톤

### 1차 목표: 토큰 감지 로직 개선

**범위:** `lib/auth/auth-sync.ts` 수정

**작업 내역:**
- [ ] `detectToken()` 함수 리팩토링
  - [ ] 역할별 키 우선 체크 로직 추가
  - [ ] 레거시 키 폴백 로직 유지
  - [ ] 쿠키 폴백 로직 추가 (서버 사이드)

- [ ] `isValidToken()` 함수 강화
  - [ ] JWT 구조 검증 (3-part dot-separated)
  - [ ] 만료 시간 검증 (`exp` claim)
  - [ ] 역할 일치 검증 (`role` claim)

**완료 기준:**
- 모든 역할(super_admin, association_admin, lawyer, teacher)에서 토큰 감지 성공
- 레거시 `token` 키 사용자도 정상 작동
- 단위 테스트 통과 (detectToken, isValidToken)

---

### 2차 목표: 이중 저장 메커니즘 구현

**범위:** `lib/auth/storage.ts`, `lib/auth/auth-sync.ts`

**작업 내역:**
- [ ] `storeToken()` 함수 구현
  - [ ] 역할별 키 저장 (`{role}_token`)
  - [ ] 레거시 키 저장 (`token`)
  - [ ] HTTP-only 쿠키 설정 (서버 사이드)

- [ ] `clearAllTokens()` 함수 구현
  - [ ] 모든 역할별 키 제거
  - [ ] 레거시 키 제거
  - [ ] 쿠키 제거

**완료 기준:**
- 로그인 시 두 위치(role-specific + legacy)에 토큰 저장 확인
- 로그아웃 시 모든 토큰 완전 제거 확인
- localStorage 검사 도구로 수동 검증

---

### 3차 목표: 자동 마이그레이션 로직

**범위:** `lib/auth/storage.ts`

**작업 내역:**
- [ ] `migrateTokenToRoleKey()` 함수 구현
  - [ ] 레거시 키에서 토큰 읽기
  - [ ] 토큰에서 역할 추출 (`role` claim)
  - [ ] 역할별 키에 토큰 저장
  - [ ] 마이그레이션 로그 기록

- [ ] `detectToken()` 내부에 마이그레이션 로직 통합
  - [ ] 레거시 키 발견 시 자동 마이그레이션 트리거
  - [ ] 마이그레이션 후 역할별 키에서 재검증

**완료 기준:**
- 레거시 키만 존재하는 세션이 자동으로 역할별 키로 전환
- 마이그레이션 성공률 100% (에러 핸들링 포함)
- 마이그레이션 로그 `.moai/logs/token-migration.log`에 기록

---

### 4차 목표: 세션 복원 강화

**범위:** `components/providers/auth-provider.tsx`, `app/api/auth/me/route.ts`

**작업 내역:**
- [ ] `AuthProvider` 초기화 로직 수정
  - [ ] 페이지 로드 시 `detectToken()` 호출
  - [ ] 토큰 발견 시 `/api/auth/me` 호출하여 세션 복원
  - [ ] 서버 응답 기반 사용자 상태 업데이트

- [ ] `/api/auth/me` 엔드포인트 개선
  - [ ] 쿠키 토큰 우선 체크
  - [ ] Authorization 헤더 폴백
  - [ ] 토큰 유효성 서버 사이드 검증

**완료 기준:**
- 페이지 새로고침 시 로그인 상태 유지 (모든 역할)
- 브라우저 재시작 후 세션 복원 (토큰 유효 기간 내)
- E2E 테스트 통과 (Playwright 시나리오)

---

## 기술적 접근 방법

### 토큰 감지 우선순위 설계

```typescript
// 우선순위 체인: Role Key > Legacy Key > Cookie
const tokenSources = [
  { type: 'role-specific', key: `${role}_token`, storage: 'localStorage' },
  { type: 'legacy', key: 'token', storage: 'localStorage' },
  { type: 'cookie', key: 'auth_token', storage: 'cookie' }
];

for (const source of tokenSources) {
  const token = getFromStorage(source.storage, source.key);
  if (token && isValidToken(token)) {
    return { token, source: source.type };
  }
}
```

### 이중 저장 트랜잭션

```typescript
// 원자적 저장: 두 키 모두 성공하거나 모두 롤백
function atomicStoreToken(role: UserRole, token: string): void {
  const roleKey = `${role}_token`;

  try {
    // Transaction start
    const backup = {
      roleKey: localStorage.getItem(roleKey),
      legacyKey: localStorage.getItem('token')
    };

    // Write operations
    localStorage.setItem(roleKey, token);
    localStorage.setItem('token', token);

    // Verify writes
    if (localStorage.getItem(roleKey) !== token ||
        localStorage.getItem('token') !== token) {
      throw new Error('Storage verification failed');
    }
  } catch (error) {
    // Rollback on failure
    if (backup.roleKey) localStorage.setItem(roleKey, backup.roleKey);
    if (backup.legacyKey) localStorage.setItem('token', backup.legacyKey);
    throw error;
  }
}
```

### 마이그레이션 로그 구조

```typescript
interface MigrationLog {
  timestamp: string;
  userId: string;
  role: UserRole;
  fromKey: 'token';
  toKey: string; // e.g., 'super_admin_token'
  success: boolean;
  error?: string;
}

function logMigration(log: MigrationLog): void {
  // Append to .moai/logs/token-migration.log
  const logLine = JSON.stringify({
    ...log,
    timestamp: new Date().toISOString()
  });

  appendToFile('.moai/logs/token-migration.log', logLine + '\n');
}
```

---

## 아키텍처 설계

### 모듈 구조

```
lib/auth/
├── auth-sync.ts          # 토큰 동기화 메인 로직
│   ├── detectToken()     # [수정] 역할별 우선 감지
│   ├── syncToken()       # [수정] 이중 저장 호출
│   └── clearSession()    # [수정] 모든 토큰 제거
│
├── storage.ts            # 저장소 관리 유틸리티
│   ├── storeToken()      # [신규] 이중 저장 구현
│   ├── clearAllTokens()  # [신규] 완전 제거
│   └── migrateToken()    # [신규] 자동 마이그레이션
│
└── validation.ts         # 토큰 검증 로직
    ├── isValidToken()    # [강화] JWT 구조 + 만료 + 역할
    └── validateClaims()  # [신규] Claims 검증
```

### 데이터 흐름

```
[Page Load] → [AuthProvider Init]
                    ↓
            [detectToken(role)]
                    ↓
        ┌───────────┴───────────┐
        ↓                       ↓
[Role-Specific Key]      [Legacy Key]
        ↓                       ↓
   [Found?]                [Found?]
        ↓                       ↓
        YES → [Validate] → [Restore Session]
        NO  → [Next Source]
                    ↓
            [Cookie Fallback]
                    ↓
            [Found & Valid?]
                    ↓
        YES → [Sync to localStorage] → [Restore]
        NO  → [Redirect to Login]
```

---

## 테스트 전략

### 단위 테스트

**파일:** `lib/auth/__tests__/token-detection.test.ts`

```typescript
describe('Token Detection', () => {
  it('should detect token from role-specific key first', () => {
    localStorage.setItem('super_admin_token', 'valid_token_1');
    localStorage.setItem('token', 'valid_token_2');

    const token = detectToken('super_admin');
    expect(token).toBe('valid_token_1');
  });

  it('should fallback to legacy key if role key missing', () => {
    localStorage.setItem('token', 'legacy_token');

    const token = detectToken('lawyer');
    expect(token).toBe('legacy_token');
  });

  it('should migrate legacy token to role key', () => {
    localStorage.setItem('token', 'legacy_token');

    detectToken('teacher');

    expect(localStorage.getItem('teacher_token')).toBe('legacy_token');
  });
});
```

### 통합 테스트

**파일:** `app/api/auth/__tests__/session-restore.test.ts`

```typescript
describe('Session Restoration', () => {
  it('should restore session on page refresh', async () => {
    // 1. Login
    await login('super_admin@test.com', 'password');

    // 2. Verify token stored
    expect(localStorage.getItem('super_admin_token')).toBeTruthy();

    // 3. Simulate page refresh
    window.location.reload();

    // 4. Wait for session restore
    await waitFor(() => {
      expect(screen.getByText('Super Admin Dashboard')).toBeInTheDocument();
    });
  });
});
```

### E2E 테스트 (Playwright)

**파일:** `e2e/auth/session-persistence.spec.ts`

```typescript
test('session persists across page refresh', async ({ page }) => {
  // Login
  await page.goto('/login');
  await page.fill('input[name="email"]', 'admin@test.com');
  await page.fill('input[name="password"]', 'admin123');
  await page.click('button[type="submit"]');

  // Verify dashboard
  await expect(page).toHaveURL('/admin/dashboard');

  // Refresh page
  await page.reload();

  // Verify still authenticated
  await expect(page).toHaveURL('/admin/dashboard');
  await expect(page.locator('text=Super Admin Dashboard')).toBeVisible();
});

test('session persists across browser restart', async ({ browser }) => {
  const context = await browser.newContext({ storageState: 'state.json' });
  const page = await context.newPage();

  // Login and save state
  await login(page);
  await context.storageState({ path: 'state.json' });
  await context.close();

  // Simulate browser restart
  const newContext = await browser.newContext({ storageState: 'state.json' });
  const newPage = await newContext.newPage();

  await newPage.goto('/admin/dashboard');

  // Verify session restored
  await expect(newPage.locator('text=Super Admin Dashboard')).toBeVisible();
});
```

---

## 리스크 및 대응 방안

### Risk 1: localStorage 사용 불가 환경

**시나리오:** 일부 브라우저(프라이빗 모드, 구버전)에서 localStorage 비활성화

**대응 방안:**
- Graceful degradation: 쿠키 전용 모드로 폴백
- 세션 스토리지 임시 활용
- 사용자에게 브라우저 설정 안내 메시지 표시

**코드 예시:**
```typescript
function isLocalStorageAvailable(): boolean {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
}

if (!isLocalStorageAvailable()) {
  // Fallback to cookie-only mode
  useCookieOnlyAuth();
}
```

### Risk 2: 다중 탭 동기화 이슈

**시나리오:** 한 탭에서 로그아웃 시 다른 탭은 여전히 인증 상태

**대응 방안:**
- `storage` 이벤트 리스너 구현
- 토큰 제거 감지 시 모든 탭에서 로그아웃 트리거

**코드 예시:**
```typescript
window.addEventListener('storage', (event) => {
  if (event.key === 'token' && event.newValue === null) {
    // Token removed in another tab
    clearSession();
    redirectToLogin();
  }
});
```

### Risk 3: 마이그레이션 무한 루프

**시나리오:** 마이그레이션 로직 버그로 인한 반복 실행

**대응 방안:**
- 마이그레이션 완료 플래그 (`_migrated` key)
- 최대 재시도 횟수 제한 (3회)
- 에러 발생 시 마이그레이션 중단 및 로그

**코드 예시:**
```typescript
function migrateTokenSafely(role: UserRole): void {
  const migrationKey = `_migration_${role}`;
  const attempts = parseInt(localStorage.getItem(migrationKey) || '0');

  if (attempts >= 3) {
    console.error('Migration failed after 3 attempts');
    return;
  }

  try {
    migrateToken(role);
    localStorage.setItem(migrationKey, '999'); // Success marker
  } catch (error) {
    localStorage.setItem(migrationKey, (attempts + 1).toString());
    throw error;
  }
}
```

---

## 성능 최적화

### 토큰 캐싱

**문제:** 매 페이지 로드마다 localStorage 읽기 오버헤드

**해결 방안:**
- 메모리 내 토큰 캐시 (5분 TTL)
- 캐시 무효화 조건: 로그인/로그아웃/토큰 갱신

```typescript
let tokenCache: { token: string; expiry: number } | null = null;

function getCachedToken(role: UserRole): string | null {
  if (tokenCache && tokenCache.expiry > Date.now()) {
    return tokenCache.token;
  }

  const token = detectToken(role);
  if (token) {
    tokenCache = {
      token,
      expiry: Date.now() + 5 * 60 * 1000 // 5 minutes
    };
  }

  return token;
}
```

### 지연 로딩

**문제:** 페이지 로드 시 동기 토큰 검증으로 인한 렌더링 지연

**해결 방안:**
- 비동기 세션 복원
- Skeleton UI 표시 (로딩 중)

```typescript
async function restoreSessionAsync(role: UserRole): Promise<void> {
  const token = await Promise.resolve(detectToken(role));

  if (token) {
    const user = await fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => res.json());

    setAuthState({ user, token });
  }
}
```

---

## 보안 고려사항

### 토큰 암호화

**요구사항:** localStorage에 저장 시 토큰 평문 노출 방지

**구현:**
- AES-256-GCM 암호화 (Web Crypto API)
- 브라우저별 고유 키 (fingerprint 기반)

```typescript
async function encryptToken(token: string): Promise<string> {
  const key = await getEncryptionKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(token)
  );

  return btoa(iv + new Uint8Array(encrypted));
}
```

### Rate Limiting

**요구사항:** 토큰 갱신 요청 과다 방지

**구현:**
- 클라이언트 측: 1분당 최대 1회 갱신
- 서버 측: IP당 분당 5회 제한

```typescript
const refreshAttempts = new Map<string, number>();

function canRefreshToken(userId: string): boolean {
  const lastAttempt = refreshAttempts.get(userId) || 0;
  const now = Date.now();

  if (now - lastAttempt < 60000) { // 1 minute
    return false;
  }

  refreshAttempts.set(userId, now);
  return true;
}
```

---

## 배포 전략

### Feature Flag

**단계적 롤아웃:**
1. Week 1: 내부 테스트 (10% 트래픽)
2. Week 2: 베타 사용자 (30% 트래픽)
3. Week 3: 전체 사용자 (100% 트래픽)

```typescript
const FEATURE_FLAG = {
  ROLE_BASED_TOKEN_DETECTION: process.env.NEXT_PUBLIC_FEATURE_ROLE_TOKENS === 'true'
};

function detectToken(role: UserRole): string | null {
  if (FEATURE_FLAG.ROLE_BASED_TOKEN_DETECTION) {
    return detectTokenV2(role); // New logic
  }
  return detectTokenV1(); // Legacy logic
}
```

### 롤백 계획

**조건:** 에러율 5% 초과 시 자동 롤백

```bash
# Monitor error rate
if [ $(error_rate) -gt 5 ]; then
  # Rollback feature flag
  export NEXT_PUBLIC_FEATURE_ROLE_TOKENS=false

  # Restart service
  pm2 restart kk119
fi
```

---

## 완료 기준 (Definition of Done)

- [ ] 모든 마일스톤 작업 완료
- [ ] 단위 테스트 커버리지 90% 이상
- [ ] E2E 테스트 모든 시나리오 통과
- [ ] 코드 리뷰 승인 (최소 2명)
- [ ] 성능 테스트 통과 (토큰 감지 < 200ms)
- [ ] 보안 감사 완료 (XSS, CSRF 검증)
- [ ] 프로덕션 배포 및 모니터링 48시간
- [ ] 에러율 < 1%, 세션 복원 성공률 > 99%

---

**End of Implementation Plan**
