// @TEST:CONSULT-MGMT-001 | Chain: SPEC-CONSULT-001 -> CODE-CONSULT-001
// TEST-CONSULT-MGMT-001: Consultation management and lifecycle tests
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { ConsultService } from '@/lib/services/consult-service';
import { UserRole } from '@/lib/types';
import { ConsultStatus } from '@/lib/types/consult';

describe('Consultation Management', () => {
  let db: Database.Database;
  let consultService: ConsultService;
  const testDbPath = path.join(process.cwd(), 'data', 'test-consult-mgmt.db');

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
      CREATE TABLE IF NOT EXISTS lawyers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE,
        name TEXT NOT NULL,
        specialty TEXT NOT NULL,
        license_number TEXT UNIQUE,
        bio TEXT,
        years_of_experience INTEGER,
        is_verified BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS lawyer_specialties (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        lawyer_id INTEGER NOT NULL,
        specialty TEXT NOT NULL,
        is_primary BOOLEAN DEFAULT FALSE,
        FOREIGN KEY (lawyer_id) REFERENCES lawyers(id)
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS consults (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        consult_no TEXT UNIQUE NOT NULL,
        teacher_id INTEGER NOT NULL,
        lawyer_id INTEGER,
        report_id INTEGER,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        category TEXT NOT NULL,
        urgency TEXT DEFAULT 'normal',
        status TEXT DEFAULT 'pending',
        matched_at DATETIME,
        completed_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (teacher_id) REFERENCES users(id),
        FOREIGN KEY (lawyer_id) REFERENCES lawyers(id)
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

    db.exec(`
      INSERT INTO lawyers (id, user_id, name, specialty, is_verified)
      VALUES (1, 3, 'Test Lawyer', '학부모 민원', 1)
    `);

    db.exec(`
      INSERT INTO lawyer_specialties (lawyer_id, specialty, is_primary)
      VALUES (1, '학부모 민원', 1)
    `);

    consultService = new ConsultService(db);
  });

  afterEach(() => {
    db.close();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('TEST-CONSULT-MGMT-001-CREATE: Create Consultation', () => {
    it('should create consultation with valid data', async () => {
      const consultData = {
        teacher_id: teacherUser.id,
        title: 'Test Consultation',
        content: 'Test content for consultation',
        category: '학부모 민원' as const,
        urgency: 'normal' as const,
      };

      const consult = await consultService.createConsultation(consultData);

      expect(consult).toBeDefined();
      expect(consult.consult_no).toMatch(/^CST-\d{8}-\d{4}$/);
      expect(consult.status).toBe('pending');
      expect(consult.teacher_id).toBe(teacherUser.id);
      expect(consult.title).toBe(consultData.title);
    });

    it('should reject consultation with title exceeding 200 characters', async () => {
      const longTitle = 'a'.repeat(201);
      const consultData = {
        teacher_id: teacherUser.id,
        title: longTitle,
        content: 'Test content',
        category: '학부모 민원' as const,
      };

      await expect(consultService.createConsultation(consultData)).rejects.toThrow(
        'Title exceeds maximum length of 200 characters'
      );
    });

    it('should reject consultation with content exceeding 10000 characters', async () => {
      const longContent = 'a'.repeat(10001);
      const consultData = {
        teacher_id: teacherUser.id,
        title: 'Test',
        content: longContent,
        category: '학부모 민원' as const,
      };

      await expect(consultService.createConsultation(consultData)).rejects.toThrow(
        'Content exceeds maximum length of 10000 characters'
      );
    });

    it('should reject consultation with invalid category', async () => {
      const consultData = {
        teacher_id: teacherUser.id,
        title: 'Test',
        content: 'Test',
        category: 'invalid_category' as any,
      };

      await expect(consultService.createConsultation(consultData)).rejects.toThrow(
        'Invalid category'
      );
    });

    it('should NOT auto-match after creation (lawyer selection system)', async () => {
      const consultData = {
        teacher_id: teacherUser.id,
        title: 'Test Consultation',
        content: 'Test content',
        category: '학부모 민원' as const,
        urgency: 'urgent' as const,
      };

      const consult = await consultService.createConsultation(consultData);

      // Should remain pending until lawyer selects it
      expect(consult.status).toBe('pending');
      expect(consult.lawyer_id).toBeNull();
    });
  });

  describe('TEST-CONSULT-MGMT-001-STATUS: Status Transitions', () => {
    let consultId: number;

    beforeEach(async () => {
      const consult = await consultService.createConsultation({
        teacher_id: teacherUser.id,
        title: 'Test',
        content: 'Test',
        category: '학부모 민원',
      });
      consultId = consult.id;
    });

    it('should transition from pending to assigned', async () => {
      await consultService.updateStatus(consultId, 'assigned', adminUser.id);

      const consult = await consultService.getConsultById(consultId, teacherUser.id, teacherUser.role);
      expect(consult?.status).toBe('assigned');
    });

    it('should transition from assigned to in_progress', async () => {
      await consultService.updateStatus(consultId, 'assigned', adminUser.id);
      await consultService.updateStatus(consultId, 'in_progress', lawyerUser.id);

      const consult = await consultService.getConsultById(consultId, teacherUser.id, teacherUser.role);
      expect(consult?.status).toBe('in_progress');
    });

    it('should transition from in_progress to completed', async () => {
      await consultService.updateStatus(consultId, 'assigned', adminUser.id);
      await consultService.updateStatus(consultId, 'in_progress', lawyerUser.id);
      await consultService.updateStatus(consultId, 'completed', lawyerUser.id);

      const consult = await consultService.getConsultById(consultId, teacherUser.id, teacherUser.role);
      expect(consult?.status).toBe('completed');
      expect(consult?.completed_at).toBeDefined();
    });

    it('should transition from completed to closed', async () => {
      await consultService.updateStatus(consultId, 'assigned', adminUser.id);
      await consultService.updateStatus(consultId, 'in_progress', lawyerUser.id);
      await consultService.updateStatus(consultId, 'completed', lawyerUser.id);
      await consultService.updateStatus(consultId, 'closed', teacherUser.id);

      const consult = await consultService.getConsultById(consultId, teacherUser.id, teacherUser.role);
      expect(consult?.status).toBe('closed');
    });

    it('should reject invalid status transitions', async () => {
      await expect(
        consultService.updateStatus(consultId, 'completed', adminUser.id)
      ).rejects.toThrow('Invalid status transition');
    });

    it('should allow cancellation only from pending status', async () => {
      // Cancellation from pending is allowed
      await consultService.updateStatus(consultId, 'cancelled', teacherUser.id);

      const consult = await consultService.getConsultById(consultId, teacherUser.id, teacherUser.role);
      expect(consult?.status).toBe('cancelled');
    });

    it('should reject cancellation after assignment (immutability)', async () => {
      await consultService.updateStatus(consultId, 'assigned', adminUser.id);

      await expect(
        consultService.updateStatus(consultId, 'cancelled', teacherUser.id)
      ).rejects.toThrow('Cannot cancel consultation after assignment');
    });

    it('should not allow status changes on closed consultations', async () => {
      await consultService.updateStatus(consultId, 'assigned', adminUser.id);
      await consultService.updateStatus(consultId, 'in_progress', lawyerUser.id);
      await consultService.updateStatus(consultId, 'completed', lawyerUser.id);
      await consultService.updateStatus(consultId, 'closed', teacherUser.id);

      await expect(
        consultService.updateStatus(consultId, 'in_progress', adminUser.id)
      ).rejects.toThrow('Cannot change status of closed consultation');
    });
  });

  describe('TEST-CONSULT-MGMT-001-ASSIGN: Lawyer Assignment (Immutable)', () => {
    let consultId: number;

    beforeEach(async () => {
      const consult = await consultService.createConsultation({
        teacher_id: teacherUser.id,
        title: 'Test',
        content: 'Test',
        category: '학부모 민원',
      });
      consultId = consult.id;
    });

    it('should allow lawyer selection (first-come-first-served)', async () => {
      // Lawyer selects consultation directly
      await consultService.selectConsultation(consultId, 1);

      const consult = await consultService.getConsultById(consultId, teacherUser.id, teacherUser.role);
      expect(consult?.lawyer_id).toBe(1);
      expect(consult?.status).toBe('assigned');
      expect(consult?.matched_at).toBeDefined();
    });

    it('should prevent reassignment once consultation is assigned (IMMUTABLE)', async () => {
      await consultService.selectConsultation(consultId, 1);

      // Try to reassign to different lawyer
      await expect(
        consultService.selectConsultation(consultId, 2)
      ).rejects.toThrow('Already assigned');

      // Try to change assignment
      await expect(
        consultService.assignLawyer(consultId, 2, adminUser.id)
      ).rejects.toThrow('Cannot reassign consultation');
    });

    it('should prevent assignment to lawyer with 100% workload', async () => {
      // Fill up lawyer's workload
      for (let i = 0; i < 10; i++) {
        db.prepare(`
          INSERT INTO consults (consult_no, teacher_id, lawyer_id, title, content, category, status)
          VALUES (?, 1, 1, 'Test', 'Test', '학부모 민원', 'in_progress')
        `).run(`CST-2025-10-${String(i).padStart(4, '0')}`);
      }

      await expect(
        consultService.selectConsultation(consultId, 1)
      ).rejects.toThrow('Workload limit reached');
    });

    it('should transition to in_progress when lawyer starts consultation', async () => {
      await consultService.selectConsultation(consultId, 1);
      await consultService.startConsultation(consultId, lawyerUser.id);

      const consult = await consultService.getConsultById(consultId, lawyerUser.id, lawyerUser.role);
      expect(consult?.status).toBe('in_progress');
    });

    it('should maintain assignment audit trail with timestamp', async () => {
      const beforeTime = new Date();
      await consultService.selectConsultation(consultId, 1);
      const afterTime = new Date();

      const consult = await consultService.getConsultById(consultId, teacherUser.id, teacherUser.role);
      const matchedAt = new Date(consult!.matched_at!);

      expect(matchedAt.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(matchedAt.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });
  });

  describe('TEST-CONSULT-MGMT-001-ACCESS: Access Control', () => {
    let consultId: number;

    beforeEach(async () => {
      const consult = await consultService.createConsultation({
        teacher_id: teacherUser.id,
        title: 'Test',
        content: 'Test',
        category: '학부모 민원',
      });
      consultId = consult.id;
    });

    it('should allow teacher to view own consultations', async () => {
      const consult = await consultService.getConsultById(consultId, teacherUser.id, teacherUser.role);
      expect(consult).toBeDefined();
      expect(consult?.id).toBe(consultId);
    });

    it('should prevent teacher from viewing other teacher consultations', async () => {
      await expect(
        consultService.getConsultById(consultId, 999, 'teacher' as UserRole)
      ).rejects.toThrow('Access denied');
    });

    it('should allow lawyer to view assigned consultations', async () => {
      await consultService.assignLawyer(consultId, 1, adminUser.id);

      const consult = await consultService.getConsultById(consultId, lawyerUser.id, lawyerUser.role);
      expect(consult).toBeDefined();
    });

    it('should prevent lawyer from viewing unassigned consultations', async () => {
      await expect(
        consultService.getConsultById(consultId, lawyerUser.id, lawyerUser.role)
      ).rejects.toThrow('Access denied');
    });

    it('should allow admin to view all consultations', async () => {
      const consult = await consultService.getConsultById(consultId, adminUser.id, adminUser.role);
      expect(consult).toBeDefined();
    });

    it('should allow teacher to list own consultations', async () => {
      const consultations = await consultService.getConsultationsByUser(
        teacherUser.id,
        teacherUser.role
      );

      expect(consultations).toHaveLength(1);
      expect(consultations[0].id).toBe(consultId);
    });

    it('should allow admin to list all consultations', async () => {
      const consultations = await consultService.getAllConsultations(adminUser.role);

      expect(consultations.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('TEST-CONSULT-MGMT-001-EXPIRY: Auto-expiry', () => {
    it('should auto-expire consultations after 30 days', async () => {
      // Create consultation with past date
      const consultId = db
        .prepare(`
        INSERT INTO consults (
          consult_no, teacher_id, title, content, category, status,
          created_at
        )
        VALUES (?, 1, 'Test', 'Test', '학부모 민원', 'in_progress', datetime('now', '-31 days'))
        RETURNING id
      `)
        .get('CST-2025-10-0001') as { id: number };

      await consultService.processExpiredConsultations();

      const consult = db
        .prepare('SELECT * FROM consults WHERE id = ?')
        .get(consultId.id) as any;

      expect(consult.status).toBe('expired');
    });

    it('should not expire completed or closed consultations', async () => {
      const consultId = db
        .prepare(`
        INSERT INTO consults (
          consult_no, teacher_id, title, content, category, status,
          created_at
        )
        VALUES (?, 1, 'Test', 'Test', '학부모 민원', 'completed', datetime('now', '-31 days'))
        RETURNING id
      `)
        .get('CST-2025-10-0001') as { id: number };

      await consultService.processExpiredConsultations();

      const consult = db
        .prepare('SELECT * FROM consults WHERE id = ?')
        .get(consultId.id) as any;

      expect(consult.status).toBe('completed');
    });
  });

  describe('TEST-CONSULT-MGMT-001-UPDATE: Update Consultation', () => {
    let consultId: number;

    beforeEach(async () => {
      const consult = await consultService.createConsultation({
        teacher_id: teacherUser.id,
        title: 'Original Title',
        content: 'Original Content',
        category: '학부모 민원',
      });
      consultId = consult.id;
    });

    it('should allow teacher to update own consultation in pending status', async () => {
      const updated = await consultService.updateConsultation(
        consultId,
        teacherUser.id,
        teacherUser.role,
        {
          title: 'Updated Title',
          content: 'Updated Content',
        }
      );

      expect(updated.title).toBe('Updated Title');
      expect(updated.content).toBe('Updated Content');
    });

    it('should prevent updates after consultation is assigned', async () => {
      await consultService.updateStatus(consultId, 'assigned', adminUser.id);

      await expect(
        consultService.updateConsultation(consultId, teacherUser.id, teacherUser.role, {
          title: 'Trying to update',
        })
      ).rejects.toThrow('Cannot update consultation in current status');
    });

    it('should prevent updates after consultation is completed', async () => {
      await consultService.updateStatus(consultId, 'assigned', adminUser.id);
      await consultService.updateStatus(consultId, 'in_progress', lawyerUser.id);
      await consultService.updateStatus(consultId, 'completed', lawyerUser.id);

      await expect(
        consultService.updateConsultation(consultId, teacherUser.id, teacherUser.role, {
          title: 'Trying to update',
        })
      ).rejects.toThrow('Cannot update completed consultation');
    });
  });
});
