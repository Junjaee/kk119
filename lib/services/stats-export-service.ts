/**
 * @SPEC:STATS-001
 * 통계 Export 서비스
 */

import Database from 'better-sqlite3';
import { DateRange, ExportFormat } from '../types/statistics';

export class StatsExportService {
  private db: Database.Database;

  constructor(dbPathOrDb: string | Database.Database = './data/kyokwon119.db') {
    if (typeof dbPathOrDb === 'string') {
      this.db = new Database(dbPathOrDb);
    } else {
      this.db = dbPathOrDb;
    }
  }

  /**
   * CSV로 Export
   */
  async exportAsCSV(
    type: string,
    dateRange: DateRange,
    userId: number
  ): Promise<string> {
    const data = await this.getExportData(type, dateRange, userId);

    if (data.length === 0) {
      return '';
    }

    // 헤더 생성
    const headers = Object.keys(data[0]);
    const headerRow = headers.map(h => this.escapeCsvValue(h)).join(',');

    // 데이터 행 생성
    const rows = data.map(row =>
      headers.map(header => this.escapeCsvValue(row[header])).join(',')
    );

    return [headerRow, ...rows].join('\n');
  }

  /**
   * JSON으로 Export
   */
  async exportAsJSON(
    type: string,
    dateRange: DateRange,
    userId: number
  ): Promise<any[]> {
    return this.getExportData(type, dateRange, userId);
  }

  /**
   * Export 데이터 조회
   */
  private async getExportData(
    type: string,
    dateRange: DateRange,
    userId: number
  ): Promise<any[]> {
    // 권한 확인
    const user = this.db.prepare('SELECT role FROM users WHERE id = ?').get(userId) as any;
    const isAdmin = user && (user.role === 'admin' || user.role === 'super_admin');

    if (type === 'reports') {
      let query = `
        SELECT
          r.id,
          r.reporter_id,
          u.name as reporter_name,
          r.category,
          r.priority,
          r.status,
          r.created_at,
          r.completed_at
        FROM reports r
        LEFT JOIN users u ON r.reporter_id = u.id
        WHERE r.created_at BETWEEN ? AND ?
      `;

      const params: any[] = [dateRange.start.toISOString(), dateRange.end.toISOString()];

      if (!isAdmin) {
        query += ' AND r.reporter_id = ?';
        params.push(userId);
      }

      query += ' ORDER BY r.created_at DESC';

      return this.db.prepare(query).all(...params) as any[];
    } else if (type === 'consultations') {
      let query = `
        SELECT
          c.id,
          c.requester_id,
          u1.name as requester_name,
          c.lawyer_id,
          u2.name as lawyer_name,
          c.status,
          c.rating,
          c.created_at,
          c.completed_at
        FROM consultations c
        LEFT JOIN users u1 ON c.requester_id = u1.id
        LEFT JOIN users u2 ON c.lawyer_id = u2.id
        WHERE c.created_at BETWEEN ? AND ?
      `;

      const params: any[] = [dateRange.start.toISOString(), dateRange.end.toISOString()];

      if (!isAdmin) {
        query += ' AND (c.requester_id = ? OR c.lawyer_id = ?)';
        params.push(userId, userId);
      }

      query += ' ORDER BY c.created_at DESC';

      return this.db.prepare(query).all(...params) as any[];
    }

    return [];
  }

  /**
   * CSV 값 이스케이프
   */
  private escapeCsvValue(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }

    const stringValue = String(value);

    // 따옴표나 쉼표, 줄바꿈이 포함되면 따옴표로 감싸고 내부의 따옴표 이스케이프
    if (stringValue.includes('"') || stringValue.includes(',') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }

    return stringValue;
  }

  /**
   * PDF로 Export (기본 구현)
   */
  async exportAsPDF(
    type: string,
    dateRange: DateRange,
    userId: number
  ): Promise<Buffer> {
    // 실제 PDF 생성은 추가 라이브러리 필요 (jsPDF, pdfkit 등)
    // 여기서는 기본 구조만 제공
    const data = await this.getExportData(type, dateRange, userId);
    return Buffer.from(JSON.stringify(data, null, 2));
  }

  /**
   * Excel로 Export (기본 구현)
   */
  async exportAsExcel(
    type: string,
    dateRange: DateRange,
    userId: number
  ): Promise<Buffer> {
    // 실제 Excel 생성은 추가 라이브러리 필요 (exceljs 등)
    // 여기서는 기본 구조만 제공
    const data = await this.getExportData(type, dateRange, userId);
    return Buffer.from(JSON.stringify(data, null, 2));
  }

  /**
   * 데이터베이스 연결 종료
   */
  close(): void {
    this.db.close();
  }
}
