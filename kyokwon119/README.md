# 교권119 - 교사의 권리를 지키는 플랫폼

교권 보호를 위한 신고 및 법률 상담 시스템

## 🚀 주요 기능

### 교사를 위한 기능
- **교권 침해 신고**: 익명으로 안전하게 교권 침해 사건 신고
- **법률 상담**: 전문 변호사의 법률 자문 제공
- **커뮤니티**: 교사들 간 경험 공유 및 상호 지원
- **진행 상황 추적**: 신고 건의 처리 상태 실시간 확인

### 변호사를 위한 기능
- **사건 관리**: 담당 사건 선택 및 관리
- **법률 자문**: 체계적인 답변 시스템
- **통계 확인**: 상담 실적 및 만족도 확인

### 관리자를 위한 기능
- **시스템 모니터링**: 전체 시스템 현황 대시보드
- **사용자 관리**: 교사, 변호사 계정 관리
- **통계 분석**: 상세한 통계 및 보고서

## 🛠 기술 스택

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Mock Auth (임시)
- **Deployment**: Vercel

## 📦 설치 방법

### 🐳 Docker로 실행 (권장)

#### Docker Compose 사용 (가장 간단)
```bash
# 프로젝트 클론
git clone https://github.com/your-repo/kyokwon119.git
cd kyokwon119

# Docker Compose로 실행
docker-compose up -d

# 브라우저에서 http://localhost:5000 접속
```

#### Docker 명령어 사용
```bash
# Windows
scripts\docker-build.bat
scripts\docker-run.bat

# Mac/Linux
./scripts/docker-build.sh
./scripts/docker-run.sh

# 브라우저에서 http://localhost:5000 접속
```

#### Docker 컨테이너 관리
```bash
# 로그 확인
docker logs -f kyokwon119-app

# 컨테이너 중지
docker stop kyokwon119-app

# 컨테이너 시작
docker start kyokwon119-app

# 컨테이너 제거
docker rm kyokwon119-app
```

### 💻 로컬 개발 환경

1. 저장소 클론
```bash
git clone https://github.com/your-repo/kyokwon119.git
cd kyokwon119
```

2. 패키지 설치
```bash
npm install
```

3. 환경 변수 설정
`.env.local` 파일을 생성하고 다음 내용을 추가:
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
```

4. 개발 서버 실행
```bash
npm run dev
```

5. 브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

## 🎯 사용 방법

### 테스트 계정
인증 시스템을 제외한 구현이므로, 자동으로 다음 계정 중 하나로 로그인됩니다:

- **교사**: 익명교사1234 (기본값)
- **변호사**: 교육법전문변호사
- **관리자**: 시스템관리자

### 주요 페이지
- `/` - 메인 대시보드
- `/reports/new` - 신고 작성
- `/reports` - 신고 목록
- `/community` - 커뮤니티
- `/consult` - 변호사 상담
- `/lawyer` - 변호사 대시보드
- `/admin` - 관리자 대시보드

## 🌟 특징

- **완전 익명 시스템**: 교사의 신원 보호
- **반응형 디자인**: 모바일, 태블릿, 데스크톱 지원
- **다크 모드**: 시스템 설정 연동
- **PWA 지원**: 앱처럼 설치 가능

## 📁 프로젝트 구조

```
kyokwon119/
├── app/                  # Next.js 앱 라우터
│   ├── admin/           # 관리자 페이지
│   ├── community/       # 커뮤니티
│   ├── consult/         # 상담 페이지
│   ├── lawyer/          # 변호사 페이지
│   └── reports/         # 신고 관련 페이지
├── components/          # React 컴포넌트
│   ├── layout/          # 레이아웃 컴포넌트
│   └── ui/              # UI 컴포넌트
├── lib/                 # 유틸리티 및 설정
│   ├── auth/            # 인증 관련
│   ├── data/            # Mock 데이터
│   ├── store/           # Zustand 스토어
│   ├── supabase/        # Supabase 클라이언트
│   ├── types/           # TypeScript 타입
│   └── utils/           # 유틸리티 함수
└── public/              # 정적 파일
```

## 🔐 보안 고려사항

- 실제 운영 시 적절한 인증 시스템 구현 필요
- Supabase RLS (Row Level Security) 설정 필요
- 민감한 데이터 암호화 처리 필요

## 📝 라이센스

이 프로젝트는 교육 및 시연 목적으로 제작되었습니다.

## 🤝 기여

버그 리포트 및 기능 제안은 이슈를 통해 제출해주세요.

## 📞 문의

프로젝트에 대한 문의사항이 있으시면 연락주세요.

---

Made with ❤️ for protecting teachers' rights