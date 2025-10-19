// @CODE:FILE-001 | Chain: SPEC-FILE-001 -> CODE-FILE-001
// File system constants (as per SPEC-FILE-001)

/**
 * Maximum file size in bytes (10MB as per SPEC-FILE-001)
 * @CODE:FILE-001-MAX-SIZE
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10,485,760 bytes

/**
 * Maximum file size in MB (for display purposes)
 * @CODE:FILE-001-MAX-SIZE-MB
 */
export const MAX_FILE_SIZE_MB = 10;

/**
 * Allowed MIME types as per SPEC-FILE-001
 * @CODE:FILE-001-ALLOWED-MIME
 */
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/pdf',
  'video/mp4',
  'video/x-msvideo', // AVI
] as const;

/**
 * Allowed file extensions as per SPEC-FILE-001
 * @CODE:FILE-001-ALLOWED-EXTENSIONS
 */
export const ALLOWED_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.pdf',
  '.mp4',
  '.avi',
] as const;

/**
 * MIME type to extension mapping
 * @CODE:FILE-001-MIME-TO-EXT
 */
export const MIME_TO_EXTENSION: Record<string, string[]> = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'application/pdf': ['.pdf'],
  'video/mp4': ['.mp4'],
  'video/x-msvideo': ['.avi'],
} as const;

/**
 * Upload base path (relative to project root)
 * @CODE:FILE-001-UPLOAD-PATH
 */
export const UPLOAD_BASE_PATH = 'data/uploads';

/**
 * Maximum filename length (security constraint)
 * @CODE:FILE-001-MAX-FILENAME-LENGTH
 */
export const MAX_FILENAME_LENGTH = 255;

/**
 * Performance targets as per SPEC-FILE-001
 * @CODE:FILE-001-PERFORMANCE
 */
export const FILE_PERFORMANCE = {
  UPLOAD_MAX_TIME_MS: 2000, // 2 seconds for 10MB file
  DOWNLOAD_START_TIME_MS: 1000, // 1 second to start download
  CONCURRENT_UPLOADS: 10, // Support 10 simultaneous uploads
} as const;

/**
 * Error messages in Korean (as per SPEC-FILE-001)
 * @CODE:FILE-001-ERROR-MESSAGES
 */
export const FILE_ERROR_MESSAGES = {
  // Size errors
  FILE_TOO_LARGE: '파일 크기는 10MB를 초과할 수 없습니다',
  FILE_EMPTY: '비어있는 파일은 업로드할 수 없습니다',

  // Type errors
  INVALID_FILE_TYPE: '허용되지 않는 파일 형식입니다',
  INVALID_EXTENSION: '허용되지 않는 파일 확장자입니다',
  MIME_EXTENSION_MISMATCH: 'MIME 타입과 파일 확장자가 일치하지 않습니다',

  // Security errors
  MALICIOUS_FILE: '악성 파일로 의심됩니다',
  DOUBLE_EXTENSION: '악성 파일로 의심됩니다. (이중 확장자 감지)',
  NULL_BYTE_DETECTED: '악성 파일로 의심됩니다. (Null byte 감지)',
  PATH_TRAVERSAL: '경로 탐색 시도가 감지되었습니다',
  SPECIAL_CHARACTERS: '파일명에 특수문자가 포함되어 있습니다',

  // Filename errors
  NO_EXTENSION: '파일 확장자가 없습니다',
  FILENAME_TOO_LONG: `파일명은 ${MAX_FILENAME_LENGTH}자를 초과할 수 없습니다`,

  // Access errors
  NO_PERMISSION: '파일 다운로드 권한이 없습니다',
  FILE_NOT_FOUND: '파일이 존재하지 않습니다',
  CANNOT_DELETE_COMPLETED_REPORT: '완료된 신고에 첨부된 파일은 삭제할 수 없습니다',

  // Storage errors
  STORAGE_WRITE_FAILED: '파일 저장 실패',
  STORAGE_READ_FAILED: '파일 읽기 실패',
  STORAGE_DELETE_FAILED: '파일 삭제 실패',
  INVALID_FILE_PATH: '보안 위험: 잘못된 파일 경로입니다',

  // General errors
  UPLOAD_FAILED: '파일 업로드 실패',
  DOWNLOAD_FAILED: '파일 다운로드 실패',
  VALIDATION_FAILED: '파일 검증 실패',
} as const;

/**
 * Success messages in Korean
 * @CODE:FILE-001-SUCCESS-MESSAGES
 */
export const FILE_SUCCESS_MESSAGES = {
  UPLOAD_SUCCESS: '파일이 업로드되었습니다',
  DELETE_SUCCESS: '파일이 삭제되었습니다',
  DOWNLOAD_STARTED: '파일 다운로드를 시작합니다',
} as const;

/**
 * File category labels in Korean
 * @CODE:FILE-001-CATEGORY-LABELS
 */
export const FILE_CATEGORY_LABELS: Record<string, string> = {
  image: '이미지',
  video: '동영상',
  document: '문서',
  other: '기타',
} as const;

/**
 * HTTP status codes for file operations
 * @CODE:FILE-001-HTTP-STATUS
 */
export const FILE_HTTP_STATUS = {
  SUCCESS: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  PAYLOAD_TOO_LARGE: 413,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_ERROR: 500,
} as const;
