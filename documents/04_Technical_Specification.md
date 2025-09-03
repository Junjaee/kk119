# 교권119 기술 명세서

## 1. 기술 스택 Overview

### 선정 기준
- **비용**: 무료 티어 최대 활용
- **개발 속도**: 빠른 프로토타이핑
- **확장성**: 향후 확장 고려
- **커뮤니티**: 풍부한 레퍼런스

### 핵심 기술 스택
```
Frontend:    Next.js 14 (App Router)
Backend:     Next.js API Routes
Database:    Supabase (PostgreSQL)
Auth:        Supabase Auth
Storage:     Supabase Storage
Hosting:     Vercel
Mobile:      PWA
```

## 2. Frontend Architecture

### 2.1 Next.js 14 구조
```
src/
├── app/                    # App Router
│   ├── (auth)/            # 인증 관련 페이지
│   │   ├── login/
│   │   ├── register/
│   │   └── verify/
│   ├── (main)/            # 메인 서비스
│   │   ├── reports/       # 신고 관리
│   │   ├── community/     # 커뮤니티
│   │   ├── consult/       # 상담
│   │   └── profile/       # 프로필
│   ├── admin/             # 관리자
│   ├── lawyer/            # 변호사
│   ├── api/               # API Routes
│   ├── layout.tsx
│   └── page.tsx
├── components/            # 재사용 컴포넌트
│   ├── ui/               # UI 컴포넌트
│   ├── forms/            # 폼 컴포넌트
│   └── layouts/          # 레이아웃
├── lib/                  # 유틸리티
│   ├── supabase/        # Supabase 클라이언트
│   ├── utils/           # 헬퍼 함수
│   └── types/           # TypeScript 타입
├── hooks/               # Custom Hooks
└── styles/              # 스타일
```

### 2.2 주요 라이브러리
```json
{
  "dependencies": {
    "next": "14.2.0",
    "react": "18.3.0",
    "react-dom": "18.3.0",
    "@supabase/supabase-js": "2.45.0",
    "@supabase/ssr": "0.5.0",
    "tailwindcss": "3.4.0",
    "react-hook-form": "7.52.0",
    "zod": "3.23.0",
    "@tanstack/react-query": "5.51.0",
    "zustand": "4.5.0",
    "react-hot-toast": "2.4.0",
    "dayjs": "1.11.0",
    "react-markdown": "9.0.0"
  }
}
```

### 2.3 상태 관리
```typescript
// Zustand Store 구조
interface AppStore {
  // User State
  user: User | null;
  setUser: (user: User | null) => void;
  
  // UI State
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  
  // Notification State
  notifications: Notification[];
  addNotification: (notification: Notification) => void;
}
```

## 3. Backend Architecture

### 3.1 API Routes 구조
```typescript
// API 엔드포인트 구조
/api/
├── auth/
│   ├── login/          POST   - 로그인
│   ├── register/       POST   - 회원가입
│   ├── verify/         POST   - 이메일 인증
│   └── logout/         POST   - 로그아웃
├── reports/
│   ├── route.ts        GET    - 신고 목록
│   │                   POST   - 신고 작성
│   └── [id]/
│       └── route.ts    GET    - 신고 상세
│                       PUT    - 신고 수정
│                       DELETE - 신고 삭제
├── consults/
│   ├── route.ts        POST   - 상담 시작
│   └── [id]/
│       └── route.ts    PUT    - 답변 작성
├── community/
│   ├── posts/          GET, POST
│   └── comments/       GET, POST
└── admin/
    └── stats/          GET    - 통계
```

### 3.2 미들웨어
```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  // 인증 체크
  // 권한 검증
  // Rate Limiting
  // CORS 설정
}
```

## 4. Database Schema

### 4.1 Supabase 테이블 구조

```sql
-- Users 테이블
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  nickname VARCHAR(50) UNIQUE NOT NULL,
  role ENUM('teacher', 'lawyer', 'admin') DEFAULT 'teacher',
  school_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Reports 테이블
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  incident_date DATE NOT NULL,
  status ENUM('received', 'reviewing', 'consulting', 'completed') DEFAULT 'received',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Consults 테이블
CREATE TABLE consults (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID REFERENCES reports(id),
  lawyer_id UUID REFERENCES users(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Posts 테이블 (커뮤니티)
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  category VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Comments 테이블
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES posts(id),
  user_id UUID REFERENCES users(id),
  content TEXT NOT NULL,
  is_lawyer BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Files 테이블
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID REFERENCES reports(id),
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type VARCHAR(100),
  uploaded_at TIMESTAMP DEFAULT NOW()
);

-- Notifications 테이블
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 4.2 Row Level Security (RLS)
```sql
-- Users 테이블 RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Reports 테이블 RLS
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers can view own reports" ON reports
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Lawyers can view all reports" ON reports
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'lawyer')
  );
```

## 5. Authentication & Authorization

### 5.1 Supabase Auth 설정
```typescript
// lib/supabase/client.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### 5.2 학교 이메일 인증
```typescript
// 이메일 도메인 검증
const schoolDomains = [
  'sen.go.kr',      // 서울
  'pen.go.kr',      // 부산
  'dge.go.kr',      // 대구
  'ice.go.kr',      // 인천
  'gen.go.kr',      // 광주
  'dje.go.kr',      // 대전
  'use.go.kr',      // 울산
  'sje.go.kr',      // 세종
  // ... 기타 교육청 도메인
];

function validateSchoolEmail(email: string): boolean {
  const domain = email.split('@')[1];
  return schoolDomains.some(d => domain.endsWith(d));
}
```

## 6. File Storage

### 6.1 Supabase Storage 구조
```
buckets/
├── reports/           # 신고 증거자료
│   └── {user_id}/
│       └── {report_id}/
│           └── {file_name}
├── avatars/          # 프로필 이미지
│   └── {user_id}/
│       └── avatar.jpg
└── attachments/      # 게시글 첨부파일
    └── {post_id}/
        └── {file_name}
```

### 6.2 파일 업로드 처리
```typescript
async function uploadFile(file: File, bucket: string, path: string) {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false
    });
  
  return { data, error };
}
```

## 7. Security

### 7.1 보안 설정
```typescript
// next.config.js
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'Referrer-Policy',
    value: 'origin-when-cross-origin'
  }
];
```

### 7.2 Input Validation
```typescript
// Zod 스키마 예시
import { z } from 'zod';

const reportSchema = z.object({
  type: z.enum(['parent', 'student', 'defamation', 'other']),
  title: z.string().min(5).max(200),
  content: z.string().min(50).max(5000),
  incidentDate: z.string().datetime(),
  files: z.array(z.instanceof(File)).max(5).optional()
});
```

## 8. Performance Optimization

### 8.1 캐싱 전략
```typescript
// React Query 캐싱
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,        // 1분
      cacheTime: 5 * 60 * 1000,     // 5분
      refetchOnWindowFocus: false
    }
  }
});
```

### 8.2 이미지 최적화
```typescript
// Next.js Image 컴포넌트 활용
import Image from 'next/image';

<Image
  src={imageUrl}
  alt="Evidence"
  width={800}
  height={600}
  loading="lazy"
  placeholder="blur"
/>
```

## 9. PWA Configuration

### 9.1 manifest.json
```json
{
  "name": "교권119",
  "short_name": "교권119",
  "description": "교사를 위한 교권 보호 시스템",
  "theme_color": "#FF6B35",
  "background_color": "#FFFFFF",
  "display": "standalone",
  "orientation": "portrait",
  "scope": "/",
  "start_url": "/",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### 9.2 Service Worker
```javascript
// public/sw.js
self.addEventListener('install', (event) => {
  // 캐시 설정
});

self.addEventListener('fetch', (event) => {
  // 오프라인 처리
});
```

## 10. Development Workflow

### 10.1 Git Branch 전략
```
main
├── develop
│   ├── feature/auth
│   ├── feature/reports
│   ├── feature/community
│   └── feature/admin
└── hotfix/critical-bug
```

### 10.2 환경 변수
```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## 11. Deployment

### 11.1 Vercel 배포 설정
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "devCommand": "npm run dev",
  "installCommand": "npm install"
}
```

### 11.2 환경별 설정
- **Development**: localhost:3000
- **Staging**: staging.kyokwon119.vercel.app
- **Production**: kyokwon119.vercel.app

## 12. Monitoring & Analytics

### 12.1 Error Tracking
- Vercel Analytics (무료)
- Sentry (무료 티어)

### 12.2 Performance Monitoring
- Lighthouse CI
- Web Vitals
- Vercel Speed Insights

## 13. Testing Strategy

### 13.1 테스트 도구
```json
{
  "devDependencies": {
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "jest": "^29.7.0",
    "cypress": "^13.0.0"
  }
}
```

### 13.2 테스트 범위
- Unit Tests: 비즈니스 로직
- Integration Tests: API 엔드포인트
- E2E Tests: 주요 사용자 플로우