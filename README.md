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