// @TEST:CONSULT-SELECT-001 | Chain: SPEC-CONSULT-001 -> CODE-CONSULT-001
// TEST-CONSULT-SELECT-001: Lawyer selection system tests (no auto-matching)
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { LawyerSelectionService } from '@/lib/services/lawyer-selection-service';
import { LawyerWorkloadService } from '@/lib/services/lawyer-workload-service';

describe('Lawyer Selection System', () => {
  let db: Database.Database;
  let selectionService: LawyerSelectionService;
  let workloadService: LawyerWorkloadService;
  const testDbPath = path.join(process.cwd(), 'data', 'test-lawyer-selection.db');

  beforeEach(() => {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    db = new Database(testDbPath);
    db.exec('PRAGMA foreign_keys = ON');

    // Create tables based on SPEC-CONSULT-001
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
        is_active BOOLEAN DEFAULT 1,
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
        title TEXT NOT NULL CHECK(length(title) <= 200),
        content TEXT NOT NULL CHECK(length(content) <= 10000),
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

    db.exec(`
      CREATE TABLE IF NOT EXISTS consult_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        consult_id INTEGER NOT NULL,
        sender_id INTEGER NOT NULL,
        sender_role TEXT NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (consult_id) REFERENCES consults(id),
        FOREIGN KEY (sender_id) REFERENCES users(id)
      )
    `);

    // Insert test data
    db.exec(`
      INSERT INTO users (id, email, password, name, role)
      VALUES
        (1, 'teacher@test.com', 'hashed', 'Test Teacher', 'teacher'),
        (2, 'lawyer1@test.com', 'hashed', 'Lawyer One', 'lawyer'),
        (3, 'lawyer2@test.com', 'hashed', 'Lawyer Two', 'lawyer'),
        (4, 'lawyer3@test.com', 'hashed', 'Lawyer Three', 'lawyer')
    `);

    db.exec(`
      INSERT INTO lawyers (id, user_id, name, specialty, is_active, is_verified)
      VALUES
        (1, 2, 'Lawyer One', '학부모 민원', 1, 1),
        (2, 3, 'Lawyer Two', '학생 폭력', 1, 1),
        (3, 4, 'Lawyer Three', '교권침해', 1, 1)
    `);

    db.exec(`
      INSERT INTO lawyer_specialties (lawyer_id, specialty, is_primary)
      VALUES
        (1, '학부모 민원', 1),
        (1, '행정 관련', 0),
        (2, '학생 폭력', 1),
        (2, '교권침해', 0),
        (3, '교권침해', 1)
    `);

    selectionService = new LawyerSelectionService(db);
    workloadService = new LawyerWorkloadService(db);
  });

  afterEach(() => {
    db.close();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('TEST-CONSULT-SELECT-001-LIST: Available Consultations List', () => {
    it('should list all pending consultations for lawyers', async () => {
      // Create pending consultations
      db.prepare(`
        INSERT INTO consults (consult_no, teacher_id, title, content, category, urgency, status)
        VALUES
          ('CST-2025-10-0001', 1, 'Test 1', 'Content 1', '학부모 민원', 'normal', 'pending'),
          ('CST-2025-10-0002', 1, 'Test 2', 'Content 2', '학생 폭력', 'urgent', 'pending'),
          ('CST-2025-10-0003', 1, 'Test 3', 'Content 3', '교권침해', 'high', 'pending')
      `).run();

      const available = await selectionService.getAvailableConsultations();

      expect(available).toHaveLength(3);
      expect(available[0].status).toBe('pending');
    });

    it('should exclude already assigned consultations', async () => {
      db.prepare(`
        INSERT INTO consults (consult_no, teacher_id, lawyer_id, title, content, category, status)
        VALUES
          ('CST-2025-10-0001', 1, NULL, 'Pending', 'Content', '학부모 민원', 'pending'),
          ('CST-2025-10-0002', 1, 1, 'Assigned', 'Content', '학생 폭력', 'assigned')
      `).run();

      const available = await selectionService.getAvailableConsultations();

      expect(available).toHaveLength(1);
      expect(available[0].consult_no).toBe('CST-2025-10-0001');
    });

    it('should sort by urgency first (urgent > high > normal > low)', async () => {
      db.prepare(`
        INSERT INTO consults (consult_no, teacher_id, title, content, category, urgency, status)
        VALUES
          ('CST-2025-10-0001', 1, 'Normal', 'Content', '학부모 민원', 'normal', 'pending'),
          ('CST-2025-10-0002', 1, 'Urgent', 'Content', '학생 폭력', 'urgent', 'pending'),
          ('CST-2025-10-0003', 1, 'High', 'Content', '교권침해', 'high', 'pending'),
          ('CST-2025-10-0004', 1, 'Low', 'Content', '기타', 'low', 'pending')
      `).run();

      const available = await selectionService.getAvailableConsultations();

      expect(available[0].urgency).toBe('urgent');
      expect(available[1].urgency).toBe('high');
      expect(available[2].urgency).toBe('normal');
      expect(available[3].urgency).toBe('low');
    });

    it('should filter by specialty for lawyer', async () => {
      db.prepare(`
        INSERT INTO consults (consult_no, teacher_id, title, content, category, urgency, status)
        VALUES
          ('CST-2025-10-0001', 1, 'Test 1', 'Content', '학부모 민원', 'normal', 'pending'),
          ('CST-2025-10-0002', 1, 'Test 2', 'Content', '학생 폭력', 'normal', 'pending'),
          ('CST-2025-10-0003', 1, 'Test 3', 'Content', '교권침해', 'normal', 'pending')
      `).run();

      const filtered = await selectionService.getAvailableConsultations({
        specialty: '학부모 민원',
      });

      expect(filtered).toHaveLength(1);
      expect(filtered[0].category).toBe('학부모 민원');
    });

    it('should filter by urgency level', async () => {
      db.prepare(`
        INSERT INTO consults (consult_no, teacher_id, title, content, category, urgency, status)
        VALUES
          ('CST-2025-10-0001', 1, 'Test 1', 'Content', '학부모 민원', 'urgent', 'pending'),
          ('CST-2025-10-0002', 1, 'Test 2', 'Content', '학생 폭력', 'normal', 'pending')
      `).run();

      const filtered = await selectionService.getAvailableConsultations({
        urgency: 'urgent',
      });

      expect(filtered).toHaveLength(1);
      expect(filtered[0].urgency).toBe('urgent');
    });
  });

  describe('TEST-CONSULT-SELECT-001-WORKLOAD: Workload Limit', () => {
    it('should calculate lawyer workload correctly', async () => {
      // Create 5 active consultations for lawyer 1
      for (let i = 0; i < 5; i++) {
        db.prepare(`
          INSERT INTO consults (consult_no, teacher_id, lawyer_id, title, content, category, status)
          VALUES (?, 1, 1, 'Test', 'Content', '학부모 민원', 'in_progress')
        `).run(`CST-2025-10-${String(i).padStart(4, '0')}`);
      }

      const workload = await workloadService.getWorkload(1);

      expect(workload.active_count).toBe(5);
      expect(workload.max_capacity).toBe(10);
      expect(workload.available_slots).toBe(5);
      expect(workload.is_full).toBe(false);
    });

    it('should exclude completed consultations from workload', async () => {
      // 3 active + 7 completed = 10 total, but only 3 count
      for (let i = 0; i < 3; i++) {
        db.prepare(`
          INSERT INTO consults (consult_no, teacher_id, lawyer_id, title, content, category, status)
          VALUES (?, 1, 1, 'Test', 'Content', '학부모 민원', 'in_progress')
        `).run(`CST-2025-10-${String(i).padStart(4, '0')}`);
      }
      for (let i = 3; i < 10; i++) {
        db.prepare(`
          INSERT INTO consults (consult_no, teacher_id, lawyer_id, title, content, category, status)
          VALUES (?, 1, 1, 'Test', 'Content', '학부모 민원', 'completed')
        `).run(`CST-2025-10-${String(i).padStart(4, '0')}`);
      }

      const workload = await workloadService.getWorkload(1);

      expect(workload.active_count).toBe(3);
      expect(workload.is_full).toBe(false);
    });

    it('should mark lawyer as full at 10 active consultations', async () => {
      // Create exactly 10 active consultations
      for (let i = 0; i < 10; i++) {
        db.prepare(`
          INSERT INTO consults (consult_no, teacher_id, lawyer_id, title, content, category, status)
          VALUES (?, 1, 1, 'Test', 'Content', '학부모 민원', 'in_progress')
        `).run(`CST-2025-10-${String(i).padStart(4, '0')}`);
      }

      const workload = await workloadService.getWorkload(1);

      expect(workload.active_count).toBe(10);
      expect(workload.is_full).toBe(true);
      expect(workload.available_slots).toBe(0);
    });

    it('should prevent selection when workload >= 10', async () => {
      // Fill lawyer 1 workload
      for (let i = 0; i < 10; i++) {
        db.prepare(`
          INSERT INTO consults (consult_no, teacher_id, lawyer_id, title, content, category, status)
          VALUES (?, 1, 1, 'Test', 'Content', '학부모 민원', 'in_progress')
        `).run(`CST-2025-10-${String(i).padStart(4, '0')}`);
      }

      // Try to select new consultation
      const consultId = db
        .prepare(`
          INSERT INTO consults (consult_no, teacher_id, title, content, category, status)
          VALUES ('CST-2025-10-9999', 1, 'New', 'Content', '학부모 민원', 'pending')
          RETURNING id
        `)
        .get() as { id: number };

      await expect(
        selectionService.selectConsultation(consultId.id, 1)
      ).rejects.toThrow('Workload limit reached');
    });
  });

  describe('TEST-CONSULT-SELECT-001-SELECT: Consultation Selection', () => {
    it('should successfully select available consultation', async () => {
      const consultId = db
        .prepare(`
          INSERT INTO consults (consult_no, teacher_id, title, content, category, status)
          VALUES ('CST-2025-10-0001', 1, 'Test', 'Content', '학부모 민원', 'pending')
          RETURNING id
        `)
        .get() as { id: number };

      const result = await selectionService.selectConsultation(consultId.id, 1);

      expect(result.success).toBe(true);
      expect(result.consult.lawyer_id).toBe(1);
      expect(result.consult.status).toBe('assigned');
      expect(result.consult.matched_at).toBeDefined();
    });

    it('should immediately confirm assignment on selection', async () => {
      const consultId = db
        .prepare(`
          INSERT INTO consults (consult_no, teacher_id, title, content, category, status)
          VALUES ('CST-2025-10-0001', 1, 'Test', 'Content', '학부모 민원', 'pending')
          RETURNING id
        `)
        .get() as { id: number };

      await selectionService.selectConsultation(consultId.id, 1);

      const consult = db
        .prepare('SELECT * FROM consults WHERE id = ?')
        .get(consultId.id) as any;

      expect(consult.lawyer_id).toBe(1);
      expect(consult.status).toBe('assigned');
      expect(consult.matched_at).not.toBeNull();
    });

    it('should reject selection if consultation already assigned', async () => {
      const consultId = db
        .prepare(`
          INSERT INTO consults (consult_no, teacher_id, lawyer_id, title, content, category, status)
          VALUES ('CST-2025-10-0001', 1, 1, 'Test', 'Content', '학부모 민원', 'assigned')
          RETURNING id
        `)
        .get() as { id: number };

      await expect(
        selectionService.selectConsultation(consultId.id, 2)
      ).rejects.toThrow('Already assigned');
    });

    it('should process selection within 100ms (performance requirement)', async () => {
      const consultId = db
        .prepare(`
          INSERT INTO consults (consult_no, teacher_id, title, content, category, status)
          VALUES ('CST-2025-10-0001', 1, 'Test', 'Content', '학부모 민원', 'pending')
          RETURNING id
        `)
        .get() as { id: number };

      const startTime = Date.now();
      await selectionService.selectConsultation(consultId.id, 1);
      const endTime = Date.now();

      expect(endTime - startTime).toBeLessThan(100);
    });
  });

  describe('TEST-CONSULT-SELECT-001-RACE: Race Condition Handling', () => {
    it('should handle concurrent selection attempts (first-come-first-served)', async () => {
      const consultId = db
        .prepare(`
          INSERT INTO consults (consult_no, teacher_id, title, content, category, status)
          VALUES ('CST-2025-10-0001', 1, 'Test', 'Content', '학부모 민원', 'pending')
          RETURNING id
        `)
        .get() as { id: number };

      // Simulate concurrent selections
      const selections = Promise.allSettled([
        selectionService.selectConsultation(consultId.id, 1),
        selectionService.selectConsultation(consultId.id, 2),
        selectionService.selectConsultation(consultId.id, 3),
      ]);

      const results = await selections;

      // Only one should succeed
      const successes = results.filter((r) => r.status === 'fulfilled');
      const failures = results.filter((r) => r.status === 'rejected');

      expect(successes).toHaveLength(1);
      expect(failures).toHaveLength(2);
    });

    it('should use transaction locking to prevent double assignment', async () => {
      const consultId = db
        .prepare(`
          INSERT INTO consults (consult_no, teacher_id, title, content, category, status)
          VALUES ('CST-2025-10-0001', 1, 'Test', 'Content', '학부모 민원', 'pending')
          RETURNING id
        `)
        .get() as { id: number };

      await selectionService.selectConsultation(consultId.id, 1);

      const consult = db
        .prepare('SELECT * FROM consults WHERE id = ?')
        .get(consultId.id) as any;

      // Verify only one lawyer assigned
      expect(consult.lawyer_id).toBe(1);

      // Second attempt should fail
      await expect(
        selectionService.selectConsultation(consultId.id, 2)
      ).rejects.toThrow();
    });
  });

  describe('TEST-CONSULT-SELECT-001-IMMUTABLE: Assignment Immutability', () => {
    it('should prevent reassignment once consultation is assigned', async () => {
      const consultId = db
        .prepare(`
          INSERT INTO consults (consult_no, teacher_id, lawyer_id, title, content, category, status, matched_at)
          VALUES ('CST-2025-10-0001', 1, 1, 'Test', 'Content', '학부모 민원', 'assigned', CURRENT_TIMESTAMP)
          RETURNING id
        `)
        .get() as { id: number };

      await expect(
        selectionService.reassignConsultation(consultId.id, 2)
      ).rejects.toThrow('Cannot reassign consultation');
    });

    it('should reject any update to lawyer_id after assignment', async () => {
      const consultId = db
        .prepare(`
          INSERT INTO consults (consult_no, teacher_id, lawyer_id, title, content, category, status)
          VALUES ('CST-2025-10-0001', 1, 1, 'Test', 'Content', '학부모 민원', 'assigned')
          RETURNING id
        `)
        .get() as { id: number };

      expect(() => {
        db.prepare('UPDATE consults SET lawyer_id = ? WHERE id = ?').run(2, consultId.id);
      }).toThrow(); // Should be prevented by application logic
    });

    it('should maintain assignment audit trail', async () => {
      const consultId = db
        .prepare(`
          INSERT INTO consults (consult_no, teacher_id, title, content, category, status)
          VALUES ('CST-2025-10-0001', 1, 'Test', 'Content', '학부모 민원', 'pending')
          RETURNING id
        `)
        .get() as { id: number };

      await selectionService.selectConsultation(consultId.id, 1);

      const consult = db
        .prepare('SELECT * FROM consults WHERE id = ?')
        .get(consultId.id) as any;

      expect(consult.lawyer_id).toBe(1);
      expect(consult.matched_at).toBeDefined();
      expect(new Date(consult.matched_at)).toBeInstanceOf(Date);
    });
  });

  describe('TEST-CONSULT-SELECT-001-ACTIVE: Lawyer Active Status', () => {
    it('should only show active lawyers in available list', async () => {
      // Deactivate lawyer 2
      db.prepare('UPDATE lawyers SET is_active = 0 WHERE id = 2').run();

      const activeLawyers = await workloadService.getActiveLawyers();

      expect(activeLawyers).toHaveLength(2);
      expect(activeLawyers.find((l) => l.id === 2)).toBeUndefined();
    });

    it('should prevent inactive lawyer from selecting consultations', async () => {
      db.prepare('UPDATE lawyers SET is_active = 0 WHERE id = 1').run();

      const consultId = db
        .prepare(`
          INSERT INTO consults (consult_no, teacher_id, title, content, category, status)
          VALUES ('CST-2025-10-0001', 1, 'Test', 'Content', '학부모 민원', 'pending')
          RETURNING id
        `)
        .get() as { id: number };

      await expect(
        selectionService.selectConsultation(consultId.id, 1)
      ).rejects.toThrow('Lawyer is not active');
    });
  });
});
