---
id: CONSULT-001
version: 0.0.1
status: draft
created: 2025-10-17
updated: 2025-10-17
author: @Goos
priority: high
category: feature
labels: ["consultation", "lawyer", "matching"]
depends_on: ["AUTH-001", "REPORT-001"]
related_specs: ["NOTIFY-001"]
---

# @SPEC:CONSULT-001: 변호사 상담 매칭 시스템

## HISTORY

### v0.0.1 (2025-10-17)
- **INITIAL**: 변호사 상담 매칭 시스템 명세 최초 작성
- **AUTHOR**: @Goos
- **SCOPE**: 자동 매칭, 워크로드 균등 배정, 실시간 메시징
- **CONTEXT**: 95% 상담 완료율 목표 달성을 위한 핵심 기능

## Environment (환경)

### 시스템 환경
- **Database**: SQLite (consult.db 전용 DB)
- **Framework**: Next.js 14 App Router
- **Authentication**: JWT 기반 역할 인증 (AUTH-001)
- **Real-time**: 폴링 방식 (단기), WebSocket (장기 계획)

### 사용자 역할
- **Teacher**: 상담 신청자
- **Lawyer**: 상담 제공자
- **Admin**: 상담 관리자
- **Super Admin**: 시스템 관리자

### 기술적 전제조건
- consult.db 독립 운영 (상담 전용 DB)
- 변호사 전문 분야 프로필 사전 설정
- 워크로드 실시간 추적 시스템

## Assumptions (가정)

### 비즈니스 가정
- 변호사는 복수의 전문 분야를 가질 수 있다
- 긴급 상담은 일반 상담보다 우선 배정된다
- 변호사는 최대 10건까지 동시 상담 가능
- 상담 완료 후 72시간 내 피드백 제공

### 기술적 가정
- 매칭 알고리즘은 3분 이내 완료
- 실시간 메시징은 1초 이내 전달
- 상담 이력은 영구 보관
- 파일 첨부는 FILE-001 SPEC 활용

## Requirements (요구사항)

### Ubiquitous (필수 기능)
- 시스템은 상담 신청/배정/진행/완료 기능을 제공해야 한다
- 시스템은 전문 분야별 변호사 자동 매칭을 지원해야 한다
- 시스템은 상담 이력 조회 기능을 제공해야 한다
- 시스템은 실시간 메시징 기능을 제공해야 한다
- 시스템은 상담 평가 및 피드백 기능을 제공해야 한다

### Event-driven (이벤트 기반)
- WHEN 교사가 상담을 신청하면, 시스템은 3분 이내에 변호사를 자동 배정해야 한다
- WHEN 변호사가 배정되면, 시스템은 교사에게 즉시 알림을 발송해야 한다
- WHEN 변호사가 답변을 작성하면, 시스템은 교사에게 실시간 알림을 전송해야 한다
- WHEN 상담이 완료되면, 시스템은 평가 요청을 발송해야 한다
- WHEN 워크로드가 80%를 초과하면, 시스템은 해당 변호사를 매칭에서 제외해야 한다

### State-driven (상태 기반)
- WHILE 상담이 'pending' 상태일 때, 시스템은 매칭 알고리즘을 실행해야 한다
- WHILE 상담이 'assigned' 상태일 때, 시스템은 변호사 응답을 대기해야 한다
- WHILE 상담이 'in_progress' 상태일 때, 시스템은 실시간 메시징을 활성화해야 한다
- WHILE 상담이 'completed' 상태일 때, 시스템은 평가를 허용해야 한다
- WHILE 변호사가 offline일 때, 시스템은 해당 변호사를 매칭에서 제외해야 한다

### Optional (선택 기능)
- WHERE 긴급 상담이면, 시스템은 우선 순위를 높여 배정할 수 있다
- WHERE 선호 변호사가 있으면, 시스템은 해당 변호사를 우선 배정할 수 있다
- WHERE 이전 상담 이력이 있으면, 시스템은 동일 변호사를 재배정할 수 있다
- WHERE 화상 상담이 필요하면, 시스템은 화상 회의실을 생성할 수 있다

### Constraints (제약사항)
- IF 변호사 워크로드가 100%이면, 시스템은 신규 배정을 차단해야 한다
- IF 상담이 30일간 미완료이면, 시스템은 자동으로 종료해야 한다
- IF 동일 사건으로 중복 상담이면, 시스템은 신청을 거부해야 한다
- 상담 제목은 200자를 초과할 수 없어야 한다
- 상담 내용은 10,000자를 초과할 수 없어야 한다
- 첨부 파일은 총 50MB를 초과할 수 없어야 한다

## State Management (상태 관리)

### 상담 상태 플로우
```
pending (대기)
  ↓ [자동 매칭]
assigned (배정됨)
  ↓ [변호사 수락]
in_progress (진행중)
  ↓ [상담 완료]
completed (완료)
  ↓ [평가 완료]
closed (종료)
```

### 특수 상태
- `cancelled`: 교사가 취소
- `rejected`: 변호사가 거절
- `expired`: 30일 경과 자동 종료

## Matching Algorithm (매칭 알고리즘)

### 우선순위 가중치
1. **전문 분야 일치도** (40%)
   - 완전 일치: 100점
   - 부분 일치: 50점
   - 불일치: 0점

2. **워크로드 균등성** (30%)
   - 0-20%: 100점
   - 21-40%: 80점
   - 41-60%: 60점
   - 61-80%: 40점
   - 81-100%: 0점 (배정 불가)

3. **응답률** (20%)
   - 90% 이상: 100점
   - 70-89%: 80점
   - 50-69%: 60점
   - 50% 미만: 40점

4. **긴급도** (10%)
   - urgent: 100점 추가
   - high: 50점 추가
   - normal: 0점
   - low: -20점

### 매칭 규칙
- 최소 점수 60점 이상만 배정 가능
- 동점일 경우 최근 배정 시간이 오래된 변호사 우선
- 3회 연속 거절한 변호사는 24시간 배정 제외

## Data Model (데이터 모델)

### consults 테이블
```sql
CREATE TABLE consults (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  consult_no VARCHAR(20) UNIQUE NOT NULL,  -- CST-2025-10-0001
  teacher_id INTEGER NOT NULL,
  lawyer_id INTEGER,
  report_id INTEGER,  -- 신고 연계
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(50),
  urgency VARCHAR(20) DEFAULT 'normal',
  status VARCHAR(20) DEFAULT 'pending',
  matched_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES users(id),
  FOREIGN KEY (lawyer_id) REFERENCES lawyers(id),
  FOREIGN KEY (report_id) REFERENCES reports(id)
);
```

### consult_messages 테이블
```sql
CREATE TABLE consult_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  consult_id INTEGER NOT NULL,
  sender_id INTEGER NOT NULL,
  sender_role VARCHAR(20) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (consult_id) REFERENCES consults(id),
  FOREIGN KEY (sender_id) REFERENCES users(id)
);
```

### lawyer_specialties 테이블
```sql
CREATE TABLE lawyer_specialties (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lawyer_id INTEGER NOT NULL,
  specialty VARCHAR(50) NOT NULL,
  is_primary BOOLEAN DEFAULT FALSE,
  FOREIGN KEY (lawyer_id) REFERENCES lawyers(id)
);
```

### consult_evaluations 테이블
```sql
CREATE TABLE consult_evaluations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  consult_id INTEGER NOT NULL,
  rating INTEGER CHECK(rating >= 1 AND rating <= 5),
  feedback TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (consult_id) REFERENCES consults(id)
);
```

## API Endpoints

### 상담 관리
- `POST /api/consults` - 상담 신청
- `GET /api/consults` - 상담 목록 조회
- `GET /api/consults/:id` - 상담 상세 조회
- `PUT /api/consults/:id` - 상담 정보 수정
- `DELETE /api/consults/:id` - 상담 취소

### 매칭 시스템
- `POST /api/consults/:id/match` - 수동 매칭 (관리자)
- `POST /api/consults/:id/accept` - 변호사 수락
- `POST /api/consults/:id/reject` - 변호사 거절
- `GET /api/lawyers/workload` - 워크로드 조회

### 메시징
- `POST /api/consults/:id/messages` - 메시지 전송
- `GET /api/consults/:id/messages` - 메시지 조회
- `PUT /api/consults/:id/messages/:msgId/read` - 읽음 처리

### 평가
- `POST /api/consults/:id/evaluate` - 상담 평가
- `GET /api/lawyers/:id/evaluations` - 변호사 평가 조회

## Security Considerations

### 접근 제어
- 교사: 본인 상담만 조회/수정 가능
- 변호사: 배정된 상담만 조회/답변 가능
- 관리자: 모든 상담 조회/관리 가능
- Super Admin: 시스템 전체 권한

### 데이터 보호
- 상담 내용 암호화 저장
- 개인정보 마스킹 처리
- 첨부 파일 접근 권한 검증
- 메시지 전송 시 XSS 방지

### 감사 로그
- 모든 상담 생성/수정/삭제 기록
- 매칭 알고리즘 실행 로그
- 메시지 전송/수신 기록
- 평가 및 피드백 기록

## Performance Requirements

### 응답 시간
- 매칭 알고리즘: 3분 이내
- 메시지 전송: 1초 이내
- 상담 목록 조회: 2초 이내
- 상담 상세 조회: 1초 이내

### 동시성
- 최대 동시 상담: 1,000건
- 최대 동시 메시징: 500건
- 변호사당 최대 상담: 10건

### 가용성
- 시스템 가용성: 99.9%
- 매칭 성공률: 95% 이상
- 메시지 전달률: 99.9%

## Monitoring & Metrics

### KPI 지표
- 상담 신청 건수 (일/주/월)
- 평균 매칭 시간
- 상담 완료율
- 평균 응답 시간
- 변호사별 워크로드
- 상담 만족도

### 알림 임계값
- 매칭 실패율 > 10%
- 평균 매칭 시간 > 5분
- 워크로드 > 90%
- 미응답 상담 > 24시간

## Traceability (@TAG)

- **SPEC**: @SPEC:CONSULT-001
- **TEST**: tests/consult/test_matching.py
- **CODE**: src/consult/matching-service.ts
- **DOC**: docs/api/consultation.md
- **DB**: consult.db (독립 DB)