// @TEST:FILE-001 | Chain: SPEC-FILE-001 -> CODE-FILE-001
// Integration tests for file API endpoints

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { FileStorage } from '@/lib/services/file-storage';
import { FileService } from '@/lib/services/file-service';
import fs from 'fs';
import path from 'path';

describe('FILE API Integration Tests', () => {
  let testDb: Database.Database;
  let fileService: FileService;
  let fileStorage: FileStorage;
  let testUploadDir: string;

  beforeEach(() => {
    // Create test database
    testDb = new Database(':memory:');

    // Create test upload directory
    testUploadDir = path.join(process.cwd(), 'data', 'uploads', 'test');

    // Initialize services
    fileService = new FileService(testDb, testUploadDir);
    fileStorage = new FileStorage(testUploadDir);

    // Create tables
    testDb.exec(`
      CREATE TABLE IF NOT EXISTS files (
        id TEXT PRIMARY KEY,
        original_filename TEXT NOT NULL,
        stored_filename TEXT UNIQUE NOT NULL,
        file_path TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        mime_type TEXT NOT NULL,
        file_extension TEXT NOT NULL,
        uploader_id INTEGER NOT NULL,
        report_id INTEGER,
        consult_id INTEGER,
        uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        deleted_at DATETIME
      );

      CREATE TABLE IF NOT EXISTS reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        report_number TEXT UNIQUE NOT NULL,
        teacher_id INTEGER NOT NULL,
        lawyer_id INTEGER,
        status TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL
      );
    `);

    // Insert test users
    testDb.exec(`
      INSERT INTO users (id, email, name, role) VALUES
      (1, 'teacher@test.com', 'Teacher User', 'teacher'),
      (2, 'lawyer@test.com', 'Lawyer User', 'lawyer'),
      (3, 'admin@test.com', 'Admin User', 'admin'),
      (4, 'teacher2@test.com', 'Teacher 2', 'teacher');
    `);

    // Insert test reports
    testDb.exec(`
      INSERT INTO reports (id, report_number, teacher_id, lawyer_id, status) VALUES
      (1, 'RPT-20250101-0001', 1, 2, 'consulting'),
      (2, 'RPT-20250101-0002', 4, NULL, 'reviewing'),
      (3, 'RPT-20250101-0003', 1, 2, 'completed');
    `);
  });

  afterEach(() => {
    // Clean up database
    testDb.close();

    // Clean up test upload directory
    if (fs.existsSync(testUploadDir)) {
      fs.rmSync(testUploadDir, { recursive: true, force: true });
    }
  });

  describe('File Access Control', () => {
    it('TEST-FILE-ACCESS-001: Owner can access their file', async () => {
      // Create test file
      const fileId = 'test-file-001';
      testDb.prepare(`
        INSERT INTO files (
          id, original_filename, stored_filename, file_path,
          file_size, mime_type, file_extension, uploader_id, report_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        fileId,
        'test.pdf',
        'uuid-test.pdf',
        '/uploads/uuid-test.pdf',
        1000,
        'application/pdf',
        '.pdf',
        1, // Teacher 1 is owner
        1
      );

      const canAccess = await fileService.canAccessFile(fileId, 1, 'teacher');
      expect(canAccess).toBe(true);
    });

    it('TEST-FILE-ACCESS-002: Admin can access all files', async () => {
      const fileId = 'test-file-002';
      testDb.prepare(`
        INSERT INTO files (
          id, original_filename, stored_filename, file_path,
          file_size, mime_type, file_extension, uploader_id, report_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        fileId,
        'test.pdf',
        'uuid-test2.pdf',
        '/uploads/uuid-test2.pdf',
        1000,
        'application/pdf',
        '.pdf',
        1, // Teacher 1 is owner
        1
      );

      const canAccess = await fileService.canAccessFile(fileId, 3, 'admin');
      expect(canAccess).toBe(true);
    });

    it('TEST-FILE-ACCESS-003: Assigned lawyer can access report files', async () => {
      const fileId = 'test-file-003';
      testDb.prepare(`
        INSERT INTO files (
          id, original_filename, stored_filename, file_path,
          file_size, mime_type, file_extension, uploader_id, report_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        fileId,
        'test.pdf',
        'uuid-test3.pdf',
        '/uploads/uuid-test3.pdf',
        1000,
        'application/pdf',
        '.pdf',
        1,
        1 // Report 1 has lawyer_id = 2
      );

      const canAccess = await fileService.canAccessFile(fileId, 2, 'lawyer');
      expect(canAccess).toBe(true);
    });

    it('TEST-FILE-ACCESS-004: Non-assigned teacher cannot access other teacher files', async () => {
      const fileId = 'test-file-004';
      testDb.prepare(`
        INSERT INTO files (
          id, original_filename, stored_filename, file_path,
          file_size, mime_type, file_extension, uploader_id, report_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        fileId,
        'test.pdf',
        'uuid-test4.pdf',
        '/uploads/uuid-test4.pdf',
        1000,
        'application/pdf',
        '.pdf',
        1, // Teacher 1 is owner
        1
      );

      const canAccess = await fileService.canAccessFile(fileId, 4, 'teacher'); // Teacher 4
      expect(canAccess).toBe(false);
    });

    it('TEST-FILE-ACCESS-005: Non-assigned lawyer cannot access files', async () => {
      const fileId = 'test-file-005';
      testDb.prepare(`
        INSERT INTO files (
          id, original_filename, stored_filename, file_path,
          file_size, mime_type, file_extension, uploader_id, report_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        fileId,
        'test.pdf',
        'uuid-test5.pdf',
        '/uploads/uuid-test5.pdf',
        1000,
        'application/pdf',
        '.pdf',
        4,
        2 // Report 2 has no lawyer assigned
      );

      const canAccess = await fileService.canAccessFile(fileId, 2, 'lawyer');
      expect(canAccess).toBe(false);
    });
  });

  describe('File Delete Permissions', () => {
    it('TEST-FILE-DELETE-001: Owner can delete their file', async () => {
      const fileId = 'test-delete-001';
      testDb.prepare(`
        INSERT INTO files (
          id, original_filename, stored_filename, file_path,
          file_size, mime_type, file_extension, uploader_id, report_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        fileId,
        'test.pdf',
        'uuid-delete1.pdf',
        '/uploads/uuid-delete1.pdf',
        1000,
        'application/pdf',
        '.pdf',
        1,
        1 // Report 1 status = 'consulting' (not completed)
      );

      const canDelete = await fileService.canDeleteFile(fileId, 1, 'teacher');
      expect(canDelete).toBe(true);
    });

    it('TEST-FILE-DELETE-002: Cannot delete file from completed report', async () => {
      const fileId = 'test-delete-002';
      testDb.prepare(`
        INSERT INTO files (
          id, original_filename, stored_filename, file_path,
          file_size, mime_type, file_extension, uploader_id, report_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        fileId,
        'test.pdf',
        'uuid-delete2.pdf',
        '/uploads/uuid-delete2.pdf',
        1000,
        'application/pdf',
        '.pdf',
        1,
        3 // Report 3 status = 'completed'
      );

      const canDelete = await fileService.canDeleteFile(fileId, 1, 'teacher');
      expect(canDelete).toBe(false);
    });

    it('TEST-FILE-DELETE-003: Admin can delete non-completed report files', async () => {
      const fileId = 'test-delete-003';
      testDb.prepare(`
        INSERT INTO files (
          id, original_filename, stored_filename, file_path,
          file_size, mime_type, file_extension, uploader_id, report_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        fileId,
        'test.pdf',
        'uuid-delete3.pdf',
        '/uploads/uuid-delete3.pdf',
        1000,
        'application/pdf',
        '.pdf',
        1,
        1 // Report 1 status = 'consulting'
      );

      const canDelete = await fileService.canDeleteFile(fileId, 3, 'admin');
      expect(canDelete).toBe(true);
    });

    it('TEST-FILE-DELETE-004: Admin cannot delete completed report files', async () => {
      const fileId = 'test-delete-004';
      testDb.prepare(`
        INSERT INTO files (
          id, original_filename, stored_filename, file_path,
          file_size, mime_type, file_extension, uploader_id, report_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        fileId,
        'test.pdf',
        'uuid-delete4.pdf',
        '/uploads/uuid-delete4.pdf',
        1000,
        'application/pdf',
        '.pdf',
        1,
        3 // Report 3 status = 'completed'
      );

      const canDelete = await fileService.canDeleteFile(fileId, 3, 'admin');
      expect(canDelete).toBe(false);
    });

    it('TEST-FILE-DELETE-005: Lawyer cannot delete files', async () => {
      const fileId = 'test-delete-005';
      testDb.prepare(`
        INSERT INTO files (
          id, original_filename, stored_filename, file_path,
          file_size, mime_type, file_extension, uploader_id, report_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        fileId,
        'test.pdf',
        'uuid-delete5.pdf',
        '/uploads/uuid-delete5.pdf',
        1000,
        'application/pdf',
        '.pdf',
        1,
        1
      );

      const canDelete = await fileService.canDeleteFile(fileId, 2, 'lawyer');
      expect(canDelete).toBe(false);
    });
  });

  describe('File Storage Operations', () => {
    it('TEST-FILE-STORAGE-001: Should save file successfully', async () => {
      const buffer = Buffer.from('test file content');
      const result = await fileStorage.saveFile(buffer, 'test.pdf');

      expect(result.success).toBe(true);
      expect(result.storedFilename).toBeDefined();
      expect(result.filePath).toBeDefined();
      expect(result.fileSize).toBe(buffer.length);
      expect(result.version).toBe(1);
    });

    it('TEST-FILE-STORAGE-002: Should read saved file', async () => {
      const buffer = Buffer.from('test file content');
      const saveResult = await fileStorage.saveFile(buffer, 'test.pdf');

      expect(saveResult.success).toBe(true);

      const readResult = await fileStorage.readFile(saveResult.filePath!);

      expect(readResult.success).toBe(true);
      expect(readResult.buffer).toBeDefined();
      expect(readResult.buffer?.toString()).toBe('test file content');
    });

    it('TEST-FILE-STORAGE-003: Should delete file successfully', async () => {
      const buffer = Buffer.from('test file content');
      const saveResult = await fileStorage.saveFile(buffer, 'test.pdf');

      expect(saveResult.success).toBe(true);

      const deleteResult = await fileStorage.deleteFile(saveResult.filePath!);

      expect(deleteResult.success).toBe(true);

      // Verify file is deleted
      const readResult = await fileStorage.readFile(saveResult.filePath!);
      expect(readResult.success).toBe(false);
    });

    it('TEST-FILE-STORAGE-004: Should prevent path traversal attacks', async () => {
      const maliciousPath = '../../../etc/passwd';
      const readResult = await fileStorage.readFile(maliciousPath);

      expect(readResult.success).toBe(false);
      expect(readResult.error).toContain('보안 위험');
    });
  });

  describe('File Versioning', () => {
    it('TEST-FILE-VERSION-001: Should create new version of file', async () => {
      const buffer1 = Buffer.from('version 1 content');
      const saveResult1 = await fileStorage.saveFile(buffer1, 'test.pdf');

      expect(saveResult1.success).toBe(true);
      expect(saveResult1.version).toBe(1);

      const buffer2 = Buffer.from('version 2 content');
      const saveResult2 = await fileStorage.saveFileVersion(
        saveResult1.storedFilename!,
        buffer2
      );

      expect(saveResult2.success).toBe(true);
      expect(saveResult2.version).toBe(2);
    });

    it('TEST-FILE-VERSION-002: Should list all file versions', async () => {
      const buffer1 = Buffer.from('version 1');
      const saveResult1 = await fileStorage.saveFile(buffer1, 'test.pdf');

      const buffer2 = Buffer.from('version 2');
      await fileStorage.saveFileVersion(saveResult1.storedFilename!, buffer2);

      const buffer3 = Buffer.from('version 3');
      await fileStorage.saveFileVersion(saveResult1.storedFilename!, buffer3);

      const versions = await fileStorage.listFileVersions(
        saveResult1.storedFilename!
      );

      expect(versions.length).toBe(3);
      expect(versions[0].version).toBe(1);
      expect(versions[1].version).toBe(2);
      expect(versions[2].version).toBe(3);
    });
  });
});
