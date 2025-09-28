/**
 * Database constants following DRY principle
 * Centralized configuration for all database-related magic numbers and strings
 */

// ID Generation Constants
export const ID_GENERATION = {
  RANDOM_SUFFIX_LENGTH: 5,
  NANOID_LENGTH: 8,
  TEACHER_NANOID_LENGTH: 8,
  RANDOM_SUBSTRING_START: 2
} as const;

// Database Status Constants
export const USER_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
} as const;

export const VERIFICATION_METHOD = {
  EMAIL: 'email',
  PHONE: 'phone',
  DOCUMENT: 'document'
} as const;

export const DOCUMENT_TYPE = {
  TEACHER_CERTIFICATE: 'teacher_certificate',
  SCHOOL_ID: 'school_id',
  EMPLOYMENT_LETTER: 'employment_letter'
} as const;

export const USER_ACTION = {
  LOGIN: 'login',
  LOGOUT: 'logout',
  REPORT_CREATED: 'report_created',
  PROFILE_UPDATED: 'profile_updated'
} as const;

// Report Status Constants
export const REPORT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  RESOLVED: 'resolved',
  REJECTED: 'rejected'
} as const;

// Community Constants
export const COMMUNITY_CATEGORY = {
  GENERAL: 'general',
  EXPERIENCE: 'experience',
  ADVICE: 'advice',
  LEGAL: 'legal',
  SUPPORT: 'support'
} as const;

// Database Keys
export const STORAGE_KEYS = {
  REPORTS: 'kk119_reports',
  COMMUNITY_POSTS: 'kk119_community_posts',
  COMMUNITY_COMMENTS: 'kk119_community_comments',
  MIGRATION_COMPLETED: 'migration_completed',
  AUTH_STORAGE: 'kyokwon119-storage'
} as const;

// ID Prefixes
export const ID_PREFIXES = {
  USER: 'usr',
  TEACHER: 'tch',
  REPORT: 'report',
  POST: 'post',
  COMMENT: 'comment',
  UNKNOWN_SCHOOL: 'unknown'
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  EMAIL_ALREADY_EXISTS: '이미 등록된 이메일입니다.',
  FAILED_TO_SAVE_REPORT: 'Failed to save report',
  FAILED_TO_SAVE_POST: 'Failed to save post',
  FAILED_TO_SAVE_COMMENT: 'Failed to save comment',
  FAILED_TO_GET_CURRENT_USER: 'Failed to get current user'
} as const;

// Type Definitions for Type Safety
export type UserStatusType = typeof USER_STATUS[keyof typeof USER_STATUS];
export type VerificationMethodType = typeof VERIFICATION_METHOD[keyof typeof VERIFICATION_METHOD];
export type DocumentTypeType = typeof DOCUMENT_TYPE[keyof typeof DOCUMENT_TYPE];
export type UserActionType = typeof USER_ACTION[keyof typeof USER_ACTION];
export type ReportStatusType = typeof REPORT_STATUS[keyof typeof REPORT_STATUS];
export type CommunityCategoryType = typeof COMMUNITY_CATEGORY[keyof typeof COMMUNITY_CATEGORY];