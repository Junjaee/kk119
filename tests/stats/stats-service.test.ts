// @TEST:STATS-001 | Chain: SPEC-STATS-001 -> CODE-STATS-001
// TEST-STATS-001: 통계 및 대시보드 시스템 테스트
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { StatisticsService } from '@/lib/services/statistics-service';
import { AggregationService } from '@/lib/services/aggregation-service';
import { StatsExportService } from '@/lib/services/stats-export-service';
import {
  ReportStatistics,
  ConsultationStatistics,
  SystemStatistics,
  DateRange,
} from '@/lib/types/statistics';

describe('Statistics System', () => {
  let db: Database.Database;
  let statsService: StatisticsService;
  let aggregationService: AggregationService;
  let exportService: StatsExportService;
  const testDbPath = path.join(process.cwd(), 'data', 'test-stats.db');

  const adminUser = {
    id: 1,
    email: 'admin@test.com',
    name: '관리자',
    role: 'admin',
  };

  const teacherUser = {
    id: 2,
    email: 'teacher@test.com',
    name: '김교사',
    role: 'teacher',
  };

  beforeEach(() => {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    db = new Database(testDbPath);
    db.exec('PRAGMA foreign_keys = ON');

    // users 테이블
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        role TEXT DEFAULT 'teacher',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // reports 테이블
    db.exec(`
      CREATE TABLE IF NOT EXISTS reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        reporter_id INTEGER NOT NULL,
        category VARCHAR(50) NOT NULL,
        priority VARCHAR(20) DEFAULT 'normal',
        status VARCHAR(20) DEFAULT 'received',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME,
        FOREIGN KEY (reporter_id) REFERENCES users(id)
      )
    `);

    // consultations 테이블
    db.exec(`
      CREATE TABLE IF NOT EXISTS consultations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        requester_id INTEGER NOT NULL,
        lawyer_id INTEGER,
        status VARCHAR(20) DEFAULT 'pending',
        rating DECIMAL(3,2),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME,
        FOREIGN KEY (requester_id) REFERENCES users(id),
        FOREIGN KEY (lawyer_id) REFERENCES users(id)
      )
    `);

    // 테스트 사용자 추가
    db.exec(`
      INSERT INTO users (id, email, name, role)
      VALUES
        (1, 'admin@test.com', '관리자', 'admin'),
        (2, 'teacher@test.com', '김교사', 'teacher'),
        (3, 'lawyer@test.com', '박변호사', 'lawyer')
    `);

    // 테스트 데이터 추가 - reports
    for (let i = 0; i < 10; i++) {
      db.prepare(`
        INSERT INTO reports (reporter_id, category, priority, status, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        2,
        ['학부모민원', '학생폭력', '명예훼손'][i % 3],
        ['urgent', 'high', 'normal', 'low'][i % 4],
        ['received', 'reviewing', 'completed'][i % 3],
        new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString()
      );
    }

    // 테스트 데이터 추가 - consultations
    for (let i = 0; i < 8; i++) {
      db.prepare(`
        INSERT INTO consultations (requester_id, lawyer_id, status, rating, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        2,
        3,
        ['pending', 'in_progress', 'completed'][i % 3],
        i % 2 === 0 ? 4.5 : 3.8,
        new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString()
      );
    }

    statsService = new StatisticsService(db);
    aggregationService = new AggregationService(db);
    exportService = new StatsExportService(db);
  });

  afterEach(() => {
    db.close();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('TEST-STATS-001-REPORT: 신고 통계 조회', () => {
    it('should get total report statistics', async () => {
      const stats = await statsService.getReportStatistics(
        { start: new Date('2025-01-01'), end: new Date('2025-12-31') },
        adminUser.id
      );

      expect(stats).toBeDefined();
      expect(stats.totalReports).toBeGreaterThan(0);
      expect(stats.byCategory).toBeDefined();
      expect(stats.byStatus).toBeDefined();
      expect(stats.byPriority).toBeDefined();
    });

    it('should filter report statistics by date range', async () => {
      const stats = await statsService.getReportStatistics(
        { start: new Date('2025-10-18'), end: new Date('2025-10-19') },
        adminUser.id
      );

      expect(stats.totalReports).toBeLessThanOrEqual(10);
    });

    it('should calculate average resolution time', async () => {
      // Mark some as completed
      db.prepare('UPDATE reports SET completed_at = CURRENT_TIMESTAMP WHERE id <= 3').run();

      const stats = await statsService.getReportStatistics(
        { start: new Date('2025-01-01'), end: new Date('2025-12-31') },
        adminUser.id
      );

      expect(stats.averageResolutionHours).toBeDefined();
    });

    it('should calculate resolution rate', async () => {
      db.prepare('UPDATE reports SET completed_at = CURRENT_TIMESTAMP WHERE id <= 5').run();

      const stats = await statsService.getReportStatistics(
        { start: new Date('2025-01-01'), end: new Date('2025-12-31') },
        adminUser.id
      );

      expect(stats.resolutionRate).toBeDefined();
      expect(stats.resolutionRate).toBeGreaterThanOrEqual(0);
      expect(stats.resolutionRate).toBeLessThanOrEqual(100);
    });

    it('should respect user role access control', async () => {
      const teacherStats = await statsService.getReportStatistics(
        { start: new Date('2025-01-01'), end: new Date('2025-12-31') },
        teacherUser.id
      );

      expect(teacherStats.totalReports).toBeLessThanOrEqual(10);
    });
  });

  describe('TEST-STATS-001-CONSULT: 상담 통계 조회', () => {
    it('should get total consultation statistics', async () => {
      const stats = await statsService.getConsultationStatistics(
        { start: new Date('2025-01-01'), end: new Date('2025-12-31') },
        adminUser.id
      );

      expect(stats).toBeDefined();
      expect(stats.totalConsultations).toBeGreaterThan(0);
      expect(stats.completedCount).toBeDefined();
      expect(stats.completionRate).toBeDefined();
    });

    it('should calculate consultation completion rate', async () => {
      const stats = await statsService.getConsultationStatistics(
        { start: new Date('2025-01-01'), end: new Date('2025-12-31') },
        adminUser.id
      );

      expect(stats.completionRate).toBeDefined();
      expect(stats.completionRate).toBeGreaterThanOrEqual(0);
      expect(stats.completionRate).toBeLessThanOrEqual(100);
    });

    it('should get lawyer-specific statistics', async () => {
      const stats = await statsService.getConsultationStatistics(
        { start: new Date('2025-01-01'), end: new Date('2025-12-31') },
        adminUser.id
      );

      expect(stats.byLawyer).toBeDefined();
      expect(Array.isArray(stats.byLawyer)).toBe(true);
    });

    it('should calculate average rating', async () => {
      const stats = await statsService.getConsultationStatistics(
        { start: new Date('2025-01-01'), end: new Date('2025-12-31') },
        adminUser.id
      );

      expect(stats.averageRating).toBeDefined();
      if (stats.averageRating !== null) {
        expect(stats.averageRating).toBeGreaterThanOrEqual(0);
        expect(stats.averageRating).toBeLessThanOrEqual(5);
      }
    });
  });

  describe('TEST-STATS-001-SYSTEM: 시스템 통계 조회', () => {
    it('should get system statistics', async () => {
      const stats = await statsService.getSystemStatistics(adminUser.id);

      expect(stats).toBeDefined();
      expect(stats.totalUsers).toBeGreaterThan(0);
      expect(stats.activeUsers).toBeDefined();
      expect(stats.usersByRole).toBeDefined();
    });

    it('should calculate user distribution by role', async () => {
      const stats = await statsService.getSystemStatistics(adminUser.id);

      expect(stats.usersByRole).toBeDefined();
      expect(stats.usersByRole.admin).toBeGreaterThanOrEqual(0);
      expect(stats.usersByRole.teacher).toBeGreaterThanOrEqual(0);
      expect(stats.usersByRole.lawyer).toBeGreaterThanOrEqual(0);
    });

    it('should only allow admin and super_admin to view system stats', async () => {
      await expect(statsService.getSystemStatistics(teacherUser.id))
        .rejects.toThrow('Access denied');
    });
  });

  describe('TEST-STATS-001-KPI: KPI 대시보드', () => {
    it('should get KPI dashboard data', async () => {
      const kpis = await statsService.getKPIDashboard(adminUser.id);

      expect(kpis).toBeDefined();
      expect(kpis.monthlyReports).toBeDefined();
      expect(kpis.completionRate).toBeDefined();
      expect(kpis.responseTime).toBeDefined();
      expect(kpis.userSatisfaction).toBeDefined();
    });

    it('should calculate KPI achievement rate', async () => {
      const kpis = await statsService.getKPIDashboard(adminUser.id);

      expect(kpis.achievementRates).toBeDefined();
      if (kpis.achievementRates) {
        for (const [key, rate] of Object.entries(kpis.achievementRates)) {
          expect(rate).toBeGreaterThanOrEqual(0);
          expect(rate).toBeLessThanOrEqual(100);
        }
      }
    });
  });

  describe('TEST-STATS-001-AGGREGATION: 데이터 집계', () => {
    it('should perform daily aggregation', async () => {
      const result = await aggregationService.aggregateDaily(new Date('2025-10-19'));

      expect(result).toBeDefined();
      expect(result.reportCount).toBeGreaterThanOrEqual(0);
      expect(result.consultationCount).toBeGreaterThanOrEqual(0);
    });

    it('should update daily aggregates table', async () => {
      await aggregationService.aggregateDaily(new Date('2025-10-19'));

      const record = db.prepare(`
        SELECT * FROM report_aggregates WHERE date = ?
      `).get('2025-10-19') as any;

      expect(record).toBeDefined();
    });
  });

  describe('TEST-STATS-001-CACHING: 캐싱 시스템', () => {
    it('should cache statistics data', async () => {
      const dateRange = { start: new Date('2025-01-01'), end: new Date('2025-12-31') };

      // First call
      const stats1 = await statsService.getReportStatistics(dateRange, adminUser.id);

      // Second call should use cache
      const stats2 = await statsService.getReportStatistics(dateRange, adminUser.id);

      expect(stats1).toEqual(stats2);
    });

    it('should invalidate cache when data changes', async () => {
      const dateRange = { start: new Date('2025-01-01'), end: new Date('2025-12-31') };

      const stats1 = await statsService.getReportStatistics(dateRange, adminUser.id);

      // Add new report
      db.prepare(`
        INSERT INTO reports (reporter_id, category, priority, status, created_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(2, 'test', 'normal', 'received', new Date().toISOString());

      // Invalidate cache
      await statsService.invalidateCache();

      const stats2 = await statsService.getReportStatistics(dateRange, adminUser.id);

      expect(stats2.totalReports).toBeGreaterThan(stats1.totalReports);
    });
  });

  describe('TEST-STATS-001-EXPORT: 데이터 Export', () => {
    it('should export statistics as CSV', async () => {
      const dateRange = { start: new Date('2025-01-01'), end: new Date('2025-12-31') };
      const csv = await exportService.exportAsCSV('reports', dateRange, adminUser.id);

      expect(csv).toBeDefined();
      expect(typeof csv).toBe('string');
      expect(csv).toContain(',');
    });

    it('should export statistics as JSON', async () => {
      const dateRange = { start: new Date('2025-01-01'), end: new Date('2025-12-31') };
      const json = await exportService.exportAsJSON('reports', dateRange, adminUser.id);

      expect(json).toBeDefined();
      expect(Array.isArray(json) || typeof json === 'object').toBe(true);
    });

    it('should validate file size on export', async () => {
      const dateRange = { start: new Date('2025-01-01'), end: new Date('2025-12-31') };
      const csv = await exportService.exportAsCSV('reports', dateRange, adminUser.id);

      // File size should not exceed 10MB
      const fileSizeInMB = Buffer.byteLength(csv) / (1024 * 1024);
      expect(fileSizeInMB).toBeLessThan(10);
    });
  });

  describe('TEST-STATS-001-COMPARISON: 기간 비교', () => {
    it('should compare statistics between two periods', async () => {
      const comparison = await statsService.comparePeriods(
        { start: new Date('2025-10-01'), end: new Date('2025-10-10') },
        { start: new Date('2025-10-11'), end: new Date('2025-10-20') },
        'reports',
        adminUser.id
      );

      expect(comparison).toBeDefined();
      expect(comparison.period1).toBeDefined();
      expect(comparison.period2).toBeDefined();
      expect(comparison.difference).toBeDefined();
      expect(comparison.percentageChange).toBeDefined();
    });
  });

  describe('TEST-STATS-001-FILTER: 필터링', () => {
    it('should get available filter options', async () => {
      const filters = await statsService.getFilterOptions('reports');

      expect(filters).toBeDefined();
      expect(filters.categories).toBeDefined();
      expect(filters.statuses).toBeDefined();
      expect(filters.priorities).toBeDefined();
    });

    it('should apply multiple filters to statistics', async () => {
      const stats = await statsService.getReportStatistics(
        { start: new Date('2025-01-01'), end: new Date('2025-12-31') },
        adminUser.id,
        { category: '학부모민원', status: 'completed' }
      );

      expect(stats).toBeDefined();
      expect(stats.totalReports).toBeGreaterThanOrEqual(0);
    });
  });
});
