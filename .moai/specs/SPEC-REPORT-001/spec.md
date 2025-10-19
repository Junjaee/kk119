---
id: REPORT-001
version: 0.0.1
status: draft
created: 2025-10-17
updated: 2025-10-17
author: @Claude
priority: critical
category: feature
labels:
  - report
  - core-feature
  - teacher-workflow
scope:
  packages:
    - app/reports
    - lib/db/reports
  files:
    - app/reports/new/page.tsx
    - app/reports/page.tsx
    - lib/db/reports.ts
---

# SPEC-REPORT-001: 교권 침해 신고 시스템

## HISTORY

### v0.0.1 (2025-10-17)
- **INITIAL**: SPEC 최초 작성 (status: draft)
- **AUTHOR**: @Claude
- **SECTIONS**: TAG BLOCK, 요구사항 (EARS), 제약사항, 시나리오, 수락 기준

---

## @SPEC:REPORT-001 TAG BLOCK

**도메인**: REPORT (교권 침해 신고)
**우선순위**: Critical
**핵심 기능**: 교권 침해 신고 작성/제출, 신고번호 자동 생성, 상태 관리
**상태 흐름**: received → reviewing → consulting → completed

### 의존성
- **@SPEC:AUTH-001**: 사용자 인증 및 세션 관리 (교사 역할 확인)
- **@SPEC:FILE-001**: 증거 자료 첨부 기능

### 관련 컨텍스트
- **@DOC:MISSION-001**: 교권 침해 체계적 대응 지원
- **@SPEC:USER-001**: 교사(Teacher) 핵심 니즈
- **@SPEC:PROBLEM-001**: 교권 침해 신고 체계 부재 해결

---

## Environment (환경 및 가정사항)

### Assumptions
- 교사(Teacher) 역할로 로그인된 사용자만 신고 작성 가능
- 신고 제출 시 JWT 토큰으로 사용자 신원 확인
- SQLite DB (kyokwon119.db)의 `reports` 테이블에 신고 데이터 저장
- 신고번호는 `RPT-YYYYMMDD-XXXX` 형식으로 자동 생성 (예: RPT-20251017-0001)
- 카테고리는 "학부모 민원", "학생 폭력", "명예훼손" 중 선택

### Preconditions
- 사용자는 Teacher 역할로 인증된 상태
- DB에 `reports` 테이블이 존재하고 마이그레이션 완료
- 파일 업로드 시스템 (SPEC-FILE-001) 구현 완료 (증거 자료 첨부용)

---

## Requirements (기능 요구사항)

### Ubiquitous Requirements (기본 기능)
- 시스템은 교권 침해 신고 작성 기능을 제공해야 한다
- 시스템은 신고 목록 조회 기능을 제공해야 한다
- 시스템은 신고 상세 조회 기능을 제공해야 한다
- 시스템은 신고 상태 변경 추적 기능을 제공해야 한다

### Event-driven Requirements (이벤트 기반)
- WHEN 교사가 신고를 제출하면, 시스템은 자동으로 고유 신고번호를 생성해야 한다
- WHEN 신고가 제출되면, 시스템은 초기 상태를 "received"로 설정해야 한다
- WHEN 관리자가 신고 상태를 변경하면, 시스템은 변경 이력을 기록해야 한다
- WHEN 신고가 완료 상태로 변경되면, 시스템은 교사에게 알림을 발송해야 한다 (@SPEC:NOTIFY-001)

### State-driven Requirements (상태 기반)
- WHILE 신고가 "received" 상태일 때, 시스템은 교사의 수정을 허용해야 한다
- WHILE 신고가 "reviewing" 이상 상태일 때, 시스템은 교사의 수정을 제한해야 한다
- WHILE 신고가 "consulting" 상태일 때, 시스템은 변호사 배정 정보를 표시해야 한다

### Optional Features (선택적 기능)
- WHERE 긴급 신고로 표시되면, 시스템은 우선순위 플래그를 설정할 수 있다
- WHERE 신고자가 익명 요청하면, 시스템은 신고자 정보를 마스킹할 수 있다

---

## Specifications (상세 명세)

### 신고 작성 (Create Report)

#### 입력 필드
| 필드명 | 타입 | 필수 | 설명 |
|--------|------|------|------|
| category | enum | ✅ | "학부모 민원", "학생 폭력", "명예훼손" |
| title | string | ✅ | 신고 제목 (최대 100자) |
| description | text | ✅ | 상세 내용 (최대 2000자) |
| incident_date | date | ✅ | 사건 발생일 |
| location | string | ✅ | 사건 발생 장소 |
| witness_count | number | ❌ | 목격자 수 |
| is_emergency | boolean | ❌ | 긴급 신고 여부 (기본값: false) |
| attachments | file[] | ❌ | 증거 자료 첨부 (SPEC-FILE-001) |

#### 신고번호 생성 규칙
```typescript
// 형식: RPT-YYYYMMDD-XXXX
// 예시: RPT-20251017-0001

function generateReportNumber(): string {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const count = await db.query('SELECT COUNT(*) FROM reports WHERE created_date = ?', [today]);
  const sequence = String(count + 1).padStart(4, '0');
  return `RPT-${today}-${sequence}`;
}
```

### 신고 상태 관리

#### 상태 전이도
```
received (접수)
   ↓
reviewing (검토 중)
   ↓
consulting (상담 진행)
   ↓
completed (완료)
```

#### 상태별 허용 액션
| 상태 | 교사 수정 | 관리자 상태 변경 | 변호사 배정 | 알림 발송 |
|------|----------|----------------|-----------|----------|
| received | ✅ | ✅ | ❌ | ❌ |
| reviewing | ❌ | ✅ | ✅ | ✅ (상태 변경 시) |
| consulting | ❌ | ✅ | ✅ | ✅ (답변 도착 시) |
| completed | ❌ | ❌ | ❌ | ✅ (완료 알림) |

### API 엔드포인트

#### POST /api/reports/create
- **권한**: Teacher
- **입력**: 신고 작성 폼 데이터
- **출력**: 생성된 신고 객체 (신고번호 포함)
- **응답 시간**: 평균 300ms 이하

#### GET /api/reports
- **권한**: Teacher (본인 신고), Admin (전체 신고)
- **입력**: 필터 (상태, 카테고리, 날짜 범위)
- **출력**: 신고 목록 (페이지네이션)
- **응답 시간**: 평균 200ms 이하

#### GET /api/reports/[id]
- **권한**: Teacher (본인 신고), Admin, Lawyer (배정된 신고)
- **입력**: 신고 ID
- **출력**: 신고 상세 정보 + 첨부파일 + 상태 이력
- **응답 시간**: 평균 250ms 이하

#### PATCH /api/reports/[id]/status
- **권한**: Admin
- **입력**: 새 상태값
- **출력**: 업데이트된 신고 객체
- **부수효과**: 상태 변경 이력 기록, 알림 발송 (@SPEC:NOTIFY-001)

---

## Constraints (제약사항)

### Technical Constraints
- IF 사용자가 Teacher 역할이 아니면, 시스템은 신고 작성을 거부해야 한다
- IF 필수 필드가 누락되면, 시스템은 422 Unprocessable Entity 에러를 반환해야 한다
- IF 첨부 파일 크기가 10MB를 초과하면, 시스템은 업로드를 거부해야 한다 (@SPEC:FILE-001)
- 신고 제목은 100자를 초과할 수 없어야 한다
- 신고 상세 내용은 2000자를 초과할 수 없어야 한다

### Business Constraints
- 신고는 한 번 제출되면 삭제할 수 없어야 한다 (보존 의무)
- 신고 상태는 역행할 수 없어야 한다 (received → reviewing만 가능, reviewing → received 불가)
- 완료된 신고는 수정할 수 없어야 한다

### Performance Constraints
- 신고 목록 조회는 2초 이내 응답해야 한다
- 신고 작성 제출은 3초 이내 완료되어야 한다
- 동시 접속 100명 처리 가능해야 한다

---

## DB Schema

```sql
CREATE TABLE reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  report_number TEXT UNIQUE NOT NULL,           -- RPT-YYYYMMDD-XXXX
  teacher_id INTEGER NOT NULL,                  -- FOREIGN KEY: users.id
  category TEXT NOT NULL,                       -- enum: 학부모 민원, 학생 폭력, 명예훼손
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  incident_date DATE NOT NULL,
  location TEXT NOT NULL,
  witness_count INTEGER,
  is_emergency BOOLEAN DEFAULT 0,
  status TEXT DEFAULT 'received',               -- enum: received, reviewing, consulting, completed
  lawyer_id INTEGER,                            -- FOREIGN KEY: users.id (assigned lawyer)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,

  FOREIGN KEY (teacher_id) REFERENCES users(id),
  FOREIGN KEY (lawyer_id) REFERENCES users(id)
);

CREATE INDEX idx_reports_teacher ON reports(teacher_id);
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_created ON reports(created_at);
CREATE UNIQUE INDEX idx_reports_number ON reports(report_number);

-- 상태 변경 이력 테이블
CREATE TABLE report_status_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  report_id INTEGER NOT NULL,
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_by INTEGER NOT NULL,                  -- FOREIGN KEY: users.id
  changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  note TEXT,

  FOREIGN KEY (report_id) REFERENCES reports(id),
  FOREIGN KEY (changed_by) REFERENCES users(id)
);
```

---

## Test Scenarios

### Scenario 1: 신고 작성 성공
```typescript
Given: 교사가 로그인된 상태
When: 필수 필드를 모두 입력하고 신고 제출 버튼 클릭
Then: 신고번호가 자동 생성되고 "received" 상태로 저장됨
And: 성공 메시지와 신고번호가 표시됨
```

### Scenario 2: 필수 필드 누락
```typescript
Given: 교사가 신고 작성 페이지에 접근
When: 제목만 입력하고 제출 버튼 클릭
Then: "필수 필드를 입력해주세요" 에러 메시지 표시
And: 누락된 필드가 빨간색으로 하이라이트됨
```

### Scenario 3: 신고 목록 조회
```typescript
Given: 교사가 3건의 신고를 작성한 상태
When: 신고 목록 페이지에 접근
Then: 3건의 신고가 최신순으로 표시됨
And: 각 신고의 번호, 제목, 상태, 작성일이 보임
```

### Scenario 4: 상태 변경 이력 추적
```typescript
Given: 관리자가 신고 상태를 "reviewing"으로 변경
When: 교사가 해당 신고 상세 페이지 조회
Then: 상태 변경 이력이 시간순으로 표시됨
And: "received → reviewing (2025-10-17 14:30, 관리자: admin@example.com)" 형식
```

---

## Acceptance Criteria

### 필수 완료 조건
- ✅ 교사가 신고를 작성하고 제출할 수 있다
- ✅ 신고번호가 `RPT-YYYYMMDD-XXXX` 형식으로 자동 생성된다
- ✅ 신고 상태가 received → reviewing → consulting → completed 순서로 전이된다
- ✅ 교사는 본인이 작성한 신고 목록을 조회할 수 있다
- ✅ 관리자는 모든 신고를 조회하고 상태를 변경할 수 있다
- ✅ 상태 변경 이력이 DB에 기록되고 조회 가능하다

### 성능 요구사항
- ✅ 신고 목록 조회 API는 2초 이내 응답한다
- ✅ 신고 작성 제출은 3초 이내 완료된다

### 보안 요구사항
- ✅ Teacher 역할이 아니면 신고 작성 페이지 접근 불가
- ✅ 다른 교사의 신고는 조회할 수 없다 (Admin, Lawyer 제외)

---

## Related SPECs

- **@SPEC:AUTH-001**: JWT 인증 및 역할 확인
- **@SPEC:FILE-001**: 증거 자료 첨부 기능
- **@SPEC:NOTIFY-001**: 상태 변경 알림 발송
- **@SPEC:CONSULT-001**: 변호사 상담 매칭 (consulting 상태 전이 시)

---

## References

- **@DOC:MISSION-001**: 교권119 핵심 미션
- **@SPEC:USER-001**: 교사(Teacher) 주요 니즈
- **@SPEC:PROBLEM-001**: 교권 침해 신고 체계 부재 문제

---

_이 SPEC은 `/alfred:2-build REPORT-001` 명령으로 구현됩니다._
