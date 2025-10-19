# SPEC-REPORT-001 구현 계획

## 개요
교권 침해 신고 시스템의 핵심 기능 구현 계획입니다. 신고 작성, 목록 조회, 상태 관리, 이력 추적 기능을 단계별로 구현합니다.

---

## 마일스톤 (우선순위 기반)

### 1차 목표: DB 스키마 및 데이터 모델 구축
- **DB 마이그레이션**: `reports` 테이블 및 `report_status_history` 테이블 생성
- **인덱스 생성**: teacher_id, status, created_at, report_number 인덱스
- **타입 정의**: `Report`, `ReportStatus`, `ReportStatusHistory` TypeScript 타입
- **검증**: SQLite DB에서 테이블 생성 확인 및 PRAGMA 검증

### 2차 목표: 신고 작성 API 구현
- **API 엔드포인트**: `POST /api/reports/create`
- **신고번호 생성 로직**: `RPT-YYYYMMDD-XXXX` 형식 자동 생성
- **입력 검증**: Zod 스키마로 필수 필드 및 길이 제한 검증
- **인증 확인**: JWT 미들웨어로 Teacher 역할 확인
- **DB 삽입**: reports 테이블에 초기 상태 "received"로 저장
- **의존성**: SPEC-AUTH-001 (JWT 인증) 완료 필요

### 3차 목표: 신고 조회 API 구현
- **API 엔드포인트**: `GET /api/reports` (목록), `GET /api/reports/[id]` (상세)
- **권한 필터링**: Teacher는 본인 신고만, Admin은 전체 신고 조회
- **페이지네이션**: 기본 20건, 최대 100건
- **정렬**: 최신순 (created_at DESC)
- **응답 최적화**: 2초 이내 응답 보장

### 4차 목표: 상태 관리 API 구현
- **API 엔드포인트**: `PATCH /api/reports/[id]/status`
- **상태 전이 검증**: received → reviewing → consulting → completed 순서 강제
- **이력 기록**: report_status_history 테이블에 변경 이력 저장
- **알림 트리거**: 상태 변경 시 SPEC-NOTIFY-001 호출
- **권한**: Admin만 상태 변경 가능

### 5차 목표: UI 페이지 구현
- **신고 작성 페이지**: `/reports/new`
  - 카테고리 선택 드롭다운
  - 제목/내용 입력 폼 (길이 제한 표시)
  - 사건 발생일 DatePicker
  - 긴급 신고 체크박스
  - 파일 첨부 (SPEC-FILE-001 연동)
- **신고 목록 페이지**: `/reports`
  - 신고 카드 리스트 (번호, 제목, 상태, 작성일)
  - 상태별 필터링 (received, reviewing, consulting, completed)
  - 카테고리별 필터링
- **신고 상세 페이지**: `/reports/[id]`
  - 신고 전체 정보 표시
  - 상태 변경 이력 타임라인
  - 첨부 파일 다운로드 링크
  - 변호사 배정 정보 (consulting 상태 시)

### 6차 목표: 통합 테스트 및 검증
- **E2E 테스트**: Playwright로 신고 작성 → 제출 → 조회 → 상태 변경 흐름 검증
- **성능 테스트**: 100건 동시 요청 처리 확인
- **보안 테스트**: 권한 없는 사용자의 접근 차단 확인
- **DB 무결성 테스트**: 외래 키 제약조건 및 인덱스 성능 검증

---

## 기술적 접근 방법

### 아키텍처 패턴
- **레이어 분리**: API Route → Service → Repository → DB
- **Repository 패턴**: `ReportRepository` 클래스로 DB 액세스 캡슐화
- **Service 레이어**: 비즈니스 로직 (신고번호 생성, 상태 전이 검증)
- **DTO (Data Transfer Object)**: API 요청/응답 타입 명시

### 코드 구조
```
lib/
  db/
    reports.ts              # ReportRepository (CRUD 메서드)
    report-status-history.ts # StatusHistoryRepository
  services/
    report-service.ts       # 비즈니스 로직 (신고번호 생성, 상태 검증)
  types/
    report.ts               # TypeScript 타입 정의

app/
  api/
    reports/
      create/
        route.ts            # POST /api/reports/create
      [id]/
        route.ts            # GET /api/reports/[id]
        status/
          route.ts          # PATCH /api/reports/[id]/status
      route.ts              # GET /api/reports
  reports/
    new/
      page.tsx              # 신고 작성 페이지
    [id]/
      page.tsx              # 신고 상세 페이지
    page.tsx                # 신고 목록 페이지
```

### 상태 전이 검증 로직
```typescript
const STATUS_TRANSITIONS: Record<ReportStatus, ReportStatus[]> = {
  received: ['reviewing'],
  reviewing: ['consulting'],
  consulting: ['completed'],
  completed: [],
};

function validateStatusTransition(from: ReportStatus, to: ReportStatus): boolean {
  return STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}
```

### 신고번호 생성 로직
```typescript
async function generateReportNumber(db: Database): Promise<string> {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const countQuery = `
    SELECT COUNT(*) as count
    FROM reports
    WHERE DATE(created_at) = DATE('now')
  `;
  const { count } = await db.get(countQuery);
  const sequence = String(count + 1).padStart(4, '0');
  return `RPT-${today}-${sequence}`;
}
```

---

## 리스크 및 대응 방안

### 리스크 1: 신고번호 중복 생성
- **원인**: 동시 요청 시 같은 count 값 조회
- **대응**: UNIQUE 제약조건 + DB 트랜잭션 처리
- **보완**: 중복 발생 시 재시도 로직 (최대 3회)

### 리스크 2: 상태 역행 시도
- **원인**: 클라이언트에서 잘못된 상태값 전송
- **대응**: `validateStatusTransition` 함수로 서버 측 검증
- **보완**: 클라이언트 UI에서 허용된 상태 버튼만 표시

### 리스크 3: 대용량 데이터 조회 성능
- **원인**: 신고 건수 증가 시 목록 조회 느려짐
- **대응**: 인덱스 최적화 (teacher_id, status, created_at)
- **보완**: 페이지네이션 및 가상 스크롤 적용

### 리스크 4: 첨부 파일 업로드 실패
- **원인**: SPEC-FILE-001 미구현 또는 파일 크기 초과
- **대응**: 첨부 파일 선택 사항으로 설정, 10MB 제한 검증
- **보완**: 파일 업로드 실패 시 신고는 저장하고 재첨부 허용

---

## 의존성 및 선행 조건

### 필수 완료 SPEC
- **SPEC-AUTH-001**: JWT 인증 및 역할 확인 (Teacher 역할 검증)
- **DB 마이그레이션**: users 테이블 존재 (외래 키 제약)

### 권장 완료 SPEC
- **SPEC-FILE-001**: 증거 자료 첨부 기능 (선택 사항이지만 핵심 기능)
- **SPEC-NOTIFY-001**: 상태 변경 알림 (상태 전이 시 알림 발송)

### 기술 스택 확인
- **Next.js 14**: App Router 및 Server Actions
- **TypeScript**: 5.0+
- **SQLite**: better-sqlite3 패키지
- **Zod**: 입력 검증
- **React Hook Form**: 폼 상태 관리

---

## 완료 정의 (Definition of Done)

### 기능 완료 조건
- ✅ 교사가 신고를 작성하고 제출할 수 있다
- ✅ 신고번호가 자동 생성되고 중복되지 않는다
- ✅ 신고 목록과 상세 정보를 조회할 수 있다
- ✅ 관리자가 신고 상태를 변경할 수 있다
- ✅ 상태 변경 이력이 기록되고 조회된다

### 품질 게이트
- ✅ E2E 테스트 전체 통과 (Playwright)
- ✅ API 응답시간 목표 달성 (조회 2초, 작성 3초)
- ✅ 코드 리뷰 완료 (타입 안정성, 에러 처리)
- ✅ DB 마이그레이션 롤백 테스트 성공

### 문서화
- ✅ API 엔드포인트 문서 작성 (Swagger 또는 README)
- ✅ 상태 전이도 다이어그램 작성
- ✅ 신고번호 생성 로직 주석 추가

---

_이 계획은 `/alfred:2-build REPORT-001` 실행 시 참조됩니다._
