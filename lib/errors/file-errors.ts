// @CODE:FILE-001 | Chain: SPEC-FILE-001 -> CODE-FILE-001
// Custom error classes for file operations

import { FILE_ERROR_MESSAGES } from '../constants/file-constants';

/**
 * Base class for all file-related errors
 * @CODE:FILE-001-BASE-ERROR
 */
export class FileError extends Error {
  public readonly statusCode: number;
  public readonly details?: any;

  constructor(message: string, statusCode: number = 500, details?: any) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * File size exceeded error (413 Payload Too Large)
 * @CODE:FILE-001-SIZE-ERROR
 */
export class FileSizeError extends FileError {
  constructor(actualSize: number, maxSize: number = 10485760) {
    const sizeMB = (actualSize / 1024 / 1024).toFixed(2);
    const message = `${FILE_ERROR_MESSAGES.FILE_TOO_LARGE} (현재: ${sizeMB}MB)`;
    super(message, 413, { actualSize, maxSize });
  }
}

/**
 * Invalid file type error (400 Bad Request)
 * @CODE:FILE-001-TYPE-ERROR
 */
export class FileTypeError extends FileError {
  constructor(mimeType: string, allowedTypes: readonly string[]) {
    super(FILE_ERROR_MESSAGES.INVALID_FILE_TYPE, 400, {
      providedType: mimeType,
      allowedTypes: [...allowedTypes],
    });
  }
}

/**
 * Invalid file extension error (400 Bad Request)
 * @CODE:FILE-001-EXTENSION-ERROR
 */
export class FileExtensionError extends FileError {
  constructor(extension: string, allowedExtensions: readonly string[]) {
    super(FILE_ERROR_MESSAGES.INVALID_EXTENSION, 400, {
      providedExtension: extension,
      allowedExtensions: [...allowedExtensions],
    });
  }
}

/**
 * MIME type and extension mismatch error (400 Bad Request)
 * @CODE:FILE-001-MISMATCH-ERROR
 */
export class MimeExtensionMismatchError extends FileError {
  constructor(mimeType: string, extension: string) {
    super(FILE_ERROR_MESSAGES.MIME_EXTENSION_MISMATCH, 400, {
      mimeType,
      extension,
    });
  }
}

/**
 * File access denied error (403 Forbidden)
 * @CODE:FILE-001-ACCESS-ERROR
 */
export class FileAccessError extends FileError {
  constructor(fileId: string, userId: number) {
    super(FILE_ERROR_MESSAGES.NO_PERMISSION, 403, {
      fileId,
      userId,
    });
  }
}

/**
 * File not found error (404 Not Found)
 * @CODE:FILE-001-NOT-FOUND-ERROR
 */
export class FileNotFoundError extends FileError {
  constructor(fileId: string) {
    super(FILE_ERROR_MESSAGES.FILE_NOT_FOUND, 404, {
      fileId,
    });
  }
}

/**
 * Malicious file detected error (400 Bad Request)
 * @CODE:FILE-001-MALICIOUS-ERROR
 */
export class MaliciousFileError extends FileError {
  constructor(reason: string, details?: any) {
    const message = reason === 'double_extension'
      ? FILE_ERROR_MESSAGES.DOUBLE_EXTENSION
      : reason === 'null_byte'
      ? FILE_ERROR_MESSAGES.NULL_BYTE_DETECTED
      : reason === 'path_traversal'
      ? FILE_ERROR_MESSAGES.PATH_TRAVERSAL
      : FILE_ERROR_MESSAGES.MALICIOUS_FILE;

    super(message, 400, { reason, ...details });
  }
}

/**
 * File validation error (422 Unprocessable Entity)
 * @CODE:FILE-001-VALIDATION-ERROR
 */
export class FileValidationError extends FileError {
  constructor(message: string, validationErrors?: any[]) {
    super(message, 422, { validationErrors });
  }
}

/**
 * File storage error (500 Internal Server Error)
 * @CODE:FILE-001-STORAGE-ERROR
 */
export class FileStorageError extends FileError {
  constructor(operation: 'save' | 'read' | 'delete', originalError?: Error) {
    const message =
      operation === 'save'
        ? FILE_ERROR_MESSAGES.STORAGE_WRITE_FAILED
        : operation === 'read'
        ? FILE_ERROR_MESSAGES.STORAGE_READ_FAILED
        : FILE_ERROR_MESSAGES.STORAGE_DELETE_FAILED;

    super(message, 500, {
      operation,
      originalError: originalError?.message,
    });
  }
}

/**
 * Cannot delete completed report file error (403 Forbidden)
 * @CODE:FILE-001-DELETE-RESTRICTION-ERROR
 */
export class FileDeleteRestrictionError extends FileError {
  constructor(fileId: string, reportId: number, reportStatus: string) {
    super(FILE_ERROR_MESSAGES.CANNOT_DELETE_COMPLETED_REPORT, 403, {
      fileId,
      reportId,
      reportStatus,
    });
  }
}

/**
 * Invalid file path error (400 Bad Request)
 * @CODE:FILE-001-PATH-ERROR
 */
export class InvalidFilePathError extends FileError {
  constructor(filePath: string) {
    super(FILE_ERROR_MESSAGES.INVALID_FILE_PATH, 400, {
      filePath,
    });
  }
}

/**
 * Helper function to check if error is a file error
 * @CODE:FILE-001-TYPE-GUARD
 */
export function isFileError(error: any): error is FileError {
  return error instanceof FileError;
}

/**
 * Helper function to convert FileError to HTTP response format
 * @CODE:FILE-001-ERROR-RESPONSE
 */
export function fileErrorToResponse(error: FileError) {
  return {
    error: error.message,
    statusCode: error.statusCode,
    details: error.details,
    name: error.name,
  };
}
