---
id: AUTH-002
version: 0.0.1
status: draft
created: 2025-10-17
updated: 2025-10-17
---

# SPEC-AUTH-002 수락 기준 (Acceptance Criteria)

## 개요

본 문서는 SPEC-AUTH-002 "서버 측 역할 검증 강화"의 상세한 수락 기준을 정의합니다. 모든 시나리오는 Given-When-Then 형식으로 작성되었습니다.

---

## AC-001: JWT 역할과 DB 역할 일치 검증

### Given-When-Then

**Given**: 사용자가 특정 역할로 로그인하여 JWT를 받았고,
**When**: 보호된 API 엔드포인트에 요청을 보내면,
**Then**: 시스템은 JWT의 역할과 DB의 역할을 대조하여 일치하는 경우에만 요청을 처리해야 한다.

### 검증 기준

1. **역할 일치 시 요청 성공**
   ```typescript
   // JWT: { userId: 1, role: 'teacher' }
   // DB:  { id: 1, role: 'teacher' }
   const response = await fetch('/api/reports', {
     headers: { 'Authorization': `Bearer ${teacherToken}` }
   });
   expect(response.status).toBe(200);
   ```

2. **역할 불일치 시 요청 거부**
   ```typescript
   // JWT: { userId: 1, role: 'admin' }
   // DB:  { id: 1, role: 'teacher' } (관리자가 역할 변경함)
   const response = await fetch('/api/reports', {
     headers: { 'Authorization': `Bearer ${oldAdminToken}` }
   });
   expect(response.status).toBe(401);
   expect(await response.json()).toEqual({
     error: expect.stringContaining('Role mismatch'),
   });
   ```

3. **역할 불일치 시 X-Auth-Reset 헤더 포함**
   ```typescript
   const response = await fetch('/api/reports', {
     headers: { 'Authorization': `Bearer ${mismatchToken}` }
   });
   expect(response.headers.get('X-Auth-Reset')).toBe('true');
   ```

### 테스트 시나리오

```typescript
describe('AC-001: JWT 역할과 DB 역할 일치 검증', () => {
  test('Teacher JWT + Teacher DB → 요청 성공', async () => {
    const token = createJWT({ userId: 1, role: 'teacher' });
    await setDBUserRole(1, 'teacher');

    const response = await fetch('/api/reports', {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    expect(response.status).toBe(200);
  });

  test('Teacher JWT + Lawyer DB → 요청 거부', async () => {
    const token = createJWT({ userId: 1, role: 'teacher' });
    await setDBUserRole(1, 'lawyer'); // 역할 변경됨

    const response = await fetch('/api/reports', {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    expect(response.status).toBe(401);
    expect(response.headers.get('X-Auth-Reset')).toBe('true');
  });

  test('역할 불일치 시 보안 로그 기록', async () => {
    const logSpy = jest.spyOn(console, 'error');
    const token = createJWT({ userId: 1, role: 'admin' });
    await setDBUserRole(1, 'teacher');

    await fetch('/api/admin/users', {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('[AUTH-GUARD] Role mismatch detected'),
      expect.objectContaining({
        jwtRole: 'admin',
        dbRole: 'teacher',
      })
    );
  });
});
```

---

## AC-002: 역할별 라우트 가드 적용

### Given-When-Then

**Given**: 각 API 엔드포인트에 허용 역할이 정의되어 있고,
**When**: 특정 역할의 JWT로 API에 접근하면,
**Then**: 허용 역할 목록에 포함된 경우에만 접근을 허용하고 그렇지 않으면 403 Forbidden을 반환해야 한다.

### 검증 기준

1. **허용 역할로 접근 시 성공**
   ```typescript
   // /api/admin/users: allowedRoles = ['admin', 'super_admin']
   const adminToken = createJWT({ userId: 1, role: 'admin' });
   const response = await fetch('/api/admin/users', {
     headers: { 'Authorization': `Bearer ${adminToken}` },
   });
   expect(response.status).toBe(200);
   ```

2. **거부 역할로 접근 시 실패**
   ```typescript
   // /api/admin/users: allowedRoles = ['admin', 'super_admin']
   const teacherToken = createJWT({ userId: 2, role: 'teacher' });
   const response = await fetch('/api/admin/users', {
     headers: { 'Authorization': `Bearer ${teacherToken}` },
   });
   expect(response.status).toBe(403);
   expect(await response.json()).toEqual({
     error: expect.stringContaining('Forbidden'),
   });
   ```

### API별 허용 역할 검증 매트릭스

| API 엔드포인트 | Teacher | Lawyer | Admin | Super Admin |
|---------------|---------|--------|-------|-------------|
| `/api/auth/me` | ✅ | ✅ | ✅ | ✅ |
| `/api/reports` (GET) | ✅ | ✅ | ✅ | ✅ |
| `/api/reports` (POST) | ✅ | ❌ | ❌ | ❌ |
| `/api/admin/users` | ❌ | ❌ | ✅ | ✅ |
| `/api/lawyer/consultations` | ❌ | ✅ | ❌ | ❌ |

### 테스트 시나리오

```typescript
describe('AC-002: 역할별 라우트 가드 적용', () => {
  const testMatrix = [
    { endpoint: '/api/reports', method: 'GET', allowedRoles: ['teacher', 'lawyer', 'admin', 'super_admin'] },
    { endpoint: '/api/reports', method: 'POST', allowedRoles: ['teacher'] },
    { endpoint: '/api/admin/users', method: 'GET', allowedRoles: ['admin', 'super_admin'] },
    { endpoint: '/api/lawyer/consultations', method: 'GET', allowedRoles: ['lawyer'] },
  ];

  const allRoles = ['teacher', 'lawyer', 'admin', 'super_admin'];

  testMatrix.forEach(({ endpoint, method, allowedRoles }) => {
    test(`${endpoint} (${method}): 허용 역할만 접근 가능`, async () => {
      for (const role of allRoles) {
        const token = createJWT({ userId: 1, role });
        await setDBUserRole(1, role);

        const response = await fetch(endpoint, {
          method,
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (allowedRoles.includes(role)) {
          expect(response.status).not.toBe(403);
        } else {
          expect(response.status).toBe(403);
        }
      }
    });
  });
});
```

---

## AC-003: JWT 서명 및 만료 검증

### Given-When-Then

**Given**: 클라이언트가 JWT를 전송하고,
**When**: 서버가 JWT를 검증하면,
**Then**: JWT 서명이 유효하고 만료되지 않은 경우에만 인증을 허용해야 한다.

### 검증 기준

1. **유효한 JWT 허용**
   ```typescript
   const validToken = jwt.sign(
     { userId: 1, role: 'teacher', exp: Math.floor(Date.now() / 1000) + 3600 },
     process.env.JWT_SECRET!
   );
   const response = await fetch('/api/reports', {
     headers: { 'Authorization': `Bearer ${validToken}` },
   });
   expect(response.status).toBe(200);
   ```

2. **서명 불일치 JWT 거부**
   ```typescript
   const invalidToken = jwt.sign(
     { userId: 1, role: 'teacher' },
     'wrong_secret' // 잘못된 시크릿
   );
   const response = await fetch('/api/reports', {
     headers: { 'Authorization': `Bearer ${invalidToken}` },
   });
   expect(response.status).toBe(401);
   ```

3. **만료된 JWT 거부**
   ```typescript
   const expiredToken = jwt.sign(
     { userId: 1, role: 'teacher', exp: Math.floor(Date.now() / 1000) - 3600 }, // 1시간 전 만료
     process.env.JWT_SECRET!
   );
   const response = await fetch('/api/reports', {
     headers: { 'Authorization': `Bearer ${expiredToken}` },
   });
   expect(response.status).toBe(401);
   expect(await response.json()).toEqual({
     error: expect.stringContaining('expired'),
   });
   ```

4. **필수 필드 누락 JWT 거부**
   ```typescript
   const incompleteToken = jwt.sign(
     { userId: 1 }, // role 필드 누락
     process.env.JWT_SECRET!
   );
   const response = await fetch('/api/reports', {
     headers: { 'Authorization': `Bearer ${incompleteToken}` },
   });
   expect(response.status).toBe(401);
   ```

### 테스트 시나리오

```typescript
describe('AC-003: JWT 서명 및 만료 검증', () => {
  test('유효한 JWT → 인증 성공', async () => {
    const token = createValidJWT({ userId: 1, role: 'teacher' });
    const response = await fetch('/api/reports', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    expect(response.status).toBe(200);
  });

  test('서명 불일치 JWT → 401 Unauthorized', async () => {
    const token = jwt.sign({ userId: 1, role: 'teacher' }, 'wrong_secret');
    const response = await fetch('/api/reports', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    expect(response.status).toBe(401);
  });

  test('만료된 JWT → 401 Unauthorized', async () => {
    const token = createExpiredJWT({ userId: 1, role: 'teacher' });
    const response = await fetch('/api/reports', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    expect(response.status).toBe(401);
  });

  test('필수 필드 누락 JWT → 401 Unauthorized', async () => {
    const token = jwt.sign({ userId: 1 }, process.env.JWT_SECRET!);
    const response = await fetch('/api/reports', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    expect(response.status).toBe(401);
  });
});
```

---

## AC-004: DB 사용자 조회 및 검증

### Given-When-Then

**Given**: JWT에 포함된 userId가 있고,
**When**: 서버가 DB에서 사용자를 조회하면,
**Then**: 사용자가 존재하고 활성화된 경우에만 인증을 허용해야 한다.

### 검증 기준

1. **사용자 존재 시 인증 성공**
   ```typescript
   const token = createJWT({ userId: 1, role: 'teacher' });
   await createDBUser({ id: 1, role: 'teacher', isActive: true });

   const response = await fetch('/api/reports', {
     headers: { 'Authorization': `Bearer ${token}` },
   });
   expect(response.status).toBe(200);
   ```

2. **사용자 미존재 시 인증 실패**
   ```typescript
   const token = createJWT({ userId: 999, role: 'teacher' }); // DB에 없는 ID

   const response = await fetch('/api/reports', {
     headers: { 'Authorization': `Bearer ${token}` },
   });
   expect(response.status).toBe(401);
   expect(await response.json()).toEqual({
     error: expect.stringContaining('User not found'),
   });
   ```

### 테스트 시나리오

```typescript
describe('AC-004: DB 사용자 조회 및 검증', () => {
  test('사용자 존재 + 역할 일치 → 인증 성공', async () => {
    const user = await createDBUser({ id: 1, role: 'teacher' });
    const token = createJWT({ userId: user.id, role: user.role });

    const response = await fetch('/api/reports', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    expect(response.status).toBe(200);
  });

  test('사용자 미존재 → 401 Unauthorized', async () => {
    const token = createJWT({ userId: 999, role: 'teacher' });

    const response = await fetch('/api/reports', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    expect(response.status).toBe(401);
  });

  test('DB 조회 실패 시 에러 처리', async () => {
    const token = createJWT({ userId: 1, role: 'teacher' });

    // DB 조회 실패 시뮬레이션
    jest.spyOn(db, 'getUserById').mockRejectedValueOnce(new Error('DB connection failed'));

    const response = await fetch('/api/reports', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    expect(response.status).toBe(500);
  });
});
```

---

## AC-005: 역할 변경 시나리오

### Given-When-Then

**Given**: 사용자가 A 역할로 로그인하여 JWT를 받았고,
**When**: 관리자가 사용자의 역할을 B로 변경한 후 사용자가 다시 API를 요청하면,
**Then**: JWT 역할(A)과 DB 역할(B) 불일치로 인해 인증이 실패하고 세션이 종료되어야 한다.

### 검증 기준

1. **역할 변경 전: 인증 성공**
   ```typescript
   const user = await createDBUser({ id: 1, role: 'teacher' });
   const token = createJWT({ userId: 1, role: 'teacher' });

   const response1 = await fetch('/api/reports', {
     headers: { 'Authorization': `Bearer ${token}` },
   });
   expect(response1.status).toBe(200);
   ```

2. **역할 변경 후: 인증 실패**
   ```typescript
   // 관리자가 역할 변경
   await updateDBUserRole(1, 'lawyer');

   // 동일한 토큰으로 재요청
   const response2 = await fetch('/api/reports', {
     headers: { 'Authorization': `Bearer ${token}` },
   });
   expect(response2.status).toBe(401);
   expect(response2.headers.get('X-Auth-Reset')).toBe('true');
   ```

### 테스트 시나리오

```typescript
describe('AC-005: 역할 변경 시나리오', () => {
  test('Teacher → Lawyer 역할 변경 후 기존 JWT 무효화', async () => {
    // 1. Teacher로 로그인
    const user = await createDBUser({ id: 1, role: 'teacher' });
    const token = createJWT({ userId: 1, role: 'teacher' });

    // 2. 첫 번째 요청: 성공
    const response1 = await fetch('/api/reports', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    expect(response1.status).toBe(200);

    // 3. 관리자가 역할 변경
    await updateDBUserRole(1, 'lawyer');

    // 4. 두 번째 요청: 역할 불일치로 실패
    const response2 = await fetch('/api/reports', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    expect(response2.status).toBe(401);
    expect(response2.headers.get('X-Auth-Reset')).toBe('true');

    // 5. 재로그인 후 새 JWT로 성공
    const newToken = createJWT({ userId: 1, role: 'lawyer' });
    const response3 = await fetch('/api/lawyer/consultations', {
      headers: { 'Authorization': `Bearer ${newToken}` },
    });
    expect(response3.status).toBe(200);
  });
});
```

---

## AC-006: 에러 응답 표준화

### Given-When-Then

**Given**: 인증/권한 검증이 실패하고,
**When**: 서버가 에러 응답을 반환하면,
**Then**: 일관된 형식의 에러 메시지와 적절한 상태 코드를 포함해야 한다.

### 검증 기준

1. **401 Unauthorized** (인증 실패)
   ```typescript
   const response = await fetch('/api/reports', {
     headers: { 'Authorization': 'Bearer invalid_token' },
   });
   expect(response.status).toBe(401);
   expect(await response.json()).toMatchObject({
     error: expect.any(String),
     code: 'AUTH_INVALID_TOKEN',
   });
   ```

2. **403 Forbidden** (권한 부족)
   ```typescript
   const teacherToken = createJWT({ userId: 1, role: 'teacher' });
   const response = await fetch('/api/admin/users', {
     headers: { 'Authorization': `Bearer ${teacherToken}` },
   });
   expect(response.status).toBe(403);
   expect(await response.json()).toMatchObject({
     error: expect.stringContaining('Forbidden'),
     code: 'AUTH_FORBIDDEN',
   });
   ```

3. **역할 불일치** (즉시 세션 종료)
   ```typescript
   const response = await fetch('/api/reports', {
     headers: { 'Authorization': `Bearer ${mismatchToken}` },
   });
   expect(response.status).toBe(401);
   expect(await response.json()).toMatchObject({
     error: expect.stringContaining('Role mismatch'),
     code: 'AUTH_ROLE_MISMATCH',
   });
   expect(response.headers.get('X-Auth-Reset')).toBe('true');
   ```

### 테스트 시나리오

```typescript
describe('AC-006: 에러 응답 표준화', () => {
  test('무효 JWT → 401 + AUTH_INVALID_TOKEN', async () => {
    const response = await fetch('/api/reports', {
      headers: { 'Authorization': 'Bearer invalid_jwt' },
    });
    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({
      code: 'AUTH_INVALID_TOKEN',
    });
  });

  test('권한 부족 → 403 + AUTH_FORBIDDEN', async () => {
    const teacherToken = createValidJWT({ userId: 1, role: 'teacher' });
    const response = await fetch('/api/admin/users', {
      headers: { 'Authorization': `Bearer ${teacherToken}` },
    });
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({
      code: 'AUTH_FORBIDDEN',
    });
  });

  test('역할 불일치 → 401 + AUTH_ROLE_MISMATCH + X-Auth-Reset', async () => {
    const token = createJWT({ userId: 1, role: 'admin' });
    await setDBUserRole(1, 'teacher');

    const response = await fetch('/api/reports', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({
      code: 'AUTH_ROLE_MISMATCH',
    });
    expect(response.headers.get('X-Auth-Reset')).toBe('true');
  });
});
```

---

## 완료 조건 (Definition of Done)

### 기능 완료
- [ ] AC-001: JWT 역할과 DB 역할 일치 검증 - 통과
- [ ] AC-002: 역할별 라우트 가드 적용 - 통과
- [ ] AC-003: JWT 서명 및 만료 검증 - 통과
- [ ] AC-004: DB 사용자 조회 및 검증 - 통과
- [ ] AC-005: 역할 변경 시나리오 - 통과
- [ ] AC-006: 에러 응답 표준화 - 통과

### 품질 게이트
- [ ] 단위 테스트 커버리지 ≥ 95%
- [ ] 통합 테스트 모두 통과
- [ ] E2E 테스트 모두 통과
- [ ] TypeScript 타입 에러 0건
- [ ] ESLint 에러 0건

### 성능 기준
- [ ] DB 역할 조회 시간 < 100ms
- [ ] API 응답 지연 < 50ms (역할 검증으로 인한)
- [ ] 메모리 누수 0건

### 보안 기준
- [ ] JWT 서명 검증 100% 통과
- [ ] 역할 불일치 감지율 100%
- [ ] 무효 JWT 거부율 100%
- [ ] 보안 로그 기록률 100% (역할 불일치 시)

### 문서화
- [ ] JWTVerifier API 문서 작성 완료
- [ ] AuthGuard 사용 가이드 작성 완료
- [ ] 에러 코드 사전 작성 완료
- [ ] 보안 로그 포맷 문서화 완료

### 코드 리뷰
- [ ] 2명 이상의 리뷰어 승인
- [ ] 모든 리뷰 코멘트 해결
- [ ] SPEC 문서와 코드 일치 확인

---

**작성자**: @spec-builder
**최종 수정일**: 2025-10-17
