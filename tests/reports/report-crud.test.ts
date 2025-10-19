// @TEST:REPORT-CRUD-001 | Chain: SPEC-REPORT-001 -> CODE-REPORT-001
// TEST-REPORT-CRUD-001: Report CRUD operations with role-based access tests
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { ReportService } from '@/lib/services/report-service';
import { UserRole } from '@/lib/types';

describe('Report CRUD Operations', () => {
  let db: Database.Database;
  let reportService: ReportService;
  const testDbPath = path.join(process.cwd(), 'data', 'test-reports-crud.db');

  const teacherUser = {
    id: 1,
    email: 'teacher@test.com',
    name: 'Test Teacher',
    role: 'teacher' as UserRole,
  };

  const adminUser = {
    id: 2,
    email: 'admin@test.com',
    name: 'Test Admin',
    role: 'admin' as UserRole,
  };

  const lawyerUser = {
    id: 3,
    email: 'lawyer@test.com',
    name: 'Test Lawyer',
    role: 'lawyer' as UserRole,
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
        category TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        incident_date DATE NOT NULL,
        location TEXT NOT NULL,
        witness_count INTEGER,
        is_emergency BOOLEAN DEFAULT 0,
        status TEXT DEFAULT 'received',
        lawyer_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME,
        FOREIGN KEY (teacher_id) REFERENCES users(id),
        FOREIGN KEY (lawyer_id) REFERENCES users(id)
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS report_status_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        report_id INTEGER NOT NULL,
        from_status TEXT,
        to_status TEXT NOT NULL,
        changed_by INTEGER NOT NULL,
        changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        note TEXT,
        FOREIGN KEY (report_id) REFERENCES reports(id),
        FOREIGN KEY (changed_by) REFERENCES users(id)
      )
    `);

    // Insert test users
    db.exec(`
      INSERT INTO users (id, email, password, name, role)
      VALUES
        (1, 'teacher@test.com', 'hashed', 'Test Teacher', 'teacher'),
        (2, 'admin@test.com', 'hashed', 'Test Admin', 'admin'),
        (3, 'lawyer@test.com', 'hashed', 'Test Lawyer', 'lawyer')
    `);

    reportService = new ReportService(db);
  });

  afterEach(() => {
    db.close();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('TEST-REPORT-CRUD-001-CREATE: Create Report', () => {
    it('should create report with valid data as teacher', async () => {
      const reportData = {
        category: '학부모 민원',
        title: 'Test Report',
        description: 'Test description',
        incident_date: '2025-10-17',
        location: 'Test School',
        witness_count: 2,
        is_emergency: false,
      };

      const report = await reportService.createReport(teacherUser.id, reportData);

      expect(report).toBeDefined();
      expect(report.report_number).toMatch(/^RPT-\d{8}-\d{4}$/);
      expect(report.status).toBe('received');
      expect(report.teacher_id).toBe(teacherUser.id);
    });

    it('should reject report creation with missing required fields', async () => {
      const invalidData = {
        category: '학부모 민원',
        // Missing title, description, etc.
      };

      await expect(
        reportService.createReport(teacherUser.id, invalidData as any)
      ).rejects.toThrow();
    });

    it('should reject report with invalid category', async () => {
      const invalidData = {
        category: 'invalid_category',
        title: 'Test',
        description: 'Test',
        incident_date: '2025-10-17',
        location: 'Test',
      };

      await expect(
        reportService.createReport(teacherUser.id, invalidData)
      ).rejects.toThrow();
    });

    it('should enforce title length limit (100 characters)', async () => {
      const longTitle = 'a'.repeat(101);
      const reportData = {
        category: '학부모 민원',
        title: longTitle,
        description: 'Test',
        incident_date: '2025-10-17',
        location: 'Test',
      };

      await expect(
        reportService.createReport(teacherUser.id, reportData)
      ).rejects.toThrow();
    });

    it('should enforce description length limit (2000 characters)', async () => {
      const longDescription = 'a'.repeat(2001);
      const reportData = {
        category: '학부모 민원',
        title: 'Test',
        description: longDescription,
        incident_date: '2025-10-17',
        location: 'Test',
      };

      await expect(
        reportService.createReport(teacherUser.id, reportData)
      ).rejects.toThrow();
    });
  });

  describe('TEST-REPORT-CRUD-001-READ: Read Reports', () => {
    it('should allow teacher to read own reports only', async () => {
      // Create reports for teacher
      const reportData = {
        category: '학부모 민원',
        title: 'My Report',
        description: 'Test',
        incident_date: '2025-10-17',
        location: 'Test',
      };

      await reportService.createReport(teacherUser.id, reportData);

      const reports = await reportService.getReportsByUser(teacherUser.id, teacherUser.role);

      expect(reports).toHaveLength(1);
      expect(reports[0].teacher_id).toBe(teacherUser.id);
    });

    it('should allow admin to read all reports', async () => {
      // Create reports from different teachers
      await reportService.createReport(teacherUser.id, {
        category: '학부모 민원',
        title: 'Report 1',
        description: 'Test',
        incident_date: '2025-10-17',
        location: 'Test',
      });

      const reports = await reportService.getAllReports(adminUser.role);

      expect(reports.length).toBeGreaterThanOrEqual(1);
    });

    it('should get report by ID with proper access control', async () => {
      const created = await reportService.createReport(teacherUser.id, {
        category: '학부모 민원',
        title: 'Test',
        description: 'Test',
        incident_date: '2025-10-17',
        location: 'Test',
      });

      const report = await reportService.getReportById(
        created.id,
        teacherUser.id,
        teacherUser.role
      );

      expect(report).toBeDefined();
      expect(report!.id).toBe(created.id);
    });

    it('should reject access to other teacher reports', async () => {
      const created = await reportService.createReport(teacherUser.id, {
        category: '학부모 민원',
        title: 'Test',
        description: 'Test',
        incident_date: '2025-10-17',
        location: 'Test',
      });

      await expect(
        reportService.getReportById(created.id, 999, 'teacher' as UserRole)
      ).rejects.toThrow('Access denied');
    });
  });

  describe('TEST-REPORT-CRUD-001-UPDATE: Update Reports', () => {
    it('should allow teacher to update own report in received state', async () => {
      const created = await reportService.createReport(teacherUser.id, {
        category: '학부모 민원',
        title: 'Original Title',
        description: 'Original Description',
        incident_date: '2025-10-17',
        location: 'Test',
      });

      const updated = await reportService.updateReport(
        created.id,
        teacherUser.id,
        teacherUser.role,
        {
          title: 'Updated Title',
          description: 'Updated Description',
        }
      );

      expect(updated.title).toBe('Updated Title');
      expect(updated.description).toBe('Updated Description');
    });

    it('should prevent teacher from updating report in reviewing state', async () => {
      const created = await reportService.createReport(teacherUser.id, {
        category: '학부모 민원',
        title: 'Test',
        description: 'Test',
        incident_date: '2025-10-17',
        location: 'Test',
      });

      // Admin changes status to reviewing
      await reportService.updateReportStatus(
        created.id,
        'reviewing',
        adminUser.id,
        'Starting review'
      );

      await expect(
        reportService.updateReport(created.id, teacherUser.id, teacherUser.role, {
          title: 'Trying to update',
        })
      ).rejects.toThrow('Cannot update report in current status');
    });

    it('should prevent updates to completed reports', async () => {
      const created = await reportService.createReport(teacherUser.id, {
        category: '학부모 민원',
        title: 'Test',
        description: 'Test',
        incident_date: '2025-10-17',
        location: 'Test',
      });

      // Complete the report
      await reportService.updateReportStatus(
        created.id,
        'completed',
        adminUser.id,
        'Case resolved'
      );

      await expect(
        reportService.updateReport(created.id, adminUser.id, adminUser.role, {
          title: 'Trying to update completed',
        })
      ).rejects.toThrow('Cannot update completed report');
    });
  });

  describe('TEST-REPORT-CRUD-001-DELETE: Delete Reports', () => {
    it('should prevent deletion of reports (preservation requirement)', async () => {
      const created = await reportService.createReport(teacherUser.id, {
        category: '학부모 민원',
        title: 'Test',
        description: 'Test',
        incident_date: '2025-10-17',
        location: 'Test',
      });

      await expect(
        reportService.deleteReport(created.id, teacherUser.id, teacherUser.role)
      ).rejects.toThrow('Reports cannot be deleted');
    });

    it('should prevent admin from deleting reports', async () => {
      const created = await reportService.createReport(teacherUser.id, {
        category: '학부모 민원',
        title: 'Test',
        description: 'Test',
        incident_date: '2025-10-17',
        location: 'Test',
      });

      await expect(
        reportService.deleteReport(created.id, adminUser.id, adminUser.role)
      ).rejects.toThrow('Reports cannot be deleted');
    });
  });

  describe('TEST-REPORT-CRUD-001-STATUS: Status Management', () => {
    it('should record status history when changing status', async () => {
      const created = await reportService.createReport(teacherUser.id, {
        category: '학부모 민원',
        title: 'Test',
        description: 'Test',
        incident_date: '2025-10-17',
        location: 'Test',
      });

      await reportService.updateReportStatus(
        created.id,
        'reviewing',
        adminUser.id,
        'Starting review process'
      );

      const history = await reportService.getStatusHistory(created.id);

      expect(history).toHaveLength(1);
      expect(history[0].from_status).toBe('received');
      expect(history[0].to_status).toBe('reviewing');
      expect(history[0].changed_by).toBe(adminUser.id);
      expect(history[0].note).toBe('Starting review process');
    });

    it('should validate state transitions when updating status', async () => {
      const created = await reportService.createReport(teacherUser.id, {
        category: '학부모 민원',
        title: 'Test',
        description: 'Test',
        incident_date: '2025-10-17',
        location: 'Test',
      });

      await expect(
        reportService.updateReportStatus(
          created.id,
          'consulting',
          adminUser.id,
          'Invalid transition'
        )
      ).rejects.toThrow('Invalid status transition');
    });

    it('should prevent backward status transitions', async () => {
      const created = await reportService.createReport(teacherUser.id, {
        category: '학부모 민원',
        title: 'Test',
        description: 'Test',
        incident_date: '2025-10-17',
        location: 'Test',
      });

      await reportService.updateReportStatus(created.id, 'reviewing', adminUser.id);

      await expect(
        reportService.updateReportStatus(created.id, 'received', adminUser.id)
      ).rejects.toThrow('Invalid status transition');
    });
  });
});
