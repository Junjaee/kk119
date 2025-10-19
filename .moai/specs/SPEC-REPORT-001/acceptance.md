# SPEC-REPORT-001 수락 기준

## Given-When-Then 테스트 시나리오

### AC-1: 신고 작성 성공
**우선순위**: Critical
**역할**: Teacher

```gherkin
Given 교사가 JWT 토큰으로 인증된 상태
  And /reports/new 페이지에 접근
When 다음 필드를 입력
  | 필드명          | 값                     |
  |----------------|------------------------|
  | category       | "학부모 민원"          |
  | title          | "수업 중 학부모 항의"  |
  | description    | "수업 중 갑작스런 방문" |
  | incident_date  | 2025-10-16            |
  | location       | "3학년 2반 교실"       |
  | is_emergency   | false                 |
  And "신고 제출" 버튼 클릭
Then HTTP 201 Created 응답 수신
  And 응답에 신고번호가 포함됨 (예: "RPT-20251017-0001")
  And 응답에 status="received" 포함
  And DB에 신고 레코드가 저장됨
  And 성공 메시지 "신고가 접수되었습니다" 표시
  And /reports 페이지로 리다이렉트
```

**검증 쿼리**:
```sql
SELECT * FROM reports WHERE report_number = 'RPT-20251017-0001';
-- 결과: 1행, status='received', teacher_id={현재 사용자 ID}
```

---

### AC-2: 필수 필드 누락 시 에러
**우선순위**: High
**역할**: Teacher

```gherkin
Given 교사가 /reports/new 페이지에 접근
When 제목만 입력하고 다른 필드는 비워둠
  And "신고 제출" 버튼 클릭
Then HTTP 422 Unprocessable Entity 응답 수신
  And 에러 메시지 "카테고리를 선택해주세요" 표시
  And 에러 메시지 "상세 내용을 입력해주세요" 표시
  And 에러 메시지 "사건 발생일을 선택해주세요" 표시
  And 누락된 필드가 빨간색으로 하이라이트됨
  And DB에 신고 레코드가 저장되지 않음
```

---

### AC-3: 비인증 사용자 접근 차단
**우선순위**: Critical
**역할**: 비로그인 사용자

```gherkin
Given 사용자가 로그인하지 않은 상태
When /reports/new URL을 직접 입력하여 접근 시도
Then HTTP 401 Unauthorized 응답 수신
  And /login 페이지로 리다이렉트
  And 에러 메시지 "로그인이 필요합니다" 표시
```

---

### AC-4: Teacher가 아닌 역할 접근 차단
**우선순위**: Critical
**역할**: Lawyer

```gherkin
Given 변호사(Lawyer) 역할로 로그인된 상태
When /reports/new 페이지 접근 시도
Then HTTP 403 Forbidden 응답 수신
  And 에러 메시지 "교사만 신고를 작성할 수 있습니다" 표시
  And /lawyer 페이지로 리다이렉트
```

---

### AC-5: 신고 목록 조회 (본인 신고만)
**우선순위**: High
**역할**: Teacher

```gherkin
Given 교사 A가 3건의 신고를 작성한 상태
  And 교사 B가 2건의 신고를 작성한 상태
  And 교사 A로 로그인된 상태
When /reports 페이지에 접근
Then HTTP 200 OK 응답 수신
  And 3건의 신고가 목록에 표시됨
  And 각 신고에 번호, 제목, 상태, 작성일이 포함됨
  And 교사 B의 신고는 표시되지 않음
  And 최신순으로 정렬됨 (created_at DESC)
```

**검증 쿼리**:
```sql
SELECT COUNT(*) FROM reports WHERE teacher_id = {교사 A ID};
-- 결과: 3
```

---

### AC-6: 관리자 전체 신고 조회
**우선순위**: High
**역할**: Admin

```gherkin
Given 전체 시스템에 15건의 신고가 작성된 상태
  And 관리자(Admin)로 로그인된 상태
When /admin/reports 페이지에 접근
Then HTTP 200 OK 응답 수신
  And 15건의 신고가 목록에 표시됨
  And 각 신고에 작성자 정보가 포함됨
  And 상태별 필터링 UI가 표시됨
```

---

### AC-7: 신고 상세 조회
**우선순위**: High
**역할**: Teacher

```gherkin
Given 교사가 신고번호 "RPT-20251017-0001"을 작성한 상태
When /reports/RPT-20251017-0001 페이지에 접근
Then HTTP 200 OK 응답 수신
  And 신고 전체 정보가 표시됨
    | 필드           | 값                     |
    |---------------|------------------------|
    | report_number | "RPT-20251017-0001"   |
    | category      | "학부모 민원"          |
    | title         | "수업 중 학부모 항의"  |
    | status        | "received"            |
  And 상태 변경 이력 타임라인이 표시됨
  And 첨부 파일 다운로드 링크가 표시됨 (파일이 있는 경우)
```

---

### AC-8: 타인 신고 상세 조회 차단
**우선순위**: Critical
**역할**: Teacher

```gherkin
Given 교사 A가 신고번호 "RPT-20251017-0001"을 작성
  And 교사 B로 로그인된 상태
When /reports/RPT-20251017-0001 페이지 접근 시도
Then HTTP 403 Forbidden 응답 수신
  And 에러 메시지 "본인의 신고만 조회할 수 있습니다" 표시
  And /reports 페이지로 리다이렉트
```

---

### AC-9: 신고 상태 변경 (Admin)
**우선순위**: High
**역할**: Admin

```gherkin
Given 관리자(Admin)로 로그인된 상태
  And 신고번호 "RPT-20251017-0001"의 상태가 "received"
When /admin/reports/RPT-20251017-0001 페이지에서
  And "검토 중으로 변경" 버튼 클릭
Then HTTP 200 OK 응답 수신
  And DB에서 상태가 "reviewing"으로 업데이트됨
  And report_status_history 테이블에 이력이 기록됨
    | 필드         | 값                     |
    |-------------|------------------------|
    | from_status | "received"            |
    | to_status   | "reviewing"           |
    | changed_by  | {관리자 ID}            |
  And 성공 메시지 "상태가 변경되었습니다" 표시
  And 교사에게 알림 발송 (@SPEC:NOTIFY-001)
```

**검증 쿼리**:
```sql
SELECT * FROM reports WHERE report_number = 'RPT-20251017-0001';
-- 결과: status='reviewing'

SELECT * FROM report_status_history
WHERE report_id = (SELECT id FROM reports WHERE report_number = 'RPT-20251017-0001')
ORDER BY changed_at DESC LIMIT 1;
-- 결과: from_status='received', to_status='reviewing'
```

---

### AC-10: 상태 역행 시도 차단
**우선순위**: Critical
**역할**: Admin

```gherkin
Given 신고번호 "RPT-20251017-0001"의 상태가 "reviewing"
  And 관리자(Admin)로 로그인된 상태
When 상태를 "received"로 변경 시도
Then HTTP 400 Bad Request 응답 수신
  And 에러 메시지 "상태는 역행할 수 없습니다" 표시
  And DB에서 상태가 "reviewing"으로 유지됨
  And 이력이 기록되지 않음
```

---

### AC-11: 신고번호 자동 생성 검증
**우선순위**: Critical
**역할**: Teacher

```gherkin
Given 오늘 날짜가 2025년 10월 17일
  And 오늘 작성된 신고가 3건 존재
When 4번째 신고를 작성하고 제출
Then 신고번호가 "RPT-20251017-0004"로 생성됨
  And DB에 UNIQUE 제약조건으로 중복 방지
```

**검증 쿼리**:
```sql
SELECT report_number FROM reports
WHERE DATE(created_at) = '2025-10-17'
ORDER BY created_at;
-- 결과:
-- RPT-20251017-0001
-- RPT-20251017-0002
-- RPT-20251017-0003
-- RPT-20251017-0004
```

---

### AC-12: 신고 수정 권한 (received 상태)
**우선순위**: Medium
**역할**: Teacher

```gherkin
Given 교사가 작성한 신고 상태가 "received"
When 신고 상세 페이지에서 "수정" 버튼 클릭
  And 제목을 "수정된 제목"으로 변경
  And "저장" 버튼 클릭
Then HTTP 200 OK 응답 수신
  And DB에서 제목이 업데이트됨
  And updated_at 필드가 현재 시각으로 갱신됨
  And 성공 메시지 "신고가 수정되었습니다" 표시
```

---

### AC-13: 신고 수정 제한 (reviewing 이상)
**우선순위**: High
**역할**: Teacher

```gherkin
Given 교사가 작성한 신고 상태가 "reviewing"
When 신고 상세 페이지에 접근
Then "수정" 버튼이 비활성화됨
  And 안내 메시지 "검토 중인 신고는 수정할 수 없습니다" 표시
  And 수정 시도 시 HTTP 403 Forbidden 응답
```

---

### AC-14: 상태 변경 이력 조회
**우선순위**: Medium
**역할**: Teacher

```gherkin
Given 신고번호 "RPT-20251017-0001"의 상태가 다음과 같이 변경됨
  | 시각              | 변경 전   | 변경 후    | 변경자          |
  |------------------|----------|-----------|----------------|
  | 2025-10-17 10:00 | -        | received  | teacher@ex.com |
  | 2025-10-17 14:30 | received | reviewing | admin@ex.com   |
  | 2025-10-17 16:00 | reviewing| consulting| admin@ex.com   |
When 신고 상세 페이지의 "상태 이력" 섹션 조회
Then 3건의 이력이 시간순으로 표시됨
  And 각 이력에 시각, 상태, 변경자가 포함됨
  And 타임라인 UI로 시각화됨
```

---

### AC-15: 성능 테스트 - 목록 조회
**우선순위**: High
**역할**: Teacher

```gherkin
Given DB에 10,000건의 신고가 저장된 상태
  And 교사가 100건의 신고를 작성한 상태
When /reports 페이지에 접근 (페이지네이션: 20건)
Then HTTP 200 OK 응답이 2초 이내 수신됨
  And 20건의 신고가 표시됨
  And 페이지네이션 컨트롤이 표시됨 (총 5페이지)
```

**성능 검증**:
```typescript
// Playwright 테스트
const start = Date.now();
await page.goto('/reports');
const elapsed = Date.now() - start;
expect(elapsed).toBeLessThan(2000);
```

---

### AC-16: 긴급 신고 플래그
**우선순위**: Low
**역할**: Teacher

```gherkin
Given 교사가 /reports/new 페이지에 접근
When "긴급 신고" 체크박스를 선택
  And 필수 필드를 입력하고 제출
Then DB에 is_emergency=1로 저장됨
  And 신고 목록에서 긴급 아이콘이 표시됨
  And (선택) 관리자에게 긴급 알림 발송
```

---

## 품질 게이트 기준

### 기능 완성도
- ✅ AC-1 ~ AC-16 모든 시나리오 통과
- ✅ E2E 테스트 스크립트 작성 및 실행 성공
- ✅ 에러 시나리오 핸들링 검증

### 성능 기준
- ✅ 신고 목록 조회: 평균 응답시간 < 2초
- ✅ 신고 작성 제출: 평균 응답시간 < 3초
- ✅ 동시 접속 100명 처리 성공

### 보안 기준
- ✅ JWT 인증 없이 API 호출 시 401 에러
- ✅ Teacher 역할 아닌 사용자의 신고 작성 차단 (403)
- ✅ 타인의 신고 조회 차단 (403)
- ✅ SQL 인젝션 방어 (Prepared Statement 사용)

### 코드 품질
- ✅ TypeScript 타입 에러 0개
- ✅ ESLint 경고 0개
- ✅ 단위 테스트 커버리지 > 80%

---

## 테스트 실행 방법

### E2E 테스트 (Playwright)
```bash
# 전체 테스트 실행
npx playwright test spec-report-001.spec.ts

# 특정 시나리오만 실행
npx playwright test -g "AC-1: 신고 작성 성공"

# 헤드리스 모드 비활성화 (브라우저 UI 확인)
npx playwright test --headed
```

### API 테스트 (Jest)
```bash
# API 엔드포인트 단위 테스트
npm test -- reports.api.test.ts

# 커버리지 확인
npm test -- --coverage
```

### DB 마이그레이션 테스트
```bash
# 마이그레이션 실행
npm run db:migrate

# 롤백 테스트
npm run db:rollback

# 무결성 검증
sqlite3 data/kyokwon119.db "PRAGMA foreign_key_check;"
```

---

## 완료 정의 (Definition of Done)

### 필수 체크리스트
- ✅ AC-1 ~ AC-16 모든 시나리오 Playwright 테스트 통과
- ✅ 성능 기준 (조회 2초, 작성 3초) 달성 확인
- ✅ 보안 취약점 테스트 통과 (권한 차단, SQL 인젝션 방어)
- ✅ DB 스키마 마이그레이션 롤백 테스트 성공
- ✅ TypeScript 타입 에러 0개
- ✅ 코드 리뷰 승인 완료

### 문서화
- ✅ API 엔드포인트 문서 작성 (Swagger 또는 README)
- ✅ 상태 전이도 다이어그램 추가
- ✅ 신고번호 생성 로직 주석 추가

### 배포 준비
- ✅ 프로덕션 DB 마이그레이션 스크립트 준비
- ✅ 롤백 계획 문서 작성
- ✅ 모니터링 대시보드에 신고 관련 메트릭 추가

---

_이 수락 기준은 `/alfred:2-build REPORT-001` 실행 후 TDD 검증에 사용됩니다._
