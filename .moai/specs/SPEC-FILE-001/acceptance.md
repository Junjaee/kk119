# SPEC-FILE-001 수락 기준

## Given-When-Then 테스트 시나리오

### AC-1: 파일 업로드 성공 (이미지)
**우선순위**: Critical
**역할**: Teacher

```gherkin
Given 교사가 JWT 토큰으로 인증된 상태
  And 2MB 크기의 이미지 파일 "증거사진.jpg" 선택
When POST /api/files/upload 요청
  And FormData에 파일 포함
Then HTTP 201 Created 응답 수신
  And 응답 본문에 다음 포함:
    {
      "id": "{UUID}",
      "filename": "증거사진.jpg",
      "size": 2097152,
      "uploadedAt": "2025-10-17T10:00:00Z"
    }
  And DB files 테이블에 레코드 저장됨
  And 파일시스템 /uploads/{UUID}.jpg에 파일 저장됨
  And 성공 메시지 "파일이 업로드되었습니다" 표시
```

**검증 쿼리**:
```sql
SELECT * FROM files WHERE original_filename = '증거사진.jpg';
-- 결과: 1행, file_size=2097152, uploader_id={현재 사용자 ID}

-- 파일시스템 확인
ls /uploads | grep {UUID}.jpg
-- 결과: {UUID}.jpg
```

---

### AC-2: 파일 크기 초과 (15MB)
**우선순위**: Critical
**역할**: Teacher

```gherkin
Given 교사가 로그인된 상태
  And 15MB 크기의 PDF 파일 "증거자료.pdf" 선택
When POST /api/files/upload 요청
Then HTTP 413 Payload Too Large 응답 수신
  And 응답 본문:
    {
      "error": "파일 크기는 10MB를 초과할 수 없습니다",
      "maxSize": 10485760,
      "receivedSize": 15728640
    }
  And DB에 레코드가 저장되지 않음
  And 파일시스템에 파일이 저장되지 않음
  And 에러 메시지 "파일 크기는 10MB를 초과할 수 없습니다" 표시
```

---

### AC-3: 허용되지 않는 파일 타입 (.exe)
**우선순위**: Critical
**역할**: Teacher

```gherkin
Given 교사가 로그인된 상태
  And .exe 실행 파일 "malware.exe" 선택
When POST /api/files/upload 요청
Then HTTP 400 Bad Request 응답 수신
  And 응답 본문:
    {
      "error": "허용되지 않는 파일 형식입니다",
      "allowedTypes": ["image/jpeg", "image/png", "image/gif", "application/pdf", "video/mp4", "video/x-msvideo"]
    }
  And DB에 레코드가 저장되지 않음
  And 파일시스템에 파일이 저장되지 않음
```

---

### AC-4: MIME 타입과 확장자 불일치
**우선순위**: High
**역할**: Teacher

```gherkin
Given 교사가 로그인된 상태
  And .exe 파일을 .jpg로 확장자 변경한 파일 선택
When POST /api/files/upload 요청
Then HTTP 400 Bad Request 응답 수신
  And 응답 본문:
    {
      "error": "MIME 타입과 확장자가 일치하지 않습니다",
      "mimeType": "application/x-msdownload",
      "extension": ".jpg"
    }
  And DB에 레코드가 저장되지 않음
```

---

### AC-5: 파일 다운로드 성공 (업로더 본인)
**우선순위**: Critical
**역할**: Teacher

```gherkin
Given 교사가 파일 ID "550e8400-e29b-41d4-a716-446655440000"을 업로드한 상태
When GET /api/files/550e8400-e29b-41d4-a716-446655440000/download 요청
Then HTTP 200 OK 응답 수신
  And Content-Disposition 헤더:
    "attachment; filename=\"증거사진.jpg\""
  And Content-Type 헤더: "image/jpeg"
  And 파일 바이너리 데이터 전송
  And 브라우저에서 파일 다운로드 시작
```

---

### AC-6: 관리자 파일 다운로드 (전체 파일)
**우선순위**: High
**역할**: Admin

```gherkin
Given 교사 A가 파일 ID "550e8400-..."을 업로드
  And 관리자(Admin)로 로그인된 상태
When GET /api/files/550e8400-.../download 요청
Then HTTP 200 OK 응답 수신
  And Content-Disposition 헤더에 원본 파일명 포함
  And 파일 바이너리 데이터 전송
```

---

### AC-7: 변호사 배정 파일 다운로드
**우선순위**: High
**역할**: Lawyer

```gherkin
Given 신고번호 "RPT-20251017-0001"에 파일 첨부
  And 해당 신고에 변호사 ID=3 배정
  And 변호사 ID=3으로 로그인된 상태
When GET /api/files/{file_id}/download 요청
Then HTTP 200 OK 응답 수신
  And 파일 다운로드 성공
```

---

### AC-8: 권한 없는 사용자 다운로드 차단
**우선순위**: Critical
**역할**: Teacher

```gherkin
Given 교사 A가 파일 ID "550e8400-..."을 업로드
  And 교사 B로 로그인된 상태
When GET /api/files/550e8400-.../download 요청
Then HTTP 403 Forbidden 응답 수신
  And 응답 본문:
    {
      "error": "파일 다운로드 권한이 없습니다"
    }
  And 파일이 전송되지 않음
```

---

### AC-9: 존재하지 않는 파일 다운로드
**우선순위**: High
**역할**: Teacher

```gherkin
Given 교사가 로그인된 상태
  And 존재하지 않는 파일 ID "invalid-uuid"
When GET /api/files/invalid-uuid/download 요청
Then HTTP 404 Not Found 응답 수신
  And 응답 본문:
    {
      "error": "파일을 찾을 수 없습니다"
    }
```

---

### AC-10: 파일 목록 조회 (본인 파일만)
**우선순위**: High
**역할**: Teacher

```gherkin
Given 교사 A가 3개의 파일을 업로드
  And 교사 B가 2개의 파일을 업로드
  And 교사 A로 로그인된 상태
When GET /api/files 요청
Then HTTP 200 OK 응답 수신
  And 응답 본문:
    {
      "files": [
        { "id": "...", "filename": "파일1.jpg", "size": 2048, "uploadedAt": "..." },
        { "id": "...", "filename": "파일2.pdf", "size": 5120, "uploadedAt": "..." },
        { "id": "...", "filename": "파일3.mp4", "size": 8192, "uploadedAt": "..." }
      ],
      "total": 3
    }
  And 교사 B의 파일은 포함되지 않음
```

---

### AC-11: 관리자 전체 파일 목록 조회
**우선순위**: Medium
**역할**: Admin

```gherkin
Given 전체 시스템에 10개의 파일이 업로드된 상태
  And 관리자(Admin)로 로그인된 상태
When GET /api/files 요청
Then HTTP 200 OK 응답 수신
  And 10개의 파일이 목록에 포함됨
  And 각 파일에 uploader 정보 포함
```

---

### AC-12: 파일 삭제 성공 (업로더 본인)
**우선순위**: High
**역할**: Teacher

```gherkin
Given 교사가 파일 ID "550e8400-..."을 업로드한 상태
  And 해당 파일이 완료되지 않은 신고에 첨부
When DELETE /api/files/550e8400-... 요청
Then HTTP 200 OK 응답 수신
  And 응답 본문:
    {
      "success": true,
      "message": "파일이 삭제되었습니다"
    }
  And DB에서 레코드 삭제됨 (또는 soft delete)
  And 파일시스템에서 파일 삭제됨
  And 성공 메시지 "파일이 삭제되었습니다" 표시
```

**검증 쿼리**:
```sql
SELECT * FROM files WHERE id = '550e8400-...';
-- 결과: 0행 (hard delete) 또는 deleted_at IS NOT NULL (soft delete)

-- 파일시스템 확인
ls /uploads | grep 550e8400-...
-- 결과: (empty)
```

---

### AC-13: 완료된 신고의 파일 삭제 차단
**우선순위**: Critical
**역할**: Teacher

```gherkin
Given 교사가 파일 ID "550e8400-..."을 업로드
  And 해당 파일이 완료된 신고(status='completed')에 첨부
When DELETE /api/files/550e8400-... 요청
Then HTTP 400 Bad Request 응답 수신
  And 응답 본문:
    {
      "error": "완료된 신고의 파일은 삭제할 수 없습니다"
    }
  And DB에서 레코드가 유지됨
  And 파일시스템에서 파일이 유지됨
```

---

### AC-14: 관리자 파일 삭제
**우선순위**: Medium
**역할**: Admin

```gherkin
Given 교사가 파일 ID "550e8400-..."을 업로드
  And 관리자(Admin)로 로그인된 상태
When DELETE /api/files/550e8400-... 요청
Then HTTP 200 OK 응답 수신
  And 파일이 삭제됨 (DB + 파일시스템)
```

---

### AC-15: 권한 없는 사용자 파일 삭제 차단
**우선순위**: Critical
**역할**: Teacher

```gherkin
Given 교사 A가 파일 ID "550e8400-..."을 업로드
  And 교사 B로 로그인된 상태
When DELETE /api/files/550e8400-... 요청
Then HTTP 403 Forbidden 응답 수신
  And 응답 본문:
    {
      "error": "파일 삭제 권한이 없습니다"
    }
  And 파일이 유지됨
```

---

### AC-16: 파일 업로드 진행률 표시
**우선순위**: Medium
**역할**: Teacher

```gherkin
Given 교사가 /reports/new 페이지에 접근
  And 10MB 파일 선택
When 파일 업로드 버튼 클릭
Then 진행률 바가 표시됨
  And 진행률이 0% → 100% 증가
  And 업로드 완료 시 "업로드 완료" 메시지 표시
```

---

### AC-17: 이미지 썸네일 자동 생성 (선택 기능)
**우선순위**: Low
**역할**: Teacher

```gherkin
Given 교사가 이미지 파일 "photo.jpg" 업로드
When 파일 업로드 성공
Then 원본 파일과 함께 썸네일 생성됨
  And 썸네일 경로: /uploads/thumbnails/{UUID}_thumb.jpg
  And 썸네일 크기: 200x200 픽셀
  And DB에 thumbnail_path 저장됨
```

---

### AC-18: 파일 타입별 아이콘 표시
**우선순위**: Low
**역할**: Teacher

```gherkin
Given 교사가 파일 목록 페이지에 접근
When 다양한 파일 타입이 업로드된 상태
Then 파일 타입별 아이콘이 표시됨
  | 파일 타입 | 아이콘 |
  |----------|--------|
  | .jpg     | 📷     |
  | .pdf     | 📄     |
  | .mp4     | 🎥     |
```

---

### AC-19: 성능 테스트 - 10MB 파일 업로드
**우선순위**: High
**역할**: Teacher

```gherkin
Given 교사가 로그인된 상태
  And 정확히 10MB 크기의 파일 선택
When POST /api/files/upload 요청
Then HTTP 201 Created 응답이 2초 이내 수신됨
  And 파일이 정상 저장됨
```

**성능 검증**:
```typescript
// Playwright 테스트
const start = Date.now();
await page.setInputFiles('input[type=file]', '10mb-file.pdf');
await page.click('button[type=submit]');
await page.waitForSelector('.success-message');
const elapsed = Date.now() - start;
expect(elapsed).toBeLessThan(2000);
```

---

### AC-20: 동시 업로드 처리 (10건)
**우선순위**: Medium
**역할**: Multiple Users

```gherkin
Given 10명의 사용자가 동시에 로그인
When 각 사용자가 동시에 5MB 파일 업로드
Then 모든 업로드가 성공함
  And DB에 10개의 레코드 저장됨
  And 파일시스템에 10개의 파일 저장됨
  And 파일명 충돌 없음 (UUID 사용)
```

---

## 품질 게이트 기준

### 기능 완성도
- ✅ AC-1 ~ AC-20 모든 시나리오 통과
- ✅ E2E 테스트 스크립트 작성 및 실행 성공
- ✅ 에러 시나리오 핸들링 검증

### 성능 기준
- ✅ 10MB 파일 업로드: 평균 응답시간 < 2초
- ✅ 파일 다운로드: 1초 이내 시작
- ✅ 동시 업로드 10건 처리 성공

### 보안 기준
- ✅ MIME 타입과 확장자 이중 검증
- ✅ 악성 파일 업로드 차단 (.exe 등)
- ✅ 권한 없는 다운로드/삭제 차단 (403)
- ✅ 파일 경로 직접 노출 방지 (UUID 사용)

### 코드 품질
- ✅ TypeScript 타입 에러 0개
- ✅ ESLint 경고 0개
- ✅ 단위 테스트 커버리지 > 80%

---

## 테스트 실행 방법

### E2E 테스트 (Playwright)
```bash
# 전체 테스트 실행
npx playwright test spec-file-001.spec.ts

# 특정 시나리오만 실행
npx playwright test -g "AC-1: 파일 업로드 성공"

# 헤드리스 모드 비활성화
npx playwright test --headed
```

### API 테스트 (Jest)
```bash
# API 엔드포인트 단위 테스트
npm test -- files.api.test.ts

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

### 파일 저장소 테스트
```bash
# 업로드 디렉토리 권한 확인
ls -ld /uploads
# 결과: drwxr-xr-x (755)

# 파일 저장 테스트
touch /uploads/test.txt && rm /uploads/test.txt
# 결과: (성공 시 아무 출력 없음)
```

---

## 완료 정의 (Definition of Done)

### 필수 체크리스트
- ✅ AC-1 ~ AC-20 모든 시나리오 Playwright 테스트 통과
- ✅ 성능 기준 (업로드 2초, 다운로드 1초) 달성 확인
- ✅ 보안 취약점 테스트 통과 (악성 파일 차단, 권한 검증)
- ✅ DB 스키마 마이그레이션 롤백 테스트 성공
- ✅ TypeScript 타입 에러 0개
- ✅ 코드 리뷰 승인 완료

### 문서화
- ✅ API 엔드포인트 문서 작성 (Swagger 또는 README)
- ✅ 파일 검증 로직 주석 추가
- ✅ 권한 확인 플로우차트 작성

### 배포 준비
- ✅ 프로덕션 환경 /uploads 디렉토리 생성 및 권한 설정
- ✅ .gitignore에 /uploads 추가
- ✅ 모니터링 대시보드에 파일 관련 메트릭 추가

---

_이 수락 기준은 `/alfred:2-build FILE-001` 실행 후 TDD 검증에 사용됩니다._
