// @CODE:FILE-SERVICE-001 | Chain: SPEC-FILE-001 -> TEST-FILE-ACCESS-001 -> CODE-FILE-SERVICE-001
// File service with business logic and access control

import Database from 'better-sqlite3';
import { UserRole } from '../types';

/**
 * File record from database
 */
export interface FileRecord {
  id: string;
  original_filename: string;
  stored_filename: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  file_extension: string;
  uploader_id: number;
  report_id: number | null;
  consult_id: number | null;
  uploaded_at: string;
  deleted_at: string | null;
}

/**
 * Report record from database
 */
export interface ReportRecord {
  id: number;
  report_number: string;
  teacher_id: number;
  lawyer_id: number | null;
  status: string;
}

/**
 * File service - Business logic and access control
 *
 * @class FileService
 * @implements SPEC-FILE-001 access control requirements
 *
 * @description
 * Provides role-based access control for file operations:
 * - File access validation
 * - Download permission checks
 * - Delete permission checks with evidence preservation
 * - Report integration
 */
export class FileService {
  private db: Database.Database;
  private uploadDir: string;

  /**
   * Create a new FileService instance
   *
   * @param {Database.Database} db - Better-sqlite3 database instance
   * @param {string} [uploadDir] - Upload directory path (optional)
   */
  constructor(db: Database.Database, uploadDir?: string) {
    this.db = db;
    this.uploadDir = uploadDir || 'data/uploads';
  }

  /**
   * Check if user can access a file
   *
   * @param {string} fileId - File ID (UUID)
   * @param {number} userId - User ID
   * @param {UserRole} userRole - User role
   * @returns {Promise<boolean>} True if user can access file
   *
   * @description
   * Access granted to:
   * - File owner (uploader)
   * - Admin and super_admin (all files)
   * - Lawyer (if assigned to related report)
   *
   * @example
   * const service = new FileService(db);
   * const canAccess = await service.canAccessFile('file-uuid', 123, 'teacher');
   */
  async canAccessFile(fileId: string, userId: number, userRole: UserRole): Promise<boolean> {
    try {
      // Get file record
      const file = this.db.prepare('SELECT * FROM files WHERE id = ? AND deleted_at IS NULL')
        .get(fileId) as FileRecord | undefined;

      if (!file) {
        return false;
      }

      // Owner can access
      if (file.uploader_id === userId) {
        return true;
      }

      // Admin and super_admin can access all files
      if (userRole === 'admin' || userRole === 'super_admin') {
        return true;
      }

      // Lawyer can access if assigned to related report
      if (userRole === 'lawyer' && file.report_id) {
        const report = this.db.prepare('SELECT * FROM reports WHERE id = ?')
          .get(file.report_id) as ReportRecord | undefined;

        if (report && report.lawyer_id === userId) {
          return true;
        }
      }

      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if user can download a file
   *
   * @param {string} fileId - File ID (UUID)
   * @param {number} userId - User ID
   * @param {UserRole} userRole - User role
   * @returns {Promise<boolean>} True if user can download file
   *
   * @description
   * Download permissions are same as access permissions
   * Delegates to canAccessFile()
   */
  async canDownloadFile(fileId: string, userId: number, userRole: UserRole): Promise<boolean> {
    // Same logic as canAccessFile
    return this.canAccessFile(fileId, userId, userRole);
  }

  /**
   * Check if user can delete a file
   *
   * @param {string} fileId - File ID (UUID)
   * @param {number} userId - User ID
   * @param {UserRole} userRole - User role
   * @returns {Promise<boolean>} True if user can delete file
   *
   * @description
   * Delete restrictions (SPEC-FILE-001):
   * - Cannot delete files from completed reports (evidence preservation)
   * - Owners can delete their own files (except completed report files)
   * - Admin and super_admin can delete (except completed report files)
   * - Lawyers cannot delete files
   *
   * @example
   * const service = new FileService(db);
   * const canDelete = await service.canDeleteFile('file-uuid', 123, 'admin');
   */
  async canDeleteFile(fileId: string, userId: number, userRole: UserRole): Promise<boolean> {
    try {
      // Get file record
      const file = this.db.prepare('SELECT * FROM files WHERE id = ? AND deleted_at IS NULL')
        .get(fileId) as FileRecord | undefined;

      if (!file) {
        return false;
      }

      // Check if file is attached to a completed report
      if (file.report_id) {
        const report = this.db.prepare('SELECT * FROM reports WHERE id = ?')
          .get(file.report_id) as ReportRecord | undefined;

        if (report && report.status === 'completed') {
          // Cannot delete files from completed reports (evidence preservation)
          return false;
        }
      }

      // Owner can delete
      if (file.uploader_id === userId) {
        return true;
      }

      // Admin and super_admin can delete (except completed report files, checked above)
      if (userRole === 'admin' || userRole === 'super_admin') {
        return true;
      }

      // Lawyers cannot delete files
      return false;
    } catch (error) {
      return false;
    }
  }
}
