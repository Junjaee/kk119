---
id: AUTH-002
version: 0.0.1
status: draft
created: 2025-10-17
updated: 2025-10-17
author: @spec-builder
priority: critical
category: security
labels:
  - authentication
  - server-validation
  - jwt-verification
  - role-guard
depends_on:
  - AUTH-001
---

# @SPEC:AUTH-002: 서버 측 역할 검증 강화

## HISTORY

### v0.0.1 (2025-10-17)
- **INITIAL**: 서버 측 역할 검증 강화 명세 작성
- **AUTHOR**: @spec-builder
- **SCOPE**: 모든 API 엔드포인트에서 JWT 역할과 DB 역할 일치 검증
- **PROBLEM**: 클라이언트 토큰만으로 인증하여 역할 위조 가능성 존재

---

## Environment (환경)

### 시스템 환경
- **Framework**: Next.js 14 (App Router, API Routes)
- **Language**: TypeScript
- **Runtime**: Node.js 18+
- **Database**: SQLite (kyokwon119.db, consult.db)
- **Authentication**: JWT (JSON Web Token)
- **Middleware**: Next.js Middleware

### 관련 파일
- `middleware.ts` - Next.js 미들웨어 (라우트 보호)
- `app/api/auth/me/route.ts` - 사용자 정보 조회 API
- `app/api/auth/login/route.ts` - 로그인 API
- `lib/middleware/auth-guard.ts` (신규) - 역할 기반 가드
- `lib/middleware/jwt-verifier.ts` (신규) - JWT 검증 유틸리티
- `lib/db/*.ts` - 데이터베이스 레이어

### 전제 조건
- JWT 기반 로그인 시스템 구현 완료
- SQLite 데이터베이스에 users 테이블 존재
- 4개 역할(teacher, lawyer, admin, super_admin) 정의 완료
- SPEC-AUTH-001 구현 완료 (클라이언트 토큰 격리)

---

## Assumptions (가정)

1. **단일 진실 공급원 (Single Source of Truth)**: 사용자 역할의 최종 진실은 데이터베이스에 있으며, JWT 토큰의 역할은 캐시로 간주
2. **Zero Trust**: 클라이언트에서 전송된 JWT 토큰은 절대 신뢰하지 않으며 항상 DB와 대조 검증
3. **토큰 위조 가능성**: 악의적 사용자가 JWT 토큰을 수정하여 다른 역할로 위장 시도 가능
4. **역할 변경 시나리오**: 관리자가 사용자 역할을 변경한 경우 즉시 반영되어야 함
5. **성능 vs 보안**: 모든 API 요청마다 DB 조회는 성능 영향이 있지만 보안이 우선

---

## Requirements (요구사항)

### Ubiquitous Requirements (필수 기능)

1. **JWT 역할과 DB 역할 일치 검증**
   - 시스템은 모든 보호된 API 엔드포인트에서 JWT의 역할과 DB의 역할을 대조해야 한다
   - 시스템은 역할 불일치 발견 시 즉시 401 Unauthorized 응답을 반환해야 한다
   - 시스템은 역할 불일치 시 클라이언트 토큰을 무효화해야 한다

2. **역할별 라우트 가드**
   - 시스템은 각 API 엔드포인트에 허용된 역할 목록을 명시해야 한다
   - 시스템은 허용되지 않은 역할의 접근 시 403 Forbidden 응답을 반환해야 한다
   - 시스템은 라우트 가드를 선언적으로 적용할 수 있어야 한다

3. **JWT 무결성 검증**
   - 시스템은 JWT 서명을 검증해야 한다
   - 시스템은 JWT 만료 시간을 검증해야 한다
   - 시스템은 JWT 발급자(issuer)를 검증해야 한다
   - 시스템은 JWT 페이로드의 필수 필드(userId, email, role)를 검증해야 한다

### Event-driven Requirements (이벤트 기반)

1. **API 요청 시**
   - WHEN 보호된 API 엔드포인트에 요청이 들어오면, 시스템은 JWT를 추출하고 검증해야 한다
   - WHEN JWT 검증이 성공하면, 시스템은 DB에서 사용자 정보를 조회해야 한다
   - WHEN DB 역할과 JWT 역할이 일치하면, 시스템은 요청을 처리해야 한다

2. **역할 불일치 발견 시**
   - WHEN JWT 역할과 DB 역할이 불일치하면, 시스템은 즉시 세션을 종료해야 한다
   - WHEN 역할 불일치가 발견되면, 시스템은 보안 로그를 기록해야 한다
   - WHEN 역할 불일치가 발견되면, 시스템은 X-Auth-Reset 헤더를 응답에 포함해야 한다

3. **JWT 무효 발견 시**
   - WHEN JWT 서명이 무효하면, 시스템은 401 Unauthorized를 반환해야 한다
   - WHEN JWT가 만료되었으면, 시스템은 토큰 갱신을 요구해야 한다
   - WHEN JWT 페이로드가 불완전하면, 시스템은 즉시 거부해야 한다

### State-driven Requirements (상태 기반)

1. **인증된 상태**
   - WHILE 사용자가 인증된 상태일 때, 시스템은 매 요청마다 역할 일치성을 검증해야 한다
   - WHILE 사용자 역할이 변경된 상태일 때, 시스템은 기존 JWT를 무효로 처리해야 한다

2. **비인증 상태**
   - WHILE JWT가 없거나 무효한 상태일 때, 시스템은 공개 엔드포인트만 허용해야 한다

### Optional Features (선택 기능)

1. **역할 캐싱**
   - WHERE 동일 토큰으로 반복 요청이 발생하면, 시스템은 DB 조회를 최적화할 수 있다
   - WHERE 캐시 유효 시간은 5분을 초과하지 않아야 한다

2. **보안 로깅**
   - WHERE 역할 불일치가 발견되면, 시스템은 상세 로그를 남길 수 있다
   - WHERE 반복적인 무효 토큰 시도가 발견되면, 시스템은 경고를 발생시킬 수 있다

### Constraints (제약사항)

1. **보안 제약**
   - IF JWT 역할과 DB 역할이 불일치하면, 시스템은 무조건 요청을 거부해야 한다
   - IF 사용자가 DB에 존재하지 않으면, 시스템은 즉시 세션을 종료해야 한다

2. **성능 제약**
   - DB 역할 조회 시간은 100ms를 초과하지 않아야 한다
   - 역할 검증으로 인한 API 응답 지연은 50ms 이하여야 한다

3. **코드 품질 제약**
   - 역할 검증 로직은 중복 없이 재사용 가능해야 한다
   - 모든 API 엔드포인트는 역할 가드를 명시적으로 선언해야 한다

---

## Technical Design (기술 설계)

### JWT 검증 유틸리티

```typescript
// @CODE:AUTH-002-JWT | SPEC: SPEC-AUTH-002.md
// lib/middleware/jwt-verifier.ts

import jwt from 'jsonwebtoken';
import { UserRole } from '@/lib/types';

export interface JWTPayload {
  userId: number;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

export class JWTVerifier {
  private secret: string;

  constructor(secret: string) {
    this.secret = secret;
  }

  /**
   * Verify JWT and extract payload
   */
  verify(token: string): JWTPayload | null {
    try {
      const payload = jwt.verify(token, this.secret) as JWTPayload;

      // Validate required fields
      if (!payload.userId || !payload.email || !payload.role) {
        console.error('[JWT-VERIFIER] Missing required fields in JWT');
        return null;
      }

      return payload;
    } catch (error) {
      console.error('[JWT-VERIFIER] JWT verification failed:', error);
      return null;
    }
  }

  /**
   * Check if token is expired
   */
  isExpired(payload: JWTPayload): boolean {
    return payload.exp * 1000 < Date.now();
  }
}
```

### 역할 기반 가드

```typescript
// @CODE:AUTH-002-GUARD | SPEC: SPEC-AUTH-002.md
// lib/middleware/auth-guard.ts

import { NextRequest, NextResponse } from 'next/server';
import { JWTVerifier, JWTPayload } from './jwt-verifier';
import { getUserById } from '@/lib/db/user-repository';
import { UserRole } from '@/lib/types';

export interface AuthGuardOptions {
  allowedRoles: UserRole[];
  requireEmailVerification?: boolean;
}

export class AuthGuard {
  private jwtVerifier: JWTVerifier;

  constructor(jwtSecret: string) {
    this.jwtVerifier = new JWTVerifier(jwtSecret);
  }

  /**
   * Verify request and check role authorization
   */
  async verify(
    request: NextRequest,
    options: AuthGuardOptions
  ): Promise<{ authorized: boolean; user: any | null; error?: string }> {
    // 1. Extract JWT from Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return { authorized: false, user: null, error: 'Missing or invalid Authorization header' };
    }

    const token = authHeader.substring(7);

    // 2. Verify JWT signature and expiration
    const jwtPayload = this.jwtVerifier.verify(token);
    if (!jwtPayload) {
      return { authorized: false, user: null, error: 'Invalid JWT token' };
    }

    if (this.jwtVerifier.isExpired(jwtPayload)) {
      return { authorized: false, user: null, error: 'JWT token expired' };
    }

    // 3. Fetch user from database
    const user = await getUserById(jwtPayload.userId);
    if (!user) {
      return { authorized: false, user: null, error: 'User not found in database' };
    }

    // 4. CRITICAL: Verify JWT role matches DB role
    if (jwtPayload.role !== user.role) {
      console.error('[AUTH-GUARD] Role mismatch detected', {
        jwtRole: jwtPayload.role,
        dbRole: user.role,
        userId: user.id,
        email: user.email,
      });
      return { authorized: false, user: null, error: 'Role mismatch - session invalidated' };
    }

    // 5. Check if user role is allowed for this endpoint
    if (!options.allowedRoles.includes(user.role as UserRole)) {
      return { authorized: false, user: null, error: 'Forbidden - insufficient permissions' };
    }

    // 6. Optional: Check email verification
    if (options.requireEmailVerification && !user.isVerified) {
      return { authorized: false, user: null, error: 'Email verification required' };
    }

    return { authorized: true, user };
  }
}
```

### API 엔드포인트 통합

```typescript
// @CODE:AUTH-002-API | SPEC: SPEC-AUTH-002.md
// app/api/admin/users/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { AuthGuard } from '@/lib/middleware/auth-guard';

const authGuard = new AuthGuard(process.env.JWT_SECRET!);

export async function GET(request: NextRequest) {
  // Role-based authorization
  const { authorized, user, error } = await authGuard.verify(request, {
    allowedRoles: ['admin', 'super_admin'],
    requireEmailVerification: true,
  });

  if (!authorized) {
    return NextResponse.json(
      { error },
      {
        status: error?.includes('Forbidden') ? 403 : 401,
        headers: {
          'X-Auth-Reset': error?.includes('mismatch') ? 'true' : 'false',
        },
      }
    );
  }

  // Process request with verified user
  return NextResponse.json({ user, data: [] });
}
```

---

## Traceability (@TAG)

- **SPEC**: @SPEC:AUTH-002
- **TEST**: `__tests__/api/auth-guard.test.ts` (예정)
- **CODE**:
  - `lib/middleware/jwt-verifier.ts` (신규)
  - `lib/middleware/auth-guard.ts` (신규)
  - `app/api/*/route.ts` (수정 - 모든 보호된 API)
- **DOC**: `.moai/specs/SPEC-AUTH-002/`
- **RELATED**:
  - @SPEC:AUTH-001 (역할별 토큰 격리)
  - @SPEC:AUTH-003 (클라이언트 상태 동기화)

---

## Success Criteria (성공 기준)

### 기능 완성도
- [ ] JWT 역할과 DB 역할 일치 검증 구현
- [ ] 역할 불일치 시 즉시 세션 종료
- [ ] 역할별 라우트 가드 선언적 적용
- [ ] JWT 서명/만료/페이로드 검증
- [ ] X-Auth-Reset 헤더 응답 포함

### 품질 기준
- [ ] 테스트 커버리지 95% 이상
- [ ] 모든 API 엔드포인트에 가드 적용
- [ ] TypeScript 타입 안정성 100%
- [ ] 순환 의존성 없음

### 성능 기준
- [ ] DB 역할 조회 시간 < 100ms
- [ ] 역할 검증으로 인한 지연 < 50ms
- [ ] 메모리 누수 없음

### 보안 기준
- [ ] JWT 서명 검증 100% 통과
- [ ] 역할 불일치 탐지율 100%
- [ ] 무효 토큰 거부율 100%

---

## Dependencies (의존성)

### 기술 의존성
- Next.js 14 (API Routes)
- jsonwebtoken 라이브러리
- SQLite 데이터베이스
- TypeScript 5.x

### SPEC 의존성
- **선행**: @SPEC:AUTH-001 (역할별 토큰 격리)
- **연관**: @SPEC:AUTH-003 (클라이언트 상태 동기화)

### 선행 조건
- JWT_SECRET 환경변수 설정
- users 테이블에 role 컬럼 존재
- UserRole 타입 정의 완료

---

## Risk Analysis (리스크 분석)

### 높은 리스크
1. **성능 저하**: 모든 요청마다 DB 조회로 인한 지연
   - **완화**: 역할 캐싱 (5분 TTL), DB 인덱스 최적화

2. **역할 변경 시 기존 JWT 유효**: 관리자가 역할 변경해도 기존 JWT는 유효
   - **완화**: 역할 불일치 즉시 감지 및 세션 종료

### 중간 리스크
1. **JWT 검증 실패 시 UX 저하**: 사용자가 갑자기 로그아웃됨
   - **완화**: X-Auth-Reset 헤더로 클라이언트에게 재로그인 유도

2. **DB 조회 실패 시 서비스 중단**: DB 장애 시 모든 요청 실패
   - **완화**: DB 연결 재시도 로직, 에러 핸들링 강화

---

## Implementation Notes (구현 참고사항)

### 단계별 구현
1. **Phase 1**: JWT 검증 유틸리티 구현 (`jwt-verifier.ts`)
2. **Phase 2**: 역할 기반 가드 구현 (`auth-guard.ts`)
3. **Phase 3**: 핵심 API 엔드포인트에 가드 적용 (`/api/auth/me`, `/api/admin/*`)
4. **Phase 4**: 나머지 API 엔드포인트에 가드 확산 적용
5. **Phase 5**: 테스트 작성 (단위 테스트, 통합 테스트)
6. **Phase 6**: 성능 모니터링 및 최적화

### 테스트 전략
- JWT 검증 테스트: 유효/무효/만료 토큰 케이스
- 역할 일치성 테스트: JWT 역할 vs DB 역할 조합 (4x4 매트릭스)
- 라우트 가드 테스트: 허용/거부 역할 조합
- 성능 테스트: DB 조회 시간, API 응답 지연

### 코드 리뷰 포인트
- 모든 보호된 API에 가드 적용되었는지 확인
- 역할 불일치 시 로그 기록 확인
- JWT 검증 예외 처리 완전성 확인
- 에러 응답 일관성 확인 (401 vs 403)
