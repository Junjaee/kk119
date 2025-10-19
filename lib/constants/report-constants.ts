// @CODE:REPORT-CONSTANTS-001 | Chain: SPEC-REPORT-001 -> CODE-REPORT-001
// Report system constants

/**
 * Report validation constraints
 * @CODE:REPORT-CONSTANTS-001-VALIDATION
 */
export const REPORT_VALIDATION = {
  TITLE_MIN_LENGTH: 1,
  TITLE_MAX_LENGTH: 100,
  DESCRIPTION_MIN_LENGTH: 1,
  DESCRIPTION_MAX_LENGTH: 2000,
  LOCATION_MIN_LENGTH: 1,
  LOCATION_MAX_LENGTH: 200,
} as const;

/**
 * Report categories (aligned with SPEC-REPORT-001)
 * @CODE:REPORT-CONSTANTS-001-CATEGORIES
 */
export const REPORT_CATEGORIES = {
  PARENT_COMPLAINT: '학부모 민원',
  STUDENT_VIOLENCE: '학생 폭력',
  DEFAMATION: '명예훼손',
} as const;

/**
 * Report statuses (aligned with SPEC-REPORT-001)
 * @CODE:REPORT-CONSTANTS-001-STATUSES
 */
export const REPORT_STATUSES = {
  RECEIVED: 'received',
  REVIEWING: 'reviewing',
  CONSULTING: 'consulting',
  COMPLETED: 'completed',
} as const;

/**
 * Report status labels in Korean
 * @CODE:REPORT-CONSTANTS-001-STATUS-LABELS
 */
export const REPORT_STATUS_LABELS: Record<string, string> = {
  received: '접수완료',
  reviewing: '검토중',
  consulting: '상담진행',
  completed: '해결완료',
} as const;

/**
 * Report category labels in Korean
 * @CODE:REPORT-CONSTANTS-001-CATEGORY-LABELS
 */
export const REPORT_CATEGORY_LABELS: Record<string, string> = {
  '학부모 민원': '학부모 민원',
  '학생 폭력': '학생 폭력',
  '명예훼손': '명예훼손',
} as const;

/**
 * Performance targets (aligned with SPEC-REPORT-001)
 * @CODE:REPORT-CONSTANTS-001-PERFORMANCE
 */
export const REPORT_PERFORMANCE = {
  LIST_RESPONSE_TIME_MS: 2000, // 2 seconds max
  CREATE_RESPONSE_TIME_MS: 3000, // 3 seconds max
  DETAIL_RESPONSE_TIME_MS: 250, // 250ms average
  CONCURRENT_USERS: 100, // Support 100 concurrent users
  MONTHLY_REPORT_TARGET: 1000, // Target: 1000 reports per month
} as const;

/**
 * Report number format
 * @CODE:REPORT-CONSTANTS-001-FORMAT
 */
export const REPORT_NUMBER_FORMAT = {
  PREFIX: 'RPT',
  DATE_FORMAT: 'YYYYMMDD',
  SEQUENCE_LENGTH: 4,
  PATTERN: /^RPT-\d{8}-\d{4}$/,
} as const;

/**
 * File attachment constraints (for future SPEC-FILE-001 integration)
 * @CODE:REPORT-CONSTANTS-001-FILES
 */
export const REPORT_FILE_CONSTRAINTS = {
  MAX_FILE_SIZE_MB: 10,
  MAX_FILE_SIZE_BYTES: 10 * 1024 * 1024,
  ALLOWED_MIME_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
} as const;
