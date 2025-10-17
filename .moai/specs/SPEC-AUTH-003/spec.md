---
id: AUTH-003
version: 0.0.1
status: draft
created: 2025-10-17
updated: 2025-10-17
author: @user
priority: high
category: feature
labels:
  - oauth2
  - social-login
  - google
  - naver
  - kakao
scope:
  packages:
    - lib/auth
    - app/api/auth/oauth
  files:
    - oauth-service.ts
    - provider-google.ts
    - provider-naver.ts
    - provider-kakao.ts
---

# SPEC-AUTH-003: 소셜 로그인 통합 (OAuth2)

## @TAG:AUTH-003 TAG BLOCK

**SPEC ID**: AUTH-003
**Title**: 소셜 로그인 통합 (OAuth2)
**Priority**: HIGH
**Status**: Draft (v0.0.1)

### TAG Chain
- **Parent**: N/A
- **Depends On**: N/A
- **Blocks**: N/A
- **Related**: AUTH-002 (소셜 로그인 후 2FA 설정 가능)

---

## HISTORY

### v0.0.1 (2025-10-17)
- **INITIAL**: 소셜 로그인 통합 (OAuth2) SPEC 작성
- **AUTHOR**: @user
- **SECTIONS**: Environment, Assumptions, Requirements, Specifications, Traceability

---

## Environment (환경 및 전제 조건)

### 시스템 환경
- **프레임워크**: Next.js 14+ (App Router)
- **인증**: NextAuth.js v5 (Auth.js) - OAuth2 통합
- **데이터베이스**: SQLite (oauth_accounts, oauth_sessions 테이블)
- **OAuth 제공자**:
  - Google OAuth2
  - Naver 간편로그인 (OAuth 2.0)
  - Kakao 간편로그인 (OAuth 2.0)
- **JWT**: 세션 토큰 관리

### 기존 시스템 통합
- 현재 JWT 기반 로그인 시스템 사용 중
- 사용자 테이블 존재 (users)
- 역할 기반 접근 제어 (role: teacher, lawyer, admin, super_admin)

---

## Assumptions (가정사항)

1. **OAuth 앱 등록**: Google, Naver, Kakao 개발자 콘솔에서 앱 등록 완료
2. **Redirect URI**: OAuth callback URL이 HTTPS로 설정되어 있다 (프로덕션)
3. **이메일 제공**: 모든 OAuth 제공자가 사용자 이메일을 반환한다
4. **계정 연동**: 동일한 이메일로 여러 OAuth 제공자를 연동할 수 있다
5. **역할 할당**: 소셜 로그인 신규 가입 시 기본 역할은 `teacher`이다

---

## Requirements (요구사항)

### @SPEC:AUTH-003-REQ-001 Ubiquitous Requirements (기본 요구사항)

#### UR-001: 소셜 로그인 버튼
- 시스템은 로그인 페이지에 Google, Naver, Kakao 로그인 버튼을 제공해야 한다

#### UR-002: OAuth 인증 플로우
- 시스템은 OAuth 2.0 Authorization Code Flow를 구현해야 한다

#### UR-003: 계정 자동 생성
- 시스템은 신규 OAuth 사용자를 자동으로 가입 처리해야 한다

#### UR-004: 계정 연동
- 시스템은 기존 사용자가 OAuth 계정을 추가 연동할 수 있는 기능을 제공해야 한다

#### UR-005: 이메일 기반 매칭
- 시스템은 동일한 이메일을 가진 기존 계정과 OAuth 계정을 자동으로 연동해야 한다

### @SPEC:AUTH-003-REQ-002 Event-driven Requirements (이벤트 기반)

#### ED-001: 소셜 로그인 버튼 클릭 시
WHEN 사용자가 "Google로 로그인" 버튼을 클릭하면,
- 시스템은 Google OAuth 인증 페이지로 리다이렉트해야 한다
- 시스템은 `state` 파라미터를 생성하여 CSRF 공격을 방지해야 한다
- 시스템은 `scope`에 email, profile을 요청해야 한다

#### ED-002: OAuth Callback 수신 시
WHEN OAuth 제공자가 callback URL을 호출하면,
- 시스템은 `code`와 `state`를 검증해야 한다
- 시스템은 `code`를 access token으로 교환해야 한다
- 시스템은 access token으로 사용자 정보를 조회해야 한다

#### ED-003: 신규 사용자 가입 시
WHEN OAuth 사용자가 처음 로그인하면 (이메일 존재하지 않음),
- 시스템은 새 사용자 계정을 생성해야 한다
- 시스템은 기본 역할을 `teacher`로 설정해야 한다
- 시스템은 OAuth 연동 정보를 `oauth_accounts` 테이블에 저장해야 한다
- 시스템은 환영 이메일을 발송해야 한다

#### ED-004: 기존 사용자 로그인 시
WHEN OAuth 사용자가 로그인하고 동일한 이메일의 계정이 존재하면,
- 시스템은 기존 계정과 OAuth 계정을 자동으로 연동해야 한다
- 시스템은 JWT 토큰을 발급해야 한다
- 시스템은 마지막 로그인 시간을 업데이트해야 한다

#### ED-005: 계정 연동 해제 시
WHEN 사용자가 OAuth 계정 연동을 해제하면,
- 시스템은 `oauth_accounts` 테이블에서 해당 연동 정보를 삭제해야 한다
- 최소 1개의 로그인 수단이 남아있어야 한다 (비밀번호 또는 다른 OAuth)
- 시스템은 연동 해제 확인 이메일을 발송해야 한다

### @SPEC:AUTH-003-REQ-003 State-driven Requirements (상태 기반)

#### SD-001: OAuth 연동된 상태
WHILE 사용자가 OAuth 계정으로 연동된 상태일 때,
- 시스템은 해당 OAuth 제공자로 빠른 로그인을 허용해야 한다
- 시스템은 access token이 만료되면 refresh token으로 갱신해야 한다

#### SD-002: 복수 OAuth 연동 상태
WHILE 사용자가 여러 OAuth 제공자를 연동한 상태일 때,
- 시스템은 모든 연동된 계정으로 로그인을 허용해야 한다
- 시스템은 설정 페이지에 연동된 계정 목록을 표시해야 한다

### @SPEC:AUTH-003-REQ-004 Optional Features (선택적 기능)

#### OP-001: 프로필 동기화
WHERE 사용자가 선택하면,
- 시스템은 OAuth 제공자의 프로필 정보(이름, 프로필 사진)를 자동으로 동기화할 수 있다

#### OP-002: OAuth 전용 계정
WHERE 사용자가 OAuth로만 가입한 경우,
- 시스템은 비밀번호 설정 옵션을 제공할 수 있다 (비밀번호 로그인 활성화)

### @SPEC:AUTH-003-REQ-005 Constraints (제약사항)

#### CN-001: HTTPS 필수
IF OAuth callback을 처리하면,
- 프로덕션 환경에서는 반드시 HTTPS를 사용해야 한다
- HTTP callback URL은 거부되어야 한다

#### CN-002: State 검증
IF OAuth callback을 수신하면,
- `state` 파라미터가 세션에 저장된 값과 일치해야 한다
- 일치하지 않으면 CSRF 공격으로 간주하고 거부해야 한다

#### CN-003: 이메일 필수
IF OAuth 사용자 정보를 조회하면,
- 반드시 이메일이 포함되어야 한다
- 이메일이 없으면 로그인을 거부해야 한다

#### CN-004: 최소 로그인 수단
IF 사용자가 OAuth 연동을 해제하려 하면,
- 최소 1개의 로그인 수단이 남아있어야 한다
- 모든 수단을 해제할 수 없어야 한다

---

## Specifications (상세 명세)

### 데이터베이스 스키마

#### oauth_accounts 테이블
```sql
CREATE TABLE oauth_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  provider TEXT NOT NULL, -- 'google', 'naver', 'kakao'
  provider_account_id TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  expires_at DATETIME,
  token_type TEXT,
  scope TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(provider, provider_account_id)
);

CREATE INDEX idx_user_id ON oauth_accounts(user_id);
CREATE INDEX idx_provider_account ON oauth_accounts(provider, provider_account_id);
```

#### users 테이블 (기존 + 추가 필드)
```sql
ALTER TABLE users ADD COLUMN oauth_only BOOLEAN DEFAULT 0;
-- oauth_only = 1: 비밀번호 없이 OAuth로만 가입한 사용자
```

### OAuth 제공자 설정

#### Google OAuth2
```env
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=https://yourdomain.com/api/auth/callback/google
```

**Scope**: `openid email profile`
**Endpoints**:
- Authorization: `https://accounts.google.com/o/oauth2/v2/auth`
- Token: `https://oauth2.googleapis.com/token`
- User Info: `https://www.googleapis.com/oauth2/v1/userinfo`

#### Naver 간편로그인
```env
NAVER_CLIENT_ID=your_client_id
NAVER_CLIENT_SECRET=your_client_secret
NAVER_REDIRECT_URI=https://yourdomain.com/api/auth/callback/naver
```

**Endpoints**:
- Authorization: `https://nid.naver.com/oauth2.0/authorize`
- Token: `https://nid.naver.com/oauth2.0/token`
- User Info: `https://openapi.naver.com/v1/nid/me`

#### Kakao 간편로그인
```env
KAKAO_CLIENT_ID=your_rest_api_key
KAKAO_CLIENT_SECRET=your_client_secret (선택)
KAKAO_REDIRECT_URI=https://yourdomain.com/api/auth/callback/kakao
```

**Endpoints**:
- Authorization: `https://kauth.kakao.com/oauth/authorize`
- Token: `https://kauth.kakao.com/oauth/token`
- User Info: `https://kapi.kakao.com/v2/user/me`

### API 엔드포인트

#### GET /api/auth/signin/google
Google OAuth 인증 시작 (리다이렉트)

#### GET /api/auth/callback/google?code={code}&state={state}
Google OAuth callback 처리

#### GET /api/auth/signin/naver
Naver OAuth 인증 시작

#### GET /api/auth/callback/naver?code={code}&state={state}
Naver OAuth callback 처리

#### GET /api/auth/signin/kakao
Kakao OAuth 인증 시작

#### GET /api/auth/callback/kakao?code={code}&state={state}
Kakao OAuth callback 처리

#### POST /api/auth/oauth/unlink
**요청**:
```json
{
  "provider": "google" | "naver" | "kakao"
}
```

**응답** (200 OK):
```json
{
  "success": true,
  "message": "Google 계정 연동이 해제되었습니다."
}
```

#### GET /api/auth/oauth/linked
**응답** (200 OK):
```json
{
  "linked": [
    { "provider": "google", "email": "user@gmail.com" },
    { "provider": "naver", "email": "user@naver.com" }
  ]
}
```

### NextAuth.js 설정 예시

```typescript
// lib/auth/next-auth.config.ts
import GoogleProvider from 'next-auth/providers/google'
import NaverProvider from 'next-auth/providers/naver'
import KakaoProvider from 'next-auth/providers/kakao'

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    NaverProvider({
      clientId: process.env.NAVER_CLIENT_ID!,
      clientSecret: process.env.NAVER_CLIENT_SECRET!,
    }),
    KakaoProvider({
      clientId: process.env.KAKAO_CLIENT_ID!,
      clientSecret: process.env.KAKAO_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // 사용자 자동 생성 또는 연동 로직
      return true
    },
    async jwt({ token, account, user }) {
      // JWT 토큰 커스터마이징
      return token
    },
  },
  pages: {
    signIn: '/login',
    error: '/auth/error',
  },
}
```

---

## Traceability (추적성)

### Parent TAG
- N/A

### Child TAGs
- @SPEC:AUTH-003-REQ-001 (Ubiquitous Requirements)
- @SPEC:AUTH-003-REQ-002 (Event-driven Requirements)
- @SPEC:AUTH-003-REQ-003 (State-driven Requirements)
- @SPEC:AUTH-003-REQ-004 (Optional Features)
- @SPEC:AUTH-003-REQ-005 (Constraints)

### Cross-references
- @SPEC:AUTH-002 (2FA 시스템 - 소셜 로그인 후 2FA 설정 가능)

---

**문서 끝**
