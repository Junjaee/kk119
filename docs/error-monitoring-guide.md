# 에러 모니터링 및 로깅 시스템 사용 가이드

## 개요

kk119 프로젝트에는 포괄적인 에러 모니터링 및 로깅 시스템이 구현되어 있습니다. 이 시스템은 클라이언트와 서버 모두에서 일관된 에러 처리, 구조화된 로깅, 성능 모니터링을 제공합니다.

## 주요 구성 요소

### 1. 중앙화된 로깅 시스템 (`@/lib/utils/logger`)

```typescript
import { log } from '@/lib/utils/logger';

// 기본 로그 레벨
log.debug('디버그 메시지', { component: 'MyComponent' });
log.info('정보 메시지', { userId: '123' });
log.warn('경고 메시지', { action: 'deprecated_api_used' });
log.error('에러 메시지', error, { context: 'user_action' });
log.fatal('치명적 에러', error, { system: 'database' });

// 전문화된 로깅 함수
log.userAction('button_click', '사용자가 저장 버튼 클릭');
log.security('failed_login', 'high', '로그인 실패 횟수 초과');
log.request('POST', '/api/users', 200, 150);
log.dbOp('SELECT', 'users', 45, 10);
```

### 2. React 에러 바운드리 (`@/components/error-boundary`)

```typescript
import { ErrorBoundary, withErrorBoundary } from '@/components/error-boundary';

// 컴포넌트 래핑
const MyComponentWithErrorBoundary = withErrorBoundary(MyComponent, {
  name: 'MyComponent',
  level: 'component'
});

// 직접 사용
<ErrorBoundary name="UserProfile" level="section">
  <UserProfile />
</ErrorBoundary>

// 페이지 레벨
<ErrorBoundary name="Dashboard" level="page">
  <DashboardContent />
</ErrorBoundary>
```

### 3. API 에러 미들웨어 (`@/lib/middleware`)

```typescript
import { apiHandler, ValidationError, NotFoundError } from '@/lib/middleware';
import { z } from 'zod';

// 기본 API 핸들러
export const POST = apiHandler(async (request, context) => {
  // 비즈니스 로직
  const users = await getUsers();
  return users;
});

// 인증이 필요한 API
export const GET = apiHandler(async (request, context) => {
  // context.user 사용 가능
  return { user: context.user };
}, { requireAuth: true });

// 유효성 검사와 함께
const createUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email()
});

export const POST = apiHandler(async (request, context, data) => {
  // data.body는 유효성 검사됨
  const user = await createUser(data.body);
  return user;
}, {
  bodySchema: createUserSchema,
  requireAuth: true,
  rateLimit: { maxRequests: 10, windowMs: 60000 }
});

// 커스텀 에러 발생
if (!user) {
  throw new NotFoundError('사용자를 찾을 수 없습니다.');
}
```

### 4. 성능 모니터링 훅 (`@/lib/hooks/use-performance`)

```typescript
import {
  useRenderPerformance,
  useApiPerformance,
  useInteractionTracking,
  useWebVitals
} from '@/lib/hooks/use-performance';

function MyComponent() {
  // 렌더 성능 모니터링
  const { getPerformanceStats } = useRenderPerformance('MyComponent');

  // API 호출 성능 추적
  const { trackApiCall } = useApiPerformance();

  // 사용자 상호작용 추적
  const { trackClick, trackInteraction } = useInteractionTracking('my-component');

  // Web Vitals 모니터링
  const { metrics } = useWebVitals();

  const handleApiCall = async () => {
    const result = await trackApiCall(
      () => fetch('/api/data').then(r => r.json()),
      {
        name: 'fetch_data',
        method: 'GET',
        url: '/api/data'
      }
    );
  };

  const handleClick = () => {
    trackClick({ buttonType: 'submit' });
    // 클릭 로직
  };

  return (
    <button onClick={handleClick}>
      Click me
    </button>
  );
}
```

## 사용 패턴

### 1. 새로운 API 라우트 생성

```typescript
// app/api/my-endpoint/route.ts
import { apiHandler, ValidationError } from '@/lib/middleware';
import { z } from 'zod';

const requestSchema = z.object({
  name: z.string().min(1),
  email: z.string().email()
});

export const POST = apiHandler(async (request, context, data) => {
  try {
    // 비즈니스 로직
    const result = await processData(data.body);
    return result;
  } catch (error) {
    // 구체적인 에러 타입 사용
    if (error.code === 'DUPLICATE_EMAIL') {
      throw new ValidationError('이미 존재하는 이메일입니다.');
    }
    throw error; // 다른 에러는 그대로 전파
  }
}, {
  bodySchema: requestSchema,
  requireAuth: true,
  rateLimit: { maxRequests: 20, windowMs: 60000 }
});
```

### 2. React 컴포넌트에서 에러 처리

```typescript
import { withErrorBoundary } from '@/components/error-boundary';
import { log } from '@/lib/utils/logger';
import { useRenderPerformance } from '@/lib/hooks/use-performance';

function UserList() {
  useRenderPerformance('UserList'); // 자동 성능 모니터링

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users');

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const users = await response.json();
      setUsers(users);

      log.userAction('users_loaded', '사용자 목록 로딩 완료', {
        userCount: users.length
      });

    } catch (error) {
      log.error('사용자 목록 로딩 실패', error, {
        component: 'UserList',
        action: 'fetch_users'
      });

      // 사용자에게 친화적인 메시지 표시
      toast.error('사용자 목록을 불러올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    // 컴포넌트 JSX
  );
}

// 에러 바운드리와 함께 내보내기
export default withErrorBoundary(UserList, {
  name: 'UserList',
  level: 'component'
});
```

### 3. 전역 에러 처리 설정

```typescript
// app/layout.tsx
import { ErrorBoundary } from '@/components/error-boundary';
import { log } from '@/lib/utils/logger';

export default function RootLayout({ children }) {
  useEffect(() => {
    // 전역 에러 핸들러
    window.addEventListener('error', (event) => {
      log.error('Uncaught JavaScript error', event.error, {
        filename: event.filename,
        line: event.lineno,
        column: event.colno
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      log.error('Unhandled promise rejection', event.reason, {
        type: 'unhandled_promise_rejection'
      });
    });
  }, []);

  return (
    <html>
      <body>
        <ErrorBoundary name="App" level="page">
          {children}
        </ErrorBoundary>
      </body>
    </html>
  );
}
```

## 로그 컨텍스트 관리

```typescript
// 사용자 로그인 시
log.setContext({
  userId: user.id,
  userEmail: user.email,
  userRole: user.role
});

// 특정 작업 중
log.updateContext('currentAction', 'uploading_file');

// 사용자 로그아웃 시
log.clearContext(); // 사용자 정보 제거, 환경 정보는 유지
```

## 성능 모니터링 Best Practices

1. **컴포넌트 레벨**: 모든 주요 컴포넌트에 `useRenderPerformance` 적용
2. **API 호출**: 모든 API 호출을 `useApiPerformance`로 래핑
3. **사용자 상호작용**: 중요한 버튼, 폼에 `useInteractionTracking` 적용
4. **페이지 로딩**: 각 페이지에서 `usePageLoadPerformance` 사용

## 에러 레벨별 대응

- **DEBUG**: 개발 시에만 표시되는 상세 정보
- **INFO**: 정상적인 시스템 동작 기록
- **WARN**: 주의가 필요하지만 즉시 대응할 필요는 없는 상황
- **ERROR**: 기능적 문제가 발생했지만 시스템은 계속 동작
- **FATAL**: 시스템이 중단될 수 있는 심각한 문제

## 프로덕션 환경 설정

1. **로그 레벨**: 프로덕션에서는 INFO 이상만 기록
2. **외부 모니터링**: Sentry, DataDog 등과 연동 가능하도록 준비됨
3. **성능 임계값**: 느린 API 호출(>1s), 렌더링(>16ms) 자동 감지
4. **보안 이벤트**: 실패한 로그인, 권한 오류 등 자동 로깅

## 문제 해결

### 일반적인 패턴

1. **에러 발생 시 확인사항**:
   - 콘솔에서 구조화된 로그 확인
   - 에러 ID로 전체 컨텍스트 추적
   - 성능 메트릭으로 원인 분석

2. **성능 문제 분석**:
   - 렌더 성능 통계 확인
   - API 응답 시간 분석
   - Web Vitals 메트릭 검토

3. **사용자 행동 분석**:
   - 상호작용 로그로 사용자 플로우 파악
   - 에러 발생 전 사용자 액션 추적

이 시스템을 통해 개발자는 더 나은 사용자 경험을 제공하고, 문제를 신속하게 파악하고 해결할 수 있습니다.