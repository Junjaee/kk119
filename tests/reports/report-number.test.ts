// @TEST:REPORT-NUMBER-001 | Chain: SPEC-REPORT-001 -> CODE-REPORT-001
// TEST-REPORT-NUMBER-001: Report number generation tests
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { generateReportNumber } from '@/lib/services/report-number-service';

describe('Report Number Generation', () => {
  let db: Database.Database;
  const testDbPath = path.join(process.cwd(), 'data', 'test-reports.db');

  beforeEach(() => {
    // Create test database
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    db = new Database(testDbPath);
    db.exec('PRAGMA foreign_keys = ON');

    // Create reports table for testing
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
        completed_at DATETIME
      )
    `);
  });

  afterEach(() => {
    db.close();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('TEST-REPORT-NUMBER-001-HAPPY: Happy Path Tests', () => {
    it('should generate report number in RPT-YYYYMMDD-XXXX format', () => {
      const reportNumber = generateReportNumber(db);
      const pattern = /^RPT-\d{8}-\d{4}$/;

      expect(reportNumber).toMatch(pattern);
    });

    it('should include current date in report number', () => {
      const reportNumber = generateReportNumber(db);
      const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');

      expect(reportNumber).toContain(today);
    });

    it('should generate sequential numbers for same day', () => {
      const first = generateReportNumber(db);
      // Insert first report to increment count
      db.prepare(`
        INSERT INTO reports (report_number, teacher_id, category, title, description, incident_date, location)
        VALUES (?, 1, '학부모 민원', 'Test', 'Test', '2025-10-17', 'Test')
      `).run(first);

      const second = generateReportNumber(db);

      const firstSeq = parseInt(first.split('-')[2]);
      const secondSeq = parseInt(second.split('-')[2]);

      expect(secondSeq).toBe(firstSeq + 1);
    });

    it('should pad sequence number with leading zeros', () => {
      const reportNumber = generateReportNumber(db);
      const sequence = reportNumber.split('-')[2];

      expect(sequence).toHaveLength(4);
      expect(sequence).toMatch(/^\d{4}$/);
    });
  });

  describe('TEST-REPORT-NUMBER-001-EDGE: Edge Cases', () => {
    it('should start from 0001 for first report of the day', () => {
      const reportNumber = generateReportNumber(db);

      expect(reportNumber).toMatch(/-0001$/);
    });

    it('should handle multiple reports correctly', () => {
      const numbers = [];
      for (let i = 0; i < 5; i++) {
        const reportNumber = generateReportNumber(db);
        numbers.push(reportNumber);
        // Insert report to increment count
        db.prepare(`
          INSERT INTO reports (report_number, teacher_id, category, title, description, incident_date, location)
          VALUES (?, 1, '학부모 민원', 'Test', 'Test', '2025-10-17', 'Test')
        `).run(reportNumber);
      }

      expect(numbers[0]).toMatch(/-0001$/);
      expect(numbers[4]).toMatch(/-0005$/);
    });

    it('should create unique report numbers', () => {
      const numbers = new Set();
      for (let i = 0; i < 10; i++) {
        const reportNumber = generateReportNumber(db);
        numbers.add(reportNumber);
        // Insert report to increment count
        db.prepare(`
          INSERT INTO reports (report_number, teacher_id, category, title, description, incident_date, location)
          VALUES (?, 1, '학부모 민원', 'Test', 'Test', '2025-10-17', 'Test')
        `).run(reportNumber);
      }

      expect(numbers.size).toBe(10);
    });
  });

  describe('TEST-REPORT-NUMBER-001-ERROR: Error Cases', () => {
    it('should throw error if database is not provided', () => {
      expect(() => generateReportNumber(null as any)).toThrow();
    });

    it('should handle database errors gracefully', () => {
      db.close();

      expect(() => generateReportNumber(db)).toThrow();
    });
  });
});
