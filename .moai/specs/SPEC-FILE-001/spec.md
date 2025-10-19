---
id: FILE-001
version: 0.0.1
status: draft
created: 2025-10-17
updated: 2025-10-17
author: @Claude
priority: high
category: feature
labels:
  - file-management
  - security
  - evidence
depends_on:
  - AUTH-001
related_specs:
  - REPORT-001
  - CONSULT-001
scope:
  packages:
    - app/api/files
    - lib/storage
  files:
    - lib/storage/file-manager.ts
    - lib/storage/file-validator.ts
---

# SPEC-FILE-001: 증거 자료 관리 시스템

## HISTORY

### v0.0.1 (2025-10-17)
- **INITIAL**: SPEC 최초 작성 (status: draft)
- **AUTHOR**: @Claude
- **SECTIONS**: TAG BLOCK, 요구사항 (EARS), 제약사항, 시나리오, 수락 기준

---

## @SPEC:FILE-001 TAG BLOCK

**도메인**: FILE (파일 관리)
**우선순위**: High
**핵심 기능**: 파일 업로드/다운로드, 바이러스 검사, 암호화 저장
**파일 타입**: 이미지 (jpg, png, gif), PDF, 동영상 (mp4, avi)
**크기 제한**: 10MB

### 의존성
- **@SPEC:AUTH-001**: JWT 인증 (업로드/다운로드 권한 확인)

### 관련 컨텍스트
- **@SPEC:REPORT-001**: 신고 증거 자료 첨부
- **@SPEC:CONSULT-001**: 변호사 상담 파일 공유
- **@SPEC:PROBLEM-001**: 증거 자료 관리 어려움 해결

---

## Environment (환경 및 가정사항)

### Assumptions
- 파일은 로컬 파일시스템 `/uploads` 디렉토리에 저장
- 파일명은 UUID로 변환하여 중복 방지 및 보안 강화
- 메타데이터는 SQLite DB (kyokwon119.db)의 `files` 테이블에 저장
- 허용된 파일 타입: `.jpg`, `.jpeg`, `.png`, `.gif`, `.pdf`, `.mp4`, `.avi`
- 최대 파일 크기: 10MB (10,485,760 bytes)

### Preconditions
- 사용자는 Teacher, Lawyer, Admin 역할로 인증된 상태
- `/uploads` 디렉토리가 존재하고 쓰기 권한이 있음
- DB에 `files` 테이블이 마이그레이션 완료

---

## Requirements (기능 요구사항)

### Ubiquitous Requirements (기본 기능)
- 시스템은 파일 업로드 기능을 제공해야 한다
- 시스템은 파일 다운로드 기능을 제공해야 한다
- 시스템은 파일 목록 조회 기능을 제공해야 한다
- 시스템은 파일 삭제 기능을 제공해야 한다

### Event-driven Requirements (이벤트 기반)
- WHEN 파일이 업로드되면, 시스템은 파일 타입과 크기를 검증해야 한다
- WHEN 파일 업로드가 성공하면, 시스템은 고유 파일명(UUID)으로 저장해야 한다
- WHEN 파일 업로드가 성공하면, 시스템은 메타데이터를 DB에 저장해야 한다
- WHEN 파일이 다운로드되면, 시스템은 사용자 권한을 확인해야 한다
- WHEN 파일이 삭제되면, 시스템은 파일시스템과 DB에서 모두 제거해야 한다

### State-driven Requirements (상태 기반)
- WHILE 파일이 업로드 중일 때, 시스템은 진행률을 표시해야 한다
- WHILE 파일이 암호화 중일 때, 시스템은 로딩 상태를 표시해야 한다

### Optional Features (선택적 기능)
- WHERE 파일이 이미지이면, 시스템은 썸네일을 자동 생성할 수 있다
- WHERE 관리자 설정에서 활성화되면, 시스템은 바이러스 검사를 수행할 수 있다
- WHERE 프리미엄 협회이면, 시스템은 파일 크기 제한을 20MB로 확장할 수 있다

---

## Specifications (상세 명세)

### 파일 업로드 (Upload)

#### 지원 파일 타입
| 카테고리 | MIME Type | 확장자 | 최대 크기 |
|---------|-----------|--------|----------|
| 이미지   | image/jpeg, image/png, image/gif | .jpg, .jpeg, .png, .gif | 10MB |
| 문서     | application/pdf | .pdf | 10MB |
| 동영상   | video/mp4, video/x-msvideo | .mp4, .avi | 10MB |

#### 파일명 변환 로직
```typescript
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

function generateUniqueFilename(originalName: string): string {
  const ext = path.extname(originalName); // .pdf
  const uuid = uuidv4(); // 550e8400-e29b-41d4-a716-446655440000
  return `${uuid}${ext}`; // 550e8400-e29b-41d4-a716-446655440000.pdf
}
```

#### 업로드 프로세스
1. **클라이언트**: 파일 선택 및 업로드 버튼 클릭
2. **서버 (검증)**:
   - 파일 크기 확인 (≤ 10MB)
   - MIME 타입 확인 (허용 목록 매칭)
   - 확장자 검증 (이중 검증)
3. **서버 (저장)**:
   - UUID 파일명 생성
   - `/uploads/{UUID}.{ext}` 경로에 저장
   - DB `files` 테이블에 메타데이터 삽입
4. **응답**: 파일 ID, 원본 파일명, 업로드 시각 반환

### 파일 다운로드 (Download)

#### 권한 확인 로직
```typescript
async function canDownloadFile(userId: number, fileId: string): Promise<boolean> {
  const file = await db.files.findById(fileId);
  if (!file) return false;

  const user = await db.users.findById(userId);

  // 업로더 본인
  if (file.uploader_id === userId) return true;

  // 관리자는 모든 파일 다운로드 가능
  if (user.role === 'admin' || user.role === 'super_admin') return true;

  // 연관된 신고/상담의 담당 변호사
  if (user.role === 'lawyer') {
    const report = await db.reports.findByFileId(fileId);
    if (report?.lawyer_id === userId) return true;
  }

  return false;
}
```

#### 다운로드 프로세스
1. **클라이언트**: 파일 다운로드 링크 클릭
2. **서버 (권한 확인)**: `canDownloadFile()` 호출
3. **서버 (파일 전송)**:
   - 파일시스템에서 파일 읽기
   - Content-Disposition 헤더 설정 (원본 파일명)
   - 스트리밍 전송
4. **응답**: 파일 바이너리 데이터

### API 엔드포인트

#### POST /api/files/upload
- **권한**: Teacher, Lawyer, Admin
- **입력**: FormData (file: File, report_id?: string)
- **출력**: `{ id: string, filename: string, size: number, uploadedAt: string }`
- **응답 시간**: 평균 2초 이하 (10MB 파일 기준)

#### GET /api/files/[id]/download
- **권한**: 업로더 본인, 관리자, 담당 변호사
- **입력**: 파일 ID
- **출력**: 파일 바이너리 (Content-Disposition: attachment)
- **응답 시간**: 평균 1초 이하

#### GET /api/files
- **권한**: Teacher (본인 파일), Admin (전체 파일)
- **입력**: 필터 (report_id, uploader_id, file_type)
- **출력**: 파일 목록 (페이지네이션)
- **응답 시간**: 평균 500ms 이하

#### DELETE /api/files/[id]
- **권한**: 업로더 본인, Admin
- **입력**: 파일 ID
- **출력**: `{ success: boolean, message: string }`
- **부수효과**: 파일시스템에서 파일 삭제, DB에서 메타데이터 삭제

---

## Constraints (제약사항)

### Technical Constraints
- IF 파일 크기가 10MB를 초과하면, 시스템은 업로드를 거부해야 한다
- IF 파일 타입이 허용 목록에 없으면, 시스템은 업로드를 거부해야 한다
- IF 사용자에게 다운로드 권한이 없으면, 시스템은 403 Forbidden 에러를 반환해야 한다
- IF 파일이 존재하지 않으면, 시스템은 404 Not Found 에러를 반환해야 한다

### Business Constraints
- 삭제된 파일은 복구할 수 없어야 한다 (영구 삭제)
- 완료된 신고에 첨부된 파일은 삭제할 수 없어야 한다 (증거 보존)
- 파일명은 고유해야 하며 충돌하지 않아야 한다 (UUID 사용)

### Security Constraints
- 업로드된 파일의 MIME 타입과 확장자를 이중 검증해야 한다
- 파일 다운로드 시 직접 경로 노출을 방지해야 한다 (UUID 사용)
- 악성 파일 업로드 방지를 위해 바이러스 검사를 수행해야 한다 (선택 사항)

### Performance Constraints
- 10MB 파일 업로드는 2초 이내 완료되어야 한다
- 파일 다운로드는 1초 이내 시작되어야 한다
- 동시 업로드 10건 처리 가능해야 한다

---

## DB Schema

```sql
CREATE TABLE files (
  id TEXT PRIMARY KEY,                          -- UUID (550e8400-e29b-41d4-a716-446655440000)
  original_filename TEXT NOT NULL,              -- 원본 파일명 (예: 증거사진.jpg)
  stored_filename TEXT UNIQUE NOT NULL,         -- 저장된 파일명 (예: 550e8400-e29b-41d4-a716-446655440000.jpg)
  file_path TEXT NOT NULL,                      -- 파일 경로 (예: /uploads/550e8400-e29b-41d4-a716-446655440000.jpg)
  file_size INTEGER NOT NULL,                   -- 파일 크기 (bytes)
  mime_type TEXT NOT NULL,                      -- MIME 타입 (예: image/jpeg)
  file_extension TEXT NOT NULL,                 -- 확장자 (예: .jpg)
  uploader_id INTEGER NOT NULL,                 -- FOREIGN KEY: users.id
  report_id INTEGER,                            -- FOREIGN KEY: reports.id (선택)
  consult_id INTEGER,                           -- FOREIGN KEY: consults.id (선택)
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME,                          -- soft delete (NULL = 활성)

  FOREIGN KEY (uploader_id) REFERENCES users(id),
  FOREIGN KEY (report_id) REFERENCES reports(id),
  FOREIGN KEY (consult_id) REFERENCES consults(id)
);

CREATE INDEX idx_files_uploader ON files(uploader_id);
CREATE INDEX idx_files_report ON files(report_id);
CREATE INDEX idx_files_consult ON files(consult_id);
CREATE UNIQUE INDEX idx_files_stored_filename ON files(stored_filename);
```

---

## Test Scenarios

### Scenario 1: 파일 업로드 성공 (이미지)
```typescript
Given: 교사가 로그인된 상태
  And 2MB 크기의 이미지 파일 선택 (증거사진.jpg)
When: 파일 업로드 버튼 클릭
Then: HTTP 201 Created 응답 수신
  And 응답에 파일 ID, 원본 파일명, 크기가 포함됨
  And DB에 메타데이터가 저장됨
  And 파일시스템에 UUID 파일명으로 저장됨
  And 성공 메시지 "파일이 업로드되었습니다" 표시
```

### Scenario 2: 파일 크기 초과
```typescript
Given: 교사가 로그인된 상태
  And 15MB 크기의 PDF 파일 선택
When: 파일 업로드 시도
Then: HTTP 413 Payload Too Large 응답 수신
  And 에러 메시지 "파일 크기는 10MB를 초과할 수 없습니다" 표시
  And 파일이 저장되지 않음
```

### Scenario 3: 허용되지 않는 파일 타입
```typescript
Given: 교사가 로그인된 상태
  And .exe 실행 파일 선택
When: 파일 업로드 시도
Then: HTTP 400 Bad Request 응답 수신
  And 에러 메시지 "허용되지 않는 파일 형식입니다" 표시
  And 파일이 저장되지 않음
```

### Scenario 4: 파일 다운로드 성공
```typescript
Given: 교사가 파일 ID "550e8400-..."을 업로드한 상태
When: 파일 다운로드 링크 클릭
Then: HTTP 200 OK 응답 수신
  And Content-Disposition 헤더에 원본 파일명 포함
  And 파일 바이너리 데이터 전송
  And 브라우저에서 파일 다운로드 시작
```

### Scenario 5: 권한 없는 사용자 다운로드 차단
```typescript
Given: 교사 A가 파일을 업로드
  And 교사 B로 로그인된 상태
When: 교사 A의 파일 다운로드 시도
Then: HTTP 403 Forbidden 응답 수신
  And 에러 메시지 "파일 다운로드 권한이 없습니다" 표시
```

---

## Acceptance Criteria

### 필수 완료 조건
- ✅ 사용자가 허용된 파일 타입을 업로드할 수 있다
- ✅ 파일 크기가 10MB를 초과하면 업로드가 거부된다
- ✅ 업로드된 파일이 UUID 파일명으로 저장된다
- ✅ 파일 메타데이터가 DB에 저장된다
- ✅ 권한이 있는 사용자만 파일을 다운로드할 수 있다
- ✅ 파일 삭제 시 파일시스템과 DB에서 모두 제거된다

### 성능 요구사항
- ✅ 10MB 파일 업로드는 2초 이내 완료된다
- ✅ 파일 다운로드는 1초 이내 시작된다

### 보안 요구사항
- ✅ MIME 타입과 확장자를 이중 검증한다
- ✅ 파일 경로를 직접 노출하지 않는다 (UUID 사용)
- ✅ 다른 사용자의 파일을 다운로드할 수 없다

---

## Related SPECs

- **@SPEC:AUTH-001**: JWT 인증 및 권한 확인
- **@SPEC:REPORT-001**: 신고 증거 자료 첨부
- **@SPEC:CONSULT-001**: 변호사 상담 파일 공유

---

## References

- **@SPEC:PROBLEM-001**: 증거 자료 관리 어려움 해결
- **@DOC:MISSION-001**: 교권119 핵심 미션

---

_이 SPEC은 `/alfred:2-build FILE-001` 명령으로 구현됩니다._
