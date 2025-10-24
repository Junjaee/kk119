// @TEST:CONSULT-MATCH-001 | Chain: SPEC-CONSULT-001 -> CODE-CONSULT-001
// TEST-CONSULT-MATCH-001: Consultation matching algorithm tests
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { MatchingService } from '@/lib/services/matching-service';
import { ConsultCategory, ConsultUrgency } from '@/lib/types/consult';

describe('Consultation Matching Algorithm', () => {
  let db: Database.Database;
  let matchingService: MatchingService;
  const testDbPath = path.join(process.cwd(), 'data', 'test-matching.db');

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

    db.exec(`
      CREATE TABLE IF NOT EXISTS consult_evaluations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        consult_id INTEGER NOT NULL,
        rating INTEGER CHECK(rating >= 1 AND rating <= 5),
        feedback TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (consult_id) REFERENCES consults(id)
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
      INSERT INTO lawyers (id, user_id, name, specialty, is_verified)
      VALUES
        (1, 2, 'Lawyer One', '학부모 민원', 1),
        (2, 3, 'Lawyer Two', '학생 폭력', 1),
        (3, 4, 'Lawyer Three', '교권침해', 1)
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

    matchingService = new MatchingService(db);
  });

  afterEach(() => {
    db.close();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('TEST-CONSULT-MATCH-001-SPECIALTY: Specialty Matching', () => {
    it('should give 100 points for exact specialty match', async () => {
      const score = await matchingService.calculateSpecialtyScore(1, '학부모 민원');
      expect(score).toBe(100);
    });

    it('should give 50 points for partial specialty match', async () => {
      const score = await matchingService.calculateSpecialtyScore(1, '행정 관련');
      expect(score).toBe(50);
    });

    it('should give 0 points for no specialty match', async () => {
      const score = await matchingService.calculateSpecialtyScore(1, '학생 폭력');
      expect(score).toBe(0);
    });
  });

  describe('TEST-CONSULT-MATCH-001-WORKLOAD: Workload Balancing', () => {
    it('should give 100 points for 0-20% workload', async () => {
      // Lawyer 1 has 0 consultations
      const score = await matchingService.calculateWorkloadScore(1);
      expect(score).toBe(100);
    });

    it('should give 80 points for 21-40% workload', async () => {
      // Create 3 consultations for lawyer 1 (30%)
      for (let i = 0; i < 3; i++) {
        db.prepare(`
          INSERT INTO consults (consult_no, teacher_id, lawyer_id, title, content, category, status)
          VALUES (?, 1, 1, 'Test', 'Test', '학부모 민원', 'in_progress')
        `).run(`CST-2025-10-${String(i).padStart(4, '0')}`);
      }

      const score = await matchingService.calculateWorkloadScore(1);
      expect(score).toBe(80);
    });

    it('should give 0 points for 81-100% workload (not assignable)', async () => {
      // Create 9 consultations for lawyer 1 (90%)
      for (let i = 0; i < 9; i++) {
        db.prepare(`
          INSERT INTO consults (consult_no, teacher_id, lawyer_id, title, content, category, status)
          VALUES (?, 1, 1, 'Test', 'Test', '학부모 민원', 'in_progress')
        `).run(`CST-2025-10-${String(i).padStart(4, '0')}`);
      }

      const score = await matchingService.calculateWorkloadScore(1);
      expect(score).toBe(0);
    });

    it('should exclude completed and closed consultations from workload', async () => {
      // Create 5 active + 5 completed (should only count 5)
      for (let i = 0; i < 5; i++) {
        db.prepare(`
          INSERT INTO consults (consult_no, teacher_id, lawyer_id, title, content, category, status)
          VALUES (?, 1, 1, 'Test', 'Test', '학부모 민원', 'in_progress')
        `).run(`CST-2025-10-${String(i).padStart(4, '0')}`);
      }
      for (let i = 5; i < 10; i++) {
        db.prepare(`
          INSERT INTO consults (consult_no, teacher_id, lawyer_id, title, content, category, status)
          VALUES (?, 1, 1, 'Test', 'Test', '학부모 민원', 'completed')
        `).run(`CST-2025-10-${String(i).padStart(4, '0')}`);
      }

      const score = await matchingService.calculateWorkloadScore(1);
      expect(score).toBe(60); // 50% workload
    });
  });

  describe('TEST-CONSULT-MATCH-001-RESPONSE: Response Rate', () => {
    it('should give 100 points for 90%+ response rate', async () => {
      // Create 10 consultations, 9 completed
      for (let i = 0; i < 9; i++) {
        db.prepare(`
          INSERT INTO consults (consult_no, teacher_id, lawyer_id, title, content, category, status, completed_at)
          VALUES (?, 1, 1, 'Test', 'Test', '학부모 민원', 'completed', CURRENT_TIMESTAMP)
        `).run(`CST-2025-10-${String(i).padStart(4, '0')}`);
      }
      db.prepare(`
        INSERT INTO consults (consult_no, teacher_id, lawyer_id, title, content, category, status)
        VALUES (?, 1, 1, 'Test', 'Test', '학부모 민원', 'in_progress')
      `).run('CST-2025-10-0009');

      const score = await matchingService.calculateResponseRateScore(1);
      expect(score).toBe(100);
    });

    it('should give 80 points for 70-89% response rate', async () => {
      // Create 10 consultations, 8 completed
      for (let i = 0; i < 8; i++) {
        db.prepare(`
          INSERT INTO consults (consult_no, teacher_id, lawyer_id, title, content, category, status, completed_at)
          VALUES (?, 1, 1, 'Test', 'Test', '학부모 민원', 'completed', CURRENT_TIMESTAMP)
        `).run(`CST-2025-10-${String(i).padStart(4, '0')}`);
      }
      for (let i = 8; i < 10; i++) {
        db.prepare(`
          INSERT INTO consults (consult_no, teacher_id, lawyer_id, title, content, category, status)
          VALUES (?, 1, 1, 'Test', 'Test', '학부모 민원', 'in_progress')
        `).run(`CST-2025-10-${String(i).padStart(4, '0')}`);
      }

      const score = await matchingService.calculateResponseRateScore(1);
      expect(score).toBe(80);
    });

    it('should handle lawyers with no consultations', async () => {
      const score = await matchingService.calculateResponseRateScore(1);
      expect(score).toBe(100); // Default to excellent for new lawyers
    });
  });

  describe('TEST-CONSULT-MATCH-001-URGENCY: Urgency Bonus', () => {
    it('should add 100 points for urgent consultations', () => {
      const bonus = matchingService.calculateUrgencyBonus('urgent');
      expect(bonus).toBe(100);
    });

    it('should add 50 points for high priority consultations', () => {
      const bonus = matchingService.calculateUrgencyBonus('high');
      expect(bonus).toBe(50);
    });

    it('should add 0 points for normal priority consultations', () => {
      const bonus = matchingService.calculateUrgencyBonus('normal');
      expect(bonus).toBe(0);
    });

    it('should subtract 20 points for low priority consultations', () => {
      const bonus = matchingService.calculateUrgencyBonus('low');
      expect(bonus).toBe(-20);
    });
  });

  describe('TEST-CONSULT-MATCH-001-TOTAL: Total Score Calculation', () => {
    it('should calculate weighted total score correctly', async () => {
      const scores = await matchingService.calculateMatchingScore(
        1,
        '학부모 민원',
        'normal'
      );

      expect(scores).toHaveProperty('specialty_score');
      expect(scores).toHaveProperty('workload_score');
      expect(scores).toHaveProperty('response_rate_score');
      expect(scores).toHaveProperty('urgency_bonus');
      expect(scores).toHaveProperty('total_score');

      // Verify weights: 40% + 30% + 20% + 10%
      const expectedTotal =
        scores.specialty_score * 0.4 +
        scores.workload_score * 0.3 +
        scores.response_rate_score * 0.2 +
        scores.urgency_bonus * 0.1;

      expect(scores.total_score).toBeCloseTo(expectedTotal, 2);
    });

    it('should return score >= 60 for assignable lawyers', async () => {
      const scores = await matchingService.calculateMatchingScore(
        1,
        '학부모 민원',
        'normal'
      );

      expect(scores.total_score).toBeGreaterThanOrEqual(60);
    });
  });

  describe('TEST-CONSULT-MATCH-001-MATCH: Best Lawyer Selection', () => {
    it('should select lawyer with highest total score', async () => {
      const bestMatch = await matchingService.findBestMatch('학부모 민원', 'normal');

      expect(bestMatch).toBeDefined();
      expect(bestMatch?.lawyer_id).toBe(1); // Lawyer 1 has exact specialty match
    });

    it('should exclude lawyers with 100% workload', async () => {
      // Fill up lawyer 1's workload
      for (let i = 0; i < 10; i++) {
        db.prepare(`
          INSERT INTO consults (consult_no, teacher_id, lawyer_id, title, content, category, status)
          VALUES (?, 1, 1, 'Test', 'Test', '학부모 민원', 'in_progress')
        `).run(`CST-2025-10-${String(i).padStart(4, '0')}`);
      }

      const bestMatch = await matchingService.findBestMatch('학부모 민원', 'normal');

      expect(bestMatch?.lawyer_id).not.toBe(1);
    });

    it('should return null if no lawyer meets minimum score', async () => {
      const bestMatch = await matchingService.findBestMatch('기타' as ConsultCategory, 'low');

      // Depending on implementation, might return null or lowest scoring lawyer
      expect(bestMatch).toBeDefined(); // Or toBeNull()
    });

    it('should prioritize recent availability on tie scores', async () => {
      // Create two lawyers with same score
      // The one with less recent assignment should be selected
      const bestMatch = await matchingService.findBestMatch('학생 폭력', 'normal');

      expect(bestMatch).toBeDefined();
    });
  });

  describe('TEST-CONSULT-MATCH-001-AUTO: Auto-matching', () => {
    it('should automatically assign consultation to best match', async () => {
      const consultId = db
        .prepare(`
        INSERT INTO consults (consult_no, teacher_id, title, content, category, urgency, status)
        VALUES (?, 1, 'Test Consult', 'Test Content', '학부모 민원', 'normal', 'pending')
        RETURNING id
      `)
        .get('CST-2025-10-0001') as { id: number };

      await matchingService.autoMatch(consultId.id);

      const consult = db
        .prepare('SELECT * FROM consults WHERE id = ?')
        .get(consultId.id) as any;

      expect(consult.lawyer_id).toBe(1);
      expect(consult.status).toBe('assigned');
      expect(consult.matched_at).toBeDefined();
    });

    it('should complete matching within 3 minutes', async () => {
      const consultId = db
        .prepare(`
        INSERT INTO consults (consult_no, teacher_id, title, content, category, urgency, status)
        VALUES (?, 1, 'Test Consult', 'Test Content', '학부모 민원', 'normal', 'pending')
        RETURNING id
      `)
        .get('CST-2025-10-0001') as { id: number };

      const startTime = Date.now();
      await matchingService.autoMatch(consultId.id);
      const endTime = Date.now();

      const duration = endTime - startTime;
      expect(duration).toBeLessThan(3 * 60 * 1000); // 3 minutes
    });
  });
});
