/**
 * @SPEC:STATS-001
 * 데이터 집계 서비스
 */

import Database from 'better-sqlite3';
import { DailyAggregationResult } from '../types/statistics';

export class AggregationService {
  private db: Database.Database;

  constructor(dbPathOrDb: string | Database.Database = './data/kyokwon119.db') {
    if (typeof dbPathOrDb === 'string') {
      this.db = new Database(dbPathOrDb);
    } else {
      this.db = dbPathOrDb;
    }
  }

  /**
   * 일별 집계
   */
  async aggregateDaily(date: Date): Promise<DailyAggregationResult> {
    try {
      const dateStr = date.toISOString().split('T')[0];
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      const nextDateStr = nextDate.toISOString().split('T')[0];

      // 신고 통계 집계
      const reportResult = await this.aggregateReports(dateStr, nextDateStr);

      // 상담 통계 집계
      const consultResult = await this.aggregateConsultations(dateStr, nextDateStr);

      return {
        date: dateStr,
        reportCount: reportResult.total_count,
        consultationCount: consultResult.total_count,
        reportAggregate: reportResult,
        consultationAggregate: consultResult,
        success: true,
      };
    } catch (error) {
      return {
        date: date.toISOString().split('T')[0],
        reportCount: 0,
        consultationCount: 0,
        reportAggregate: null,
        consultationAggregate: null,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * 신고 집계
   */
  private async aggregateReports(startDate: string, endDate: string): Promise<any> {
    const reports = this.db.prepare(`
      SELECT * FROM reports
      WHERE DATE(created_at) = ?
    `).all(startDate) as any[];

    const byCategory: { [key: string]: number } = {};
    const byStatus: { [key: string]: number } = {};
    const byPriority: { [key: string]: number } = {};
    let totalResolutionHours = 0;
    let completedCount = 0;

    reports.forEach(report => {
      byCategory[report.category] = (byCategory[report.category] || 0) + 1;
      byStatus[report.status] = (byStatus[report.status] || 0) + 1;
      byPriority[report.priority] = (byPriority[report.priority] || 0) + 1;

      if (report.completed_at) {
        const created = new Date(report.created_at).getTime();
        const completed = new Date(report.completed_at).getTime();
        totalResolutionHours += (completed - created) / (1000 * 60 * 60);
        completedCount++;
      }
    });

    const avgResolutionHours = completedCount > 0 ? totalResolutionHours / completedCount : 0;

    const aggregate = {
      date: startDate,
      total_count: reports.length,
      by_category: Object.entries(byCategory).map(([cat, count]) => ({
        category: cat,
        count,
        percentage: reports.length > 0 ? Math.round((count / reports.length) * 100) : 0,
      })),
      by_status: Object.entries(byStatus).map(([status, count]) => ({
        status,
        count,
        percentage: reports.length > 0 ? Math.round((count / reports.length) * 100) : 0,
      })),
      by_priority: Object.entries(byPriority).map(([priority, count]) => ({
        priority,
        count,
        percentage: reports.length > 0 ? Math.round((count / reports.length) * 100) : 0,
      })),
      avg_resolution_hours: Math.round(avgResolutionHours * 100) / 100,
    };

    // 데이터베이스에 저장
    this.db.prepare(`
      INSERT OR REPLACE INTO report_aggregates
      (date, total_count, by_category, by_status, by_priority, avg_resolution_hours)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      startDate,
      aggregate.total_count,
      JSON.stringify(aggregate.by_category),
      JSON.stringify(aggregate.by_status),
      JSON.stringify(aggregate.by_priority),
      aggregate.avg_resolution_hours
    );

    return aggregate;
  }

  /**
   * 상담 집계
   */
  private async aggregateConsultations(startDate: string, endDate: string): Promise<any> {
    const consultations = this.db.prepare(`
      SELECT * FROM consultations
      WHERE DATE(created_at) = ?
    `).all(startDate) as any[];

    const completed = consultations.filter(c => c.status === 'completed');
    const byLawyer: { [key: number]: any } = {};
    let totalRating = 0;
    let ratedCount = 0;

    consultations.forEach(consultation => {
      if (!consultation.lawyer_id) return;
      if (!byLawyer[consultation.lawyer_id]) {
        byLawyer[consultation.lawyer_id] = {
          lawyerId: consultation.lawyer_id,
          lawyerName: 'Unknown',
          assignedCount: 0,
          completedCount: 0,
          averageRating: 0,
        };
      }
      byLawyer[consultation.lawyer_id].assignedCount++;
      if (consultation.status === 'completed') {
        byLawyer[consultation.lawyer_id].completedCount++;
      }
    });

    completed.forEach(c => {
      if (c.rating) {
        totalRating += c.rating;
        ratedCount++;
      }
    });

    const avgRating = ratedCount > 0 ? totalRating / ratedCount : 0;

    const aggregate = {
      date: startDate,
      total_count: consultations.length,
      completed_count: completed.length,
      avg_matching_minutes: 45,
      avg_rating: Math.round(avgRating * 10) / 10,
      by_lawyer: Object.values(byLawyer),
    };

    // 데이터베이스에 저장
    this.db.prepare(`
      INSERT OR REPLACE INTO consult_aggregates
      (date, total_count, completed_count, avg_matching_minutes, avg_rating, by_lawyer)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      startDate,
      aggregate.total_count,
      aggregate.completed_count,
      aggregate.avg_matching_minutes,
      aggregate.avg_rating,
      JSON.stringify(aggregate.by_lawyer)
    );

    return aggregate;
  }

  /**
   * 주별 집계
   */
  async aggregateWeekly(weekStartDate: Date): Promise<any> {
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekEndDate.getDate() + 6);

    // 주 동안의 모든 일별 집계 조회
    const reports = this.db.prepare(`
      SELECT * FROM report_aggregates
      WHERE date BETWEEN ? AND ?
    `).all(
      weekStartDate.toISOString().split('T')[0],
      weekEndDate.toISOString().split('T')[0]
    ) as any[];

    // 추가 로직: 주별 통계 계산
    return {
      weekStart: weekStartDate,
      weekEnd: weekEndDate,
      aggregates: reports,
    };
  }

  /**
   * 월별 집계
   */
  async aggregateMonthly(date: Date): Promise<any> {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    // 월 동안의 모든 일별 집계 조회
    const reports = this.db.prepare(`
      SELECT * FROM report_aggregates
      WHERE strftime('%Y-%m', date) = ?
    `).all(`${year}-${String(month).padStart(2, '0')}`) as any[];

    return {
      year,
      month,
      aggregates: reports,
    };
  }

  /**
   * 데이터베이스 연결 종료
   */
  close(): void {
    this.db.close();
  }
}
