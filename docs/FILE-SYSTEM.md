# 증거 자료 관리 시스템 (FILE-SYSTEM)

> **@DOC:FILE-001** | SPEC: SPEC-FILE-001 | 파일 업로드, 다운로드, 버전 관리 시스템

## 목차

1. [개요](#개요)
2. [시스템 아키텍처](#시스템-아키텍처)
3. [API 문서](#api-문서)
4. [사용 예제](#사용-예제)
5. [보안 고려사항](#보안-고려사항)
6. [성능 최적화](#성능-최적화)
7. [문제 해결](#문제-해결)

---

## 개요

### 목적

교권119 시스템에서 증거 자료(이미지, PDF, 동영상)의 안전한 업로드, 저장, 다운로드, 버전 관리를 제공합니다.

### 주요 기능

- **파일 업로드**: 최대 10MB, 7가지 파일 타입 지원
- **보안 검증**: MIME 타입, 확장자 이중 검증 및 악성 파일 탐지
- **역할 기반 접근 제어**: 업로더, 관리자, 배정된 변호사만 접근 가능
- **파일 버전 관리**: 동일 파일의 여러 버전 관리
- **증거 보존**: 완료된 신고의 파일 삭제 방지

### 지원 파일 타입

| 카테고리 | MIME Type | 확장자 | 최대 크기 |
|---------|-----------|--------|----------|
| 이미지 | image/jpeg, image/png, image/gif | .jpg, .jpeg, .png, .gif | 10MB |
| 문서 | application/pdf | .pdf | 10MB |
| 동영상 | video/mp4, video/x-msvideo | .mp4, .avi | 10MB |

---

## 시스템 아키텍처

### 전체 구조

```
┌─────────────┐
│   Client    │ (Teacher, Lawyer, Admin)
└─────┬───────┘
      │ HTTP Request (FormData)
      ▼
┌─────────────────────────────────────────────┐
│           API Layer (Next.js)               │
│  /api/files/upload                          │
│  /api/files/[id]                            │
│  /api/files/[id]/download                   │
│  /api/files/[id]/versions                   │
│  /api/files/report/[reportId]               │
└─────┬───────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────┐
│          Service Layer                      │
│  ┌─────────────┐  ┌─────────────┐          │
│  │FileValidator│  │FileService  │          │
│  │(validation) │  │(access ctrl)│          │
│  └─────────────┘  └─────────────┘          │
│  ┌─────────────┐                            │
│  │FileStorage  │ (UUID, versioning)        │
│  └─────────────┘                            │
└─────┬───────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────┐
│         Storage Layer                       │
│  ┌──────────────┐  ┌──────────────┐        │
│  │  Filesystem  │  │   Database   │        │
│  │  (uploads/)  │  │  (files tbl) │        │
│  └──────────────┘  └──────────────┘        │
└─────────────────────────────────────────────┘
```

### 디렉토리 구조

```
data/uploads/
  └── YYYY/          # 년도별
      └── MM/        # 월별
          └── DD/    # 일별
              ├── {UUID}.pdf        # 첫 번째 버전
              ├── {UUID}-v2.pdf     # 두 번째 버전
              └── {UUID}-v3.pdf     # 세 번째 버전
```

### 핵심 컴포넌트

#### 1. FileValidator
**위치**: `lib/services/file-validator.ts`
**책임**: 파일 유효성 검증 및 보안 검사

- 파일 크기 검증 (≤ 10MB)
- MIME 타입 검증
- 파일 확장자 검증
- 이중 확장자 탐지 (예: `.pdf.exe`)
- Null byte 주입 탐지
- 경로 탐색 공격 방지
- 특수 문자 필터링

#### 2. FileStorage
**위치**: `lib/services/file-storage.ts`
**책임**: 물리적 파일 저장 및 관리

- UUID 기반 고유 파일명 생성
- 날짜별 디렉토리 구조 (YYYY/MM/DD)
- 파일 읽기/쓰기/삭제
- 버전 관리 (v1, v2, v3...)
- 경로 보안 검증

#### 3. FileService
**위치**: `lib/services/file-service.ts`
**책임**: 비즈니스 로직 및 접근 제어

- 역할 기반 접근 제어 (RBAC)
- 다운로드 권한 확인
- 삭제 권한 확인
- 증거 보존 규칙 적용

---

## API 문서

### 1. 파일 업로드

```
POST /api/files/upload
```

**권한**: Teacher, Lawyer, Admin, SuperAdmin

**요청 (multipart/form-data)**:
```typescript
{
  file: File,              // 업로드할 파일
  report_id?: string,      // 연결할 신고 ID (선택)
  consult_id?: string      // 연결할 상담 ID (선택)
}
```

**응답 (201 Created)**:
```json
{
  "success": true,
  "message": "파일이 업로드되었습니다",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "originalFilename": "증거사진.jpg",
    "storedFilename": "550e8400-e29b-41d4-a716-446655440000.jpg",
    "filePath": "/uploads/2025/10/19/550e8400-e29b-41d4-a716-446655440000.jpg",
    "fileSize": 2048576,
    "mimeType": "image/jpeg",
    "fileExtension": ".jpg",
    "uploadedAt": "2025-10-19T12:34:56.789Z"
  }
}
```

**에러 응답**:
- `400 Bad Request`: 파일이 제공되지 않음
- `413 Payload Too Large`: 파일 크기 초과 (>10MB)
- `422 Unprocessable Entity`: 파일 검증 실패

### 2. 파일 메타데이터 조회

```
GET /api/files/{id}
```

**권한**: Owner, Admin, SuperAdmin, Assigned Lawyer

**응답 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "original_filename": "증거사진.jpg",
    "stored_filename": "550e8400-e29b-41d4-a716-446655440000.jpg",
    "file_path": "/uploads/2025/10/19/550e8400-e29b-41d4-a716-446655440000.jpg",
    "file_size": 2048576,
    "mime_type": "image/jpeg",
    "file_extension": ".jpg",
    "uploader_id": 123,
    "report_id": 456,
    "consult_id": null,
    "uploaded_at": "2025-10-19T12:34:56.789Z",
    "deleted_at": null
  }
}
```

### 3. 파일 다운로드

```
GET /api/files/{id}/download?inline=false
```

**권한**: Owner, Admin, SuperAdmin, Assigned Lawyer

**쿼리 파라미터**:
- `inline` (optional): `true`이면 브라우저에서 표시, `false`이면 다운로드 (기본값: false)

**응답 (200 OK)**:
- Headers:
  - `Content-Type`: 파일의 MIME 타입
  - `Content-Disposition`: `attachment; filename="원본파일명.jpg"`
  - `Content-Length`: 파일 크기
  - `Cache-Control`: `private, max-age=3600`
- Body: 파일 바이너리 데이터

### 4. 파일 삭제

```
DELETE /api/files/{id}
```

**권한**: Owner, Admin, SuperAdmin (단, 완료된 신고의 파일은 삭제 불가)

**응답 (200 OK)**:
```json
{
  "success": true,
  "message": "파일이 삭제되었습니다",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "deletedAt": "2025-10-19T14:30:00.000Z"
  }
}
```

**에러 응답**:
- `403 Forbidden`: 완료된 신고의 파일은 삭제할 수 없습니다
- `404 Not Found`: 파일이 존재하지 않습니다

### 5. 파일 버전 목록

```
GET /api/files/{id}/versions
```

**권한**: Owner, Admin, SuperAdmin, Assigned Lawyer

**응답 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "fileId": "550e8400-e29b-41d4-a716-446655440000",
    "originalFilename": "증거사진.jpg",
    "versions": [
      {
        "version": 1,
        "storedFilename": "550e8400-e29b-41d4-a716-446655440000.jpg",
        "filePath": "/uploads/2025/10/19/550e8400-e29b-41d4-a716-446655440000.jpg",
        "createdAt": "2025-10-19T12:34:56.789Z"
      },
      {
        "version": 2,
        "storedFilename": "550e8400-e29b-41d4-a716-446655440000-v2.jpg",
        "filePath": "/uploads/2025/10/19/550e8400-e29b-41d4-a716-446655440000-v2.jpg",
        "createdAt": "2025-10-19T14:20:10.123Z"
      }
    ],
    "totalVersions": 2
  }
}
```

### 6. 새 버전 업로드

```
POST /api/files/{id}/versions
```

**권한**: Owner, Admin, SuperAdmin

**요청 (multipart/form-data)**:
```typescript
{
  file: File  // 새 버전 파일 (기존 파일과 동일한 타입이어야 함)
}
```

**응답 (201 Created)**:
```json
{
  "success": true,
  "message": "새 버전이 업로드되었습니다.",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "version": 2,
    "storedFilename": "550e8400-e29b-41d4-a716-446655440000-v2.jpg",
    "filePath": "/uploads/2025/10/19/550e8400-e29b-41d4-a716-446655440000-v2.jpg",
    "fileSize": 2150000
  }
}
```

### 7. 신고별 파일 목록

```
GET /api/files/report/{reportId}
```

**권한**: Report Owner, Admin, SuperAdmin, Assigned Lawyer

**응답 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "reportId": 456,
    "files": [
      {
        "id": "file-uuid-1",
        "originalFilename": "증거1.jpg",
        "storedFilename": "uuid1.jpg",
        "fileSize": 2048576,
        "mimeType": "image/jpeg",
        "fileExtension": ".jpg",
        "uploadedBy": 123,
        "uploadedAt": "2025-10-19T12:34:56.789Z"
      }
    ],
    "totalFiles": 1,
    "totalSize": 2048576
  }
}
```

---

## 사용 예제

### 1. 파일 업로드 (프론트엔드)

```typescript
async function uploadFile(file: File, reportId?: number) {
  const formData = new FormData();
  formData.append('file', file);
  if (reportId) {
    formData.append('report_id', reportId.toString());
  }

  const response = await fetch('/api/files/upload', {
    method: 'POST',
    body: formData,
    credentials: 'include', // JWT 쿠키 포함
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  return await response.json();
}

// 사용 예제
const fileInput = document.querySelector('input[type="file"]');
const file = fileInput.files[0];

try {
  const result = await uploadFile(file, 123);
  console.log('파일 업로드 성공:', result.data);
} catch (error) {
  console.error('업로드 실패:', error.message);
}
```

### 2. 파일 다운로드

```typescript
async function downloadFile(fileId: string, inline: boolean = false) {
  const url = `/api/files/${fileId}/download?inline=${inline}`;

  const response = await fetch(url, {
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error);
  }

  // 파일 다운로드
  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = downloadUrl;

  // Content-Disposition에서 파일명 추출
  const contentDisposition = response.headers.get('Content-Disposition');
  const filename = contentDisposition?.split('filename=')[1]?.replace(/"/g, '') || 'download';

  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(downloadUrl);
}
```

### 3. 신고별 파일 목록 조회

```typescript
async function getReportFiles(reportId: number) {
  const response = await fetch(`/api/files/report/${reportId}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('파일 목록 조회 실패');
  }

  return await response.json();
}

// 사용 예제
const files = await getReportFiles(123);
console.log(`총 ${files.data.totalFiles}개 파일, ${formatBytes(files.data.totalSize)}`);
```

---

## 보안 고려사항

### 1. 파일 검증

**이중 검증 전략**:
- MIME 타입 검증 (HTTP 헤더)
- 파일 확장자 검증 (파일명)
- MIME 타입과 확장자 일치성 확인

**악성 파일 탐지**:
- 이중 확장자 (`.pdf.exe`) 차단
- Null byte 주입 (`file.pdf\0.exe`) 차단
- 경로 탐색 (`../../etc/passwd`) 차단
- 절대 경로 차단 (`/etc/passwd`)
- 특수 문자 필터링 (`<>:"|?*`)

### 2. 접근 제어

**역할별 권한**:

| 작업 | Teacher (Owner) | Teacher (Non-owner) | Lawyer (Assigned) | Lawyer (Non-assigned) | Admin | SuperAdmin |
|------|-----------------|---------------------|-------------------|-----------------------|-------|------------|
| 업로드 | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| 조회 | ✅ | ❌ | ✅ | ❌ | ✅ | ✅ |
| 다운로드 | ✅ | ❌ | ✅ | ❌ | ✅ | ✅ |
| 삭제 | ✅* | ❌ | ❌ | ❌ | ✅* | ✅* |
| 버전 업로드 | ✅ | ❌ | ❌ | ❌ | ✅ | ✅ |

*완료된 신고의 파일은 삭제 불가 (증거 보존)

### 3. 증거 보존 규칙

**삭제 제한**:
- `report.status === 'completed'`인 신고의 파일은 영구 삭제 불가
- Owner와 Admin도 삭제 불가
- Soft delete 대신 hard delete 방지

**감사 로그**:
- 파일 업로드/다운로드/삭제 이벤트 기록 권장
- 누가, 언제, 어떤 파일을 작업했는지 추적

---

## 성능 최적화

### 1. 성능 목표 (SPEC-FILE-001)

- **파일 업로드**: 10MB 파일 업로드 2초 이내
- **파일 다운로드**: 1초 이내 다운로드 시작
- **동시 업로드**: 10건 동시 처리 가능

### 2. 최적화 전략

**캐싱**:
```typescript
// 파일 다운로드 시 1시간 캐싱
headers.set('Cache-Control', 'private, max-age=3600');
```

**스트리밍**:
```typescript
// 대용량 파일도 메모리 효율적으로 전송
return new NextResponse(buffer, { headers });
```

**날짜별 디렉토리**:
- 파일 검색 성능 향상
- 백업/아카이빙 용이

**데이터베이스 인덱스**:
```sql
CREATE INDEX idx_files_uploader ON files(uploader_id);
CREATE INDEX idx_files_report ON files(report_id);
CREATE INDEX idx_files_consult ON files(consult_id);
CREATE UNIQUE INDEX idx_files_stored_filename ON files(stored_filename);
```

---

## 문제 해결

### 자주 발생하는 오류

#### 1. "파일 크기는 10MB를 초과할 수 없습니다"
**원인**: 파일 크기 > 10,485,760 bytes
**해결**: 파일 압축 또는 크기 축소

#### 2. "허용되지 않는 파일 형식입니다"
**원인**: 지원하지 않는 파일 타입
**해결**: jpg, png, gif, pdf, mp4, avi 중 하나로 변환

#### 3. "파일 다운로드 권한이 없습니다"
**원인**: 접근 권한 없음
**해결**: 파일 소유자, 관리자, 또는 배정된 변호사만 다운로드 가능

#### 4. "완료된 신고에 첨부된 파일은 삭제할 수 없습니다"
**원인**: 증거 보존 규칙
**해결**: 완료된 신고의 파일은 시스템 정책상 삭제 불가

### 디버깅 팁

**로그 확인**:
```typescript
console.error('File upload error:', error);
console.error('Download file error:', error);
```

**데이터베이스 조회**:
```sql
-- 파일 메타데이터 확인
SELECT * FROM files WHERE id = 'file-uuid';

-- 신고별 파일 확인
SELECT * FROM files WHERE report_id = 123;

-- 삭제된 파일 확인
SELECT * FROM files WHERE deleted_at IS NOT NULL;
```

**파일 시스템 확인**:
```bash
# 오늘 업로드된 파일 확인
ls data/uploads/2025/10/19/

# 특정 파일 존재 확인
ls data/uploads/2025/10/19/550e8400-e29b-41d4-a716-446655440000.jpg
```

---

## 참고 자료

- **SPEC 문서**: `.moai/specs/SPEC-FILE-001/spec.md`
- **API 라우트**: `app/api/files/`
- **서비스 로직**: `lib/services/file-*.ts`
- **테스트 코드**: `tests/files/`
- **타입 정의**: `lib/types/file.ts`
- **상수 정의**: `lib/constants/file-constants.ts`

---

**작성일**: 2025-10-19
**작성자**: @agent-code-builder
**버전**: 1.0.0
**SPEC**: SPEC-FILE-001
