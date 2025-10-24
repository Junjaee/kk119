---
id: CONSULT-001
version: 0.1.0
status: draft
created: 2025-10-17
updated: 2025-10-19
author: @Goos, @Claude
priority: high
category: feature
labels: ["consultation", "lawyer", "matching"]
depends_on: ["AUTH-001", "REPORT-001"]
related_specs: ["NOTIFY-001"]
---

# @SPEC:CONSULT-001: 변호사 상담 매칭 시스템

## HISTORY

### v0.1.0 (2025-10-19)
- **UPDATE**: 변호사 직접 선택 방식으로 변경
- **AUTHOR**: @Claude
- **CHANGES**:
  - 자동 매칭 제거, 변호사가 직접 상담 선택
  - 배정 후 수정 불가 정책 추가
  - 변호사 간 경쟁 시스템 도입
- **RATIONALE**: 변호사의 자율성 강화 및 전문성 기반 선택

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
- 변호사 선택은 즉시 처리 (트랜잭션 락 적용)
- 실시간 메시징은 1초 이내 전달
- 상담 이력은 영구 보관
- 파일 첨부는 FILE-001 SPEC 활용

## Requirements (요구사항)

### Ubiquitous (필수 기능)
- 시스템은 상담 신청/배정/진행/완료 기능을 제공해야 한다
- 시스템은 변호사가 상담 목록을 조회하고 직접 선택할 수 있는 기능을 제공해야 한다
- 시스템은 상담 이력 조회 기능을 제공해야 한다
- 시스템은 실시간 메시징 기능을 제공해야 한다
- 시스템은 상담 평가 및 피드백 기능을 제공해야 한다
- 시스템은 배정 완료 후 수정 불가 정책을 적용해야 한다

### Event-driven (이벤트 기반)
- WHEN 교사가 상담을 신청하면, 시스템은 모든 변호사에게 새 상담 알림을 발송해야 한다
- WHEN 변호사가 상담을 선택하면, 시스템은 즉시 배정을 확정하고 다른 변호사의 접근을 차단해야 한다
- WHEN 변호사가 배정되면, 시스템은 교사에게 즉시 알림을 발송해야 한다
- WHEN 변호사가 답변을 작성하면, 시스템은 교사에게 실시간 알림을 전송해야 한다
- WHEN 상담이 완료되면, 시스템은 평가 요청을 발송해야 한다
- WHEN 워크로드가 10건을 초과하면, 시스템은 해당 변호사의 추가 선택을 제한해야 한다

### State-driven (상태 기반)
- WHILE 상담이 'pending' 상태일 때, 시스템은 모든 변호사가 조회 및 선택 가능하도록 해야 한다
- WHILE 상담이 'assigned' 상태일 때, 시스템은 배정 수정을 차단하고 변호사 응답을 대기해야 한다
- WHILE 상담이 'in_progress' 상태일 때, 시스템은 실시간 메시징을 활성화해야 한다
- WHILE 상담이 'completed' 상태일 때, 시스템은 평가를 허용해야 한다
- WHILE 변호사 워크로드가 10건 이상일 때, 시스템은 해당 변호사의 새 상담 선택을 차단해야 한다

### Optional (선택 기능)
- WHERE 긴급 상담이면, 시스템은 상담 목록 상단에 강조 표시할 수 있다
- WHERE 특정 전문 분야가 명시되면, 시스템은 해당 전문 변호사에게 우선 알림을 발송할 수 있다
- WHERE 이전 상담 이력이 있으면, 시스템은 이전 담당 변호사에게 추가 알림을 발송할 수 있다
- WHERE 화상 상담이 필요하면, 시스템은 화상 회의실을 생성할 수 있다

### Constraints (제약사항)
- IF 변호사 워크로드가 10건이면, 시스템은 신규 선택을 차단해야 한다
- IF 상담이 이미 배정되었으면, 시스템은 다른 변호사의 선택을 차단해야 한다
- IF 상담이 배정 완료되면, 시스템은 배정 변경을 절대 허용하지 않아야 한다
- IF 상담이 30일간 미배정이면, 시스템은 자동으로 종료해야 한다
- IF 동일 사건으로 중복 상담이면, 시스템은 신청을 거부해야 한다
- 상담 제목은 200자를 초과할 수 없어야 한다
- 상담 내용은 10,000자를 초과할 수 없어야 한다
- 첨부 파일은 총 50MB를 초과할 수 없어야 한다

## State Management (상태 관리)

### 상담 상태 플로우
```
pending (대기)
  ↓ [변호사가 직접 선택]
assigned (배정됨) - 수정 불가
  ↓ [변호사 상담 시작]
in_progress (진행중)
  ↓ [상담 완료]
completed (완료)
  ↓ [평가 완료]
closed (종료)
```

### 특수 상태
- `cancelled`: 교사가 취소 (pending 상태에서만 가능)
- `expired`: 30일간 미배정 시 자동 종료

## Lawyer Selection System (변호사 선택 시스템)

### 상담 목록 표시
1. **정렬 기준**
   - 긴급도 우선 (urgent → high → normal → low)
   - 최신 등록순 (기본값)
   - 전문 분야 일치도 (변호사별 맞춤 정렬)

2. **필터링 옵션**
   - 전문 분야별 필터
   - 긴급도별 필터
   - 날짜 범위 필터

3. **표시 정보**
   - 상담 제목 및 요약
   - 카테고리 및 긴급도
   - 예상 소요 시간
   - 등록 시간

### 선택 규칙
1. **선택 가능 조건**
   - 변호사 워크로드 < 10건
   - 상담 상태 = 'pending'
   - 변호사 활동 상태 = 'active'

2. **선택 제한**
   - 워크로드 10건 도달 시 선택 불가
   - 이미 배정된 상담 선택 불가
   - 선착순 배정 (동시 선택 시 먼저 요청한 변호사에게 배정)

3. **배정 확정**
   - 선택 즉시 배정 확정
   - 배정 후 취소/변경 절대 불가
   - 교사에게 즉시 알림 발송

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

### 변호사 선택 시스템
- `GET /api/consults/available` - 선택 가능한 상담 목록 (변호사용)
- `POST /api/consults/:id/select` - 변호사가 상담 선택
- `GET /api/lawyers/workload` - 워크로드 조회
- `GET /api/lawyers/:id/consults` - 변호사별 상담 목록

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
- 변호사 선택 처리: 즉시 (< 100ms)
- 메시지 전송: 1초 이내
- 상담 목록 조회: 2초 이내
- 상담 상세 조회: 1초 이내

### 동시성
- 최대 동시 상담: 1,000건
- 최대 동시 메시징: 500건
- 변호사당 최대 상담: 10건

### 가용성
- 시스템 가용성: 99.9%
- 선택 처리 성공률: 99.9% 이상
- 메시지 전달률: 99.9%

## Monitoring & Metrics

### KPI 지표
- 상담 신청 건수 (일/주/월)
- 평균 배정 소요 시간 (pending → assigned)
- 상담 완료율
- 평균 응답 시간
- 변호사별 워크로드
- 변호사별 선택 성공률
- 미배정 상담 수
- 상담 만족도

### 알림 임계값
- 미배정 상담 > 10건
- 평균 배정 시간 > 24시간
- 워크로드 > 90% (9/10건)
- 미응답 상담 > 24시간
- 동시 선택 충돌 > 5회/시간

## Traceability (@TAG)

- **SPEC**: @SPEC:CONSULT-001
- **TEST**: tests/consult/test_selection.py
- **CODE**: src/consult/selection-service.ts
- **DOC**: docs/api/consultation.md
- **DB**: consult.db (독립 DB)