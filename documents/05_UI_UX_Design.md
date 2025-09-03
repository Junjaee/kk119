# 교권119 UI/UX 설계 문서

## 1. 디자인 시스템

### 1.1 브랜드 아이덴티티

#### 로고
```
텍스트 로고: 교권119
서체: Bold Sans-serif
색상: #FF6B35 (주황색 포인트)
```

#### 슬로건
"교사의 권리, 우리가 지킵니다"

### 1.2 컬러 팔레트

#### Primary Colors
```css
--primary-orange: #FF6B35;    /* 메인 포인트 */
--primary-hover: #E5602F;     /* 호버 상태 */
--primary-light: #FFE5DB;     /* 배경색 */

/* Grayscale */
--black: #1A1A1A;             /* 주요 텍스트 */
--gray-900: #2D2D2D;          /* 제목 */
--gray-700: #4A4A4A;          /* 본문 */
--gray-500: #767676;          /* 보조 텍스트 */
--gray-300: #D4D4D4;          /* 구분선 */
--gray-100: #F5F5F5;          /* 배경 */
--white: #FFFFFF;             /* 기본 배경 */
```

#### Semantic Colors
```css
--success: #10B981;           /* 성공, 완료 */
--warning: #F59E0B;           /* 경고 */
--error: #EF4444;             /* 오류, 긴급 */
--info: #3B82F6;              /* 정보 */
```

#### Dark Mode Colors
```css
--dark-bg: #1A1A1A;
--dark-surface: #2D2D2D;
--dark-border: #404040;
--dark-text: #E5E5E5;
--dark-text-secondary: #A3A3A3;
```

### 1.3 타이포그래피

```css
/* Font Family */
--font-primary: 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif;

/* Font Sizes */
--text-xs: 0.75rem;     /* 12px */
--text-sm: 0.875rem;    /* 14px */
--text-base: 1rem;      /* 16px */
--text-lg: 1.125rem;    /* 18px */
--text-xl: 1.25rem;     /* 20px */
--text-2xl: 1.5rem;     /* 24px */
--text-3xl: 1.875rem;   /* 30px */
--text-4xl: 2.25rem;    /* 36px */

/* Font Weights */
--font-regular: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;

/* Line Heights */
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.75;
```

### 1.4 Spacing System
```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
```

## 2. 레이아웃 구조

### 2.1 데스크톱 레이아웃 (1440px)
```
┌─────────────────────────────────────────────────┐
│                    Header (80px)                 │
├─────────────────────────────────────────────────┤
│         │                                        │
│  Sidebar│         Main Content Area             │
│  (240px)│            (1200px)                    │
│         │                                        │
│         │                                        │
└─────────────────────────────────────────────────┘
```

### 2.2 모바일 레이아웃 (375px)
```
┌──────────────────┐
│  Header (60px)   │
├──────────────────┤
│                  │
│   Main Content   │
│                  │
├──────────────────┤
│  Bottom Nav(60px)│
└──────────────────┘
```

## 3. 컴포넌트 디자인

### 3.1 버튼 스타일

#### Primary Button
```css
.btn-primary {
  background: var(--primary-orange);
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-primary:hover {
  background: var(--primary-hover);
  box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);
}
```

#### Secondary Button
```css
.btn-secondary {
  background: white;
  color: var(--gray-700);
  border: 1px solid var(--gray-300);
  padding: 12px 24px;
  border-radius: 8px;
}
```

### 3.2 카드 컴포넌트
```css
.card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.3s;
}

.card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}
```

### 3.3 폼 요소

#### Input Field
```css
.input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid var(--gray-300);
  border-radius: 8px;
  font-size: var(--text-base);
  transition: all 0.2s;
}

.input:focus {
  border-color: var(--primary-orange);
  box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.1);
}
```

## 4. 페이지별 UI 설계

### 4.1 랜딩 페이지 (로그인 전)

```
┌─────────────────────────────────────────┐
│            네비게이션 바                   │
├─────────────────────────────────────────┤
│                                         │
│      교권119                           │
│      교사의 권리, 우리가 지킵니다          │
│                                         │
│      [시작하기] [더 알아보기]             │
│                                         │
├─────────────────────────────────────────┤
│                                         │
│   📱 신속한 신고     🔒 완전한 익명      │
│   ⚖️ 전문 변호사     👥 교사 커뮤니티    │
│                                         │
├─────────────────────────────────────────┤
│           이용 방법 안내                  │
│   1. 회원가입 → 2. 신고 → 3. 상담       │
├─────────────────────────────────────────┤
│              푸터                        │
└─────────────────────────────────────────┘
```

### 4.2 메인 대시보드 (로그인 후)

```
┌─────────────────────────────────────────┐
│  🔔 3  |  안녕하세요, 익명교사1234님  🌙  │
├──────┬──────────────────────────────────┤
│      │   최근 신고 현황                  │
│ 신고  │  ┌────────────────────┐         │
│ 접수  │  │ 📊 진행중: 2건      │         │
│      │  │ ✅ 완료: 5건        │         │
│ 내   │  └────────────────────┘         │
│ 신고  │                                 │
│      │   최근 변호사 답변                │
│ 커뮤  │  ┌────────────────────┐         │
│ 니티  │  │ • 학부모 민원 대응법 │         │
│      │  │ • 명예훼손 법적 조치 │         │
│ 상담  │  └────────────────────┘         │
│      │                                 │
│ 마이  │   인기 커뮤니티 글               │
│ 페이지 │  ┌────────────────────┐         │
│      │  │ 🔥 효과적인 대응 사례│         │
│      │  │ 💬 함께 극복한 경험  │         │
│      │  └────────────────────┘         │
└──────┴──────────────────────────────────┘
```

### 4.3 신고 작성 페이지

```
┌─────────────────────────────────────────┐
│          교권 침해 신고하기               │
├─────────────────────────────────────────┤
│                                         │
│  신고 유형*                              │
│  [▼ 선택하세요                      ]   │
│                                         │
│  발생 일시*                              │
│  [📅 2025년 8월 28일               ]   │
│                                         │
│  제목*                                  │
│  [                                 ]   │
│                                         │
│  상황 설명* (최소 50자)                  │
│  ┌─────────────────────────────────┐   │
│  │                                 │   │
│  │                                 │   │
│  │                                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  증거 자료 첨부                          │
│  [📎 파일 선택] (최대 5개, 각 10MB)      │
│                                         │
│  [임시 저장]        [제출하기]           │
│                                         │
└─────────────────────────────────────────┘
```

### 4.4 변호사 대시보드

```
┌─────────────────────────────────────────┐
│        변호사 대시보드                    │
├──────┬──────────────────────────────────┤
│      │   새로운 신고 (3)                │
│ 새   │  ┌────────────────────┐         │
│ 신고  │  │ 🔴 학부모 민원      │         │
│      │  │ 🟡 명예훼손        │         │
│ 진행  │  │ 🟡 학생 폭력       │         │
│ 중   │  └────────────────────┘         │
│      │                                 │
│ 완료  │   담당 사건 (5)                 │
│      │  ┌────────────────────┐         │
│ 통계  │  │ • 사건 A - 상담중   │         │
│      │  │ • 사건 B - 답변대기 │         │
│      │  └────────────────────┘         │
└──────┴──────────────────────────────────┘
```

## 5. 인터랙션 디자인

### 5.1 마이크로 인터랙션

#### 로딩 상태
```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.loading {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
```

#### 토스트 알림
```javascript
// 성공
toast.success('신고가 접수되었습니다', {
  duration: 3000,
  position: 'top-right'
});

// 에러
toast.error('파일 크기가 10MB를 초과합니다', {
  duration: 4000
});
```

### 5.2 페이지 전환
```css
.page-transition {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
```

## 6. 반응형 디자인

### 6.1 브레이크포인트
```css
/* Mobile First Approach */
--mobile: 375px;      /* 기본 */
--tablet: 768px;      /* 태블릿 */
--laptop: 1024px;     /* 노트북 */
--desktop: 1440px;    /* 데스크톱 */
```

### 6.2 그리드 시스템
```css
.container {
  width: 100%;
  margin: 0 auto;
  padding: 0 16px;
}

@media (min-width: 768px) {
  .container { max-width: 720px; }
}

@media (min-width: 1024px) {
  .container { max-width: 960px; }
}

@media (min-width: 1440px) {
  .container { max-width: 1200px; }
}
```

## 7. 접근성 (Accessibility)

### 7.1 WCAG 2.1 AA 준수
- **색상 대비**: 4.5:1 이상
- **키보드 네비게이션**: Tab 순서 지정
- **스크린 리더**: ARIA 레이블 적용
- **포커스 인디케이터**: 명확한 표시

### 7.2 ARIA 속성
```html
<button aria-label="신고 작성" role="button">
  <span aria-hidden="true">+</span>
  새 신고
</button>

<nav aria-label="주 메뉴" role="navigation">
  <!-- 메뉴 항목 -->
</nav>
```

## 8. 다크모드 디자인

### 8.1 컬러 변환
```css
[data-theme="dark"] {
  --bg-primary: #1A1A1A;
  --bg-secondary: #2D2D2D;
  --text-primary: #E5E5E5;
  --text-secondary: #A3A3A3;
  --border: #404040;
}
```

### 8.2 토글 스위치
```jsx
<button 
  onClick={toggleTheme}
  className="theme-toggle"
  aria-label="다크모드 토글"
>
  {isDark ? '🌙' : '☀️'}
</button>
```

## 9. 모바일 최적화

### 9.1 터치 타겟
- 최소 크기: 44x44px
- 간격: 8px 이상
- 터치 영역 확대

### 9.2 제스처
- 스와이프: 페이지 전환
- 풀 투 리프레시: 목록 새로고침
- 롱 프레스: 추가 옵션

### 9.3 햄버거 메뉴
```
┌──────────────────┐
│ ☰  교권119    🔔 │
├──────────────────┤
│                  │
│  Drawer Menu     │
│  ├─ 신고 접수    │
│  ├─ 내 신고      │
│  ├─ 커뮤니티     │
│  ├─ 상담         │
│  └─ 마이페이지   │
│                  │
└──────────────────┘
```

## 10. 아이콘 시스템

### 10.1 아이콘 세트
```
📝 신고 작성       🔔 알림
📊 통계           💬 댓글
⚖️ 법률 상담      👤 프로필
🏠 홈             ⚙️ 설정
📎 첨부파일        🔍 검색
❤️ 공감           🚨 긴급
✅ 완료           ⏰ 대기중
```

## 11. 애니메이션 가이드

### 11.1 기본 원칙
- **Duration**: 200-300ms
- **Easing**: ease-in-out
- **Purpose**: 상태 변화 명확화

### 11.2 주요 애니메이션
```css
/* 호버 효과 */
.hover-lift {
  transition: transform 0.2s ease-in-out;
}
.hover-lift:hover {
  transform: translateY(-2px);
}

/* 펼치기/접기 */
.collapse {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease-in-out;
}
.collapse.open {
  max-height: 500px;
}
```

## 12. 에러 상태

### 12.1 빈 상태 (Empty State)
```
┌─────────────────────┐
│                     │
│    📭               │
│  아직 신고가 없습니다 │
│                     │
│  [신고 작성하기]     │
│                     │
└─────────────────────┘
```

### 12.2 에러 페이지
```
┌─────────────────────┐
│                     │
│    ⚠️               │
│  페이지를 찾을 수    │
│  없습니다           │
│                     │
│  [홈으로 돌아가기]   │
│                     │
└─────────────────────┘
```

## 13. 성능 최적화

### 13.1 이미지 최적화
- WebP 포맷 사용
- Lazy Loading
- 반응형 이미지

### 13.2 CSS 최적화
- Critical CSS 인라인
- CSS 모듈화
- Tree Shaking

## 14. 프로토타입 링크

### 14.1 주요 화면 플로우
1. 랜딩 → 로그인 → 대시보드
2. 대시보드 → 신고 작성 → 확인
3. 커뮤니티 → 게시글 → 댓글
4. 변호사 대시보드 → 사건 선택 → 답변

### 14.2 인터랙티브 프로토타입
- Figma 링크: [준비중]
- 클릭 가능한 프로토타입
- 주요 사용자 시나리오