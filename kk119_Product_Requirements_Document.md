# 교사119 플랫폼 - Product Requirements Document (PRD)

## 📋 문서 정보
- **버전**: 2.0.0
- **작성일**: 2025-10-20
- **작성자**: Claude Code Assistant
- **상태**: Production Ready
- **플랫폼**: 교사119 (교사 권익 보호 통합 플랫폼)

---

## 1. 제품 개요 (Product Overview)

### 1.1 비전 (Vision)
**"교사의 권익을 보호하고, 교육 현장의 문제를 신속하게 해결하는 통합 지원 플랫폼"**

교사119는 교사들이 겪는 다양한 교권 침해 상황에 대해 즉각적인 법률 지원과 상담을 제공하며, 교사 커뮤니티를 통해 경험과 지식을 공유할 수 있는 종합 솔루션입니다.

### 1.2 핵심 가치 제안 (Value Proposition)
1. **즉각적 대응**: 24시간 내 법률 상담 연결
2. **전문성**: 교육법 전문 변호사 네트워크
3. **익명성 보장**: 안전한 신고 및 상담 시스템
4. **데이터 기반**: 교권 침해 통계 및 분석 제공
5. **커뮤니티**: 교사 간 경험 공유 및 상호 지원

### 1.3 목표 사용자 (Target Users)

#### Primary Users
- **교사** (초/중/고등학교 교원)
  - 교권 침해 피해자
  - 예방 교육이 필요한 교사
  - 동료 지원을 원하는 교사

#### Secondary Users
- **변호사** (교육법 전문)
  - 교권 보호 전문 변호사
  - 프로보노 참여 변호사

#### Administrative Users
- **협회 관리자**
  - 시/도 교육청 담당자
  - 교원단체 관리자
- **슈퍼 관리자**
  - 시스템 전체 관리자
  - 플랫폼 운영진

---

## 2. 핵심 기능 (Core Features)

### 2.1 🔐 인증 및 권한 관리 시스템

#### 2.1.1 다중 역할 기반 인증 (Multi-Role Authentication)

**기능 상세**:
- JWT 기반 토큰 인증 시스템
- 역할별 독립적인 토큰 관리 (Dual Storage Mechanism)
  - Role-specific keys: `auth_token_teacher`, `auth_token_lawyer`, etc.
  - Legacy fallback: `token` key for backward compatibility
- 자동 토큰 갱신 메커니즘
- 세션 타임아웃 관리 (기본 24시간)

**역할 체계**:
```typescript
enum UserRole {
  TEACHER = 'teacher',        // 교사
  LAWYER = 'lawyer',          // 변호사
  ADMIN = 'admin',           // 협회 관리자
  SUPER_ADMIN = 'super_admin' // 슈퍼 관리자
}
```

**보안 기능**:
- bcrypt 해싱 (salt rounds: 10)
- 2FA 지원 준비
- IP 기반 접근 제어

#### 2.1.2 역할별 접근 제어 (Role-Based Access Control)

**권한 매트릭스**:
| 기능 | 교사 | 변호사 | 협회관리자 | 슈퍼관리자 |
|------|------|--------|------------|------------|
| 신고 작성 | ✅ | ❌ | ❌ | ✅ |
| 신고 조회 (본인) | ✅ | ❌ | ❌ | ✅ |
| 신고 조회 (전체) | ❌ | ✅ | ❌ | ✅ |
| 법률 상담 | ✅ | ✅ | ❌ | ✅ |
| 통계 조회 | ✅ | ✅ | ❌ | ✅ |
| 사용자 관리 | ❌ | ❌ | ✅ | ✅ |
| 시스템 설정 | ❌ | ❌ | ❌ | ✅ |

---

### 2.2 📝 교권 침해 신고 시스템

#### 2.2.1 신고 접수 (Report Submission)

**신고 유형 분류**:
1. **학부모 관련**
   - 폭언/욕설
   - 무리한 요구
   - 명예훼손
   - 물리적 위협

2. **학생 관련**
   - 수업 방해
   - 반항/불복종
   - 폭언/폭행
   - 사이버 불링

3. **동료/관리자 관련**
   - 직장 내 괴롭힘
   - 부당한 업무 지시
   - 차별/배제

**신고 프로세스**:
```
[신고 작성] → [초기 분류] → [변호사 배정] → [상담 진행] → [해결/종결]
     ↓            ↓              ↓              ↓            ↓
  (익명처리)   (긴급도 평가)  (24시간 내)   (진행 추적)  (만족도 조사)
```

**데이터 수집 항목**:
- 사건 일시 및 장소
- 가해자 정보 (익명화 가능)
- 사건 경위 (최대 5000자)
- 증거 자료 (파일 업로드, 최대 10MB × 5개)
- 목격자 정보
- 희망 조치사항

#### 2.2.2 신고 추적 시스템 (Case Tracking)
**구현 상태**: ✅ Complete

**상태 관리**:
```typescript
enum ReportStatus {
  SUBMITTED = 'submitted',     // 접수됨
  ASSIGNED = 'assigned',       // 변호사 배정
  IN_PROGRESS = 'in_progress', // 상담 진행중
  RESOLVED = 'resolved',       // 해결됨
  CLOSED = 'closed'           // 종결
}
```

**실시간 알림**:
- 상태 변경 시 이메일/SMS 알림
- 변호사 답변 시 즉시 알림
- 중요 일정 리마인더

---

### 2.3 ⚖️ 법률 상담 시스템

#### 2.3.1 변호사 매칭 시스템

**매칭 알고리즘**:
1. 각 변호사가 사건을 조회하고 상담을 원하는 사건을 직접 매칭


#### 2.3.2 상담 관리 대시보드 (Consultation Dashboard)

**변호사용 기능**:
- 미배정 케이스 풀 조회
- 담당 케이스 관리
- 상담 이력 작성
- 법률 자료 첨부
- 일정 관리

**교사용 기능**:
- 상담 진행 상황 확인
- 메시지 송수신
- 평가 및 피드백
- 상담 내역 다운로드

---

### 2.4 👥 커뮤니티 시스템

#### 2.4.1 익명 게시판

**게시판 카테고리**:
1. **경험 공유**
   - 성공 사례
   - 대처 방법
   - 실패 교훈

2. **Q&A**
   - 법률 질문
   - 행정 절차
   - 교육 정책

3. **자료실**
   - 판례 모음
   - 서식 템플릿
   - 교육 자료

**익명성 보장**:
- 자동 닉네임 생성 (예: "익명교사001")
- IP 해싱 처리
- 개인정보 자동 마스킹

---

### 2.5 📊 통계 및 분석 시스템

#### 2.5.1 교권 침해 통계 대시보드

**주요 지표**:
1. **시계열 분석**
   - 일별/월별/연도별 추세
   - 계절성 패턴 분석

2. **유형별 분석**
   - 침해 유형별 분포
   - 가해자 유형별 통계

3. **지역별 분석**
   - 시/도별 발생 현황
   - 핫스팟 매핑

4. **해결률 분석**
   - 평균 처리 시간
   - 만족도 점수
   - 재발생률

**데이터 시각화**:
- Chart.js 기반 인터랙티브 차트
- 히트맵
- 실시간 대시보드
- PDF 리포트 생성


---

### 2.6 🔔 알림 시스템

#### 2.6.1 다채널 알림

**알림 채널**:
1. **인앱 알림**
   - 실시간 팝업
   - 알림 센터
   - 배지 카운트

2. **이메일**
   - 템플릿 기반 HTML 이메일
   - 일일 다이제스트

3. **SMS** 
   - 긴급 알림
   - 일정 리마인더

**알림 설정**:
- 유형별 on/off
- 시간대 설정 (방해금지 모드)
- 채널별 우선순위

---

## 3. 기술 사양 (Technical Specifications)

### 3.1 기술 스택

#### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5.0+
- **Styling**: Tailwind CSS 3.0
- **State Management**: Zustand
- **UI Components**: Radix UI + shadcn/ui
- **Charts**: Chart.js + react-chartjs-2

#### Backend
- **Runtime**: Node.js 18+ (ARM optimized)
- **API**: Next.js API Routes
- **Database**: SQLite3 (Better-SQLite3)
- **ORM**: Raw SQL with prepared statements
- **Authentication**: JWT (jsonwebtoken)
- **Encryption**: bcrypt

#### Infrastructure
- **Deployment**: Vercel / Self-hosted
- **CDN**: CloudFlare
- **Monitoring**: Sentry
- **Analytics**: Google Analytics 4

### 3.2 데이터베이스 스키마

```sql
-- 핵심 테이블 구조
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('teacher','lawyer','admin','super_admin')),
  phone TEXT,
  school TEXT,
  position TEXT,
  association_id INTEGER,
  is_verified BOOLEAN DEFAULT 0,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME
);

CREATE TABLE reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  category TEXT NOT NULL,
  sub_category TEXT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  incident_date DATE NOT NULL,
  incident_location TEXT,
  perpetrator_type TEXT,
  status TEXT DEFAULT 'submitted',
  priority TEXT DEFAULT 'normal',
  assigned_lawyer_id INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  resolved_at DATETIME,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (assigned_lawyer_id) REFERENCES users(id)
);

CREATE TABLE consultations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  report_id INTEGER NOT NULL,
  lawyer_id INTEGER NOT NULL,
  teacher_id INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  type TEXT DEFAULT 'general',
  started_at DATETIME,
  completed_at DATETIME,
  satisfaction_rating INTEGER,
  notes TEXT,
  FOREIGN KEY (report_id) REFERENCES reports(id),
  FOREIGN KEY (lawyer_id) REFERENCES users(id),
  FOREIGN KEY (teacher_id) REFERENCES users(id)
);

CREATE TABLE messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  consultation_id INTEGER NOT NULL,
  sender_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (consultation_id) REFERENCES consultations(id),
  FOREIGN KEY (sender_id) REFERENCES users(id)
);
```

### 3.3 API 엔드포인트

#### Authentication APIs
```
POST   /api/auth/register    - 회원가입
POST   /api/auth/login       - 로그인
POST   /api/auth/logout      - 로그아웃
GET    /api/auth/me          - 현재 사용자 정보
POST   /api/auth/refresh     - 토큰 갱신
POST   /api/auth/forgot      - 비밀번호 찾기
POST   /api/auth/reset       - 비밀번호 재설정
```

#### Report Management APIs
```
GET    /api/reports          - 신고 목록 조회
GET    /api/reports/:id      - 신고 상세 조회
POST   /api/reports          - 신고 작성
PUT    /api/reports/:id      - 신고 수정
DELETE /api/reports/:id      - 신고 삭제
POST   /api/reports/:id/assign - 변호사 배정
```

#### Consultation APIs
```
GET    /api/consultations    - 상담 목록
GET    /api/consultations/:id - 상담 상세
POST   /api/consultations    - 상담 시작
PUT    /api/consultations/:id - 상담 상태 변경
POST   /api/consultations/:id/messages - 메시지 전송
```

#### Statistics APIs
```
GET    /api/stats/overview   - 전체 통계
GET    /api/stats/trends     - 추세 분석
GET    /api/stats/regional   - 지역별 통계
GET    /api/stats/categories - 카테고리별 통계
```

---

## 4. 보안 요구사항 (Security Requirements)

### 4.1 데이터 보호
- **암호화**: 모든 민감 데이터 AES-256 암호화
- **전송 보안**: TLS 1.3 강제 적용
- **PII 보호**: 개인정보 자동 마스킹
- **데이터 보존**: 법적 요구사항 준수 (5년)

### 4.2 접근 제어
- **Multi-Factor Authentication**: TOTP 기반 2FA
- **Session Management**: 유휴 시간 초과 (30분)
- **IP Whitelisting**: 관리자 계정 IP 제한
- **Audit Logging**: 모든 중요 작업 기록

### 4.3 규정 준수
- **개인정보보호법 (PIPA)** 준수
- **GDPR** 대응 (EU 사용자)
- **교육부 가이드라인** 준수
- **변호사법** 관련 규정 준수

---

## 5. 성능 요구사항 (Performance Requirements)

### 5.1 응답 시간
- **페이지 로드**: < 2초
- **API 응답**: < 500ms (95 percentile)
- **검색**: < 1초
- **파일 업로드**: < 10초 (10MB)

### 5.2 가용성
- **Uptime SLA**: 99.9%
- **계획된 다운타임**: 월 1회, 최대 2시간
- **장애 복구 시간**: < 1시간

### 5.3 확장성
- **동시 사용자**: 10,000명
- **일일 활성 사용자**: 50,000명
- **데이터 증가율**: 연 100GB

---

## 6. 사용자 경험 (User Experience)

### 6.1 디자인 원칙
1. **심플함**: 직관적인 인터페이스
2. **일관성**: 통일된 디자인 시스템
3. **접근성**: WCAG 2.1 Level AA 준수
4. **반응형**: 모바일 최적화

### 6.2 주요 사용자 플로우

#### 교사 - 신고 접수 플로우
```
[로그인] → [대시보드] → [신고하기] → [유형 선택] → [상세 작성]
    → [증거 첨부] → [제출] → [확인 메시지] → [추적 대시보드]
```

#### 변호사 - 상담 플로우
```
[로그인] → [상담 대시보드] → [미배정 케이스] → [케이스 선택]
    → [상세 검토] → [수락] → [메시지 작성] → [전송] → [상태 업데이트]
```

### 6.3 브랜딩
- **Primary Color**: #0066CC (신뢰감 있는 파란색)
- **Secondary Color**: #FF6B35 (긴급/주목 오렌지)
- **Typography**: Pretendard (한글), Inter (영문)
- **아이콘**: Lucide Icons

---

## 7. 로드맵 (Product Roadmap)

### Phase 1 (현재 완료) ✅
- 기본 인증 시스템
- 신고 접수/관리
- 변호사 매칭
- 기본 통계

### Phase 2 (진행 중) 🚧
- 실시간 채팅
- 모바일 앱
- AI 기반 케이스 분류
- 고급 분석 대시보드

### Phase 3 (계획) 📅
- 화상 상담
- 음성 전사
- 예측 분석
- 챗봇 상담

### Phase 4 (미래) 🔮
- AI 법률 조언
- 블록체인 증거 보관
- VR 상담실
- 국제화 (다국어)

---

## 8. 성공 지표 (Success Metrics)

### 8.1 비즈니스 KPI
- **월간 활성 사용자 (MAU)**: 10,000명 목표
- **신고 해결률**: 85% 이상
- **평균 처리 시간**: 72시간 이내
- **사용자 만족도 (NPS)**: 70 이상

### 8.2 기술 KPI
- **시스템 가용성**: 99.9%
- **평균 응답 시간**: < 500ms
- **에러율**: < 0.1%
- **보안 침해**: 0건

### 8.3 사용자 KPI
- **신규 가입률**: 월 20% 성장
- **재방문율**: 60% 이상
- **평균 세션 시간**: 15분 이상
- **기능 활용도**: 70% 이상

---

## 9. 리스크 및 완화 방안

### 9.1 기술적 리스크
| 리스크 | 영향도 | 발생확률 | 완화 방안 |
|--------|--------|----------|-----------|
| 데이터 유출 | 높음 | 낮음 | 암호화, 접근 제어, 감사 로그 |
| 서버 다운 | 높음 | 중간 | 이중화, 자동 페일오버 |
| DDoS 공격 | 중간 | 중간 | CloudFlare, Rate limiting |

### 9.2 비즈니스 리스크
| 리스크 | 영향도 | 발생확률 | 완화 방안 |
|--------|--------|----------|-----------|
| 사용자 신뢰 상실 | 높음 | 낮음 | 투명한 커뮤니케이션, 빠른 대응 |
| 법적 분쟁 | 높음 | 낮음 | 법률 자문, 약관 명확화 |
| 경쟁 서비스 등장 | 중간 | 높음 | 차별화 기능, 사용자 락인 |

---

## 10. 부록 (Appendix)

### 10.1 용어 정의
- **교권**: 교사의 교육 활동에 대한 권리와 권한
- **프로보노**: 무료 법률 봉사
- **케이스**: 개별 신고 건
- **컨설테이션**: 변호사와의 상담

### 10.2 참고 자료
- 교육부 교권 보호 가이드라인
- 대한변호사협회 프로보노 지침
- WCAG 2.1 접근성 가이드
- Next.js 14 공식 문서

### 10.3 연락처
- 기술 문의: tech@kyokwon119.org
- 사업 문의: biz@kyokwon119.org
- 긴급 지원: 119@kyokwon119.org

---

**© 2025 교사119. All Rights Reserved.**

이 PRD는 교사119 플랫폼의 현재 구현 상태와 향후 계획을 포괄적으로 문서화한 것입니다. 지속적으로 업데이트되며, 모든 이해관계자들의 참조 문서로 활용됩니다.