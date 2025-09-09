# 교권119 🏫⚖️

> 교사의 권익을 보호하고 교권 침해 사건에 대한 체계적 대응을 지원하는 플랫폼

![Next.js](https://img.shields.io/badge/Next.js-15.5.2-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React-19.1.0-blue?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.17-38B2AC?style=flat-square&logo=tailwind-css)
![SQLite](https://img.shields.io/badge/SQLite-3-003B57?style=flat-square&logo=sqlite)

## 📋 프로젝트 개요

교권119는 교사들이 직면하는 교권 침해 문제에 대해 체계적이고 전문적인 대응을 지원하는 종합 플랫폼입니다. 익명성을 보장하면서도 전문적인 법적 조언과 동료 교사들과의 경험 공유를 통해 교권 보호에 기여합니다.

## ✨ 주요 기능

### 🔐 사용자 인증 시스템
- SQLite 기반 로컬 데이터베이스 인증
- 비밀번호 암호화 및 JWT 토큰 기반 세션 관리
- 교사, 변호사, 관리자 역할 기반 접근 제어

### 📢 교권 침해 신고 시스템
- 다단계 신고 접수 프로세스
- 사건 유형별 분류 및 증거 자료 첨부
- 실시간 처리 상태 추적
- 익명성 보장

### 💬 커뮤니티 기능
- 경험 공유 및 조언 게시판
- 실시간 댓글 및 좋아요 기능
- 전문 변호사 답변 시스템
- 카테고리별 게시물 분류

### ⚖️ 법적 지원
- 교육법 전문 변호사 상담
- 사건별 맞춤 법적 조언
- 판례 및 대응 사례 데이터베이스

## 🛠 기술 스택

### Frontend
- **Next.js 15.5.2** - React 기반 풀스택 프레임워크
- **React 19.1.0** - 사용자 인터페이스 라이브러리
- **TypeScript** - 정적 타입 시스템
- **Tailwind CSS** - 유틸리티 우선 CSS 프레임워크
- **Radix UI** - 접근성 우선 컴포넌트 라이브러리

### Backend
- **Next.js API Routes** - 서버사이드 API
- **SQLite** - 경량 관계형 데이터베이스
- **better-sqlite3** - 고성능 SQLite 드라이버
- **bcryptjs** - 비밀번호 암호화
- **jsonwebtoken** - JWT 토큰 인증

### 개발 도구
- **ESLint** - 코드 린팅
- **Turbopack** - 고속 번들러
- **Hot Toast** - 사용자 알림

## 🚀 시작하기

### 요구사항
- Node.js 18.0 이상
- npm 또는 yarn

### 설치 및 실행

```bash
# 저장소 클론
git clone https://github.com/Junjaee/kk119.git
cd kk119/kyokwon119

# 의존성 설치
npm install

# 테스트 계정 생성 (선택사항)
node scripts/create-test-accounts.js

# 개발 서버 실행
npm run dev
```

서버가 시작되면 [http://localhost:3000](http://localhost:3000)에서 애플리케이션에 접근할 수 있습니다.

### 🐳 Docker로 실행

```bash
# Docker 컨테이너 빌드 및 실행
npm run docker:build
npm run docker:run

# 또는 Docker Compose 사용
npm run docker:up

# 브라우저에서 http://localhost:3001 접속
```

## 🧪 테스트 계정

개발 및 테스트 목적으로 다음 계정들을 사용할 수 있습니다:

| 역할 | 이메일 | 비밀번호 | 설명 |
|------|--------|----------|------|
| 교사 | teacher@test.com | Teacher123! | 일반 교사 계정 |
| 변호사 | lawyer@test.com | Lawyer123! | 법적 자문 제공자 |
| 관리자 | admin@test.com | Admin123! | 시스템 관리자 |
| 교장 | principal@test.com | Principal123! | 학교 관리자 |

## 🌟 주요 페이지

- `/` - 메인 대시보드
- `/login` - 로그인 페이지
- `/signup` - 회원가입 페이지
- `/reports/new` - 교권 침해 신고 작성
- `/reports` - 신고 목록 및 관리
- `/community` - 커뮤니티 게시판
- `/community/new` - 커뮤니티 글 작성
- `/consult` - 변호사 상담
- `/lawyer` - 변호사 대시보드
- `/admin` - 관리자 대시보드

## 📁 프로젝트 구조

```
kyokwon119/
├── app/                    # Next.js 13+ App Router
│   ├── api/               # API 라우트
│   │   ├── auth/         # 인증 API
│   │   └── community/    # 커뮤니티 API
│   ├── community/        # 커뮤니티 페이지
│   ├── reports/          # 신고 페이지
│   ├── login/            # 로그인 페이지
│   └── signup/           # 회원가입 페이지
├── components/            # 재사용 컴포넌트
│   ├── ui/               # UI 컴포넌트
│   ├── layout/           # 레이아웃 컴포넌트
│   └── editor/           # 에디터 컴포넌트
├── lib/                  # 유틸리티 및 설정
│   ├── auth/            # 인증 관련
│   ├── db/              # 데이터베이스
│   ├── services/        # 비즈니스 로직
│   └── utils/           # 공통 유틸리티
├── data/                # SQLite 데이터베이스 파일
└── scripts/             # 개발 스크립트
```

## 🔧 주요 스크립트

```bash
# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm start

# 코드 린팅
npm run lint

# 테스트 계정 생성
node scripts/create-test-accounts.js

# Docker 관련
npm run docker:build
npm run docker:run
npm run docker:up
npm run docker:down
```

## 🤝 기여하기

1. 이 저장소를 포크합니다
2. 새로운 기능 브랜치를 생성합니다 (`git checkout -b feature/amazing-feature`)
3. 변경사항을 커밋합니다 (`git commit -m 'Add some amazing feature'`)
4. 브랜치에 푸시합니다 (`git push origin feature/amazing-feature`)
5. Pull Request를 생성합니다

## 🔐 보안 고려사항

- JWT 토큰 기반 인증 시스템 구현
- 비밀번호 bcrypt 암호화 적용
- SQL Injection 방지를 위한 Prepared Statement 사용
- 익명성 보장을 위한 개인정보 최소화

## 📄 라이선스

이 프로젝트는 교육 목적으로 개발되었습니다.

## 📞 문의

프로젝트에 대한 문의나 제안사항이 있으시면 이슈를 생성해 주세요.

---

**교권119** - 교사의 권익 보호를 위한 종합 플랫폼 🏫⚖️