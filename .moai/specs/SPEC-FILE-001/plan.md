# SPEC-FILE-001 구현 계획

## 개요
증거 자료 관리 시스템의 핵심 기능 구현 계획입니다. 파일 업로드, 다운로드, 검증, 암호화 저장 기능을 단계별로 구현합니다.

---

## 마일스톤 (우선순위 기반)

### 1차 목표: DB 스키마 및 파일 저장소 구축
- **DB 마이그레이션**: `files` 테이블 생성
- **인덱스 생성**: uploader_id, report_id, consult_id, stored_filename 인덱스
- **디렉토리 생성**: `/uploads` 디렉토리 생성 및 권한 설정 (755)
- **타입 정의**: `File`, `FileMetadata`, `UploadResult` TypeScript 타입
- **검증**: 파일 저장소 쓰기 권한 확인

### 2차 목표: 파일 업로드 API 구현
- **API 엔드포인트**: `POST /api/files/upload`
- **파일 검증 로직**:
  - 파일 크기 확인 (≤ 10MB)
  - MIME 타입 검증 (허용 목록 매칭)
  - 확장자 검증 (이중 검증)
- **UUID 파일명 생성**: `uuidv4()` 사용
- **파일 저장**: `/uploads/{UUID}.{ext}` 경로에 저장
- **메타데이터 저장**: DB `files` 테이블에 삽입
- **의존성**: multer 또는 formidable 패키지 사용

### 3차 목표: 파일 다운로드 API 구현
- **API 엔드포인트**: `GET /api/files/[id]/download`
- **권한 확인 로직**: `canDownloadFile(userId, fileId)`
  - 업로더 본인 확인
  - 관리자 역할 확인
  - 담당 변호사 확인 (신고/상담 연관)
- **파일 스트리밍**: `fs.createReadStream()` 사용
- **Content-Disposition 헤더**: 원본 파일명 설정
- **에러 처리**: 404 (파일 없음), 403 (권한 없음)

### 4차 목표: 파일 목록 조회 및 삭제 API
- **API 엔드포인트**: `GET /api/files` (목록), `DELETE /api/files/[id]` (삭제)
- **목록 조회**:
  - 필터링 (report_id, uploader_id, file_type)
  - 페이지네이션 (기본 20건)
  - 정렬 (uploaded_at DESC)
- **파일 삭제**:
  - 권한 확인 (업로더 본인, Admin)
  - 파일시스템에서 삭제 (`fs.unlinkSync()`)
  - DB에서 메타데이터 삭제 또는 soft delete
  - 완료된 신고의 파일은 삭제 불가 검증

### 5차 목표: UI 컴포넌트 구현
- **파일 업로드 컴포넌트**: `<FileUploader />`
  - Drag & Drop 지원
  - 진행률 표시 (Progress Bar)
  - 파일 타입 및 크기 제한 안내
  - 업로드 완료 시 썸네일 표시 (이미지만)
- **파일 목록 컴포넌트**: `<FileList />`
  - 파일 카드 리스트 (아이콘, 파일명, 크기, 업로드 시각)
  - 다운로드 버튼
  - 삭제 버튼 (권한 있는 경우만)
- **파일 미리보기**: `<FilePreview />`
  - 이미지 미리보기 (Lightbox)
  - PDF 미리보기 (iframe 또는 PDF.js)
  - 동영상 미리보기 (HTML5 video)

### 6차 목표: 보안 강화 및 선택 기능
- **MIME 타입 이중 검증**: 헤더 검증 + Magic Bytes 검증
- **바이러스 검사**: ClamAV 또는 VirusTotal API 연동 (선택)
- **썸네일 자동 생성**: Sharp 라이브러리 사용 (이미지만)
- **암호화 저장**: AES-256 암호화 (선택)
- **파일 크기 제한 확장**: 프리미엄 협회 20MB (선택)

### 7차 목표: 통합 테스트 및 검증
- **E2E 테스트**: Playwright로 업로드 → 다운로드 → 삭제 흐름 검증
- **성능 테스트**: 10MB 파일 업로드 2초 이내 확인
- **보안 테스트**: 악성 파일 업로드 차단, 권한 없는 다운로드 차단
- **동시성 테스트**: 10건 동시 업로드 처리 확인

---

## 기술적 접근 방법

### 아키텍처 패턴
- **레이어 분리**: API Route → Service → Storage → FileSystem/DB
- **Storage Service**: 파일 저장소 추상화 (LocalStorage, S3 등 확장 가능)
- **Validator Service**: 파일 검증 로직 분리
- **Repository 패턴**: `FileRepository` 클래스로 DB 액세스 캡슐화

### 코드 구조
```
lib/
  storage/
    file-manager.ts         # 파일 저장/삭제/읽기
    file-validator.ts       # 파일 검증 (크기, 타입, 확장자)
    file-encryptor.ts       # 파일 암호화 (선택)
    thumbnail-generator.ts  # 썸네일 생성 (선택)
  db/
    files.ts                # FileRepository (CRUD 메서드)
  services/
    file-service.ts         # 비즈니스 로직 (권한 확인, 메타데이터 처리)
  types/
    file.ts                 # TypeScript 타입 정의

app/
  api/
    files/
      upload/
        route.ts            # POST /api/files/upload
      [id]/
        download/
          route.ts          # GET /api/files/[id]/download
        route.ts            # DELETE /api/files/[id]
      route.ts              # GET /api/files
  components/
    files/
      FileUploader.tsx      # 파일 업로드 컴포넌트
      FileList.tsx          # 파일 목록 컴포넌트
      FilePreview.tsx       # 파일 미리보기 컴포넌트
```

### 파일 검증 로직
```typescript
const ALLOWED_MIME_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'application/pdf': ['.pdf'],
  'video/mp4': ['.mp4'],
  'video/x-msvideo': ['.avi'],
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function validateFile(file: File): { valid: boolean; error?: string } {
  // 크기 검증
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: '파일 크기는 10MB를 초과할 수 없습니다' };
  }

  // MIME 타입 검증
  const allowedExts = ALLOWED_MIME_TYPES[file.type];
  if (!allowedExts) {
    return { valid: false, error: '허용되지 않는 파일 형식입니다' };
  }

  // 확장자 검증
  const ext = path.extname(file.name).toLowerCase();
  if (!allowedExts.includes(ext)) {
    return { valid: false, error: 'MIME 타입과 확장자가 일치하지 않습니다' };
  }

  return { valid: true };
}
```

### 파일 업로드 로직
```typescript
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs/promises';
import path from 'path';

async function uploadFile(file: File, uploaderId: number): Promise<UploadResult> {
  // 검증
  const validation = validateFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }

  // UUID 파일명 생성
  const ext = path.extname(file.name);
  const storedFilename = `${uuidv4()}${ext}`;
  const filePath = path.join('/uploads', storedFilename);

  // 파일 저장
  await fs.writeFile(filePath, await file.arrayBuffer());

  // DB 메타데이터 저장
  const fileRecord = await db.files.create({
    id: uuidv4(),
    original_filename: file.name,
    stored_filename: storedFilename,
    file_path: filePath,
    file_size: file.size,
    mime_type: file.type,
    file_extension: ext,
    uploader_id: uploaderId,
  });

  return {
    id: fileRecord.id,
    filename: file.name,
    size: file.size,
    uploadedAt: fileRecord.uploaded_at,
  };
}
```

### 권한 확인 로직
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
    if (file.report_id) {
      const report = await db.reports.findById(file.report_id);
      if (report?.lawyer_id === userId) return true;
    }
    if (file.consult_id) {
      const consult = await db.consults.findById(file.consult_id);
      if (consult?.lawyer_id === userId) return true;
    }
  }

  return false;
}
```

---

## 리스크 및 대응 방안

### 리스크 1: 파일명 충돌
- **원인**: UUID 충돌 (확률 극히 낮음)
- **대응**: UNIQUE 제약조건 + 충돌 시 재생성
- **보완**: 저장 전 파일 존재 여부 확인

### 리스크 2: 악성 파일 업로드
- **원인**: MIME 타입 위조, 확장자 변경
- **대응**: Magic Bytes 검증 (파일 헤더 바이트 확인)
- **보완**: 바이러스 검사 API 연동 (ClamAV, VirusTotal)

### 리스크 3: 디스크 용량 부족
- **원인**: 대용량 파일 대량 업로드
- **대응**: 디스크 용량 모니터링 (80% 이상 시 알림)
- **보완**: 파일 보관 정책 (90일 경과 파일 자동 삭제)

### 리스크 4: 동시 업로드 성능 저하
- **원인**: 10건 이상 동시 업로드 시 서버 부하
- **대응**: 업로드 큐 시스템 (Bull Queue)
- **보완**: CDN 업로드 (S3 Pre-signed URL)

### 리스크 5: 파일 다운로드 대역폭 초과
- **원인**: 대용량 파일 동시 다운로드
- **대응**: CDN 사용 (CloudFront, Cloudflare)
- **보완**: 다운로드 속도 제한 (throttling)

---

## 의존성 및 선행 조건

### 필수 완료 SPEC
- **SPEC-AUTH-001**: JWT 인증 및 역할 확인 (업로드/다운로드 권한)

### 권장 완료 SPEC
- **SPEC-REPORT-001**: 신고 테이블 존재 (외래 키 제약)
- **SPEC-CONSULT-001**: 상담 테이블 존재 (외래 키 제약)

### 기술 스택 확인
- **Next.js 14**: App Router 및 API Routes
- **TypeScript**: 5.0+
- **SQLite**: better-sqlite3 패키지
- **파일 업로드**: multer 또는 formidable
- **UUID 생성**: uuid 패키지
- **이미지 처리**: sharp (썸네일 생성용, 선택)

### 환경 설정
- `/uploads` 디렉토리 생성 및 권한 설정 (755)
- `.gitignore`에 `/uploads` 추가 (업로드 파일 제외)
- 프로덕션 환경: S3 버킷 생성 (선택)

---

## 완료 정의 (Definition of Done)

### 기능 완료 조건
- ✅ 사용자가 허용된 파일을 업로드할 수 있다
- ✅ 파일 크기 및 타입 검증이 정상 작동한다
- ✅ 업로드된 파일이 UUID 파일명으로 저장된다
- ✅ 권한이 있는 사용자만 파일을 다운로드할 수 있다
- ✅ 파일을 삭제하면 파일시스템과 DB에서 모두 제거된다

### 품질 게이트
- ✅ E2E 테스트 전체 통과 (Playwright)
- ✅ 성능 기준 달성 (10MB 업로드 2초, 다운로드 1초)
- ✅ 보안 테스트 통과 (악성 파일 차단, 권한 검증)
- ✅ 코드 리뷰 완료 (타입 안정성, 에러 처리)

### 문서화
- ✅ API 엔드포인트 문서 작성 (Swagger 또는 README)
- ✅ 파일 검증 로직 주석 추가
- ✅ 권한 확인 로직 다이어그램 작성

---

_이 계획은 `/alfred:2-build FILE-001` 실행 시 참조됩니다._
