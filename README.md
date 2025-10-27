# 교권119 🏫⚖️

> 교사의 권익을 보호하고 교권 침해 사건에 대한 체계적 대응을 지원하는 종합 플랫폼

![Next.js](https://img.shields.io/badge/Next.js-15.5.2-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19.1.0-blue?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.17-38B2AC?style=flat-square&logo=tailwind-css)
![SQLite](https://img.shields.io/badge/SQLite-3-003B57?style=flat-square&logo=sqlite)

## 📋 프로젝트 개요

교권119는 교사들이 직면하는 교권 침해 문제에 대해 체계적이고 전문적인 대응을 지원하는 종합 플랫폼입니다. 익명성을 보장하면서도 전문적인 법적 조언과 동료 교사들과의 경험 공유를 통해 교권 보호에 기여합니다.

## ✨ 주요 기능

### 🔐 다계층 사용자 인증 시스템
- JWT 토큰 기반 세션 관리
- 역할별 접근 제어 (교사, 변호사, 관리자, 슈퍼관리자)
- bcrypt 암호화 및 보안 강화
- 자동 리다이렉트 및 세션 동기화

### 📢 교권 침해 신고 및 관리
- 체계적인 신고 접수 프로세스
- 사건 유형별 분류 (학부모 민원, 학생 폭력, 명예훼손 등)
- 실시간 처리 상태 추적
- 증거 자료 첨부 및 관리
- 익명성 보장

### ⚖️ 변호사 상담 시스템
- **변호사 전용 대시보드** - 배정받은 상담 건 관리
- **상담 세부 페이지** - 상담 내용 및 답변 작성
- **실시간 상담 진행** - 교사와 변호사 간 추가 대화
- **상담 상태 관리** - 대기중/검토중/답변완료/종료 등
- **파일 첨부 지원** - 법률 문서 및 증거 자료 관리

### 💬 커뮤니티 기능
- 경험 공유 및 조언 게시판
- 실시간 댓글 및 좋아요 기능
- 카테고리별 게시물 분류
- 교사 간 익명 소통 지원

### 👥 관리자 기능
- 사용자 관리 및 역할 배정
- 협회 관리 및 멤버십 관리
- 신고 건 모니터링 및 통계
- 시스템 전반 관리

## 🛠 기술 스택

### Frontend
- **Next.js 15.5.2** - React 기반 풀스택 프레임워크
- **React 19.1.0** - 사용자 인터페이스 라이브러리
- **TypeScript** - 정적 타입 시스템
- **Tailwind CSS** - 유틸리티 우선 CSS 프레임워크
- **Radix UI** - 접근성 우선 컴포넌트 라이브러리
- **Lucide React** - 아이콘 라이브러리

### Backend
- **Next.js API Routes** - 서버사이드 API
- **SQLite** - 경량 관계형 데이터베이스
- **better-sqlite3** - 고성능 SQLite 드라이버
- **bcryptjs** - 비밀번호 암호화
- **jsonwebtoken** - JWT 토큰 인증

### 개발 도구
- **ESLint** - 코드 린팅
- **Turbopack** - 고속 번들러 (개발 서버)
- **Hot Toast** - 사용자 알림
- **Zustand** - 상태 관리

## 🚀 시작하기

### 요구사항
- Node.js 18.0 이상
- npm 또는 yarn

### 설치 및 실행

```bash
# 저장소 클론
git clone https://github.com/Junjaee/kk119.git
cd kk119

# 의존성 설치
npm install

# 개발 서버 실행 (Turbopack 사용)
npm run dev:turbo
# 또는 일반 개발 서버
npm run dev
```

서버가 시작되면 자동으로 사용 가능한 포트(3000, 3001, 3002 등)에서 실행됩니다.

## 🧪 테스트 계정

개발 및 테스트 목적으로 다음 계정들을 사용할 수 있습니다:

| 역할 | 이메일 | 비밀번호 | 설명 |
|------|--------|----------|------|
| 교사 | teacher@test.com | Teacher123! | 일반 교사 계정 |
| 변호사 | lawyer@test.com | Lawyer123! | 법적 자문 제공자 |
| 관리자 | admin@test.com | Admin123! | 일반 관리자 |
| 슈퍼관리자 | superadmin@test.com | SuperAdmin123! | 최고 관리자 |

## 🌟 주요 페이지 및 기능

### 공통 페이지
- `/` - 메인 대시보드 (역할별 자동 리다이렉트)
- `/login` - 로그인 페이지
- `/signup` - 회원가입 페이지

### 교사 전용 페이지
- `/reports/new` - 교권 침해 신고 작성
- `/reports` - 내 신고 목록 및 관리
- `/community` - 커뮤니티 게시판
- `/community/new` - 커뮤니티 글 작성
- `/resources` - 교권 자료실

### 변호사 전용 페이지
- `/lawyer` - 변호사 대시보드
- `/lawyer/consult` - 상담 목록 관리
- `/lawyer/consult/[id]` - 상담 세부 페이지

### 관리자 전용 페이지
- `/admin` - 슈퍼관리자 대시보드
- `/admin/dashboard` - 일반 관리자 대시보드
- `/admin/associations` - 협회 관리
- `/admin/user-management` - 사용자 관리
- `/admin/reports` - 신고 관리

## 📁 프로젝트 구조

```
kk119/
├── app/                      # Next.js 13+ App Router
│   ├── api/                 # API 라우트
│   │   ├── auth/           # 인증 API
│   │   ├── admin/          # 관리자 API
│   │   ├── lawyer/         # 변호사 API
│   │   ├── consult/        # 상담 API
│   │   └── community/      # 커뮤니티 API
│   ├── admin/              # 관리자 페이지
│   ├── lawyer/             # 변호사 페이지
│   ├── community/          # 커뮤니티 페이지
│   ├── reports/            # 신고 페이지
│   ├── login/              # 로그인 페이지
│   └── signup/             # 회원가입 페이지
├── components/              # 재사용 컴포넌트
│   ├── ui/                 # UI 컴포넌트
│   ├── layout/             # 레이아웃 컴포넌트
│   ├── auth/               # 인증 컴포넌트
│   └── editor/             # 에디터 컴포넌트
├── lib/                    # 유틸리티 및 설정
│   ├── auth/              # 인증 관련
│   ├── db/                # 데이터베이스 연결
│   ├── services/          # 비즈니스 로직
│   ├── hooks/             # 커스텀 훅
│   └── utils/             # 공통 유틸리티
├── data/                   # SQLite 데이터베이스 파일
│   ├── kyokwon119.db      # 메인 데이터베이스
│   └── consult.db         # 상담 전용 데이터베이스
├── scripts/                # 개발 및 유틸리티 스크립트
└── middleware.ts           # Next.js 미들웨어 (인증 및 라우팅)
```

## 🔧 주요 스크립트

```bash
# 개발 서버 실행 (Turbopack 사용 - 권장)
npm run dev:turbo

# 개발 서버 실행 (기본 Webpack)
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm start

# 코드 린팅
npm run lint

# 데이터베이스 초기화 및 설정
node scripts/init-consult-db.js
node scripts/seed-mock-consults.js

# 테스트 스크립트
node check-consults.mjs
```

## 🗄️ 데이터베이스 구조

### 메인 데이터베이스 (kyokwon119.db)
- **users** - 사용자 정보
- **associations** - 협회 정보
- **memberships** - 멤버십 정보
- **admins** - 관리자 정보
- **community_posts** - 커뮤니티 게시물
- **reports** - 신고 내역

### 상담 데이터베이스 (consult.db)
- **consults** - 상담 내역
- **consult_replies** - 상담 대화
- **consult_attachments** - 첨부파일
- **lawyers** - 변호사 정보

## 🔒 보안 기능

- **JWT 토큰 인증** - 안전한 세션 관리
- **bcrypt 암호화** - 비밀번호 보안
- **역할 기반 접근 제어** - 페이지별 권한 관리
- **미들웨어 보안** - 자동 인증 검증
- **SQL Injection 방지** - Prepared Statement 사용
- **익명성 보장** - 개인정보 최소화

## 🚨 문제 해결

### 개발 서버 오류
```bash
# 빌드 캐시 정리
rm -rf .next
rm -rf node_modules/.cache

# Turbopack으로 재시작
npm run dev:turbo
```

### 데이터베이스 문제
```bash
# 데이터베이스 재초기화
node scripts/init-consult-db.js
node scripts/seed-mock-consults.js
```

## 🤝 기여하기

1. 이 저장소를 포크합니다
2. 새로운 기능 브랜치를 생성합니다 (`git checkout -b feature/amazing-feature`)
3. 변경사항을 커밋합니다 (`git commit -m 'feat: Add amazing feature'`)
4. 브랜치에 푸시합니다 (`git push origin feature/amazing-feature`)
5. Pull Request를 생성합니다

## 📈 최근 업데이트

### v2.0.0 (2025-01-01)
- ✅ 변호사 상담 시스템 완전 구현
- ✅ 관리자 역할 세분화 (admin/super_admin)
- ✅ Turbopack 개발 서버 지원
- ✅ 상담 데이터베이스 분리
- ✅ 실시간 상담 대화 기능
- ✅ 개발 서버 안정성 개선

## 📄 라이선스

이 프로젝트는 교육 목적으로 개발되었습니다.

## 📞 문의

프로젝트에 대한 문의나 제안사항이 있으시면 GitHub 이슈를 생성해 주세요.

---

**교권119** - 교사의 권익 보호를 위한 종합 플랫폼 🏫⚖️
<!-- TASKMASTER_EXPORT_START -->
> 🎯 **Taskmaster Export** - 2025-10-27 07:50:23 UTC
> 📋 Export: with subtasks • Status filter: none
> 🔗 Powered by [Task Master](https://task-master.dev?utm_source=github-readme&utm_medium=readme-export&utm_campaign=kk119&utm_content=task-export-link)

| Project Dashboard |  |
| :-                |:-|
| Task Progress     | ████████████████████ 100% |
| Done | 23 |
| In Progress | 0 |
| Pending | 0 |
| Deferred | 0 |
| Cancelled | 0 |
|-|-|
| Subtask Progress | ████████████░░░░░░░░ 58% |
| Completed | 63 |
| In Progress | 0 |
| Pending | 45 |


| ID | Title | Status | Priority | Dependencies | Complexity |
| :- | :-    | :-     | :-       | :-           | :-         |
| 11 | 메인 대시보드에서 변호사 상담 섹션 제거 | ✓&nbsp;done | high | None | N/A |
| 11.1 | app/page.tsx에서 MessageSquare import 제거 | ✓&nbsp;done | -            | None | N/A |
| 11.2 | upcomingEvents에서 변호사 상담 이벤트 제거 | ✓&nbsp;done | -            | 11.1 | N/A |
| 11.3 | 메인 그리드 레이아웃을 3-column에서 2-column으로 변경 | ✓&nbsp;done | -            | 11.2 | N/A |
| 11.4 | 변호사 상담 관련 Card 컴포넌트 완전 제거 | ✓&nbsp;done | -            | 11.3 | N/A |
| 11.5 | 레이아웃 정리 및 반응형 디자인 검증 | ✓&nbsp;done | -            | 11.4 | N/A |
| 12 | 사이드바 네비게이션에서 변호사 상담 메뉴 제거 | ✓&nbsp;done | high | None | N/A |
| 12.1 | teacher 역할의 변호사 상담 메뉴 제거 | ✓&nbsp;done | -            | None | N/A |
| 12.2 | lawyer 역할의 상담 관리 메뉴 제거 | ✓&nbsp;done | -            | None | N/A |
| 12.3 | admin 및 super_admin 역할의 변호사 관리 메뉴 제거 | ✓&nbsp;done | -            | None | N/A |
| 12.4 | MessageSquare import 사용 확인 및 정리 | ✓&nbsp;done | -            | 12.1, 12.2, 12.3 | N/A |
| 13 | 변호사 상담 관련 페이지 및 디렉토리 완전 삭제 | ✓&nbsp;done | high | 11, 12 | N/A |
| 13.1 | 변호사 상담 관련 디렉토리 존재 확인 및 목록화 | ✓&nbsp;done | -            | None | N/A |
| 13.2 | 코드베이스 전체에서 변호사 상담 관련 경로 참조 검색 및 정리 | ✓&nbsp;done | -            | 13.1 | N/A |
| 13.3 | 변호사 상담 관련 디렉토리 완전 삭제 및 빌드 검증 | ✓&nbsp;done | -            | 13.2 | N/A |
| 14 | 미들웨어에서 변호사 상담 경로 제거 | ✓&nbsp;done | high | 13 | N/A |
| 14.1 | middleware.ts 파일 분석 및 현재 상태 확인 | ✓&nbsp;done | -            | None | N/A |
| 14.2 | rolePaths와 protectedPaths 배열에서 '/consult' 경로 제거 | ✓&nbsp;done | -            | 14.1 | N/A |
| 14.3 | 변호사 역할 사용자 리다이렉트 경로 변경 | ✓&nbsp;done | -            | 14.2 | N/A |
| 14.4 | 변경사항 검증 및 권한 제어 로직 테스트 | ✓&nbsp;done | -            | 14.3 | N/A |
| 15 | 타입 정의에서 변호사 상담 전용 타입 정리 | ✓&nbsp;done | medium | 14 | N/A |
| 15.1 | 기존 변호사 상담 관련 타입 분석 및 정리 | ✓&nbsp;done | -            | None | N/A |
| 15.2 | 독립적인 변호사 상담 전용 타입 제거 | ✓&nbsp;done | -            | 15.1 | N/A |
| 15.3 | 신고 시스템 통합용 새로운 타입 정의 추가 | ✓&nbsp;done | -            | 15.2 | N/A |
| 16 | 신고 시스템 데이터베이스 스키마 확장 | ✓&nbsp;done | high | 15 | N/A |
| 16.1 | 기존 데이터베이스 스키마 분석 및 consultations 테이블 확인 | ✓&nbsp;done | -            | None | N/A |
| 16.2 | reports 테이블에 변호사 상담 관련 필드 추가 | ✓&nbsp;done | -            | 16.1 | N/A |
| 16.3 | lawyer_consultations 테이블 생성 | ✓&nbsp;done | -            | 16.1 | N/A |
| 16.4 | 외래키 제약조건 및 인덱스 설정 | ✓&nbsp;done | -            | 16.2, 16.3 | N/A |
| 16.5 | 데이터 마이그레이션 및 스키마 변경 테스트 | ✓&nbsp;done | -            | 16.4 | N/A |
| 17 | 신고 상태 확장 및 변호사 배정 API 개발 | ✓&nbsp;done | medium | 16 | N/A |
| 17.1 | ReportStatus 타입에 변호사 상담 상태 추가 | ✓&nbsp;done | -            | None | N/A |
| 17.2 | 관리자용 변호사 배정 API 개발 | ✓&nbsp;done | -            | 17.1 | N/A |
| 17.3 | 변호사 상담 정보 조회 API 개발 | ✓&nbsp;done | -            | 17.2 | N/A |
| 17.4 | 변호사 상담 응답 업데이트 API 개발 | ✓&nbsp;done | -            | 17.3 | N/A |
| 17.5 | 추가 정보 요청 API 개발 | ✓&nbsp;done | -            | 17.4 | N/A |
| 18 | 변호사 전용 API 및 대시보드 기능 개발 | ✓&nbsp;done | medium | 17 | N/A |
| 18.1 | 변호사 배정된 신고 목록 조회 API 구현 | ✓&nbsp;done | -            | None | N/A |
| 18.2 | 변호사 상담 응답 작성 API 구현 | ✓&nbsp;done | -            | 18.1 | N/A |
| 18.3 | 변고사 상담 응답 수정 API 구현 | ✓&nbsp;done | -            | 18.2 | N/A |
| 18.4 | 변호사 상담 응답 템플릿 조회 API 구현 | ✓&nbsp;done | -            | 18.2 | N/A |
| 19 | 신고 상세 페이지에 변호사 상담 섹션 통합 | ✓&nbsp;done | medium | 18 | N/A |
| 19.1 | 변호사 배정 정보 및 프로필 표시 컴포넌트 개발 | ✓&nbsp;done | -            | None | N/A |
| 19.2 | 상담 진행 상황 표시 UI 구현 | ✓&nbsp;done | -            | 19.1 | N/A |
| 19.3 | 변호사 응답 내용 표시 영역 구현 | ✓&nbsp;done | -            | 19.2 | N/A |
| 19.4 | 추가 질문 및 자료 제출 인터페이스 개발 | ✓&nbsp;done | -            | 19.3 | N/A |
| 19.5 | 상담 히스토리 타임라인 컴포넌트 구현 | ✓&nbsp;done | -            | 19.4 | N/A |
| 20 | 관리자 인터페이스에 변호사 배정 기능 추가 | ✓&nbsp;done | medium | 19 | N/A |
| 20.1 | 신고 관리 페이지에 변호사 배정 필요 신고 필터링 기능 구현 | ✓&nbsp;done | -            | None | N/A |
| 20.2 | 변호사 목록 및 전문 분야별 선택 UI 구현 | ✓&nbsp;done | -            | 20.1 | N/A |
| 20.3 | 변호사별 업무량 표시 및 배정 이력 관리 시스템 구현 | ✓&nbsp;done | -            | 20.2 | N/A |
| 20.4 | 배정 완료 후 자동 알림 발송 시스템 구현 | ✓&nbsp;done | -            | 20.3 | N/A |
| 20.5 | 변호사 상담 진행 상황 모니터링 대시보드 구현 | ✓&nbsp;done | -            | 20.4 | N/A |
| 21 | API 미들웨어 비동기 처리 오류 수정 | ✓&nbsp;done | high | None | N/A |
| 21.1 | authenticateRequest 함수를 async 함수로 변환 | ○&nbsp;pending | -            | None | N/A |
| 21.2 | authorizeRequest 함수를 async 함수로 변환 | ○&nbsp;pending | -            | 21.1 | N/A |
| 21.3 | withAuth 고차함수의 미들웨어 호출 부분 async 처리 | ○&nbsp;pending | -            | 21.2 | N/A |
| 21.4 | 모든 미들웨어 래퍼 함수들의 타입 시그니처 업데이트 | ○&nbsp;pending | -            | 21.3 | N/A |
| 21.5 | 협회관리자 API 테스트 및 403 오류 해결 검증 | ○&nbsp;pending | -            | 21.4 | N/A |
| 22 | 인증 상태 동기화 로직 개선 | ✓&nbsp;done | high | 21 | N/A |
| 22.1 | 토큰 만료 시간 추적 및 자동 갱신 로직 구현 | ○&nbsp;pending | -            | None | N/A |
| 22.2 | API 호출 실패 시 재인증 시도 로직 구현 | ○&nbsp;pending | -            | 22.1 | N/A |
| 22.3 | middleware.ts의 Server-client auth mismatch 감지 로직 개선 | ○&nbsp;pending | -            | 22.1, 22.2 | N/A |
| 22.4 | 쿠키와 서버 토큰 상태 동기화 메커니즘 구현 | ○&nbsp;pending | -            | 22.1, 22.2, 22.3 | N/A |
| 22.5 | 에러 핸들링 및 사용자 경험 개선 | ○&nbsp;pending | -            | 22.1, 22.2, 22.3, 22.4 | N/A |
| 23 | 관리자 권한 데이터 일관성 보장 | ✓&nbsp;done | high | None | N/A |
| 23.1 | 로그인 시 admin 역할 사용자의 admins 테이블 동기화 로직 구현 | ○&nbsp;pending | -            | None | N/A |
| 23.2 | admins 테이블 조회 및 생성 데이터베이스 함수 구현 | ○&nbsp;pending | -            | None | N/A |
| 23.3 | 기존 admin 역할 사용자들의 데이터 일관성 검증 스크립트 작성 | ○&nbsp;pending | -            | 23.2 | N/A |
| 23.4 | 누락된 admin 레코드 자동 생성 마이그레이션 로직 구현 | ○&nbsp;pending | -            | 23.2, 23.3 | N/A |
| 23.5 | 관리자 권한 검증 로직에서 admins 테이블 참조 추가 | ○&nbsp;pending | -            | 23.1, 23.2 | N/A |
| 24 | 회원 승인 시스템 안정화 | ✓&nbsp;done | high | 21, 22, 23 | N/A |
| 24.1 | API 요청 재시도 로직 구현 | ○&nbsp;pending | -            | None | N/A |
| 24.2 | 로딩 상태 표시 컴포넌트 개선 | ○&nbsp;pending | -            | 24.1 | N/A |
| 24.3 | 오류 처리 및 사용자 알림 시스템 구현 | ○&nbsp;pending | -            | 24.1 | N/A |
| 24.4 | 멤버십 페이지에 재시도 로직 적용 | ○&nbsp;pending | -            | 24.1, 24.2, 24.3 | N/A |
| 24.5 | 시스템 안정성 검증 및 테스트 | ○&nbsp;pending | -            | 24.1, 24.2, 24.3, 24.4 | N/A |
| 25 | PWA 아이콘 파일 생성 및 배포 | ✓&nbsp;done | medium | None | N/A |
| 25.1 | PWA 아이콘 디자인 및 기본 파일 생성 | ✓&nbsp;done | -            | None | N/A |
| 25.2 | 다양한 크기의 아이콘 파일 일괄 생성 | ✓&nbsp;done | -            | 25.1 | N/A |
| 25.3 | 아이콘 파일 최적화 및 압축 | ✓&nbsp;done | -            | 25.2 | N/A |
| 25.4 | 빌드 시 아이콘 파일 존재 검증 스크립트 추가 | ✓&nbsp;done | -            | 25.3 | N/A |
| 25.5 | PWA 아이콘 통합 테스트 및 배포 검증 | ✓&nbsp;done | -            | 25.4 | N/A |
| 26 | 에러 모니터링 및 로깅 시스템 개선 | ✓&nbsp;done | medium | 21, 22 | N/A |
| 26.1 | 불필요한 console.log 제거 및 로그 레벨 정리 | ○&nbsp;pending | -            | None | N/A |
| 26.2 | 구조화된 로깅 시스템 구현 | ○&nbsp;pending | -            | 26.1 | N/A |
| 26.3 | API 성능 메트릭 수집 시스템 구현 | ○&nbsp;pending | -            | 26.2 | N/A |
| 26.4 | 모니터링 대시보드 및 임계치 설정 | ○&nbsp;pending | -            | 26.3 | N/A |
| 26.5 | 임계치 초과 알림 시스템 구현 | ○&nbsp;pending | -            | 26.4 | N/A |
| 27 | Next.js 메타데이터 및 Turbopack 경고 해결 | ✓&nbsp;done | low | None | N/A |
| 27.1 | layout.tsx에서 메타데이터 viewport 및 themeColor 제거 | ○&nbsp;pending | -            | None | N/A |
| 27.2 | viewport export 함수 추가 | ○&nbsp;pending | -            | 27.1 | N/A |
| 27.3 | generateStaticParams 또는 별도 themeColor export 추가 | ○&nbsp;pending | -            | 27.1 | N/A |
| 27.4 | next.config 파일 Turbopack 최적화 | ○&nbsp;pending | -            | 27.2, 27.3 | N/A |
| 27.5 | 개발 환경 경고 해결 검증 및 문서화 | ○&nbsp;pending | -            | 27.1, 27.2, 27.3, 27.4 | N/A |
| 27.6 | Next.js 15 메타데이터 구조에 맞게 viewport와 themeColor 분리 | ○&nbsp;pending | -            | None | N/A |
| 27.7 | Turbopack과 Webpack 설정 충돌 해결 | ○&nbsp;pending | -            | 27.6 | N/A |
| 27.8 | Turbopack 호환성을 위한 webpack 설정 조건부 적용 | ○&nbsp;pending | -            | 27.7 | N/A |
| 27.9 | 개발 환경 최적화 및 불필요한 경고 제거 | ○&nbsp;pending | -            | 27.8 | N/A |
| 27.10 | 빌드 및 개발 환경 검증 | ○&nbsp;pending | -            | 27.9 | N/A |
| 28 | 협회관리자 전체 워크플로우 E2E 테스트 구성 | ✓&nbsp;done | medium | 21, 22, 23, 24 | N/A |
| 29 | JWT 토큰 보안 강화 및 만료 시간 최적화 | ✓&nbsp;done | medium | 22 | N/A |
| 29.1 | JWT 토큰 만료 시간 설정 최적화 및 환경 변수 분리 | ✓&nbsp;done | -            | None | N/A |
| 29.2 | 리프레시 토큰 시스템 구현 | ✓&nbsp;done | -            | 29.1 | N/A |
| 29.3 | 로그인 시도 제한 및 브루트포스 공격 방지 구현 | ✓&nbsp;done | -            | 29.2 | N/A |
| 29.4 | 세션 관리 보안 강화 및 동시 세션 제어 | ✓&nbsp;done | -            | 29.2, 29.3 | N/A |
| 29.5 | 프론트엔드 토큰 자동 갱신 및 보안 상태 관리 구현 | ✓&nbsp;done | -            | 29.2, 29.4 | N/A |
| 30 | 시스템 전체 통합 테스트 및 성능 검증 | ✓&nbsp;done | high | 21, 22, 23, 24, 25, 26, 27, 28, 29 | N/A |
| 30.1 | 기능 테스트 자동화 스크립트 구현 및 실행 | ○&nbsp;pending | -            | None | N/A |
| 30.2 | API 성능 테스트 및 응답 시간 최적화 | ○&nbsp;pending | -            | 30.1 | N/A |
| 30.3 | 부하 테스트를 통한 동시 접속자 처리 능력 검증 | ○&nbsp;pending | -            | 30.2 | N/A |
| 30.4 | 보안 취약점 스캔 및 JWT 토큰 보안 검증 | ○&nbsp;pending | -            | 30.2 | N/A |
| 30.5 | 배포 준비 완료 및 최종 시스템 검증 | ○&nbsp;pending | -            | 30.1, 30.2, 30.3, 30.4 | N/A |
| 31 | 교사 대시보드 로딩 상태 무한 지속 버그 수정 | ✓&nbsp;done | medium | None | N/A |
| 31.1 | store 초기화 및 hydration 타이밍 문제 분석 | ○&nbsp;pending | -            | None | N/A |
| 31.2 | 로그인 후 store 상태 동기화 메커니즘 수정 | ○&nbsp;pending | -            | 1 | N/A |
| 31.3 | teacher 페이지 초기 로딩 로직 개선 | ○&nbsp;pending | -            | 2 | N/A |
| 31.4 | auth-sync refreshAuthState 최적화 | ○&nbsp;pending | -            | 3 | N/A |
| 31.5 | 통합 테스트 및 디버그 로그 정리 | ○&nbsp;pending | -            | 1, 2, 3, 4 | N/A |
| 32 | 모든 DB를 SUPABASE로 마이그레이션 | ✓&nbsp;done | medium | None | N/A |
| 32.3 | 하이브리드 데이터 액세스 계층 구현 | ✓&nbsp;done | -            | 2 | N/A |
| 32.4 | API 라우트를 하이브리드 모드로 업데이트 | ✓&nbsp;done | -            | 3 | N/A |
| 32.5 | RLS(Row Level Security) 정책 구현 | ✓&nbsp;done | -            | 4 | N/A |
| 32.1 | Supabase 프로젝트 설정 및 환경 구성 | ✓&nbsp;done | -            | None | N/A |
| 32.2 | SQLite 스키마를 PostgreSQL 스키마로 변환 및 마이그레이션 | ✓&nbsp;done | -            | 1 | N/A |
| 33 | 커뮤니티와 교권자료실 글쓰기 실제 DB 저장 구현 | ✓&nbsp;done | medium | 32 | N/A |
| 33.1 | 커뮤니티 글쓰기 API 연동 구현 | ✓&nbsp;done | -            | None | N/A |
| 33.2 | Supabase communityDb 함수 구현 | ✓&nbsp;done | -            | None | N/A |
| 33.3 | 커뮤니티 Supabase Storage 이미지 업로드 구현 | ✓&nbsp;done | -            | 2 | N/A |
| 33.4 | 교권자료실 Supabase 전환 | ✓&nbsp;done | -            | 2 | N/A |
| 33.5 | 커뮤니티 목록/상세 조회 Supabase 연동 | ✓&nbsp;done | -            | 2 | N/A |

> 📋 **End of Taskmaster Export** - Tasks are synced from your project using the `sync-readme` command.
<!-- TASKMASTER_EXPORT_END -->


