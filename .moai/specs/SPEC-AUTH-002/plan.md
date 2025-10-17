---
id: AUTH-002
version: 0.0.1
status: draft
created: 2025-10-17
updated: 2025-10-17
---

# SPEC-AUTH-002 구현 계획

## 목표

모든 API 엔드포인트에서 JWT 역할과 데이터베이스 역할을 대조 검증하여 역할 위조를 방지하고, 역할 기반 접근 제어를 강화한다.

---

## 우선순위별 마일스톤

### 1차 목표: JWT 검증 유틸리티 구현

**우선순위**: Critical

**목표**:
- JWT 서명, 만료, 페이로드 검증 함수 구현
- 타입 안전한 JWT 디코딩 및 검증

**산출물**:
- `lib/middleware/jwt-verifier.ts` 신규 생성
- `JWTVerifier` 클래스 구현
- `JWTPayload` 인터페이스 정의

**기술적 접근**:
```typescript
import jwt from 'jsonwebtoken';

export class JWTVerifier {
  constructor(private secret: string) {}

  verify(token: string): JWTPayload | null {
    try {
      const payload = jwt.verify(token, this.secret) as JWTPayload;
      if (!payload.userId || !payload.email || !payload.role) {
        return null;
      }
      return payload;
    } catch (error) {
      return null;
    }
  }

  isExpired(payload: JWTPayload): boolean {
    return payload.exp * 1000 < Date.now();
  }
}
```

**의존성**:
- jsonwebtoken 패키지 설치 필요
- JWT_SECRET 환경변수 설정 필요

---

### 2차 목표: 역할 기반 가드 구현

**우선순위**: Critical

**목표**:
- JWT 검증 + DB 역할 대조 검증
- 역할별 라우트 가드 선언적 적용
- 역할 불일치 시 즉시 세션 종료

**산출물**:
- `lib/middleware/auth-guard.ts` 신규 생성
- `AuthGuard` 클래스 구현
- `AuthGuardOptions` 인터페이스 정의

**기술적 접근**:
```typescript
export class AuthGuard {
  constructor(private jwtVerifier: JWTVerifier) {}

  async verify(
    request: NextRequest,
    options: AuthGuardOptions
  ): Promise<{ authorized: boolean; user: any | null; error?: string }> {
    // 1. Extract JWT
    const token = extractTokenFromHeader(request);
    if (!token) return { authorized: false, user: null, error: 'No token' };

    // 2. Verify JWT
    const jwtPayload = this.jwtVerifier.verify(token);
    if (!jwtPayload) return { authorized: false, user: null, error: 'Invalid JWT' };

    // 3. Fetch user from DB
    const user = await getUserById(jwtPayload.userId);
    if (!user) return { authorized: false, user: null, error: 'User not found' };

    // 4. CRITICAL: Verify role match
    if (jwtPayload.role !== user.role) {
      return { authorized: false, user: null, error: 'Role mismatch' };
    }

    // 5. Check allowed roles
    if (!options.allowedRoles.includes(user.role)) {
      return { authorized: false, user: null, error: 'Forbidden' };
    }

    return { authorized: true, user };
  }
}
```

**의존성**:
- 1차 목표(JWTVerifier) 완료 후 진행
- DB user repository 함수 필요

---

### 3차 목표: 핵심 API 엔드포인트에 가드 적용

**우선순위**: High

**목표**:
- 인증 관련 핵심 API에 역할 가드 적용
- `/api/auth/me`, `/api/admin/*`, `/api/lawyer/*` 보호

**산출물**:
- `app/api/auth/me/route.ts` 수정
- `app/api/admin/*/route.ts` 수정
- `app/api/lawyer/*/route.ts` 수정

**기술적 접근**:
```typescript
// app/api/auth/me/route.ts
import { AuthGuard } from '@/lib/middleware/auth-guard';

const authGuard = new AuthGuard(process.env.JWT_SECRET!);

export async function GET(request: NextRequest) {
  const { authorized, user, error } = await authGuard.verify(request, {
    allowedRoles: ['teacher', 'lawyer', 'admin', 'super_admin'], // 모든 역할 허용
  });

  if (!authorized) {
    return NextResponse.json(
      { error },
      {
        status: 401,
        headers: { 'X-Auth-Reset': error?.includes('mismatch') ? 'true' : 'false' },
      }
    );
  }

  return NextResponse.json({ user });
}
```

**의존성**:
- 2차 목표(AuthGuard) 완료 후 진행

---

### 4차 목표: 나머지 API 엔드포인트에 가드 확산

**우선순위**: High

**목표**:
- 모든 보호된 API 엔드포인트에 역할 가드 적용
- 각 엔드포인트별 허용 역할 명시

**산출물**:
- `app/api/reports/*/route.ts` 수정
- `app/api/consultations/*/route.ts` 수정
- `app/api/notifications/*/route.ts` 수정

**API별 허용 역할 매트릭스**:

| API 엔드포인트                | 허용 역할                  |
|-----------------------------|--------------------------|
| `/api/auth/me`              | 모든 역할                 |
| `/api/reports` (GET)        | 모든 역할                 |
| `/api/reports` (POST)       | teacher                  |
| `/api/admin/*`              | admin, super_admin       |
| `/api/lawyer/consultations` | lawyer                   |
| `/api/teacher/reports`      | teacher                  |

**의존성**:
- 3차 목표 완료 후 진행

---

### 5차 목표: 에러 처리 및 로깅 강화

**우선순위**: Medium

**목표**:
- 역할 불일치 감지 시 상세 로그 기록
- 클라이언트에게 명확한 에러 메시지 제공
- X-Auth-Reset 헤더로 클라이언트 상태 초기화 유도

**산출물**:
- `lib/middleware/auth-logger.ts` (선택)
- 보안 로그 포맷 표준화

**기술적 접근**:
```typescript
function logRoleMismatch(jwtPayload: JWTPayload, dbUser: User) {
  console.error('[AUTH-GUARD] SECURITY ALERT: Role mismatch detected', {
    timestamp: new Date().toISOString(),
    userId: dbUser.id,
    email: dbUser.email,
    jwtRole: jwtPayload.role,
    dbRole: dbUser.role,
    jwtIssuedAt: new Date(jwtPayload.iat * 1000).toISOString(),
    severity: 'HIGH',
  });
}
```

**의존성**:
- 2차 목표 완료 후 진행

---

### 6차 목표: 성능 최적화 (역할 캐싱)

**우선순위**: Low (선택)

**목표**:
- 동일 토큰으로 반복 요청 시 DB 조회 최적화
- 캐시 TTL 5분 설정
- 캐시 무효화 전략 구현

**산출물**:
- `lib/middleware/role-cache.ts` (신규)
- 메모리 기반 LRU 캐시 또는 Redis 캐시

**기술적 접근**:
```typescript
// 메모리 기반 간단한 캐시
const roleCache = new Map<number, { role: UserRole; expiry: number }>();

function getCachedRole(userId: number): UserRole | null {
  const cached = roleCache.get(userId);
  if (!cached) return null;
  if (Date.now() > cached.expiry) {
    roleCache.delete(userId);
    return null;
  }
  return cached.role;
}

function setCachedRole(userId: number, role: UserRole) {
  roleCache.set(userId, {
    role,
    expiry: Date.now() + 5 * 60 * 1000, // 5분 TTL
  });
}
```

**주의사항**:
- 역할 변경 시 캐시 무효화 필수
- 메모리 누수 방지 위해 주기적 정리 필요

**의존성**:
- 2차 목표 완료 후 진행

---

## 기술적 설계 방향

### 아키텍처 원칙

1. **Zero Trust**
   - 클라이언트 토큰은 절대 신뢰하지 않음
   - 데이터베이스가 유일한 진실 공급원

2. **Defense in Depth (다층 방어)**
   - JWT 서명 검증 (1차 방어)
   - JWT 만료 검증 (2차 방어)
   - DB 역할 대조 검증 (3차 방어)
   - 역할 기반 접근 제어 (4차 방어)

3. **Fail-Safe (안전 실패)**
   - 검증 실패 시 무조건 접근 거부
   - 불확실한 상태에서는 세션 종료

### API 응답 표준화

**401 Unauthorized** (인증 실패):
```json
{
  "error": "Invalid JWT token",
  "code": "AUTH_INVALID_TOKEN"
}
```

**403 Forbidden** (권한 부족):
```json
{
  "error": "Forbidden - insufficient permissions",
  "code": "AUTH_FORBIDDEN",
  "requiredRole": ["admin", "super_admin"]
}
```

**역할 불일치** (즉시 세션 종료):
```json
{
  "error": "Role mismatch - session invalidated",
  "code": "AUTH_ROLE_MISMATCH"
}
```
- 헤더: `X-Auth-Reset: true`

---

## 리스크 및 대응 방안

### 리스크 1: 성능 저하 (DB 조회)

**발생 확률**: 높음

**영향도**: 중간

**대응 방안**:
1. **DB 인덱스 최적화**
   ```sql
   CREATE INDEX idx_users_id_role ON users(id, role);
   ```
2. **역할 캐싱 (선택)**
   - 5분 TTL 메모리 캐시
   - 역할 변경 시 캐시 무효화
3. **연결 풀링**
   - SQLite 연결 재사용
   - 연결 풀 크기 최적화

### 리스크 2: 역할 변경 시 기존 JWT 유효

**발생 확률**: 중간

**영향도**: 높음

**대응 방안**:
- 역할 불일치 즉시 감지 및 세션 종료
- X-Auth-Reset 헤더로 클라이언트 재로그인 유도
- (선택) JWT 블랙리스트 또는 토큰 무효화 API 구현

### 리스크 3: DB 장애 시 서비스 중단

**발생 확률**: 낮음

**영향도**: 높음

**대응 방안**:
1. **재시도 로직**
   ```typescript
   async function getUserWithRetry(userId: number, retries = 3) {
     for (let i = 0; i < retries; i++) {
       try {
         return await getUserById(userId);
       } catch (error) {
         if (i === retries - 1) throw error;
         await sleep(100 * Math.pow(2, i)); // Exponential backoff
       }
     }
   }
   ```
2. **읽기 전용 복제본**
   - 역할 조회는 읽기 전용 DB에서 수행

---

## 테스트 계획

### 단위 테스트

**파일**: `__tests__/middleware/jwt-verifier.test.ts`

**테스트 케이스**:
1. 유효한 JWT 검증 성공
2. 서명 불일치 JWT 거부
3. 만료된 JWT 거부
4. 필수 필드 누락 JWT 거부

**파일**: `__tests__/middleware/auth-guard.test.ts`

**테스트 케이스**:
1. JWT 역할 = DB 역할 → 인증 성공
2. JWT 역할 ≠ DB 역할 → 인증 실패
3. 허용 역할 목록에 포함 → 접근 허용
4. 허용 역할 목록에 미포함 → 접근 거부

### 통합 테스트

**파일**: `__tests__/api/auth-guard-integration.test.ts`

**테스트 시나리오**:
1. Teacher JWT로 `/api/reports` (POST) 접근 → 성공
2. Teacher JWT로 `/api/admin/users` 접근 → 403 Forbidden
3. Admin JWT로 `/api/admin/users` 접근 → 성공
4. Teacher로 로그인 → 관리자가 역할을 Lawyer로 변경 → 다음 요청 시 역할 불일치 감지 → 401 Unauthorized

### E2E 테스트

**도구**: Playwright

**시나리오**:
1. Teacher 로그인 → 신고 작성 (성공)
2. Teacher 로그인 → 관리자 페이지 접근 (실패)
3. Admin 로그인 → 사용자 관리 페이지 접근 (성공)
4. Admin 로그인 → 관리자가 Teacher로 역할 변경 → 페이지 새로고침 → 자동 로그아웃

---

## 성공 지표

### 기능 지표
- [ ] JWT 역할 vs DB 역할 검증률: 100%
- [ ] 역할 불일치 감지율: 100%
- [ ] 무효 JWT 거부율: 100%

### 성능 지표
- [ ] DB 역할 조회 시간 < 100ms
- [ ] API 응답 지연 < 50ms (역할 검증으로 인한)
- [ ] 메모리 사용량 증가 < 20MB

### 보안 지표
- [ ] JWT 위조 시도 차단율: 100%
- [ ] 역할 불일치 로그 기록률: 100%
- [ ] X-Auth-Reset 헤더 발송률: 100% (역할 불일치 시)

---

## 배포 전 체크리스트

- [ ] JWT_SECRET 환경변수 설정 완료
- [ ] JWTVerifier 클래스 구현 및 테스트 완료
- [ ] AuthGuard 클래스 구현 및 테스트 완료
- [ ] 모든 보호된 API에 가드 적용 완료
- [ ] 역할별 허용 매트릭스 검증 완료
- [ ] 에러 응답 표준화 완료
- [ ] X-Auth-Reset 헤더 통합 완료
- [ ] 단위 테스트 작성 및 통과
- [ ] 통합 테스트 작성 및 통과
- [ ] E2E 테스트 작성 및 통과
- [ ] 코드 리뷰 완료

---

## 문서화 계획

1. **개발자 문서**
   - `docs/auth/server-validation.md`: 서버 측 역할 검증 원칙
   - `docs/auth/api-guard-usage.md`: AuthGuard 사용 가이드

2. **API 문서**
   - 각 API 엔드포인트별 허용 역할 명시
   - 에러 코드 및 응답 형식 문서화

3. **보안 문서**
   - 역할 불일치 감지 로그 포맷
   - 보안 사고 대응 절차

---

**작성자**: @spec-builder
**최종 수정일**: 2025-10-17
