// @CODE:FILE-001 | Chain: SPEC-FILE-001 -> CODE-FILE-001
// File management types and interfaces

/**
 * File access levels
 * @CODE:FILE-001-ACCESS
 */
export enum FileAccess {
  PRIVATE = 'private',
  SHARED = 'shared',
  PUBLIC = 'public',
}

/**
 * File status
 * @CODE:FILE-001-STATUS
 */
export enum FileStatus {
  ACTIVE = 'active',
  DELETED = 'deleted',
  ARCHIVED = 'archived',
}

/**
 * File category (context of use)
 * @CODE:FILE-001-CATEGORY
 */
export type FileCategory = 'report' | 'consult' | 'resource' | 'other';

/**
 * File upload request interface
 * @CODE:FILE-001-UPLOAD-REQUEST
 */
export interface FileUploadRequest {
  file: File | Buffer;
  originalFilename: string;
  mimeType: string;
  uploaderId: number;
  reportId?: number;
  consultId?: number;
  category?: FileCategory;
}

/**
 * File metadata response
 * @CODE:FILE-001-RESPONSE
 */
export interface FileResponse {
  id: string;
  originalFilename: string;
  storedFilename: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  fileExtension: string;
  uploaderId: number;
  reportId?: number | null;
  consultId?: number | null;
  uploadedAt: string;
  deletedAt?: string | null;
  version?: number;
}

/**
 * File version information
 * @CODE:FILE-001-VERSION
 */
export interface FileVersion {
  version: number;
  filePath: string;
  storedFilename: string;
  fileSize: number;
  createdAt: Date;
  uploadedBy?: number;
}

/**
 * File list filter options
 * @CODE:FILE-001-FILTER
 */
export interface FileListFilter {
  uploaderId?: number;
  reportId?: number;
  consultId?: number;
  category?: FileCategory;
  status?: FileStatus;
  mimeType?: string;
  fromDate?: Date;
  toDate?: Date;
  limit?: number;
  offset?: number;
}

/**
 * File download options
 * @CODE:FILE-001-DOWNLOAD
 */
export interface FileDownloadOptions {
  fileId: string;
  userId: number;
  userRole: string;
  inline?: boolean; // If true, display in browser; if false, force download
}

/**
 * File deletion result
 * @CODE:FILE-001-DELETE
 */
export interface FileDeletionResult {
  success: boolean;
  message: string;
  fileId?: string;
  deletedAt?: string;
}

/**
 * File validation error details
 * @CODE:FILE-001-VALIDATION-ERROR
 */
export interface FileValidationError {
  field: string;
  message: string;
  value?: any;
}

/**
 * Allowed MIME types (as per SPEC-FILE-001)
 * @CODE:FILE-001-MIME-TYPES
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
 * Allowed file extensions (as per SPEC-FILE-001)
 * @CODE:FILE-001-EXTENSIONS
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
 * Type guard for allowed MIME types
 * @CODE:FILE-001-TYPE-GUARD
 */
export function isAllowedMimeType(mimeType: string): boolean {
  return (ALLOWED_MIME_TYPES as readonly string[]).includes(mimeType);
}

/**
 * Type guard for allowed extensions
 * @CODE:FILE-001-TYPE-GUARD
 */
export function isAllowedExtension(extension: string): boolean {
  return (ALLOWED_EXTENSIONS as readonly string[]).includes(extension.toLowerCase());
}

/**
 * Get file category from MIME type
 * @CODE:FILE-001-HELPER
 */
export function getCategoryFromMimeType(mimeType: string): string {
  if (mimeType.startsWith('image/')) return '이미지';
  if (mimeType.startsWith('video/')) return '동영상';
  if (mimeType === 'application/pdf') return '문서';
  return '기타';
}

/**
 * Format file size to human-readable string
 * @CODE:FILE-001-HELPER
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
