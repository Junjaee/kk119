---
id: SESSION-001
version: 0.0.1
status: draft
created: 2025-10-20
updated: 2025-10-20
author: @claude
priority: critical
category: bugfix
labels:
  - session
  - auth
  - ux
  - persistence
---

# SPEC-SESSION-001: 세션 영속성 개선

## HISTORY

### v0.0.1 (2025-10-20)
- **INITIAL**: 세션 영속성 개선 명세 최초 작성
- **AUTHOR**: @claude
- **SCOPE**: 페이지 새로고침 시 세션 유실 및 ChunkLoadError 해결
- **CONTEXT**: E2E 테스트 보고서 기반 문제 해결

---

## @TAG:SPEC-SESSION-001 메타데이터

### 추적성 태그
- **@SPEC:SESSION-001** - 세션 영속성 개선 명세
- **@SPEC:AUTH-001** - 하이브리드 인증 시스템 (의존)
- **@DOC:PROBLEM-001** - 핵심 문제 정의 참조

### 우선순위
- **Priority**: CRITICAL
- **Category**: Bugfix
- **Impact**: High (사용자 경험 직접 영향)

### 의존성
- **Depends On**:
  - SPEC-AUTH-001 (JWT 토큰 시스템)
- **Blocks**:
  - SPEC-API-001 (API 헤더 통합)
- **Related**:
  - SPEC-BUILD-001 (Webpack 최적화)

---

## Environment (환경 및 가정사항)

### 시스템 환경
- **Framework**: Next.js 14 App Router
- **Runtime**: Node.js 18+ (Windows ARM)
- **Storage**: localStorage + httpOnly 쿠키 (하이브리드)
- **Database**: SQLite (kyokwon119.db, consult.db)

### 현재 인증 아키텍처
- JWT 토큰 기반 클라이언트 인증
- Role-specific localStorage 키 사용:
  - `admin_token`, `teacher_token`, `lawyer_token`
- Server-side 세션 검증 미흡

### 문제 환경
- **트리거**: 페이지 새로고침 (F5, Ctrl+R)
- **증상**:
  - localStorage 토큰 유실
  - ChunkLoadError 발생
  - 로그인 페이지로 강제 리디렉션
- **영향 범위**: 모든 역할(Teacher, Lawyer, Admin)

---

## Assumptions (전제 조건)

### 기술적 전제
1. **localStorage는 불안정**: 브라우저 설정, 프라이빗 모드, 클리어 등으로 유실 가능
2. **동적 임포트 취약성**: Next.js의 코드 스플리팅으로 인한 청크 로딩 실패
3. **세션 동기화 부재**: 클라이언트와 서버의 세션 상태 불일치

### 비즈니스 전제
1. **세션 유지 필수**: 교사의 신고 작성 중 새로고침 시 데이터 보존 필요
2. **보안과 편의성 균형**: httpOnly 쿠키로 보안 강화, localStorage로 빠른 응답
3. **역할별 격리**: 한 브라우저에서 여러 역할 동시 로그인 방지

---

## Requirements (기능 요구사항)

### Ubiquitous Requirements (기본 기능)
- **REQ-SESSION-001**: 시스템은 페이지 새로고침 시에도 세션을 유지해야 한다
- **REQ-SESSION-002**: 시스템은 httpOnly 쿠키를 세션 백업 수단으로 사용해야 한다
- **REQ-SESSION-003**: 시스템은 서버 사이드 세션 검증을 제공해야 한다
- **REQ-SESSION-004**: 시스템은 동적 임포트로 인한 ChunkLoadError를 방지해야 한다

### Event-driven Requirements (이벤트 기반)
- **REQ-SESSION-005**: WHEN 사용자가 로그인하면, 시스템은 localStorage와 httpOnly 쿠키에 동시에 토큰을 저장해야 한다
- **REQ-SESSION-006**: WHEN 페이지가 로드되면, 시스템은 localStorage → 쿠키 순으로 토큰을 복구해야 한다
- **REQ-SESSION-007**: WHEN ChunkLoadError가 발생하면, 시스템은 자동으로 페이지를 재로딩해야 한다
- **REQ-SESSION-008**: WHEN localStorage가 비어있고 쿠키가 존재하면, 시스템은 쿠키에서 토큰을 복구해야 한다

### State-driven Requirements (상태 기반)
- **REQ-SESSION-009**: WHILE 사용자가 인증된 상태일 때, 시스템은 매 요청마다 서버에서 세션을 검증해야 한다
- **REQ-SESSION-010**: WHILE 토큰이 만료되었을 때, 시스템은 자동으로 로그아웃 처리해야 한다
- **REQ-SESSION-011**: WHILE 페이지가 로딩 중일 때, 시스템은 동적 임포트 대신 정적 임포트를 사용해야 한다

### Optional Features (선택적 기능)
- **OPT-SESSION-001**: WHERE 네트워크가 불안정하면, 시스템은 토큰 복구 재시도를 3회까지 수행할 수 있다
- **OPT-SESSION-002**: WHERE 개발 환경이면, 시스템은 세션 디버깅 로그를 콘솔에 출력할 수 있다

### Constraints (제약사항)
- **CON-SESSION-001**: IF localStorage가 사용 불가능하면, 시스템은 httpOnly 쿠키만으로 세션을 유지해야 한다
- **CON-SESSION-002**: IF httpOnly 쿠키가 없으면, 시스템은 로그아웃 처리해야 한다
- **CON-SESSION-003**: 세션 토큰은 24시간을 초과할 수 없다
- **CON-SESSION-004**: 동시에 2개 이상의 역할 토큰이 존재하면 시스템은 가장 최근 로그인을 우선해야 한다

---

## Specifications (상세 명세)

### 1. 토큰 이중 저장 메커니즘

#### 1.1 로그인 시 저장
```typescript
// POST /api/auth/login
{
  "username": "teacher1",
  "password": "******",
  "role": "teacher"
}

// Response
Set-Cookie: teacher_token={JWT}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=86400
{
  "token": "{JWT}",
  "user": { "id": 1, "role": "teacher", "name": "홍길동" }
}
```

**저장 로직**:
1. 서버: httpOnly 쿠키 설정 (24시간)
2. 클라이언트: localStorage에 `{role}_token` 저장
3. 클라이언트: Zustand store에 user 정보 저장

#### 1.2 페이지 로드 시 복구
```typescript
// app/layout.tsx (서버 컴포넌트)
async function AuthProvider() {
  const cookieStore = cookies();
  const teacherToken = cookieStore.get('teacher_token');
  const lawyerToken = cookieStore.get('lawyer_token');
  const adminToken = cookieStore.get('admin_token');

  // 우선순위: localStorage → httpOnly 쿠키
  const token = localStorage.getItem('teacher_token')
    || teacherToken?.value
    || localStorage.getItem('lawyer_token')
    || lawyerToken?.value
    || localStorage.getItem('admin_token')
    || adminToken?.value;

  if (!token) {
    redirect('/login');
  }

  // 서버 사이드 검증
  const user = await verifyTokenServer(token);
  return <AuthContext.Provider value={user}>...</AuthContext.Provider>;
}
```

### 2. 서버 사이드 세션 검증

#### 2.1 검증 API
```typescript
// lib/auth/session-verify.ts
export async function verifyTokenServer(token: string) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);

    // DB에서 사용자 존재 여부 확인
    const user = await db.query(
      'SELECT id, role, name FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (!user) {
      throw new Error('User not found');
    }

    return { ...decoded, ...user };
  } catch (error) {
    throw new Error('Invalid token');
  }
}
```

#### 2.2 미들웨어 적용
```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 공개 경로 제외
  if (pathname.startsWith('/login') || pathname.startsWith('/api/auth/login')) {
    return NextResponse.next();
  }

  // 토큰 추출 (쿠키 우선)
  const token = request.cookies.get('teacher_token')?.value
    || request.cookies.get('lawyer_token')?.value
    || request.cookies.get('admin_token')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    await verifyTokenServer(token);
    return NextResponse.next();
  } catch (error) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}
```

### 3. ChunkLoadError 방지

#### 3.1 정적 임포트 변경
**Before (동적 임포트)**:
```typescript
const Header = dynamic(() => import('@/components/layout/header'), {
  loading: () => <div>Loading...</div>
});
```

**After (정적 임포트)**:
```typescript
import Header from '@/components/layout/header';

export default function Layout() {
  return <Header />;
}
```

#### 3.2 글로벌 에러 핸들러
```typescript
// app/error.tsx
'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // ChunkLoadError 자동 복구
    if (error.message.includes('ChunkLoadError')) {
      console.warn('ChunkLoadError detected, reloading page...');
      window.location.reload();
    }
  }, [error]);

  return (
    <html>
      <body>
        <h2>오류가 발생했습니다</h2>
        <button onClick={reset}>다시 시도</button>
      </body>
    </html>
  );
}
```

### 4. 세션 동기화

#### 4.1 클라이언트 사이드 동기화
```typescript
// lib/auth/auth-sync.ts
export function syncAuthState() {
  const roles = ['teacher', 'lawyer', 'admin'] as const;

  for (const role of roles) {
    const token = localStorage.getItem(`${role}_token`);
    if (token) {
      // 쿠키에도 동기화 (클라이언트 → 서버)
      document.cookie = `${role}_token=${token}; Path=/; Max-Age=86400; SameSite=Strict`;
    }
  }
}

// app/layout.tsx에서 초기화
useEffect(() => {
  syncAuthState();
}, []);
```

---

## Test Strategy (테스트 전략)

### Unit Tests
1. `verifyTokenServer()` 함수 테스트
   - 유효한 토큰 → 사용자 정보 반환
   - 만료된 토큰 → 에러 발생
   - DB에 없는 사용자 → 에러 발생

2. `syncAuthState()` 함수 테스트
   - localStorage → 쿠키 동기화 검증
   - 여러 역할 동시 존재 시 우선순위 확인

### Integration Tests
1. 로그인 플로우
   - localStorage + httpOnly 쿠키 동시 저장 확인
   - 서버 사이드 세션 검증 성공

2. 페이지 새로고침 시나리오
   - localStorage 유지 시 세션 복구
   - localStorage 유실 시 쿠키에서 복구
   - 둘 다 없으면 로그인 페이지 리디렉션

### E2E Tests (Playwright)
1. Teacher 로그인 → 새로고침 → 세션 유지 확인
2. Lawyer 로그인 → localStorage 클리어 → 쿠키로 복구 확인
3. Admin 로그인 → ChunkLoadError 시뮬레이션 → 자동 재로딩 확인

---

## Implementation Notes

### 우선순위 높음
1. **httpOnly 쿠키 백업 시스템** 구현
   - 서버 사이드에서 Set-Cookie 응답 헤더 추가
   - 클라이언트에서 쿠키 읽기 및 localStorage 동기화

2. **서버 사이드 세션 검증** 강화
   - `verifyTokenServer()` 함수 구현
   - middleware.ts에서 모든 보호된 경로에 적용

3. **동적 임포트 제거**
   - Header, Sidebar 등 핵심 컴포넌트 정적 임포트로 변경
   - ChunkLoadError 글로벌 에러 핸들러 추가

### 우선순위 중간
1. **세션 복구 로직** 최적화
   - localStorage → 쿠키 폴백 체인 구현
   - 복구 실패 시 로그아웃 처리

2. **역할별 토큰 격리** 강화
   - 동시 다중 역할 로그인 방지
   - 가장 최근 로그인 우선 정책

### 리스크 및 대응
- **리스크**: httpOnly 쿠키는 JavaScript에서 직접 읽기 불가
  - **대응**: 서버 컴포넌트에서 `cookies()` 사용, API 라우트로 토큰 전달
- **리스크**: 쿠키 크기 제한 (4KB)
  - **대응**: JWT 페이로드 최소화, 필수 필드만 포함
- **리스크**: SameSite=Strict로 인한 외부 도메인 문제
  - **대응**: 개발 환경에서는 SameSite=Lax 사용

---

## Definition of Done

### 기능 완료 조건
- [x] httpOnly 쿠키에 JWT 토큰 저장
- [x] 페이지 로드 시 localStorage → 쿠키 순으로 토큰 복구
- [x] 서버 사이드 세션 검증 미들웨어 적용
- [x] ChunkLoadError 자동 재로딩 처리
- [x] 동적 임포트 → 정적 임포트 전환 (Header, Sidebar)

### 테스트 통과 조건
- [ ] Unit Tests 100% 커버리지
- [ ] E2E Tests 통과 (Teacher, Lawyer, Admin 각 역할)
- [ ] 페이지 새로고침 시나리오 100% 성공

### 문서화 조건
- [ ] API 문서 업데이트 (/api/auth/login 응답 형식)
- [ ] 세션 복구 로직 다이어그램 추가
- [ ] 개발자 가이드 업데이트 (httpOnly 쿠키 사용법)

---

**다음 단계**: `/alfred:2-build SPEC-SESSION-001`로 구현 시작
