---
id: AUTH-003
version: 0.0.1
status: draft
title: 소셜 로그인 통합 (OAuth2) - 인수 기준
---

# SPEC-AUTH-003: 소셜 로그인 통합 (OAuth2) - 인수 기준

## 개요

소셜 로그인 통합 (OAuth2) 시스템의 상세한 인수 기준 및 테스트 시나리오입니다.
Given-When-Then 형식의 BDD 시나리오로 작성되었습니다.

---

## 핵심 기능 인수 기준

### AC-001: Google 로그인 (신규 가입)

**Given** (전제 조건):
- 사용자가 시스템에 등록되지 않았다
- 사용자의 Google 계정 이메일은 `newuser@gmail.com`이다
- 로그인 페이지 `/login`에 접속한 상태이다

**When** (실행):
- 사용자가 "Google로 로그인" 버튼을 클릭한다
- Google OAuth 인증 페이지로 리다이렉트된다
- 사용자가 Google 계정으로 로그인하고 권한을 승인한다
- 시스템이 OAuth callback을 처리한다

**Then** (결과):
- 새 사용자 계정이 생성된다 (users 테이블)
- 기본 역할이 `teacher`로 설정된다
- OAuth 연동 정보가 저장된다 (oauth_accounts 테이블)
  - `provider`: 'google'
  - `provider_account_id`: Google user ID
  - `access_token`, `refresh_token` 저장
- JWT 토큰이 발급된다
- 사용자는 대시보드로 리다이렉트된다
- 환영 이메일이 발송된다

---

### AC-002: Google 로그인 (기존 사용자)

**Given** (전제 조건):
- 사용자가 이미 시스템에 등록되어 있다 (비밀번호 로그인 사용 중)
- 사용자의 이메일은 `existing@gmail.com`이다
- 사용자가 Google 계정도 동일한 이메일 `existing@gmail.com`을 사용한다

**When** (실행):
- 사용자가 "Google로 로그인" 버튼을 클릭한다
- Google OAuth 인증을 완료한다

**Then** (결과):
- 새 계정이 생성되지 않는다 (기존 계정 사용)
- OAuth 연동 정보가 추가된다 (oauth_accounts 테이블)
- 시스템은 "Google 계정이 연동되었습니다." 메시지를 표시한다
- JWT 토큰이 발급된다
- 사용자는 대시보드로 리다이렉트된다
- 다음 로그인부터는 비밀번호 또는 Google 로그인 모두 사용 가능하다

---

### AC-003: Naver/Kakao 로그인 (신규 가입)

**Given** (전제 조건):
- 사용자가 시스템에 등록되지 않았다
- 사용자의 Naver 계정 이메일은 `newuser@naver.com`이다

**When** (실행):
- 사용자가 "Naver로 로그인" 버튼을 클릭한다
- Naver OAuth 인증을 완료한다

**Then** (결과):
- 새 사용자 계정이 생성된다
- 기본 역할이 `teacher`로 설정된다
- OAuth 연동 정보가 저장된다 (provider: 'naver')
- JWT 토큰이 발급된다
- 사용자는 대시보드로 리다이렉트된다
- 환영 이메일이 발송된다

---

### AC-004: 복수 OAuth 계정 연동

**Given** (전제 조건):
- 사용자가 이미 Google 계정으로 로그인 중이다 (`user@gmail.com`)
- 사용자가 설정 페이지 `/settings/account`에 접속했다

**When** (실행):
- 사용자가 "Naver 계정 연동" 버튼을 클릭한다
- Naver OAuth 인증을 완료한다

**Then** (결과):
- Naver OAuth 계정이 추가로 연동된다 (oauth_accounts에 추가)
- 설정 페이지에 연동된 계정 목록이 표시된다:
  - Google: user@gmail.com
  - Naver: user@naver.com
- 사용자는 Google 또는 Naver 중 어느 것으로도 로그인할 수 있다

---

### AC-005: OAuth 계정 연동 해제

**Given** (전제 조건):
- 사용자가 Google과 Naver 두 계정을 연동한 상태이다
- 사용자가 설정 페이지에 접속했다

**When** (실행):
- 사용자가 "Google 연동 해제" 버튼을 클릭한다
- 확인 다이얼로그에서 "확인"을 클릭한다

**Then** (결과):
- Google OAuth 계정이 연동 해제된다 (oauth_accounts에서 삭제)
- 시스템은 "Google 계정 연동이 해제되었습니다." 메시지를 표시한다
- 연동 해제 확인 이메일이 발송된다
- 사용자는 여전히 Naver 로그인을 사용할 수 있다
- 설정 페이지에 Naver 계정만 표시된다

---

### AC-006: 최소 로그인 수단 보호

**Given** (전제 조건):
- 사용자가 OAuth로만 가입했다 (비밀번호 없음)
- 사용자가 Google 계정 1개만 연동한 상태이다
- 사용자가 설정 페이지에 접속했다

**When** (실행):
- 사용자가 "Google 연동 해제" 버튼을 클릭한다

**Then** (결과):
- 시스템은 에러 메시지를 표시한다: "최소 1개의 로그인 수단이 필요합니다. 비밀번호를 설정하거나 다른 소셜 계정을 연동하세요."
- Google 연동이 해제되지 않는다
- "비밀번호 설정" 링크가 표시된다

---

### AC-007: OAuth 전용 계정 비밀번호 설정

**Given** (전제 조건):
- 사용자가 OAuth로만 가입했다 (`oauth_only = 1`)
- 사용자가 설정 페이지에 접속했다

**When** (실행):
- 사용자가 "비밀번호 설정" 버튼을 클릭한다
- 새 비밀번호를 입력하고 확인한다

**Then** (결과):
- 비밀번호가 설정된다 (users 테이블의 password 필드)
- `oauth_only` 필드가 0으로 변경된다
- 시스템은 "비밀번호가 설정되었습니다. 이제 이메일/비밀번호로도 로그인할 수 있습니다." 메시지를 표시한다
- 사용자는 비밀번호 로그인과 OAuth 로그인을 모두 사용할 수 있다

---

## 비기능적 요구사항 인수 기준

### NFR-001: 보안 - CSRF 방지

**Given** (전제 조건):
- 공격자가 악의적인 OAuth callback URL을 생성했다
- 공격자가 피해자에게 해당 URL을 전달했다

**When** (실행):
- 피해자가 악의적인 URL을 클릭한다
- 시스템이 `state` 파라미터를 검증한다

**Then** (결과):
- `state` 파라미터가 세션과 일치하지 않으면 요청이 거부된다
- 에러 메시지가 표시된다: "잘못된 요청입니다. 다시 시도하세요."
- 로그에 "CSRF 공격 시도" 기록

---

### NFR-002: 보안 - HTTPS 필수

**Given** (전제 조건):
- 프로덕션 환경에서 OAuth callback URL이 설정되어 있다

**When** (실행):
- HTTP 프로토콜로 OAuth callback을 요청한다 (`http://example.com/api/auth/callback/google`)

**Then** (결과):
- 요청이 자동으로 HTTPS로 리다이렉트된다
- HTTP callback은 거부된다

---

### NFR-003: 성능 - OAuth 로그인 응답 시간

**Given** (전제 조건):
- OAuth 시스템이 정상 동작 중이다

**When** (실행):
- 100개의 OAuth 로그인 요청을 동시에 전송한다

**Then** (결과):
- 95%의 요청이 3초 이내에 완료된다 (OAuth 제공자 응답 시간 포함)
- 데이터베이스 조회가 최적화되어 있다 (인덱스 사용)

---

### NFR-004: 보안 - 이메일 필수 확인

**Given** (전제 조건):
- 사용자가 Google 로그인을 시도한다
- Google에서 이메일 정보를 제공하지 않는다 (권한 거부)

**When** (실행):
- OAuth callback이 이메일 없이 반환된다

**Then** (결과):
- 시스템은 로그인을 거부한다
- 에러 메시지가 표시된다: "이메일 정보가 필요합니다. Google 계정에서 이메일 접근 권한을 허용해주세요."

---

## 품질 게이트 기준

### 테스트 커버리지
- [ ] 단위 테스트 커버리지 80% 이상
- [ ] 통합 테스트 커버리지 70% 이상
- [ ] E2E 테스트 시나리오 7개 이상 통과

### 보안 체크리스트
- [ ] HTTPS 필수 사용 (프로덕션)
- [ ] State 파라미터로 CSRF 방지
- [ ] 이메일 필수 검증
- [ ] Access Token 암호화 저장 (선택)
- [ ] Refresh Token으로 자동 갱신
- [ ] 최소 1개 로그인 수단 보호

### 운영 체크리스트
- [ ] Google, Naver, Kakao 앱 등록 완료
- [ ] OAuth callback URL 설정 완료 (HTTPS)
- [ ] 환영 이메일 전송
- [ ] 연동 해제 이메일 전송
- [ ] OAuth 로그인 로그 기록 (성공, 실패)
- [ ] API 문서 작성 완료
- [ ] 사용자 가이드 작성 완료

---

## 완료 조건 (Definition of Done)

- [ ] 모든 인수 기준 (AC-001 ~ AC-007) 통과
- [ ] 모든 비기능적 요구사항 (NFR-001 ~ NFR-004) 통과
- [ ] 품질 게이트 기준 100% 충족
- [ ] E2E 테스트 시나리오 실행 및 스크린샷 기록
- [ ] Google, Naver, Kakao 실제 OAuth 테스트 완료
- [ ] 코드 리뷰 완료 (최소 1명 승인)
- [ ] 보안 체크리스트 검토 완료
- [ ] 문서화 완료 (API 문서, 사용자 가이드, 운영 가이드)

---

**문서 끝**
