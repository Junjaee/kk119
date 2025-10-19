---
id: NOTIFY-001
version: 0.0.1
status: draft
created: 2025-10-17
updated: 2025-10-17
author: @Goos
priority: medium
category: feature
labels: ["notification", "real-time", "alert"]
depends_on: ["AUTH-001", "CONSULT-001", "REPORT-001"]
---

# @SPEC:NOTIFY-001: 실시간 알림 시스템

## HISTORY

### v0.0.1 (2025-10-17)
- **INITIAL**: 실시간 알림 시스템 명세 최초 작성
- **AUTHOR**: @Goos
- **SCOPE**: 인앱/이메일/푸시 알림, 실시간 전송
- **CONTEXT**: 처리 과정 투명성 제공 및 사용자 경험 향상

## Environment (환경)

### 시스템 환경
- **Database**: SQLite (kyokwon119.db)
- **Framework**: Next.js 14 App Router
- **Real-time**: 폴링 (단기), WebSocket/SSE (장기)
- **Email**: SendGrid or AWS SES
- **Push**: Web Push API

### 사용자 역할
- **Teacher**: 알림 수신자 (주요)
- **Lawyer**: 알림 수신자
- **Admin**: 알림 발송자/수신자
- **Super Admin**: 시스템 알림 관리

### 기술적 전제조건
- 브라우저 Notification API 지원
- Service Worker 등록 (PWA)
- SMTP/Email API 설정
- 알림 큐 시스템

## Assumptions (가정)

### 비즈니스 가정
- 사용자는 알림 채널을 선택할 수 있다
- 중요도별 알림 우선순위가 존재한다
- 알림은 30일간 보관된다
- 읽지 않은 알림은 자동 리마인더된다

### 기술적 가정
- 알림 전송 지연 3초 이내
- 알림 전달 성공률 99% 이상
- 동시 알림 처리 1,000건/초
- 알림 히스토리 무제한 저장

## Requirements (요구사항)

### Ubiquitous (필수 기능)
- 시스템은 실시간 알림 생성/전송 기능을 제공해야 한다
- 시스템은 알림 읽음/안읽음 상태를 관리해야 한다
- 시스템은 알림 채널별 전송을 지원해야 한다
- 시스템은 알림 히스토리를 제공해야 한다
- 시스템은 알림 설정 관리를 제공해야 한다

### Event-driven (이벤트 기반)
- WHEN 신고 상태가 변경되면, 시스템은 교사에게 즉시 알림을 발송해야 한다
- WHEN 변호사가 배정되면, 시스템은 교사에게 배정 알림을 발송해야 한다
- WHEN 변호사가 답변하면, 시스템은 교사에게 답변 알림을 발송해야 한다
- WHEN 긴급 상황이 발생하면, 시스템은 관리자에게 우선 알림을 발송해야 한다
- WHEN 알림이 7일간 읽지 않으면, 시스템은 리마인더를 발송해야 한다

### State-driven (상태 기반)
- WHILE 사용자가 온라인일 때, 시스템은 실시간 알림을 표시해야 한다
- WHILE 사용자가 오프라인일 때, 시스템은 알림을 큐에 저장해야 한다
- WHILE 알림이 읽지 않은 상태일 때, 시스템은 배지 카운트를 표시해야 한다
- WHILE Do Not Disturb 모드일 때, 시스템은 알림을 보류해야 한다
- WHILE 알림이 처리 중일 때, 시스템은 중복 발송을 방지해야 한다

### Optional (선택 기능)
- WHERE 사용자가 설정하면, 시스템은 이메일 알림도 발송할 수 있다
- WHERE 사용자가 허용하면, 시스템은 브라우저 푸시를 발송할 수 있다
- WHERE 관리자가 설정하면, 시스템은 SMS 알림을 발송할 수 있다
- WHERE 일괄 알림이 필요하면, 시스템은 그룹 알림을 발송할 수 있다

### Constraints (제약사항)
- IF 알림 발송 실패하면, 시스템은 3회 재시도해야 한다
- IF 사용자가 알림을 거부하면, 시스템은 해당 채널을 비활성화해야 한다
- IF 알림이 30일 경과하면, 시스템은 자동 삭제해야 한다
- 알림 제목은 100자를 초과할 수 없어야 한다
- 알림 내용은 500자를 초과할 수 없어야 한다
- 알림 전송 지연은 3초를 초과하지 않아야 한다

## Notification Types (알림 유형)

### 우선순위별 분류
| Priority | Type | Channel | Delay |
|----------|------|---------|-------|
| Critical | 시스템 장애, 보안 이슈 | 모든 채널 | 즉시 |
| High | 긴급 상담, 관리자 요청 | 인앱 + 이메일 | 1초 |
| Normal | 상태 변경, 답변 도착 | 인앱 | 3초 |
| Low | 정기 리포트, 안내 | 이메일 | 배치 |

### 카테고리별 분류
```yaml
REPORT:
  - report.created: "신고가 접수되었습니다"
  - report.status_changed: "신고 상태가 변경되었습니다"
  - report.completed: "신고 처리가 완료되었습니다"

CONSULT:
  - consult.assigned: "변호사가 배정되었습니다"
  - consult.accepted: "변호사가 상담을 수락했습니다"
  - consult.message: "새로운 메시지가 도착했습니다"
  - consult.completed: "상담이 완료되었습니다"

SYSTEM:
  - system.maintenance: "시스템 점검 안내"
  - system.update: "새로운 기능이 추가되었습니다"
  - system.alert: "중요 공지사항"

USER:
  - user.welcome: "환영합니다!"
  - user.password_reset: "비밀번호 재설정"
  - user.account_locked: "계정 잠김 알림"
```

## Data Model (데이터 모델)

### notifications 테이블
```sql
CREATE TABLE notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  recipient_id INTEGER NOT NULL,
  recipient_role VARCHAR(20) NOT NULL,
  type VARCHAR(50) NOT NULL,
  category VARCHAR(30) NOT NULL,
  priority VARCHAR(20) DEFAULT 'normal',
  title VARCHAR(100) NOT NULL,
  content VARCHAR(500),
  action_url VARCHAR(255),
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (recipient_id) REFERENCES users(id)
);

CREATE INDEX idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at);
```

### notification_settings 테이블
```sql
CREATE TABLE notification_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  in_app BOOLEAN DEFAULT TRUE,
  email BOOLEAN DEFAULT FALSE,
  push BOOLEAN DEFAULT FALSE,
  sms BOOLEAN DEFAULT FALSE,
  do_not_disturb BOOLEAN DEFAULT FALSE,
  dnd_start TIME,
  dnd_end TIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### notification_queue 테이블
```sql
CREATE TABLE notification_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  notification_id INTEGER NOT NULL,
  channel VARCHAR(20) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  retry_count INTEGER DEFAULT 0,
  error_message TEXT,
  scheduled_at TIMESTAMP,
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (notification_id) REFERENCES notifications(id)
);
```

### notification_templates 테이블
```sql
CREATE TABLE notification_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type VARCHAR(50) UNIQUE NOT NULL,
  category VARCHAR(30) NOT NULL,
  title_template VARCHAR(200) NOT NULL,
  content_template TEXT,
  email_subject VARCHAR(200),
  email_body TEXT,
  variables JSON,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

### 알림 조회
- `GET /api/notifications` - 알림 목록 조회
- `GET /api/notifications/unread` - 읽지 않은 알림 조회
- `GET /api/notifications/:id` - 알림 상세 조회
- `GET /api/notifications/count` - 읽지 않은 알림 개수

### 알림 관리
- `PUT /api/notifications/:id/read` - 알림 읽음 처리
- `PUT /api/notifications/read-all` - 모든 알림 읽음
- `DELETE /api/notifications/:id` - 알림 삭제
- `DELETE /api/notifications/clear` - 알림 전체 삭제

### 알림 설정
- `GET /api/notifications/settings` - 알림 설정 조회
- `PUT /api/notifications/settings` - 알림 설정 변경
- `POST /api/notifications/subscribe` - 푸시 구독
- `DELETE /api/notifications/unsubscribe` - 푸시 구독 해제

### 관리자 기능
- `POST /api/notifications/send` - 수동 알림 발송
- `POST /api/notifications/broadcast` - 전체 공지
- `GET /api/notifications/templates` - 템플릿 관리
- `PUT /api/notifications/templates/:id` - 템플릿 수정

## Notification Channels

### 1. In-App Notification
```typescript
interface InAppNotification {
  show(): void;
  position: 'top-right' | 'top-center' | 'bottom-right';
  duration: number; // milliseconds
  sound: boolean;
  vibration: boolean;
}
```

### 2. Email Notification
```typescript
interface EmailNotification {
  provider: 'sendgrid' | 'ses' | 'smtp';
  from: string;
  replyTo?: string;
  template: string;
  attachments?: File[];
}
```

### 3. Push Notification
```typescript
interface PushNotification {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  actions?: NotificationAction[];
}
```

### 4. SMS Notification (Optional)
```typescript
interface SMSNotification {
  provider: 'twilio' | 'aws-sns';
  phoneNumber: string;
  message: string; // max 160 chars
}
```

## Real-time Implementation

### Short-term: Polling
```typescript
// 1초 간격 폴링
setInterval(async () => {
  const response = await fetch('/api/notifications/unread');
  const notifications = await response.json();
  updateNotificationBadge(notifications.count);
  displayNewNotifications(notifications.items);
}, 1000);
```

### Long-term: WebSocket/SSE
```typescript
// Server-Sent Events
const eventSource = new EventSource('/api/notifications/stream');

eventSource.addEventListener('notification', (event) => {
  const notification = JSON.parse(event.data);
  displayNotification(notification);
});

// WebSocket
const ws = new WebSocket('wss://api.kyokwon119.com/notifications');

ws.onmessage = (event) => {
  const notification = JSON.parse(event.data);
  handleNotification(notification);
};
```

## Performance Requirements

### Response Time
- 알림 생성: < 100ms
- 알림 전송: < 3초
- 알림 조회: < 500ms
- 배지 업데이트: < 100ms

### Throughput
- 동시 알림: 1,000건/초
- 이메일 발송: 100건/초
- 푸시 알림: 500건/초

### Reliability
- 전달 성공률: > 99%
- 중복 방지: 100%
- 순서 보장: FIFO

## Security Considerations

### Access Control
- 본인 알림만 조회 가능
- 관리자만 브로드캐스트 가능
- 역할별 알림 권한 검증

### Data Protection
- 알림 내용 암호화
- PII 마스킹 처리
- SSL/TLS 전송

### Rate Limiting
- 사용자당 100건/시간
- IP당 1,000건/시간
- 브로드캐스트 10건/일

## Monitoring & Metrics

### KPI
- 알림 전달률
- 평균 전송 시간
- 읽음 비율
- 클릭률 (CTR)
- 구독/해지 비율

### Alerts
- 전달 실패율 > 5%
- 전송 지연 > 5초
- 큐 적체 > 1,000건
- 에러율 > 1%

## Error Handling

### Retry Strategy
```yaml
attempts: 3
backoff:
  initial: 1s
  multiplier: 2
  max: 30s
deadletter:
  after: 3 failures
  ttl: 7 days
```

### Fallback
- 인앱 실패 → 이메일
- 푸시 실패 → 인앱
- 모든 채널 실패 → 로그 및 관리자 알림

## Traceability (@TAG)

- **SPEC**: @SPEC:NOTIFY-001
- **TEST**: tests/notify/test_notification.py
- **CODE**: src/notify/notification-service.ts
- **DOC**: docs/api/notifications.md
- **QUEUE**: Bull Queue or Database Queue