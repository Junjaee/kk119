// @CODE:FILE-VALIDATOR-001 | Chain: SPEC-FILE-001 -> TEST-FILE-VALIDATOR-001 -> CODE-FILE-VALIDATOR-001
// File validation service - MIME type, size, extension, malicious file detection

import path from 'path';
import mime from 'mime-types';

/**
 * Maximum file size in bytes (10MB as per SPEC-FILE-001)
 */
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

/**
 * Maximum filename length for security
 */
const MAX_FILENAME_LENGTH = 255;

// Allowed MIME types as per SPEC-FILE-001
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/pdf',
  'video/mp4',
  'video/x-msvideo', // AVI
];

// Allowed extensions as per SPEC-FILE-001
const ALLOWED_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.pdf',
  '.mp4',
  '.avi',
];

// MIME type to extension mapping
const MIME_TO_EXTENSION: Record<string, string[]> = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'application/pdf': ['.pdf'],
  'video/mp4': ['.mp4'],
  'video/x-msvideo': ['.avi'],
};

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * File validator service
 * Validates file size, MIME type, extension, and security checks
 *
 * @class FileValidator
 * @implements SPEC-FILE-001 validation requirements
 */
export class FileValidator {
  /**
   * Validate file size
   *
   * @param {number} sizeInBytes - File size in bytes
   * @returns {ValidationResult} Validation result with error message if invalid
   *
   * @example
   * const validator = new FileValidator();
   * const result = validator.validateFileSize(5000000); // 5MB
   * if (!result.isValid) {
   *   console.error(result.error);
   * }
   */
  validateFileSize(sizeInBytes: number): ValidationResult {
    if (sizeInBytes <= 0) {
      return {
        isValid: false,
        error: '비어있는 파일은 업로드할 수 없습니다.'
      };
    }

    if (sizeInBytes > MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: `파일 크기는 10MB를 초과할 수 없습니다. (현재: ${(sizeInBytes / 1024 / 1024).toFixed(2)}MB)`
      };
    }

    return { isValid: true };
  }

  /**
   * Validate MIME type and cross-check with file extension
   *
   * @param {string} mimeType - MIME type from file upload
   * @param {string} filename - Original filename
   * @returns {ValidationResult} Validation result
   *
   * @description
   * - Checks if MIME type is in allowed list (SPEC-FILE-001)
   * - Cross-validates MIME type with file extension for security
   * - Prevents MIME type spoofing attacks
   */
  validateMimeType(mimeType: string, filename: string): ValidationResult {
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      return {
        isValid: false,
        error: '허용되지 않는 파일 형식입니다.'
      };
    }

    // Cross-validate MIME type with file extension
    const ext = path.extname(filename).toLowerCase();
    const allowedExtensions = MIME_TO_EXTENSION[mimeType];

    if (allowedExtensions && !allowedExtensions.includes(ext)) {
      return {
        isValid: false,
        error: 'MIME 타입과 파일 확장자가 일치하지 않습니다.'
      };
    }

    return { isValid: true };
  }

  /**
   * Validate file extension and detect double extensions
   *
   * @param {string} filename - Original filename
   * @returns {ValidationResult} Validation result
   *
   * @description
   * - Checks if extension is in allowed list (SPEC-FILE-001)
   * - Detects double extensions (e.g., .pdf.exe) for security
   * - Case-insensitive comparison
   */
  validateExtension(filename: string): ValidationResult {
    // Get extension and convert to lowercase for case-insensitive comparison
    const ext = path.extname(filename).toLowerCase();

    if (!ext) {
      return {
        isValid: false,
        error: '파일 확장자가 없습니다.'
      };
    }

    // Check for double extensions (e.g., .pdf.exe)
    // Remove the last extension, check if there's another dot
    const baseName = path.basename(filename);
    const nameWithoutExt = baseName.substring(0, baseName.length - ext.length);

    if (nameWithoutExt.includes('.')) {
      return {
        isValid: false,
        error: '악성 파일로 의심됩니다. (이중 확장자 감지)'
      };
    }

    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return {
        isValid: false,
        error: '허용되지 않는 파일 확장자입니다.'
      };
    }

    return { isValid: true };
  }

  /**
   * Validate filename for security issues
   *
   * @param {string} filename - Original filename
   * @returns {ValidationResult} Validation result
   *
   * @description
   * Security checks performed:
   * - Null byte injection detection
   * - Path traversal attack prevention (../ or ..\)
   * - Absolute path rejection
   * - Special character filtering (<>:"|?*)
   * - Filename length validation
   */
  validateFilename(filename: string): ValidationResult {
    // Check for null byte injection
    if (filename.includes('\0')) {
      return {
        isValid: false,
        error: '악성 파일로 의심됩니다. (Null byte 감지)'
      };
    }

    // Check for path traversal
    if (filename.includes('../') || filename.includes('..\\')) {
      return {
        isValid: false,
        error: '경로 탐색 시도가 감지되었습니다.'
      };
    }

    // Check for absolute paths
    if (path.isAbsolute(filename)) {
      return {
        isValid: false,
        error: '경로 탐색 시도가 감지되었습니다.'
      };
    }

    // Check for special characters
    const dangerousChars = /[<>:"|?*]/;
    if (dangerousChars.test(filename)) {
      return {
        isValid: false,
        error: '파일명에 특수문자가 포함되어 있습니다.'
      };
    }

    // Check filename length
    if (filename.length > MAX_FILENAME_LENGTH) {
      return {
        isValid: false,
        error: `파일명은 ${MAX_FILENAME_LENGTH}자를 초과할 수 없습니다.`
      };
    }

    return { isValid: true };
  }

  /**
   * Validate complete file object
   *
   * @param {Object} file - File object to validate
   * @param {string} file.name - Filename
   * @param {number} file.size - File size in bytes
   * @param {string} file.type - MIME type
   * @returns {ValidationResult} Validation result
   *
   * @description
   * Performs comprehensive validation in this order:
   * 1. Filename security check
   * 2. File size validation
   * 3. Extension validation
   * 4. MIME type validation
   *
   * Stops at first validation failure for performance
   *
   * @example
   * const validator = new FileValidator();
   * const result = validator.validateFile({
   *   name: 'document.pdf',
   *   size: 5000000,
   *   type: 'application/pdf'
   * });
   */
  validateFile(file: { name: string; size: number; type: string }): ValidationResult {
    // Validate filename
    const filenameResult = this.validateFilename(file.name);
    if (!filenameResult.isValid) {
      return filenameResult;
    }

    // Validate size
    const sizeResult = this.validateFileSize(file.size);
    if (!sizeResult.isValid) {
      return sizeResult;
    }

    // Validate extension
    const extensionResult = this.validateExtension(file.name);
    if (!extensionResult.isValid) {
      return extensionResult;
    }

    // Validate MIME type
    const mimeResult = this.validateMimeType(file.type, file.name);
    if (!mimeResult.isValid) {
      return mimeResult;
    }

    return { isValid: true };
  }
}
