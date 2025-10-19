// @CODE:REPORT-ERRORS-001 | Chain: SPEC-REPORT-001 -> CODE-REPORT-001
// Custom error classes for report system

/**
 * Base error class for report-related errors
 * @CODE:REPORT-ERRORS-001-BASE
 */
export class ReportError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'ReportError';
    Object.setPrototypeOf(this, ReportError.prototype);
  }
}

/**
 * Error thrown when report validation fails
 * @CODE:REPORT-ERRORS-001-VALIDATION
 */
export class ReportValidationError extends ReportError {
  constructor(message: string, public field?: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ReportValidationError';
    Object.setPrototypeOf(this, ReportValidationError.prototype);
  }
}

/**
 * Error thrown when report is not found
 * @CODE:REPORT-ERRORS-001-NOT-FOUND
 */
export class ReportNotFoundError extends ReportError {
  constructor(reportId: number) {
    super(`Report not found: ${reportId}`, 'NOT_FOUND');
    this.name = 'ReportNotFoundError';
    Object.setPrototypeOf(this, ReportNotFoundError.prototype);
  }
}

/**
 * Error thrown when access to report is denied
 * @CODE:REPORT-ERRORS-001-ACCESS-DENIED
 */
export class ReportAccessDeniedError extends ReportError {
  constructor(message: string = 'Access denied to this report') {
    super(message, 'ACCESS_DENIED');
    this.name = 'ReportAccessDeniedError';
    Object.setPrototypeOf(this, ReportAccessDeniedError.prototype);
  }
}

/**
 * Error thrown when report status transition is invalid
 * @CODE:REPORT-ERRORS-001-INVALID-TRANSITION
 */
export class InvalidStatusTransitionError extends ReportError {
  constructor(fromStatus: string, toStatus: string) {
    super(
      `Invalid status transition from ${fromStatus} to ${toStatus}`,
      'INVALID_TRANSITION'
    );
    this.name = 'InvalidStatusTransitionError';
    Object.setPrototypeOf(this, InvalidStatusTransitionError.prototype);
  }
}

/**
 * Error thrown when attempting to modify a completed report
 * @CODE:REPORT-ERRORS-001-COMPLETED
 */
export class ReportCompletedError extends ReportError {
  constructor(message: string = 'Cannot modify completed report') {
    super(message, 'REPORT_COMPLETED');
    this.name = 'ReportCompletedError';
    Object.setPrototypeOf(this, ReportCompletedError.prototype);
  }
}

/**
 * Error thrown when attempting to delete a report
 * @CODE:REPORT-ERRORS-001-DELETE-FORBIDDEN
 */
export class ReportDeleteForbiddenError extends ReportError {
  constructor() {
    super(
      'Reports cannot be deleted for preservation requirements',
      'DELETE_FORBIDDEN'
    );
    this.name = 'ReportDeleteForbiddenError';
    Object.setPrototypeOf(this, ReportDeleteForbiddenError.prototype);
  }
}
