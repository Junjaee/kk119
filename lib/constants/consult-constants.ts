// @CODE:CONSULT-CONST-001 | Chain: SPEC-CONSULT-001 -> TEST-CONSULT-001 -> CODE-CONSULT-001
// Related: @CODE:CONSULT-TYPES-001
// Constants for lawyer selection consultation system (no auto-matching)

/**
 * Urgency sort order
 * Used for listing available consultations
 */
export const URGENCY_PRIORITY = {
  urgent: 4,
  high: 3,
  normal: 2,
  low: 1,
} as const;

/**
 * System limits and constraints
 */
export const SYSTEM_LIMITS = {
  MAX_CONSULTATIONS_PER_LAWYER: 10, // Workload limit
  MAX_TITLE_LENGTH: 200,
  MAX_CONTENT_LENGTH: 10000,
  MAX_MESSAGE_LENGTH: 5000,
  MAX_ATTACHMENT_SIZE: 50 * 1024 * 1024, // 50MB total
  AUTO_EXPIRY_DAYS: 30, // Auto-expire pending after 30 days
  EVALUATION_DEADLINE_HOURS: 72,
  SELECTION_RESPONSE_TIME_MS: 100, // Lawyer selection must complete within 100ms
} as const;

/**
 * Access control permissions
 */
export const ACCESS_CONTROL = {
  teacher: {
    canCreate: true,
    canViewOwn: true,
    canViewAll: false,
    canViewPending: false, // Cannot see pending consultations list
    canSelect: false, // Cannot select consultations
    canEvaluate: true,
    canCancel: true, // Only from pending status
  },
  lawyer: {
    canCreate: false,
    canViewOwn: true,
    canViewAll: false,
    canViewPending: true, // Can see all pending consultations
    canSelect: true, // Can select consultations
    canEvaluate: false,
    canCancel: false,
  },
  admin: {
    canCreate: false,
    canViewOwn: false,
    canViewAll: true,
    canViewPending: true,
    canSelect: false,
    canEvaluate: false,
    canCancel: false,
  },
  super_admin: {
    canCreate: true,
    canViewOwn: false,
    canViewAll: true,
    canViewPending: true,
    canSelect: false, // Super admin doesn't select, lawyers do
    canEvaluate: true,
    canCancel: true,
  },
} as const;

/**
 * Consultation number format
 * Format: CST-YYYYMMDD-XXXX
 */
export const CONSULT_NUMBER_PREFIX = 'CST';

/**
 * Message delivery time requirement (ms)
 */
export const MESSAGE_DELIVERY_TIME_MS = 1000; // 1 second
