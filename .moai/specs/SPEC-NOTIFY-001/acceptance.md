# @SPEC:NOTIFY-001: Acceptance Criteria

## Overview
실시간 알림 시스템의 인수 기준을 정의합니다. 인앱, 이메일, 푸시 알림의 생성, 전송, 관리 기능이 요구사항을 충족하는지 검증합니다.

## Test Scenarios

### 1. 알림 생성 및 전송

#### Scenario 1.1: 인앱 알림 생성
```gherkin
Given: 신고 상태가 'received'에서 'reviewing'으로 변경
When: 상태 변경 이벤트 발생
Then: 교사에게 인앱 알림 생성
  And: notifications 테이블에 저장
  And: 3초 이내 알림 표시
  And: 알림 벨 아이콘에 배지 표시
```

#### Scenario 1.2: 이메일 알림 발송
```gherkin
Given: 사용자가 이메일 알림 활성화
  And: 변호사가 상담 답변 작성
When: 답변 제출 완료
Then: 이메일 템플릿 렌더링
  And: SendGrid API 호출
  And: 3초 이내 이메일 발송
  And: 발송 상태 로깅
```

#### Scenario 1.3: 푸시 알림 전송
```gherkin
Given: 사용자가 푸시 알림 구독
  And: 브라우저가 백그라운드 상태
When: 긴급 상담 배정
Then: Service Worker 활성화
  And: 푸시 알림 표시
  And: 클릭 시 해당 페이지로 이동
```

### 2. 알림 우선순위 처리

#### Scenario 2.1: 긴급 알림 우선 전송
```gherkin
Given: 일반 알림 10개가 큐에 대기
  And: 긴급 알림 1개 추가
When: 알림 처리 시작
Then: 긴급 알림이 먼저 전송
  And: 모든 채널로 동시 발송
  And: 관리자에게 별도 알림
```

#### Scenario 2.2: 우선순위별 채널 선택
```gherkin
Given: 알림 우선순위 설정
When: 각 우선순위별 알림 발생
Then:
  Critical: 인앱 + 이메일 + 푸시
  High: 인앱 + 이메일
  Normal: 인앱
  Low: 배치 이메일
```

### 3. 알림 관리

#### Scenario 3.1: 알림 읽음 처리
```gherkin
Given: 읽지 않은 알림 5개 존재
When: 사용자가 알림 클릭
Then: 해당 알림 is_read = true
  And: read_at 타임스탬프 기록
  And: 배지 카운트 감소
  And: UI 즉시 업데이트
```

#### Scenario 3.2: 일괄 읽음 처리
```gherkin
Given: 읽지 않은 알림 여러 개
When: "모두 읽음" 버튼 클릭
Then: 모든 알림 읽음 처리
  And: 배지 카운트 0으로 리셋
  And: 일괄 업데이트 쿼리 실행
```

#### Scenario 3.3: 알림 삭제
```gherkin
Given: 알림 목록에 오래된 알림
When: 삭제 아이콘 클릭
Then: 해당 알림 soft delete
  And: UI에서 즉시 제거
  And: 30일 후 hard delete
```

### 4. 알림 설정

#### Scenario 4.1: 채널별 설정
```gherkin
Given: 알림 설정 페이지
When: 사용자가 이메일 알림 비활성화
Then: notification_settings 업데이트
  And: 이후 이메일 발송 중단
  And: 인앱 알림은 계속 발송
```

#### Scenario 4.2: Do Not Disturb 설정
```gherkin
Given: DND 시간 설정 (22:00 - 08:00)
When: DND 시간대에 알림 발생
Then: 인앱 알림만 조용히 저장
  And: 이메일/푸시 발송 보류
  And: DND 종료 후 일괄 발송
```

#### Scenario 4.3: 카테고리별 필터링
```gherkin
Given: 사용자가 '시스템 공지' 알림 비활성화
When: 시스템 공지 알림 발생
Then: 해당 사용자에게 발송 안 함
  And: 다른 카테고리는 정상 발송
```

### 5. 실시간 업데이트

#### Scenario 5.1: 폴링 방식 동작
```gherkin
Given: 사용자가 앱에 접속 중
When: 새로운 알림 생성
Then: 1초 이내 폴링으로 감지
  And: 알림 드롭다운 자동 업데이트
  And: 토스트 메시지 표시
  And: 사운드 재생 (설정 시)
```

#### Scenario 5.2: 오프라인 처리
```gherkin
Given: 사용자가 오프라인 상태
When: 알림이 발생
Then: 알림이 큐에 저장
  And: 온라인 복귀 시 일괄 전송
  And: 시간순 정렬 유지
```

### 6. 이메일 템플릿

#### Scenario 6.1: 동적 템플릿 렌더링
```gherkin
Given: 상담 배정 알림 템플릿
When: 변수 치환 수행
Then: {{teacherName}} → 실제 이름
  And: {{lawyerName}} → 변호사 이름
  And: {{consultTitle}} → 상담 제목
  And: HTML/Text 버전 모두 생성
```

#### Scenario 6.2: 이메일 바운스 처리
```gherkin
Given: 잘못된 이메일 주소
When: 이메일 발송 실패
Then: 바운스 이벤트 감지
  And: 해당 이메일 비활성화
  And: 인앱 알림으로 대체
```

### 7. 푸시 알림

#### Scenario 7.1: 구독 관리
```gherkin
Given: 사용자가 푸시 권한 허용
When: 구독 버튼 클릭
Then: VAPID 키로 구독 생성
  And: 구독 정보 서버 저장
  And: 테스트 푸시 발송
```

#### Scenario 7.2: 푸시 클릭 처리
```gherkin
Given: 푸시 알림 표시됨
When: 사용자가 알림 클릭
Then: 앱이 포커스 또는 열림
  And: 해당 페이지로 라우팅
  And: 알림 읽음 처리
```

### 8. 관리자 기능

#### Scenario 8.1: 전체 공지
```gherkin
Given: 관리자 권한
When: 전체 공지 작성 및 발송
Then: 모든 활성 사용자에게 발송
  And: 역할별 필터링 가능
  And: 발송 통계 확인
```

#### Scenario 8.2: 알림 모니터링
```gherkin
Given: 관리자 대시보드
When: 알림 통계 조회
Then: 발송 성공/실패 건수
  And: 채널별 전달률
  And: 평균 읽음 시간
  And: 사용자별 알림 현황
```

### 9. 성능 요구사항

#### Scenario 9.1: 대량 알림 처리
```gherkin
Given: 1,000명에게 동시 알림
When: 일괄 발송 실행
Then: 3초 이내 큐 등록
  And: 1분 이내 모든 인앱 알림 전송
  And: 5분 이내 모든 이메일 발송
  And: 시스템 응답성 유지
```

#### Scenario 9.2: 알림 조회 성능
```gherkin
Given: 사용자당 알림 1,000개
When: 알림 목록 조회
Then: 500ms 이내 응답
  And: 페이지네이션 적용
  And: 최근 30일 데이터만 기본 표시
```

### 10. 에러 처리

#### Scenario 10.1: 전송 실패 재시도
```gherkin
Given: 네트워크 오류로 전송 실패
When: 재시도 로직 실행
Then: 지수 백오프로 3회 재시도
  And: 1초 → 2초 → 4초 간격
  And: 최종 실패 시 Dead Letter Queue
```

#### Scenario 10.2: 템플릿 오류 처리
```gherkin
Given: 템플릿 변수 누락
When: 렌더링 시도
Then: 기본값으로 대체
  And: 오류 로깅
  And: 관리자 알림
  But: 발송은 계속 진행
```

## Non-functional Requirements

### Performance
- ✅ 알림 생성: < 100ms
- ✅ 알림 전송: < 3초
- ✅ 폴링 간격: 1초
- ✅ 배지 업데이트: < 100ms

### Reliability
- ✅ 전달 성공률: > 99%
- ✅ 중복 방지: 100%
- ✅ 순서 보장: FIFO
- ✅ 데이터 무결성: 100%

### Scalability
- ✅ 동시 알림: 1,000건/초
- ✅ 이메일: 100건/초
- ✅ 푸시: 500건/초
- ✅ 저장 용량: 무제한

### Usability
- ✅ 직관적 UI
- ✅ 1클릭 읽음 처리
- ✅ 명확한 알림 내용
- ✅ 모바일 반응형

## Test Data

### Test Users
```yaml
teachers: 20명
lawyers: 10명
admins: 3명
super_admin: 1명
```

### Test Notifications
```yaml
report_notifications: 100건
consult_notifications: 50건
system_notifications: 20건
test_emails: 30건
test_push: 20건
```

### Test Scenarios
```yaml
normal_flow: 50건
urgent_flow: 10건
dnd_test: 5건
offline_test: 5건
bounce_test: 3건
```

## Security Requirements

### Access Control
- ✅ 본인 알림만 조회
- ✅ 역할별 발송 권한
- ✅ 관리자 기능 제한
- ✅ API 인증 필수

### Data Protection
- ✅ 알림 내용 암호화
- ✅ PII 마스킹
- ✅ HTTPS 전송
- ✅ XSS 방지

### Audit
- ✅ 모든 발송 로깅
- ✅ 읽음 기록 추적
- ✅ 설정 변경 이력
- ✅ 90일 보관

## Definition of Done

### Development
- [ ] 모든 API 엔드포인트 구현
- [ ] UI 컴포넌트 완성
- [ ] 이메일 템플릿 작성
- [ ] Service Worker 등록
- [ ] 알림 설정 페이지

### Testing
- [ ] 단위 테스트 80% 커버리지
- [ ] 통합 테스트 완료
- [ ] E2E 테스트 시나리오
- [ ] 부하 테스트 통과
- [ ] 보안 테스트 완료

### Documentation
- [ ] API 문서화
- [ ] 사용자 가이드
- [ ] 관리자 매뉴얼
- [ ] 템플릿 가이드

### Deployment
- [ ] 환경별 설정
- [ ] 모니터링 구성
- [ ] 알림 대시보드
- [ ] 백업 계획

## Sign-off Criteria

### Stakeholder Approval
- [ ] Product Owner 승인
- [ ] QA Team 승인
- [ ] Security Review
- [ ] UX Review

### Success Metrics
- [ ] 전달률 > 99%
- [ ] 읽음률 > 60%
- [ ] 응답시간 < 3초
- [ ] 사용자 만족도 > 4.0/5.0