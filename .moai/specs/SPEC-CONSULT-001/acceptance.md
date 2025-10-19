# @SPEC:CONSULT-001: Acceptance Criteria

## Overview
변호사 상담 매칭 시스템의 인수 기준을 정의합니다. Given-When-Then 형식으로 작성된 테스트 시나리오를 통해 시스템이 요구사항을 충족하는지 검증합니다.

## Test Scenarios

### 1. 상담 신청 (Teacher)

#### Scenario 1.1: 성공적인 상담 신청
```gherkin
Given: 교사가 로그인된 상태
  And: 유효한 신고 건이 존재
When: 상담 신청 폼을 작성하고 제출
Then: 고유 상담번호(CST-YYYY-MM-NNNN)가 생성됨
  And: 상담 상태가 'pending'으로 설정됨
  And: 매칭 큐에 등록됨
  And: 신청 확인 알림이 표시됨
```

#### Scenario 1.2: 긴급 상담 신청
```gherkin
Given: 교사가 로그인된 상태
  And: 긴급 사안 발생
When: 긴급도를 'urgent'로 설정하여 상담 신청
Then: 우선순위 큐의 상단에 배치됨
  And: 1분 이내 매칭 시도가 시작됨
  And: 관리자에게 긴급 알림 발송됨
```

#### Scenario 1.3: 중복 상담 신청 차단
```gherkin
Given: 이미 진행 중인 상담이 존재
  And: 동일한 신고 건에 대한 상담
When: 중복 상담을 신청 시도
Then: 중복 신청 오류 메시지 표시
  And: 기존 상담 링크 제공
  And: 신청이 차단됨
```

### 2. 자동 매칭 시스템

#### Scenario 2.1: 전문 분야 일치 매칭
```gherkin
Given: '학부모 민원' 카테고리 상담 신청
  And: 해당 전문 분야 변호사 3명 대기 중
When: 매칭 알고리즘이 실행
Then: 전문 분야 일치도가 가장 높은 변호사 선정
  And: 3분 이내 매칭 완료
  And: 변호사에게 배정 알림 발송
  And: 교사에게 매칭 완료 알림 발송
```

#### Scenario 2.2: 워크로드 기반 매칭
```gherkin
Given: 동일 전문 분야 변호사 2명
  And: A 변호사 워크로드 20%, B 변호사 워크로드 60%
When: 매칭 알고리즘 실행
Then: 워크로드가 낮은 A 변호사에게 우선 배정
  And: 워크로드가 업데이트됨 (A: 30%)
```

#### Scenario 2.3: 매칭 실패 처리
```gherkin
Given: 모든 변호사의 워크로드가 100%
When: 상담 매칭 시도
Then: 매칭 실패 상태로 전환
  And: 관리자에게 에스컬레이션 알림
  And: 수동 매칭 대기 상태로 전환
```

### 3. 변호사 응답

#### Scenario 3.1: 변호사 수락
```gherkin
Given: 변호사에게 상담이 배정됨
  And: 배정 알림을 받음
When: 변호사가 24시간 이내 수락
Then: 상담 상태가 'in_progress'로 변경
  And: 교사에게 수락 알림 발송
  And: 메시징 채널 활성화
  And: 변호사 워크로드 증가
```

#### Scenario 3.2: 변호사 거절
```gherkin
Given: 변호사에게 상담이 배정됨
When: 변호사가 거절 버튼 클릭
Then: 상담이 재매칭 큐로 이동
  And: 다른 변호사에게 자동 재배정
  And: 거절 사유 기록
  And: 거절률 통계 업데이트
```

#### Scenario 3.3: 무응답 처리
```gherkin
Given: 변호사에게 상담이 배정됨
When: 48시간 동안 응답 없음
Then: 자동으로 재매칭 실행
  And: 해당 변호사 응답률 감소
  And: 3회 연속 무응답 시 24시간 배정 제외
```

### 4. 실시간 메시징

#### Scenario 4.1: 메시지 전송
```gherkin
Given: 상담이 'in_progress' 상태
  And: 교사가 메시지 작성
When: 전송 버튼 클릭
Then: 1초 이내 변호사에게 전달
  And: 메시지 히스토리에 저장
  And: 변호사에게 푸시 알림
  And: 읽지 않음 표시
```

#### Scenario 4.2: 메시지 읽음 처리
```gherkin
Given: 읽지 않은 메시지 존재
When: 수신자가 메시지 확인
Then: 읽음 상태로 변경
  And: 발신자에게 읽음 표시
  And: 읽음 시간 기록
```

#### Scenario 4.3: 파일 첨부
```gherkin
Given: 메시지 작성 중
When: 파일 첨부 버튼 클릭하고 파일 선택
Then: FILE-001 SPEC 연동하여 업로드
  And: 파일 미리보기 표시
  And: 다운로드 링크 생성
  And: 10MB 제한 검증
```

### 5. 상담 완료

#### Scenario 5.1: 정상 완료
```gherkin
Given: 상담이 'in_progress' 상태
  And: 충분한 답변이 제공됨
When: 변호사가 완료 버튼 클릭
Then: 상담 상태가 'completed'로 변경
  And: 교사에게 완료 알림
  And: 평가 요청 발송
  And: 변호사 워크로드 감소
```

#### Scenario 5.2: 자동 종료
```gherkin
Given: 상담이 30일간 'in_progress' 상태
When: 자동 종료 스케줄러 실행
Then: 상담 상태가 'expired'로 변경
  And: 양측에 종료 알림
  And: 종료 사유 기록
```

### 6. 평가 시스템

#### Scenario 6.1: 평가 제출
```gherkin
Given: 상담이 'completed' 상태
  And: 교사가 평가 페이지 접근
When: 1-5점 평점과 피드백 작성 후 제출
Then: 평가 데이터 저장
  And: 변호사 평균 평점 업데이트
  And: 상담 상태가 'closed'로 변경
```

#### Scenario 6.2: 평가 기반 매칭 개선
```gherkin
Given: 변호사 A의 평균 평점 4.5
  And: 변호사 B의 평균 평점 3.0
When: 동일 조건에서 매칭 실행
Then: 평점이 높은 A 변호사에게 가산점 부여
  And: 매칭 우선순위 상승
```

### 7. 관리자 기능

#### Scenario 7.1: 수동 매칭
```gherkin
Given: 관리자 권한으로 로그인
  And: 자동 매칭 실패한 상담 존재
When: 특정 변호사를 선택하여 수동 배정
Then: 워크로드와 관계없이 배정 완료
  And: 수동 배정 사유 기록
  And: 변호사에게 특별 배정 알림
```

#### Scenario 7.2: 상담 모니터링
```gherkin
Given: 관리자 대시보드 접근
When: 실시간 상담 현황 조회
Then: 전체 상담 상태별 통계 표시
  And: 변호사별 워크로드 현황
  And: 평균 매칭 시간
  And: 상담 완료율
```

### 8. 보안 및 권한

#### Scenario 8.1: 권한 검증
```gherkin
Given: 교사 A가 로그인
When: 교사 B의 상담 접근 시도
Then: 403 Forbidden 오류
  And: 접근 시도 로그 기록
  And: 본인 상담 목록으로 리다이렉트
```

#### Scenario 8.2: 데이터 암호화
```gherkin
Given: 민감한 상담 내용 입력
When: 데이터베이스에 저장
Then: AES-256 암호화 적용
  And: 복호화는 권한 있는 사용자만 가능
  And: 전송 시 HTTPS 필수
```

### 9. 성능 요구사항

#### Scenario 9.1: 매칭 성능
```gherkin
Given: 100건의 동시 상담 신청
When: 매칭 알고리즘 실행
Then: 모든 매칭이 3분 이내 완료
  And: 시스템 응답 시간 < 2초 유지
  And: 메모리 사용률 < 80%
```

#### Scenario 9.2: 메시징 성능
```gherkin
Given: 500개의 동시 메시지 전송
When: 메시지 처리 시스템 동작
Then: 모든 메시지 1초 이내 전달
  And: 메시지 유실률 0%
  And: 순서 보장
```

### 10. 에러 처리

#### Scenario 10.1: 네트워크 오류 복구
```gherkin
Given: 메시지 전송 중
When: 네트워크 연결 끊김
Then: 자동 재시도 (3회)
  And: 로컬 스토리지에 임시 저장
  And: 연결 복구 시 자동 전송
```

#### Scenario 10.2: 시스템 장애 대응
```gherkin
Given: 매칭 시스템 장애
When: 상담 신청 시도
Then: Graceful degradation
  And: 수동 매칭 모드로 전환
  And: 관리자에게 긴급 알림
  And: 사용자에게 안내 메시지
```

## Non-functional Acceptance Criteria

### Performance
- ✅ 페이지 로드 시간 < 2초
- ✅ API 응답 시간 < 500ms
- ✅ 매칭 완료 시간 < 3분
- ✅ 메시지 전달 시간 < 1초

### Reliability
- ✅ 시스템 가용성 > 99.9%
- ✅ 데이터 무결성 100%
- ✅ 자동 백업 일 1회
- ✅ 장애 복구 시간 < 1시간

### Scalability
- ✅ 동시 상담 1,000건 처리
- ✅ 동시 사용자 5,000명 지원
- ✅ 메시지 처리량 10,000/분
- ✅ 스토리지 자동 확장

### Security
- ✅ OWASP Top 10 대응
- ✅ 데이터 암호화 (at rest & in transit)
- ✅ 2FA 인증 지원
- ✅ 감사 로그 90일 보관

### Usability
- ✅ 모바일 반응형 디자인
- ✅ 3클릭 이내 주요 기능 접근
- ✅ 5초 이내 작업 완료
- ✅ 직관적 UI/UX

## Test Data Requirements

### Test Users
- 교사: 10명 (다양한 학교/지역)
- 변호사: 5명 (각기 다른 전문 분야)
- 관리자: 2명
- Super Admin: 1명

### Test Cases
- 일반 상담: 50건
- 긴급 상담: 10건
- 거절 케이스: 5건
- 재매칭 케이스: 5건
- 자동 종료 케이스: 3건

### Test Environment
- Development: SQLite + Local
- Staging: PostgreSQL + Cloud
- Production: PostgreSQL + AWS/GCP

## Definition of Done

### Code Quality
- [ ] 코드 리뷰 완료
- [ ] 단위 테스트 커버리지 > 80%
- [ ] 통합 테스트 통과
- [ ] E2E 테스트 통과
- [ ] 보안 스캔 통과

### Documentation
- [ ] API 문서 작성
- [ ] 사용자 가이드 작성
- [ ] 관리자 매뉴얼 작성
- [ ] 배포 가이드 작성

### Deployment
- [ ] CI/CD 파이프라인 구성
- [ ] 모니터링 대시보드 구성
- [ ] 알림 시스템 구성
- [ ] 백업/복구 계획 수립

## Sign-off Criteria

### Stakeholder Approval
- [ ] Product Owner 승인
- [ ] QA Team 승인
- [ ] Security Team 검토
- [ ] Legal Team 검토 (개인정보보호)

### Business Metrics
- [ ] 95% 상담 완료율 달성
- [ ] 3분 이내 매칭률 > 90%
- [ ] 사용자 만족도 > 4.0/5.0
- [ ] 시스템 안정성 > 99.9%