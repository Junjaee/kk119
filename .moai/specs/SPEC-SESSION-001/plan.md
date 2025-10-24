# SPEC-SESSION-001 구현 계획서

## 개요

이 문서는 **SPEC-SESSION-001: 세션 영속성 개선**의 구체적인 구현 계획과 기술적 접근 방법을 설명합니다.

---

## 목표

**핵심 목표**: 페이지 새로고침 시 세션 유실 및 ChunkLoadError를 완전히 해결하여 사용자 경험을 향상시킵니다.

**측정 가능한 성과**:
- 페이지 새로고침 후 세션 유지율 100%
- ChunkLoadError 발생률 0%
- 평균 세션 복구 시간 < 100ms

---

## 구현 마일스톤

### 1차 목표: 토큰 이중 저장 메커니즘 구현

**범위**:
- httpOnly 쿠키 기반 백업 시스템
- 로그인 API 응답에 Set-Cookie 헤더 추가
- 클라이언트 localStorage와 쿠키 동시 저장

**구현 파일**:
```
app/api/auth/login/route.ts          # Set-Cookie 응답 헤더 추가
lib/auth/cookie-manager.ts            # 쿠키 설정/읽기 유틸
lib/auth/auth-sync.ts                 # localStorage ↔ 쿠키 동기화
```

**구현 순서**:
1. `cookie-manager.ts` 작성 (서버/클라이언트 쿠키 유틸)
2. 로그인 API 수정 (Set-Cookie 헤더 추가)
3. `auth-sync.ts` 작성 (동기화 로직)
4. 클라이언트 초기화 시 `syncAuthState()` 호출

**의존성**:
- Next.js `cookies()` API (서버 컴포넌트)
- `document.cookie` (클라이언트)

---

### 2차 목표: 서버 사이드 세션 검증 강화

**범위**:
- JWT 검증 로직 서버 사이드 구현
- DB 사용자 존재 여부 확인
- 미들웨어에서 모든 보호된 경로 검증

**구현 파일**:
```
lib/auth/session-verify.ts            # 서버 사이드 토큰 검증
middleware.ts                         # 보호된 경로 검증
app/api/auth/verify/route.ts          # 검증 API 엔드포인트
```

**구현 순서**:
1. `session-verify.ts` 작성 (JWT 검증 + DB 조회)
2. `middleware.ts` 수정 (쿠키 우선 읽기, 검증 호출)
3. `/api/auth/verify` 엔드포인트 추가 (클라이언트 검증용)
4. 에러 처리 및 로그아웃 리디렉션

**의존성**:
- `jsonwebtoken` 라이브러리
- SQLite DB 연결 (kyokwon119.db)

---

### 3차 목표: ChunkLoadError 방지

**범위**:
- 동적 임포트 → 정적 임포트 전환
- 글로벌 에러 핸들러 구현
- 청크 로딩 실패 시 자동 재로딩

**구현 파일**:
```
components/layout/header.tsx          # 정적 임포트로 변경
components/layout/sidebar.tsx         # 정적 임포트로 변경
app/error.tsx                         # 글로벌 에러 핸들러
app/global-error.tsx                  # 루트 에러 핸들러
```

**구현 순서**:
1. 모든 `dynamic()` 사용 제거
2. `error.tsx` 작성 (ChunkLoadError 감지)
3. `global-error.tsx` 작성 (루트 레벨 에러)
4. 자동 재로딩 로직 추가

**의존성**:
- Next.js App Router 에러 경계
- `useEffect` 훅 (클라이언트)

---

### 최종 목표: 세션 복구 로직 최적화

**범위**:
- localStorage → 쿠키 폴백 체인 구현
- 복구 실패 시 graceful degradation
- 역할별 토큰 격리 강화

**구현 파일**:
```
lib/auth/session-recovery.ts          # 세션 복구 로직
app/layout.tsx                        # 초기 세션 복구
hooks/useAuth.ts                      # 클라이언트 인증 훅
```

**구현 순서**:
1. `session-recovery.ts` 작성 (복구 체인 로직)
2. `app/layout.tsx`에서 서버 사이드 복구
3. `useAuth()` 훅에서 클라이언트 복구
4. 복구 실패 시 로그아웃 처리

**의존성**:
- Zustand store (인증 상태 관리)
- Next.js `cookies()` API

---

## 기술적 접근 방법

### 아키텍처 설계

#### 세션 저장 계층
```
┌─────────────────────────────────────────┐
│  Client-side Storage                    │
├─────────────────────────────────────────┤
│  1. localStorage (Primary)              │
│     - teacher_token, lawyer_token, ...  │
│     - Fast access, but volatile         │
│                                          │
│  2. httpOnly Cookie (Backup)            │
│     - Server-side only access           │
│     - Secure, persistent                │
└─────────────────────────────────────────┘
           ↓ Sync ↑
┌─────────────────────────────────────────┐
│  Server-side Validation                 │
├─────────────────────────────────────────┤
│  1. JWT Verification (lib/auth)         │
│  2. DB User Check (SQLite)              │
│  3. Middleware Protection (all routes)  │
└─────────────────────────────────────────┘
```

#### 세션 복구 플로우
```
Page Load
  ↓
Check localStorage
  ↓ (exists)        ↓ (empty)
Use token      Check httpOnly Cookie
                  ↓ (exists)      ↓ (empty)
                Restore token   Redirect to /login
```

### 주요 기술 스택

1. **httpOnly 쿠키 관리**
   - 라이브러리: Native `Set-Cookie` HTTP 헤더
   - 설정: `HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=86400`

2. **JWT 검증**
   - 라이브러리: `jsonwebtoken`
   - 알고리즘: HS256
   - 페이로드: `{ userId, role, exp }`

3. **세션 동기화**
   - 클라이언트: `document.cookie` (쓰기 전용)
   - 서버: `cookies()` API (읽기/쓰기)
   - 동기화 주기: 페이지 로드 시

4. **에러 처리**
   - Next.js Error Boundary
   - `error.tsx` + `global-error.tsx`
   - ChunkLoadError 자동 감지 및 재로딩

---

## 리스크 및 대응 방안

### 리스크 1: httpOnly 쿠키는 JavaScript에서 읽기 불가

**영향도**: 높음

**대응 방안**:
1. 서버 컴포넌트에서 `cookies()` 사용
2. API 라우트를 통한 토큰 전달
3. 클라이언트는 localStorage 우선 사용

**구현 예시**:
```typescript
// app/layout.tsx (서버 컴포넌트)
const cookieStore = cookies();
const token = cookieStore.get('teacher_token')?.value;

// 클라이언트로 전달
<AuthProvider initialToken={token}>
```

---

### 리스크 2: 쿠키 크기 제한 (4KB)

**영향도**: 중간

**대응 방안**:
1. JWT 페이로드 최소화
2. 필수 필드만 포함 (userId, role, exp)
3. 사용자 상세 정보는 DB에서 조회

**JWT 페이로드 예시**:
```json
{
  "userId": 123,
  "role": "teacher",
  "exp": 1729468800
}
```

---

### 리스크 3: SameSite=Strict로 인한 외부 도메인 문제

**영향도**: 낮음 (현재 단일 도메인)

**대응 방안**:
1. 개발 환경: `SameSite=Lax` 사용
2. 프로덕션: `SameSite=Strict` 유지
3. 필요 시 OAuth 리디렉션 고려

---

### 리스크 4: 동시 다중 역할 로그인

**영향도**: 중간

**대응 방안**:
1. 최신 로그인 우선 정책
2. 로그인 시 기존 역할 토큰 클리어
3. 역할 전환 시 명시적 로그아웃 요구

**구현 예시**:
```typescript
// 로그인 시 기존 토큰 클리어
function clearOtherRoleTokens(currentRole: string) {
  const roles = ['teacher', 'lawyer', 'admin'];
  roles.filter(r => r !== currentRole).forEach(role => {
    localStorage.removeItem(`${role}_token`);
    document.cookie = `${role}_token=; Max-Age=0; Path=/`;
  });
}
```

---

## 구현 순서 (Dependency Order)

```
1. cookie-manager.ts (독립)
   ↓
2. session-verify.ts (의존: cookie-manager)
   ↓
3. auth-sync.ts (의존: cookie-manager)
   ↓
4. login/route.ts 수정 (의존: cookie-manager, auth-sync)
   ↓
5. middleware.ts 수정 (의존: session-verify)
   ↓
6. session-recovery.ts (의존: auth-sync, session-verify)
   ↓
7. layout.tsx 수정 (의존: session-recovery)
   ↓
8. error.tsx, global-error.tsx 작성 (독립)
```

---

## 테스트 계획

### Unit Tests (Jest)

**테스트 파일**: `__tests__/lib/auth/`

1. `cookie-manager.test.ts`
   - ✅ 서버 사이드 쿠키 설정
   - ✅ 클라이언트 사이드 쿠키 쓰기
   - ✅ 쿠키 삭제

2. `session-verify.test.ts`
   - ✅ 유효한 JWT 검증
   - ✅ 만료된 JWT 에러
   - ✅ DB 사용자 존재 확인

3. `auth-sync.test.ts`
   - ✅ localStorage → 쿠키 동기화
   - ✅ 쿠키 → localStorage 복구

---

### Integration Tests (Playwright)

**테스트 파일**: `e2e/session-persistence.spec.ts`

1. **시나리오 1: 정상 세션 유지**
   ```typescript
   test('Teacher 로그인 후 새로고침 시 세션 유지', async ({ page }) => {
     await page.goto('/login');
     await page.fill('input[name="username"]', 'teacher1');
     await page.fill('input[name="password"]', 'password123');
     await page.click('button[type="submit"]');

     // 로그인 성공 확인
     await expect(page).toHaveURL('/teacher');

     // 페이지 새로고침
     await page.reload();

     // 여전히 /teacher 페이지에 있어야 함
     await expect(page).toHaveURL('/teacher');
     await expect(page.locator('text=홍길동')).toBeVisible();
   });
   ```

2. **시나리오 2: localStorage 유실 시 쿠키 복구**
   ```typescript
   test('localStorage 클리어 후 쿠키로 세션 복구', async ({ page }) => {
     await page.goto('/login');
     await page.fill('input[name="username"]', 'teacher1');
     await page.fill('input[name="password"]', 'password123');
     await page.click('button[type="submit"]');

     // localStorage 클리어 (쿠키는 유지)
     await page.evaluate(() => localStorage.clear());

     // 페이지 새로고침
     await page.reload();

     // 여전히 세션 유지되어야 함
     await expect(page).toHaveURL('/teacher');
   });
   ```

3. **시나리오 3: ChunkLoadError 자동 복구**
   ```typescript
   test('ChunkLoadError 발생 시 자동 재로딩', async ({ page }) => {
     // ChunkLoadError 시뮬레이션
     await page.route('**/_next/static/chunks/**', route => route.abort());

     await page.goto('/teacher');

     // 에러 발생 후 자동 재로딩 확인
     await page.waitForLoadState('domcontentloaded');
     // 정상 페이지 로드 확인
   });
   ```

---

## 성능 최적화

### 세션 복구 시간 최적화

**목표**: < 100ms

**전략**:
1. 서버 컴포넌트에서 쿠키 읽기 (SSR)
2. 클라이언트 hydration 전 토큰 복구 완료
3. DB 조회 캐싱 (Redis 추후 도입)

### 네트워크 요청 최소화

**목표**: 세션 복구 시 추가 네트워크 요청 0회

**전략**:
1. 서버 사이드에서 JWT 검증 완료
2. 클라이언트로 검증된 사용자 정보 전달
3. 추가 API 호출 불필요

---

## 문서화 계획

### 업데이트 대상 문서

1. **API 문서**
   - `/api/auth/login` 응답 형식 업데이트
   - `Set-Cookie` 헤더 설명 추가

2. **개발자 가이드**
   - httpOnly 쿠키 사용법
   - 세션 복구 플로우 다이어그램

3. **아키텍처 문서**
   - 세션 저장 계층 다이어그램
   - 토큰 복구 순서도

---

## Definition of Done

### 구현 완료 기준
- [x] 모든 마일스톤 코드 작성 완료
- [x] Unit Tests 100% 통과
- [x] E2E Tests 100% 통과
- [x] 코드 리뷰 승인

### 배포 준비 기준
- [ ] 성능 테스트 통과 (세션 복구 < 100ms)
- [ ] 보안 검토 완료 (httpOnly 쿠키 설정)
- [ ] 문서화 완료

---

**작성자**: @claude
**최종 수정**: 2025-10-20
