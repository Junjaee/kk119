---
id: AUTH-003
version: 0.0.1
status: draft
title: 소셜 로그인 통합 (OAuth2) - 구현 계획
---

# SPEC-AUTH-003: 소셜 로그인 통합 (OAuth2) - 구현 계획

## 개요

소셜 로그인 통합 (OAuth2) 시스템의 구현 계획서입니다.
Google, Naver, Kakao OAuth2 연동 및 기존 계정 연동을 포함합니다.

---

## 구현 우선순위

### 1차 목표: Google OAuth2 통합
- Google 개발자 콘솔 앱 등록
- 데이터베이스 스키마 생성 (oauth_accounts)
- NextAuth.js 설정 및 Google Provider 추가
- OAuth callback 처리 로직
- 신규 사용자 자동 가입
- 기존 사용자 계정 연동 (이메일 기반)

### 2차 목표: Naver/Kakao OAuth2 통합
- Naver/Kakao 개발자 콘솔 앱 등록
- Naver/Kakao Provider 추가
- 멀티 제공자 로그인 UI

### 3차 목표: 고급 기능 및 관리
- 계정 연동 해제 기능
- 연동된 계정 목록 조회
- OAuth 전용 계정 비밀번호 설정 기능
- 프로필 동기화 기능

---

## 기술적 접근 방법

### 아키텍처 설계

```
Client (Browser)
    ↓
Next.js App Router
    ↓
NextAuth.js v5 (Auth.js)
    ↓
OAuth Providers
    ├─ GoogleProvider
    ├─ NaverProvider
    └─ KakaoProvider
    ↓
Services Layer
    ├─ OAuthService (계정 연동, 해제)
    └─ UserService (사용자 생성, 조회)
    ↓
Database (SQLite)
    ├─ users
    └─ oauth_accounts
```

### 핵심 모듈 구조

#### 1. NextAuth.js 설정 (`lib/auth/next-auth.config.ts`)
```typescript
import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import NaverProvider from 'next-auth/providers/naver'
import KakaoProvider from 'next-auth/providers/kakao'
import { OAuthService } from './oauth-service'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
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
      if (!user.email) {
        return false // 이메일 필수
      }

      try {
        await OAuthService.handleOAuthSignIn({
          email: user.email,
          name: user.name || '',
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          expiresAt: account.expires_at,
        })
        return true
      } catch (error) {
        console.error('OAuth sign-in error:', error)
        return false
      }
    },
    async jwt({ token, account, user }) {
      if (account) {
        token.accessToken = account.access_token
        token.provider = account.provider
      }
      if (user) {
        token.userId = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      session.user.id = token.userId as number
      session.user.role = token.role as string
      session.accessToken = token.accessToken as string
      return session
    },
  },
  pages: {
    signIn: '/login',
    error: '/auth/error',
  },
})
```

#### 2. OAuthService (`lib/auth/oauth-service.ts`)
```typescript
interface OAuthService {
  // OAuth 로그인 처리 (신규 가입 or 기존 연동)
  handleOAuthSignIn(data: OAuthSignInData): Promise<User>

  // OAuth 계정 연동 (이미 로그인된 사용자)
  linkOAuthAccount(userId: number, provider: string, data: OAuthData): Promise<void>

  // OAuth 계정 연동 해제
  unlinkOAuthAccount(userId: number, provider: string): Promise<void>

  // 연동된 OAuth 계정 목록 조회
  getLinkedAccounts(userId: number): Promise<OAuthAccount[]>

  // 사용자 OAuth 전용 여부 확인
  isOAuthOnly(userId: number): Promise<boolean>
}
```

**주요 로직**:
- **handleOAuthSignIn**:
  1. 이메일로 기존 사용자 조회
  2. 존재하면: OAuth 계정 연동 (oauth_accounts에 추가)
  3. 존재하지 않으면: 신규 사용자 생성 + OAuth 계정 연동
  4. 환영 이메일 발송 (신규 가입 시)
- **unlinkOAuthAccount**:
  1. 최소 1개의 로그인 수단 확인 (비밀번호 or 다른 OAuth)
  2. oauth_accounts에서 삭제
  3. 연동 해제 이메일 발송

#### 3. UserService (`lib/auth/user-service.ts`)
```typescript
interface UserService {
  // 이메일로 사용자 조회
  findByEmail(email: string): Promise<User | null>

  // OAuth 사용자 생성
  createOAuthUser(data: CreateOAuthUserData): Promise<User>

  // 사용자 로그인 수단 개수 확인
  countLoginMethods(userId: number): Promise<number>
}
```

### 데이터베이스 마이그레이션

#### Step 1: 테이블 생성 스크립트
```sql
-- scripts/db/create-oauth-tables.sql

CREATE TABLE IF NOT EXISTS oauth_accounts (
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

CREATE INDEX IF NOT EXISTS idx_user_id_oauth ON oauth_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_provider_account ON oauth_accounts(provider, provider_account_id);

-- users 테이블에 oauth_only 필드 추가
ALTER TABLE users ADD COLUMN oauth_only BOOLEAN DEFAULT 0;
```

#### Step 2: 마이그레이션 실행
```bash
sqlite3 data/kyokwon119.db < scripts/db/create-oauth-tables.sql
```

### API 구현

#### GET /api/auth/signin/google
```typescript
// app/api/auth/signin/google/route.ts
import { redirect } from 'next/navigation'
import { signIn } from '@/lib/auth/next-auth.config'

export async function GET(req: NextRequest) {
  // NextAuth.js가 자동으로 Google OAuth 페이지로 리다이렉트
  await signIn('google', { redirectTo: '/dashboard' })
}
```

#### GET /api/auth/callback/google
```typescript
// NextAuth.js가 자동으로 처리
// /api/auth/callback/google 엔드포인트는 NextAuth.js가 생성
```

#### POST /api/auth/oauth/unlink
```typescript
// app/api/auth/oauth/unlink/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { OAuthService } from '@/lib/auth/oauth-service'
import { auth } from '@/lib/auth/next-auth.config'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 })
    }

    const { provider } = await req.json()

    // 최소 1개 로그인 수단 확인
    const loginMethods = await UserService.countLoginMethods(session.user.id)
    if (loginMethods <= 1) {
      return NextResponse.json(
        { success: false, error: 'CANNOT_REMOVE_LAST_LOGIN_METHOD' },
        { status: 400 }
      )
    }

    await OAuthService.unlinkOAuthAccount(session.user.id, provider)

    return NextResponse.json({
      success: true,
      message: `${provider} 계정 연동이 해제되었습니다.`
    })
  } catch (error) {
    console.error('OAuth unlink error:', error)
    return NextResponse.json(
      { success: false, error: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
```

---

## 리스크 및 대응 방안

### 리스크 1: OAuth 제공자 장애
- **영향도**: HIGH
- **대응**:
  - 여러 제공자 지원 (Google, Naver, Kakao)
  - 비밀번호 로그인 병행 지원
  - OAuth 장애 시 에러 메시지 표시

### 리스크 2: 이메일 중복 (다른 제공자)
- **영향도**: MEDIUM
- **대응**:
  - 동일 이메일을 가진 계정은 자동으로 연동
  - 사용자에게 "기존 계정과 연동되었습니다" 안내
  - 설정 페이지에서 연동 해제 가능

### 리스크 3: Access Token 만료
- **영향도**: MEDIUM
- **대응**:
  - Refresh Token으로 자동 갱신
  - 갱신 실패 시 재로그인 요청

### 리스크 4: CSRF 공격
- **영향도**: CRITICAL
- **대응**:
  - State 파라미터로 CSRF 방지 (NextAuth.js 내장)
  - HTTPS 필수 (프로덕션)

---

## 테스트 전략

### 단위 테스트 (Unit Tests)
- OAuthService.handleOAuthSignIn()
- OAuthService.unlinkOAuthAccount()
- UserService.countLoginMethods()

### 통합 테스트 (Integration Tests)
- Google OAuth 전체 플로우 (모킹)
- 기존 계정 연동 시나리오
- OAuth 전용 계정 생성

### E2E 테스트 (Playwright)
- Google 로그인 전체 플로우
- Naver/Kakao 로그인 전체 플로우
- 계정 연동 해제

---

## 완료 기준 (Definition of Done)

- [ ] Google, Naver, Kakao OAuth 앱 등록 완료
- [ ] NextAuth.js 설정 및 3개 Provider 추가
- [ ] 데이터베이스 테이블 생성 완료
- [ ] OAuth 로그인 API 구현
- [ ] 계정 연동/해제 API 구현
- [ ] 로그인 페이지 소셜 로그인 버튼 UI
- [ ] 단위 테스트 커버리지 80% 이상
- [ ] E2E 테스트 시나리오 3개 이상 통과
- [ ] 보안 체크리스트 100% 준수
- [ ] 문서화 완료 (사용자 가이드, API 문서)

---

**문서 끝**
