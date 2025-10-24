---
id: API-001
version: 0.0.1
status: draft
created: 2025-10-20
updated: 2025-10-20
author: @claude
priority: high
category: bugfix
labels:
  - api
  - auth
  - headers
  - integration
---

# SPEC-API-001: API 인증 헤더 통합

## HISTORY

### v0.0.1 (2025-10-20)
- **INITIAL**: API 인증 헤더 통합 명세 최초 작성
- **AUTHOR**: @claude
- **SCOPE**: API 호출 시 Authorization 헤더 자동 주입
- **CONTEXT**: E2E 테스트 보고서 기반 문제 해결

---

## @TAG:SPEC-API-001 메타데이터

### 추적성 태그
- **@SPEC:API-001** - API 인증 헤더 통합 명세
- **@SPEC:SESSION-001** - 세션 영속성 개선 (의존)
- **@SPEC:AUTH-001** - 하이브리드 인증 시스템 (의존)
- **@DOC:PROBLEM-001** - 핵심 문제 정의 참조

### 우선순위
- **Priority**: HIGH
- **Category**: Bugfix
- **Impact**: High (API 인증 실패 방지)

### 의존성
- **Depends On**:
  - SPEC-SESSION-001 (토큰 저장 및 복구)
  - SPEC-AUTH-001 (JWT 토큰 시스템)
- **Blocks**:
  - None
- **Related**:
  - SPEC-BUILD-001 (Webpack 최적화)

---

## Environment (환경 및 가정사항)

### 시스템 환경
- **Framework**: Next.js 14 App Router
- **HTTP Client**: Native `fetch` API
- **Authentication**: JWT Bearer Token
- **Storage**: localStorage + httpOnly 쿠키

### 현재 API 아키텍처
- **API Routes**: `/api/*` (Next.js Route Handlers)
- **인증 방식**: Bearer Token in Authorization Header
- **역할별 엔드포인트**:
  - Teacher: `/api/reports`, `/api/consult`
  - Lawyer: `/api/consult/[id]`
  - Admin: `/api/admin/users`, `/api/admin/stats`

### 문제 환경
- **트리거**: API 호출 시 Authorization 헤더 누락
- **증상**:
  - 401 Unauthorized 응답
  - "토큰이 제공되지 않았습니다" 에러 메시지
  - 사용자 인증 실패
- **영향 범위**: 모든 보호된 API 엔드포인트

---

## Assumptions (전제 조건)

### 기술적 전제
1. **JWT 토큰은 localStorage에 저장**: Role-specific 키 사용 (예: `teacher_token`)
2. **모든 보호된 API는 Authorization 헤더 필요**: `Bearer {token}` 형식
3. **토큰은 세션당 1회만 발급**: 재발급 시 기존 토큰 무효화

### 비즈니스 전제
1. **API 인증 실패는 치명적**: 교사의 신고 작성, 변호사의 상담 응답 등 핵심 기능 차단
2. **토큰 자동 주입 필요**: 개발자가 매번 헤더 설정하는 것은 비효율적
3. **역할별 토큰 자동 선택**: 현재 로그인된 역할의 토큰을 자동으로 사용

---

## Requirements (기능 요구사항)

### Ubiquitous Requirements (기본 기능)
- **REQ-API-001**: 시스템은 모든 보호된 API 호출에 Authorization 헤더를 자동으로 추가해야 한다
- **REQ-API-002**: 시스템은 글로벌 request interceptor를 제공해야 한다
- **REQ-API-003**: 시스템은 역할별 토큰을 자동으로 선택하여 주입해야 한다
- **REQ-API-004**: 시스템은 토큰이 없을 경우 401 에러를 명확히 처리해야 한다

### Event-driven Requirements (이벤트 기반)
- **REQ-API-005**: WHEN API 호출이 발생하면, 시스템은 localStorage에서 토큰을 조회해야 한다
- **REQ-API-006**: WHEN 토큰이 존재하면, 시스템은 `Authorization: Bearer {token}` 헤더를 추가해야 한다
- **REQ-API-007**: WHEN 토큰이 없으면, 시스템은 헤더를 추가하지 않아야 한다
- **REQ-API-008**: WHEN API가 401을 반환하면, 시스템은 자동으로 로그아웃 처리해야 한다

### State-driven Requirements (상태 기반)
- **REQ-API-009**: WHILE 사용자가 로그인된 상태일 때, 시스템은 모든 API 호출에 토큰을 포함해야 한다
- **REQ-API-010**: WHILE 토큰이 만료되었을 때, 시스템은 401 응답 후 로그인 페이지로 리디렉션해야 한다

### Optional Features (선택적 기능)
- **OPT-API-001**: WHERE 토큰 갱신 기능이 있으면, 시스템은 401 응답 시 토큰 재발급을 시도할 수 있다
- **OPT-API-002**: WHERE 디버그 모드이면, 시스템은 헤더 정보를 콘솔에 출력할 수 있다

### Constraints (제약사항)
- **CON-API-001**: IF 공개 API 경로이면, 시스템은 Authorization 헤더를 추가하지 않아야 한다
- **CON-API-002**: IF 토큰이 유효하지 않으면, 시스템은 API 호출을 차단하고 로그아웃 처리해야 한다
- **CON-API-003**: Authorization 헤더는 `Bearer` 스키마만 사용해야 한다

---

## Specifications (상세 명세)

### 1. 글로벌 Request Interceptor

#### 1.1 Fetch Wrapper 구현
```typescript
// lib/api/fetch-wrapper.ts
export async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // 토큰 조회 (역할 우선순위: admin > lawyer > teacher)
  const token =
    localStorage.getItem('admin_token') ||
    localStorage.getItem('lawyer_token') ||
    localStorage.getItem('teacher_token');

  // 헤더 병합
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  // API 호출
  const response = await fetch(url, { ...options, headers });

  // 401 처리
  if (response.status === 401) {
    console.error('Unauthorized, logging out...');
    handleLogout();
    throw new Error('Unauthorized');
  }

  return response;
}
```

#### 1.2 사용 예시
```typescript
// Before: 수동 헤더 설정
const token = localStorage.getItem('teacher_token');
const response = await fetch('/api/reports', {
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  },
});

// After: 자동 헤더 주입
import { fetchWithAuth } from '@/lib/api/fetch-wrapper';
const response = await fetchWithAuth('/api/reports');
```

---

### 2. 역할별 토큰 자동 선택

#### 2.1 토큰 우선순위 로직
```typescript
// lib/auth/token-resolver.ts
export function getCurrentToken(): string | null {
  // 우선순위: admin > lawyer > teacher
  const roles = ['admin', 'lawyer', 'teacher'] as const;

  for (const role of roles) {
    const token = localStorage.getItem(`${role}_token`);
    if (token) {
      return token;
    }
  }

  return null;
}

export function getCurrentRole(): string | null {
  if (localStorage.getItem('admin_token')) return 'admin';
  if (localStorage.getItem('lawyer_token')) return 'lawyer';
  if (localStorage.getItem('teacher_token')) return 'teacher';
  return null;
}
```

#### 2.2 역할별 엔드포인트 매칭
```typescript
// lib/api/role-endpoint-map.ts
const ROLE_ENDPOINTS = {
  teacher: ['/api/reports', '/api/consult'],
  lawyer: ['/api/consult'],
  admin: ['/api/admin', '/api/users', '/api/stats'],
};

export function isEndpointAllowedForRole(
  endpoint: string,
  role: string
): boolean {
  const allowedPaths = ROLE_ENDPOINTS[role as keyof typeof ROLE_ENDPOINTS];
  return allowedPaths?.some(path => endpoint.startsWith(path)) ?? false;
}
```

---

### 3. API 에러 처리

#### 3.1 통합 에러 핸들러
```typescript
// lib/api/error-handler.ts
export async function handleApiError(response: Response) {
  if (response.status === 401) {
    console.error('401 Unauthorized - Token invalid or expired');

    // 로그아웃 처리
    clearAllTokens();
    window.location.href = '/login';

    throw new Error('Unauthorized');
  }

  if (response.status === 403) {
    console.error('403 Forbidden - Insufficient permissions');
    throw new Error('Forbidden');
  }

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'API request failed');
  }

  return response;
}

function clearAllTokens() {
  localStorage.removeItem('teacher_token');
  localStorage.removeItem('lawyer_token');
  localStorage.removeItem('admin_token');
}
```

#### 3.2 Fetch Wrapper 업데이트
```typescript
// lib/api/fetch-wrapper.ts (updated)
export async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getCurrentToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(url, { ...options, headers });

  // 에러 핸들러 적용
  return handleApiError(response);
}
```

---

### 4. 공개 API 경로 제외

#### 4.1 화이트리스트 정의
```typescript
// lib/api/public-routes.ts
const PUBLIC_ROUTES = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/health',
];

export function isPublicRoute(url: string): boolean {
  return PUBLIC_ROUTES.some(route => url.startsWith(route));
}
```

#### 4.2 조건부 헤더 추가
```typescript
// lib/api/fetch-wrapper.ts (updated)
export async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // 공개 경로는 토큰 불필요
  const token = isPublicRoute(url) ? null : getCurrentToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(url, { ...options, headers });
  return handleApiError(response);
}
```

---

### 5. React Hook 통합

#### 5.1 useApi 훅 구현
```typescript
// hooks/useApi.ts
import { fetchWithAuth } from '@/lib/api/fetch-wrapper';

export function useApi() {
  async function get<T>(url: string): Promise<T> {
    const response = await fetchWithAuth(url, { method: 'GET' });
    return response.json();
  }

  async function post<T>(url: string, data: any): Promise<T> {
    const response = await fetchWithAuth(url, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json();
  }

  async function put<T>(url: string, data: any): Promise<T> {
    const response = await fetchWithAuth(url, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.json();
  }

  async function del<T>(url: string): Promise<T> {
    const response = await fetchWithAuth(url, { method: 'DELETE' });
    return response.json();
  }

  return { get, post, put, delete: del };
}
```

#### 5.2 사용 예시
```typescript
// app/reports/page.tsx
'use client';

import { useApi } from '@/hooks/useApi';

export default function ReportsPage() {
  const api = useApi();

  async function fetchReports() {
    // Authorization 헤더 자동 주입
    const reports = await api.get<Report[]>('/api/reports');
    console.log(reports);
  }

  async function createReport(data: ReportInput) {
    // Authorization 헤더 자동 주입
    const newReport = await api.post<Report>('/api/reports', data);
    console.log(newReport);
  }

  return <div>...</div>;
}
```

---

## Test Strategy (테스트 전략)

### Unit Tests
1. `getCurrentToken()` 함수 테스트
   - 역할 우선순위 검증 (admin > lawyer > teacher)
   - 토큰 없을 때 null 반환

2. `isPublicRoute()` 함수 테스트
   - 공개 경로 화이트리스트 검증
   - 보호된 경로는 false 반환

3. `handleApiError()` 함수 테스트
   - 401 응답 시 로그아웃 처리
   - 403 응답 시 에러 발생

### Integration Tests
1. Fetch Wrapper 통합 테스트
   - 토큰 존재 시 Authorization 헤더 추가
   - 공개 경로는 헤더 미추가
   - 401 응답 시 로그아웃 처리

2. useApi 훅 테스트
   - GET, POST, PUT, DELETE 메서드 검증
   - 에러 핸들링 확인

### E2E Tests (Playwright)
1. Teacher API 호출 시나리오
   - 로그인 → 신고 작성 → Authorization 헤더 확인
2. Lawyer API 호출 시나리오
   - 로그인 → 상담 응답 → Authorization 헤더 확인
3. 401 에러 시나리오
   - 만료된 토큰으로 API 호출 → 로그인 페이지 리디렉션

---

## Implementation Notes

### 우선순위 높음
1. **Fetch Wrapper 구현**
   - `fetchWithAuth()` 함수 작성
   - 토큰 자동 주입 로직

2. **에러 핸들러 통합**
   - 401/403 처리
   - 자동 로그아웃

3. **useApi 훅 구현**
   - GET, POST, PUT, DELETE 메서드
   - 타입 안전성 확보

### 우선순위 중간
1. **공개 경로 화이트리스트**
   - `/api/auth/*` 제외 처리
2. **역할별 엔드포인트 검증**
   - 권한 없는 역할의 API 호출 차단

### 리스크 및 대응
- **리스크**: 기존 코드에서 수동으로 헤더 설정한 부분과 충돌
  - **대응**: 점진적 마이그레이션, 기존 코드 유지하며 새로운 API는 `fetchWithAuth` 사용
- **리스크**: 토큰 우선순위 정책 오해
  - **대응**: 명확한 문서화 및 로그 출력

---

## Definition of Done

### 기능 완료 조건
- [x] `fetchWithAuth()` 구현
- [x] `useApi()` 훅 구현
- [x] 에러 핸들러 통합
- [x] 공개 경로 화이트리스트

### 테스트 통과 조건
- [ ] Unit Tests 100% 커버리지
- [ ] E2E Tests 통과 (Teacher, Lawyer, Admin)

### 문서화 조건
- [ ] API 사용 가이드 작성
- [ ] `fetchWithAuth` 사용 예시 추가

---

**다음 단계**: `/alfred:2-build SPEC-API-001`로 구현 시작
