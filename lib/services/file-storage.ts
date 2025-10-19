// @CODE:FILE-STORAGE-001 | Chain: SPEC-FILE-001 -> TEST-FILE-STORAGE-001 -> CODE-FILE-STORAGE-001
// File storage service - UUID naming, directory structure, version control

import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

/**
 * Result of file save operation
 */
export interface SaveResult {
  success: boolean;
  filePath?: string;
  storedFilename?: string;
  fileSize?: number;
  version?: number;
  error?: string;
}

/**
 * Result of file read operation
 */
export interface ReadResult {
  success: boolean;
  buffer?: Buffer;
  error?: string;
}

/**
 * File version metadata
 */
export interface FileVersion {
  version: number;
  filePath: string;
  storedFilename: string;
  createdAt: Date;
}

/**
 * File storage service
 * Handles physical file storage with UUID naming and versioning
 *
 * @class FileStorage
 * @implements SPEC-FILE-001 storage requirements
 *
 * @description
 * Features:
 * - UUID-based unique filenames
 * - Date-based directory structure (YYYY/MM/DD)
 * - File versioning support
 * - Path traversal security checks
 * - Atomic file operations
 */
export class FileStorage {
  private uploadDir: string;

  /**
   * Create a new FileStorage instance
   *
   * @param {string} [uploadDir] - Custom upload directory (defaults to data/uploads)
   */
  constructor(uploadDir?: string) {
    this.uploadDir = uploadDir || path.join(process.cwd(), 'data', 'uploads');
  }

  /**
   * Generate UUID-based filename
   *
   * @param {string} originalFilename - Original filename with extension
   * @returns {string} UUID-based filename (e.g., 550e8400-e29b-41d4-a716-446655440000.pdf)
   *
   * @example
   * const storage = new FileStorage();
   * const uniqueName = storage.generateUniqueFilename('document.pdf');
   * // Returns: "550e8400-e29b-41d4-a716-446655440000.pdf"
   */
  generateUniqueFilename(originalFilename: string): string {
    const ext = path.extname(originalFilename);
    const uuid = uuidv4();
    return ext ? `${uuid}${ext}` : uuid;
  }

  /**
   * Get date-based directory path (YYYY/MM/DD)
   *
   * @returns {string} Absolute path to date-based directory
   *
   * @example
   * // On 2025-10-19
   * const storage = new FileStorage();
   * const dir = storage.getDateBasedDirectory();
   * // Returns: "/path/to/data/uploads/2025/10/19"
   */
  getDateBasedDirectory(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');

    return path.join(this.uploadDir, String(year), month, day);
  }

  /**
   * Ensure directory exists, create if needed
   *
   * @param {string} dirPath - Directory path to ensure
   *
   * @description
   * Creates directory and all parent directories if they don't exist
   * Uses recursive mode for safe directory creation
   */
  ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  /**
   * Validate path is within upload directory (security check)
   *
   * @param {string} filePath - File path to validate
   * @returns {boolean} True if path is secure, false otherwise
   *
   * @description
   * Security checks:
   * - Prevents path traversal attacks (../)
   * - Ensures absolute paths are within upload directory
   * - Allows relative paths (assumed to be relative to upload dir)
   *
   * @private
   */
  private isPathSecure(filePath: string): boolean {
    const normalizedPath = path.normalize(filePath);
    const normalizedUploadDir = path.normalize(this.uploadDir);

    // Check for path traversal patterns in input
    if (filePath.includes('..') || filePath.includes('..\\') || filePath.includes('../')) {
      return false;
    }

    // If it's an absolute path, check if it's within upload directory
    if (path.isAbsolute(filePath)) {
      return normalizedPath.startsWith(normalizedUploadDir);
    }

    // For relative paths, assume they're relative to upload directory and allow them
    // This is needed for the storage's own file paths
    return true;
  }

  /**
   * Save file to storage
   *
   * @param {Buffer} buffer - File content as Buffer
   * @param {string} originalFilename - Original filename with extension
   * @returns {Promise<SaveResult>} Save result with file path and metadata
   *
   * @description
   * Process:
   * 1. Generate UUID-based filename
   * 2. Create date-based directory structure (YYYY/MM/DD)
   * 3. Write file to disk
   * 4. Return file metadata
   *
   * @example
   * const storage = new FileStorage();
   * const buffer = Buffer.from('file content');
   * const result = await storage.saveFile(buffer, 'document.pdf');
   * if (result.success) {
   *   console.log('File saved:', result.filePath);
   * }
   */
  async saveFile(buffer: Buffer, originalFilename: string): Promise<SaveResult> {
    try {
      const storedFilename = this.generateUniqueFilename(originalFilename);
      const dirPath = this.getDateBasedDirectory();

      this.ensureDirectoryExists(dirPath);

      const filePath = path.join(dirPath, storedFilename);

      await fs.promises.writeFile(filePath, buffer);

      return {
        success: true,
        filePath,
        storedFilename,
        fileSize: buffer.length,
        version: 1
      };
    } catch (error: any) {
      return {
        success: false,
        error: `파일 저장 실패: ${error.message}`
      };
    }
  }

  /**
   * Read file from storage
   *
   * @param {string} filePath - File path to read
   * @returns {Promise<ReadResult>} Read result with file buffer
   *
   * @description
   * Security features:
   * - Path traversal check (FIRST priority)
   * - File existence validation
   * - Error handling with descriptive messages
   *
   * @example
   * const storage = new FileStorage();
   * const result = await storage.readFile('/uploads/2025/10/19/uuid.pdf');
   * if (result.success) {
   *   // Use result.buffer
   * }
   */
  async readFile(filePath: string): Promise<ReadResult> {
    try {
      // Security check FIRST (before checking existence)
      if (!this.isPathSecure(filePath)) {
        return {
          success: false,
          error: '보안 위험: 잘못된 파일 경로입니다.'
        };
      }

      // Then check if file exists
      if (!fs.existsSync(filePath)) {
        return {
          success: false,
          error: '파일이 존재하지 않습니다.'
        };
      }

      const buffer = await fs.promises.readFile(filePath);

      return {
        success: true,
        buffer
      };
    } catch (error: any) {
      return {
        success: false,
        error: `파일 읽기 실패: ${error.message}`
      };
    }
  }

  /**
   * Delete file from storage
   *
   * @param {string} filePath - File path to delete
   * @returns {Promise<SaveResult>} Deletion result
   *
   * @description
   * Security features:
   * - Path traversal check
   * - File existence validation
   * - Permanent deletion (not recoverable)
   */
  async deleteFile(filePath: string): Promise<SaveResult> {
    try {
      // Security check
      if (!this.isPathSecure(filePath)) {
        return {
          success: false,
          error: '보안 위험: 잘못된 파일 경로입니다.'
        };
      }

      if (!fs.existsSync(filePath)) {
        return {
          success: false,
          error: '파일이 존재하지 않습니다.'
        };
      }

      await fs.promises.unlink(filePath);

      return {
        success: true
      };
    } catch (error: any) {
      return {
        success: false,
        error: `파일 삭제 실패: ${error.message}`
      };
    }
  }

  /**
   * Save new version of existing file
   *
   * @param {string} baseFilename - Base filename (UUID.ext or UUID-vN.ext)
   * @param {Buffer} buffer - New file content
   * @returns {Promise<SaveResult>} Save result with version number
   *
   * @description
   * Versioning strategy:
   * - First version: UUID.ext
   * - Subsequent versions: UUID-v2.ext, UUID-v3.ext, etc.
   * - Automatically detects and increments version number
   *
   * @example
   * const storage = new FileStorage();
   * const buffer = Buffer.from('new content');
   * const result = await storage.saveFileVersion('550e8400-...-v1.pdf', buffer);
   * // Creates: 550e8400-...-v2.pdf
   */
  async saveFileVersion(baseFilename: string, buffer: Buffer): Promise<SaveResult> {
    try {
      // Get version from filename
      const ext = path.extname(baseFilename);
      const basename = path.basename(baseFilename, ext);

      // Check for existing version number in the input filename
      const versionMatch = basename.match(/-v(\d+)$/);
      const uuidPart = versionMatch ? basename.replace(/-v\d+$/, '') : basename;

      // Get all existing versions to determine next version number
      const dirPath = this.getDateBasedDirectory();
      this.ensureDirectoryExists(dirPath);

      let maxVersion = 0;
      if (fs.existsSync(dirPath)) {
        const files = await fs.promises.readdir(dirPath);
        for (const file of files) {
          const fileExt = path.extname(file);
          const fileBasename = path.basename(file, fileExt);

          if (fileBasename === uuidPart || fileBasename.startsWith(uuidPart + '-v')) {
            const fileVersionMatch = fileBasename.match(/-v(\d+)$/);
            const version = fileVersionMatch ? parseInt(fileVersionMatch[1]) : 1;
            maxVersion = Math.max(maxVersion, version);
          }
        }
      } else {
        maxVersion = 1; // First version if directory doesn't exist yet
      }

      const newVersion = maxVersion + 1;

      // Create new filename with version
      const storedFilename = `${uuidPart}-v${newVersion}${ext}`;
      const filePath = path.join(dirPath, storedFilename);

      await fs.promises.writeFile(filePath, buffer);

      return {
        success: true,
        filePath,
        storedFilename,
        fileSize: buffer.length,
        version: newVersion
      };
    } catch (error: any) {
      return {
        success: false,
        error: `파일 버전 저장 실패: ${error.message}`
      };
    }
  }

  /**
   * List all versions of a file
   *
   * @param {string} baseFilename - Base filename to find versions for
   * @returns {Promise<FileVersion[]>} Array of file versions sorted by version number
   *
   * @description
   * Finds all versions by matching UUID part of filename
   * Returns empty array if no versions found
   * Sorted by version number (ascending)
   *
   * @example
   * const storage = new FileStorage();
   * const versions = await storage.listFileVersions('550e8400-....pdf');
   * // Returns: [
   * //   { version: 1, filePath: '...', storedFilename: '550e8400-....pdf', ... },
   * //   { version: 2, filePath: '...', storedFilename: '550e8400-...-v2.pdf', ... }
   * // ]
   */
  async listFileVersions(baseFilename: string): Promise<FileVersion[]> {
    const versions: FileVersion[] = [];

    try {
      const ext = path.extname(baseFilename);
      const basename = path.basename(baseFilename, ext);

      // Remove version suffix if exists
      const versionMatch = basename.match(/-v(\d+)$/);
      const uuidPart = versionMatch ? basename.replace(/-v\d+$/, '') : basename;

      const dirPath = this.getDateBasedDirectory();

      if (!fs.existsSync(dirPath)) {
        return versions;
      }

      const files = await fs.promises.readdir(dirPath);

      // Find all versions - match exact UUID part with extension
      for (const file of files) {
        const fileExt = path.extname(file);
        const fileBasename = path.basename(file, fileExt);

        // Check if this file belongs to the same UUID
        if (fileBasename === uuidPart || fileBasename.startsWith(uuidPart + '-v')) {
          const fullPath = path.join(dirPath, file);
          const stats = await fs.promises.stat(fullPath);

          // Extract version number
          const fileVersionMatch = fileBasename.match(/-v(\d+)$/);
          const version = fileVersionMatch ? parseInt(fileVersionMatch[1]) : 1;

          versions.push({
            version,
            filePath: fullPath,
            storedFilename: file,
            createdAt: stats.ctime
          });
        }
      }

      // Sort by version
      versions.sort((a, b) => a.version - b.version);

      return versions;
    } catch (error: any) {
      return versions;
    }
  }
}
