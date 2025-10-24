// @TEST:FILE-ACCESS-001 | Chain: SPEC-FILE-001 -> CODE-FILE-001
// TEST-FILE-ACCESS-001: File access control tests (role-based permissions, owner verification)

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { FileService } from '@/lib/services/file-service';
import { UserRole } from '@/lib/types';

describe('File Access Control', () => {
  let db: Database.Database;
  let fileService: FileService;
  const testDbPath = path.join(process.cwd(), 'data', 'test-files-access.db');
  const testUploadDir = path.join(process.cwd(), 'data', 'test-uploads-access');

  const teacherUser = {
    id: 1,
    email: 'teacher@test.com',
    name: 'Test Teacher',
    role: 'teacher' as UserRole,
  };

  const otherTeacherUser = {
    id: 2,
    email: 'teacher2@test.com',
    name: 'Other Teacher',
    role: 'teacher' as UserRole,
  };

  const lawyerUser = {
    id: 3,
    email: 'lawyer@test.com',
    name: 'Test Lawyer',
    role: 'lawyer' as UserRole,
  };

  const adminUser = {
    id: 4,
    email: 'admin@test.com',
    name: 'Test Admin',
    role: 'admin' as UserRole,
  };

  const superAdminUser = {
    id: 5,
    email: 'super@test.com',
    name: 'Super Admin',
    role: 'super_admin' as UserRole,
  };

  beforeEach(() => {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    db = new Database(testDbPath);
    db.exec('PRAGMA foreign_keys = ON');

    // Create tables
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT DEFAULT 'teacher',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        report_number TEXT UNIQUE NOT NULL,
        teacher_id INTEGER NOT NULL,
        lawyer_id INTEGER,
        status TEXT DEFAULT 'received',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (teacher_id) REFERENCES users(id),
        FOREIGN KEY (lawyer_id) REFERENCES users(id)
      )
    `);

    db.exec(`
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
        uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        deleted_at DATETIME,
        FOREIGN KEY (uploader_id) REFERENCES users(id),
        FOREIGN KEY (report_id) REFERENCES reports(id)
      )
    `);

    // Insert test users
    db.exec(`
      INSERT INTO users (id, email, password, name, role)
      VALUES
        (1, 'teacher@test.com', 'hashed', 'Test Teacher', 'teacher'),
        (2, 'teacher2@test.com', 'hashed', 'Other Teacher', 'teacher'),
        (3, 'lawyer@test.com', 'hashed', 'Test Lawyer', 'lawyer'),
        (4, 'admin@test.com', 'hashed', 'Test Admin', 'admin'),
        (5, 'super@test.com', 'hashed', 'Super Admin', 'super_admin')
    `);

    fileService = new FileService(db, testUploadDir);
  });

  afterEach(() => {
    db.close();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    if (fs.existsSync(testUploadDir)) {
      fs.rmSync(testUploadDir, { recursive: true, force: true });
    }
  });

  describe('TEST-FILE-ACCESS-001-OWNER: Owner access', () => {
    it('should allow uploader to access their own file', async () => {
      const fileId = 'test-file-001';

      // Insert test file
      db.exec(`
        INSERT INTO files (id, original_filename, stored_filename, file_path, file_size, mime_type, file_extension, uploader_id)
        VALUES ('${fileId}', 'test.jpg', 'uuid.jpg', '/path/to/uuid.jpg', 1024, 'image/jpeg', '.jpg', ${teacherUser.id})
      `);

      const canAccess = await fileService.canAccessFile(fileId, teacherUser.id, teacherUser.role);

      expect(canAccess).toBe(true);
    });

    it('should allow uploader to download their own file', async () => {
      const fileId = 'test-file-002';

      db.exec(`
        INSERT INTO files (id, original_filename, stored_filename, file_path, file_size, mime_type, file_extension, uploader_id)
        VALUES ('${fileId}', 'test.pdf', 'uuid.pdf', '/path/to/uuid.pdf', 2048, 'application/pdf', '.pdf', ${teacherUser.id})
      `);

      const canDownload = await fileService.canDownloadFile(fileId, teacherUser.id, teacherUser.role);

      expect(canDownload).toBe(true);
    });

    it('should allow uploader to delete their own file', async () => {
      const fileId = 'test-file-003';

      db.exec(`
        INSERT INTO files (id, original_filename, stored_filename, file_path, file_size, mime_type, file_extension, uploader_id)
        VALUES ('${fileId}', 'test.png', 'uuid.png', '/path/to/uuid.png', 512, 'image/png', '.png', ${teacherUser.id})
      `);

      const canDelete = await fileService.canDeleteFile(fileId, teacherUser.id, teacherUser.role);

      expect(canDelete).toBe(true);
    });
  });

  describe('TEST-FILE-ACCESS-001-OTHER: Other user access denial', () => {
    it('should deny access to other teacher files', async () => {
      const fileId = 'test-file-004';

      db.exec(`
        INSERT INTO files (id, original_filename, stored_filename, file_path, file_size, mime_type, file_extension, uploader_id)
        VALUES ('${fileId}', 'test.jpg', 'uuid.jpg', '/path/to/uuid.jpg', 1024, 'image/jpeg', '.jpg', ${teacherUser.id})
      `);

      const canAccess = await fileService.canAccessFile(fileId, otherTeacherUser.id, otherTeacherUser.role);

      expect(canAccess).toBe(false);
    });

    it('should deny download to other teacher files', async () => {
      const fileId = 'test-file-005';

      db.exec(`
        INSERT INTO files (id, original_filename, stored_filename, file_path, file_size, mime_type, file_extension, uploader_id)
        VALUES ('${fileId}', 'test.pdf', 'uuid.pdf', '/path/to/uuid.pdf', 2048, 'application/pdf', '.pdf', ${teacherUser.id})
      `);

      const canDownload = await fileService.canDownloadFile(fileId, otherTeacherUser.id, otherTeacherUser.role);

      expect(canDownload).toBe(false);
    });

    it('should deny deletion to other teacher files', async () => {
      const fileId = 'test-file-006';

      db.exec(`
        INSERT INTO files (id, original_filename, stored_filename, file_path, file_size, mime_type, file_extension, uploader_id)
        VALUES ('${fileId}', 'test.png', 'uuid.png', '/path/to/uuid.png', 512, 'image/png', '.png', ${teacherUser.id})
      `);

      const canDelete = await fileService.canDeleteFile(fileId, otherTeacherUser.id, otherTeacherUser.role);

      expect(canDelete).toBe(false);
    });
  });

  describe('TEST-FILE-ACCESS-001-ADMIN: Admin access', () => {
    it('should allow admin to access any file', async () => {
      const fileId = 'test-file-007';

      db.exec(`
        INSERT INTO files (id, original_filename, stored_filename, file_path, file_size, mime_type, file_extension, uploader_id)
        VALUES ('${fileId}', 'test.jpg', 'uuid.jpg', '/path/to/uuid.jpg', 1024, 'image/jpeg', '.jpg', ${teacherUser.id})
      `);

      const canAccess = await fileService.canAccessFile(fileId, adminUser.id, adminUser.role);

      expect(canAccess).toBe(true);
    });

    it('should allow admin to download any file', async () => {
      const fileId = 'test-file-008';

      db.exec(`
        INSERT INTO files (id, original_filename, stored_filename, file_path, file_size, mime_type, file_extension, uploader_id)
        VALUES ('${fileId}', 'test.pdf', 'uuid.pdf', '/path/to/uuid.pdf', 2048, 'application/pdf', '.pdf', ${teacherUser.id})
      `);

      const canDownload = await fileService.canDownloadFile(fileId, adminUser.id, adminUser.role);

      expect(canDownload).toBe(true);
    });

    it('should allow admin to delete any file', async () => {
      const fileId = 'test-file-009';

      db.exec(`
        INSERT INTO files (id, original_filename, stored_filename, file_path, file_size, mime_type, file_extension, uploader_id)
        VALUES ('${fileId}', 'test.png', 'uuid.png', '/path/to/uuid.png', 512, 'image/png', '.png', ${teacherUser.id})
      `);

      const canDelete = await fileService.canDeleteFile(fileId, adminUser.id, adminUser.role);

      expect(canDelete).toBe(true);
    });

    it('should allow super_admin to access any file', async () => {
      const fileId = 'test-file-010';

      db.exec(`
        INSERT INTO files (id, original_filename, stored_filename, file_path, file_size, mime_type, file_extension, uploader_id)
        VALUES ('${fileId}', 'test.jpg', 'uuid.jpg', '/path/to/uuid.jpg', 1024, 'image/jpeg', '.jpg', ${teacherUser.id})
      `);

      const canAccess = await fileService.canAccessFile(fileId, superAdminUser.id, superAdminUser.role);

      expect(canAccess).toBe(true);
    });
  });

  describe('TEST-FILE-ACCESS-001-LAWYER: Lawyer access via report', () => {
    it('should allow assigned lawyer to access report files', async () => {
      const reportId = 1;
      const fileId = 'test-file-011';

      // Create report with assigned lawyer
      db.exec(`
        INSERT INTO reports (id, report_number, teacher_id, lawyer_id, status)
        VALUES (${reportId}, 'RPT-001', ${teacherUser.id}, ${lawyerUser.id}, 'consulting')
      `);

      // Create file linked to report
      db.exec(`
        INSERT INTO files (id, original_filename, stored_filename, file_path, file_size, mime_type, file_extension, uploader_id, report_id)
        VALUES ('${fileId}', 'evidence.jpg', 'uuid.jpg', '/path/to/uuid.jpg', 1024, 'image/jpeg', '.jpg', ${teacherUser.id}, ${reportId})
      `);

      const canAccess = await fileService.canAccessFile(fileId, lawyerUser.id, lawyerUser.role);

      expect(canAccess).toBe(true);
    });

    it('should deny unassigned lawyer access to report files', async () => {
      const reportId = 2;
      const fileId = 'test-file-012';
      const otherLawyerId = 99;

      // Create report without assigned lawyer (or different lawyer)
      db.exec(`
        INSERT INTO reports (id, report_number, teacher_id, status)
        VALUES (${reportId}, 'RPT-002', ${teacherUser.id}, 'received')
      `);

      db.exec(`
        INSERT INTO files (id, original_filename, stored_filename, file_path, file_size, mime_type, file_extension, uploader_id, report_id)
        VALUES ('${fileId}', 'evidence.jpg', 'uuid.jpg', '/path/to/uuid.jpg', 1024, 'image/jpeg', '.jpg', ${teacherUser.id}, ${reportId})
      `);

      const canAccess = await fileService.canAccessFile(fileId, otherLawyerId, 'lawyer' as UserRole);

      expect(canAccess).toBe(false);
    });

    it('should allow lawyer to download assigned report files', async () => {
      const reportId = 3;
      const fileId = 'test-file-013';

      db.exec(`
        INSERT INTO reports (id, report_number, teacher_id, lawyer_id, status)
        VALUES (${reportId}, 'RPT-003', ${teacherUser.id}, ${lawyerUser.id}, 'consulting')
      `);

      db.exec(`
        INSERT INTO files (id, original_filename, stored_filename, file_path, file_size, mime_type, file_extension, uploader_id, report_id)
        VALUES ('${fileId}', 'evidence.pdf', 'uuid.pdf', '/path/to/uuid.pdf', 2048, 'application/pdf', '.pdf', ${teacherUser.id}, ${reportId})
      `);

      const canDownload = await fileService.canDownloadFile(fileId, lawyerUser.id, lawyerUser.role);

      expect(canDownload).toBe(true);
    });

    it('should prevent lawyer from deleting report files', async () => {
      const reportId = 4;
      const fileId = 'test-file-014';

      db.exec(`
        INSERT INTO reports (id, report_number, teacher_id, lawyer_id, status)
        VALUES (${reportId}, 'RPT-004', ${teacherUser.id}, ${lawyerUser.id}, 'consulting')
      `);

      db.exec(`
        INSERT INTO files (id, original_filename, stored_filename, file_path, file_size, mime_type, file_extension, uploader_id, report_id)
        VALUES ('${fileId}', 'evidence.jpg', 'uuid.jpg', '/path/to/uuid.jpg', 1024, 'image/jpeg', '.jpg', ${teacherUser.id}, ${reportId})
      `);

      const canDelete = await fileService.canDeleteFile(fileId, lawyerUser.id, lawyerUser.role);

      expect(canDelete).toBe(false);
    });
  });

  describe('TEST-FILE-ACCESS-001-REPORT: Report completion restrictions', () => {
    it('should prevent deletion of files from completed reports', async () => {
      const reportId = 5;
      const fileId = 'test-file-015';

      db.exec(`
        INSERT INTO reports (id, report_number, teacher_id, status)
        VALUES (${reportId}, 'RPT-005', ${teacherUser.id}, 'completed')
      `);

      db.exec(`
        INSERT INTO files (id, original_filename, stored_filename, file_path, file_size, mime_type, file_extension, uploader_id, report_id)
        VALUES ('${fileId}', 'evidence.jpg', 'uuid.jpg', '/path/to/uuid.jpg', 1024, 'image/jpeg', '.jpg', ${teacherUser.id}, ${reportId})
      `);

      const canDelete = await fileService.canDeleteFile(fileId, teacherUser.id, teacherUser.role);

      expect(canDelete).toBe(false);
    });

    it('should prevent admin from deleting files from completed reports', async () => {
      const reportId = 6;
      const fileId = 'test-file-016';

      db.exec(`
        INSERT INTO reports (id, report_number, teacher_id, status)
        VALUES (${reportId}, 'RPT-006', ${teacherUser.id}, 'completed')
      `);

      db.exec(`
        INSERT INTO files (id, original_filename, stored_filename, file_path, file_size, mime_type, file_extension, uploader_id, report_id)
        VALUES ('${fileId}', 'evidence.pdf', 'uuid.pdf', '/path/to/uuid.pdf', 2048, 'application/pdf', '.pdf', ${teacherUser.id}, ${reportId})
      `);

      const canDelete = await fileService.canDeleteFile(fileId, adminUser.id, adminUser.role);

      expect(canDelete).toBe(false);
    });

    it('should allow access to files from completed reports', async () => {
      const reportId = 7;
      const fileId = 'test-file-017';

      db.exec(`
        INSERT INTO reports (id, report_number, teacher_id, lawyer_id, status)
        VALUES (${reportId}, 'RPT-007', ${teacherUser.id}, ${lawyerUser.id}, 'completed')
      `);

      db.exec(`
        INSERT INTO files (id, original_filename, stored_filename, file_path, file_size, mime_type, file_extension, uploader_id, report_id)
        VALUES ('${fileId}', 'evidence.jpg', 'uuid.jpg', '/path/to/uuid.jpg', 1024, 'image/jpeg', '.jpg', ${teacherUser.id}, ${reportId})
      `);

      const teacherCanAccess = await fileService.canAccessFile(fileId, teacherUser.id, teacherUser.role);
      const lawyerCanAccess = await fileService.canAccessFile(fileId, lawyerUser.id, lawyerUser.role);
      const adminCanAccess = await fileService.canAccessFile(fileId, adminUser.id, adminUser.role);

      expect(teacherCanAccess).toBe(true);
      expect(lawyerCanAccess).toBe(true);
      expect(adminCanAccess).toBe(true);
    });
  });

  describe('TEST-FILE-ACCESS-001-NOTFOUND: Non-existent file handling', () => {
    it('should return false for non-existent file access', async () => {
      const canAccess = await fileService.canAccessFile('non-existent-file', teacherUser.id, teacherUser.role);

      expect(canAccess).toBe(false);
    });

    it('should return false for non-existent file download', async () => {
      const canDownload = await fileService.canDownloadFile('non-existent-file', teacherUser.id, teacherUser.role);

      expect(canDownload).toBe(false);
    });

    it('should return false for non-existent file deletion', async () => {
      const canDelete = await fileService.canDeleteFile('non-existent-file', teacherUser.id, teacherUser.role);

      expect(canDelete).toBe(false);
    });
  });
});
