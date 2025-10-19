/**
 * @SPEC:CONSULT-001
 * 변호사 워크로드 관리 서비스
 */

import Database from 'better-sqlite3';
import {
  WorkloadInfo,
  CONSULT_STATUS,
  MAX_WORKLOAD_PER_LAWYER
} from '../types/consult';

export class LawyerWorkloadService {
  private db: Database.Database;

  constructor(dbPathOrDb: string | Database.Database = './data/consult.db') {
    if (typeof dbPathOrDb === 'string') {
      this.db = new Database(dbPathOrDb);
    } else {
      this.db = dbPathOrDb;
    }
    this.initDatabase();
  }

  /**
   * 데이터베이스 초기화
   */
  private initDatabase(): void {
    // consults 테이블 생성
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS consults (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        consult_no VARCHAR(20) UNIQUE NOT NULL,
        teacher_id INTEGER NOT NULL,
        lawyer_id INTEGER,
        report_id INTEGER,
        title VARCHAR(200) NOT NULL,
        content TEXT NOT NULL,
        category VARCHAR(50),
        urgency VARCHAR(20) DEFAULT 'normal',
        status VARCHAR(20) DEFAULT 'pending',
        matched_at TIMESTAMP,
        completed_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 인덱스 생성
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_consults_lawyer_id ON consults(lawyer_id);
      CREATE INDEX IF NOT EXISTS idx_consults_status ON consults(status);
      CREATE INDEX IF NOT EXISTS idx_consults_urgency ON consults(urgency);
    `);
  }

  /**
   * 변호사의 현재 워크로드 정보 조회
   */
  async getWorkload(lawyerId: number): Promise<WorkloadInfo> {
    // 상담 상태별 카운트
    const statusCounts = this.db.prepare(`
      SELECT
        status,
        COUNT(*) as count
      FROM consults
      WHERE lawyer_id = ?
      GROUP BY status
    `).all(lawyerId) as { status: string; count: number }[];

    // 전체 활성 상담 수 계산 (pending은 제외)
    const activeConsults = statusCounts
      .filter(sc => sc.status !== CONSULT_STATUS.COMPLETED &&
                   sc.status !== CONSULT_STATUS.CANCELLED &&
                   sc.status !== CONSULT_STATUS.EXPIRED)
      .reduce((sum, sc) => sum + sc.count, 0);

    // 카테고리별 분포
    const categoryDistribution = this.db.prepare(`
      SELECT
        category,
        COUNT(*) as count
      FROM consults
      WHERE lawyer_id = ?
        AND status NOT IN (?, ?, ?)
      GROUP BY category
    `).all(
      lawyerId,
      CONSULT_STATUS.COMPLETED,
      CONSULT_STATUS.CANCELLED,
      CONSULT_STATUS.EXPIRED
    ) as { category: string | null; count: number }[];

    // 긴급도별 분포
    const urgencyDistribution = this.db.prepare(`
      SELECT
        urgency,
        COUNT(*) as count
      FROM consults
      WHERE lawyer_id = ?
        AND status NOT IN (?, ?, ?)
      GROUP BY urgency
    `).all(
      lawyerId,
      CONSULT_STATUS.COMPLETED,
      CONSULT_STATUS.CANCELLED,
      CONSULT_STATUS.EXPIRED
    ) as { urgency: string; count: number }[];

    const result = {
      lawyerId,
      lawyer_id: lawyerId, // snake_case 호환
      currentLoad: activeConsults,
      active_count: activeConsults, // snake_case 호환
      maxLoad: MAX_WORKLOAD_PER_LAWYER,
      max_capacity: MAX_WORKLOAD_PER_LAWYER, // snake_case 호환
      availableSlots: Math.max(0, MAX_WORKLOAD_PER_LAWYER - activeConsults),
      available_slots: Math.max(0, MAX_WORKLOAD_PER_LAWYER - activeConsults), // snake_case 호환
      isAvailable: activeConsults < MAX_WORKLOAD_PER_LAWYER,
      is_full: activeConsults >= MAX_WORKLOAD_PER_LAWYER, // snake_case 호환
      consultations: statusCounts.reduce((acc, sc) => {
        acc[sc.status] = sc.count;
        return acc;
      }, {} as Record<string, number>),
      categoryDistribution: categoryDistribution.reduce((acc, cd) => {
        const key = cd.category || 'uncategorized';
        acc[key] = cd.count;
        return acc;
      }, {} as Record<string, number>),
      urgencyDistribution: urgencyDistribution.reduce((acc, ud) => {
        acc[ud.urgency] = ud.count;
        return acc;
      }, {} as Record<string, number>)
    };

    return result as any;
  }

  /**
   * 여러 변호사의 워크로드 조회
   */
  async getMultipleWorkloads(lawyerIds: number[]): Promise<WorkloadInfo[]> {
    return Promise.all(lawyerIds.map(id => this.getWorkload(id)));
  }

  /**
   * 모든 변호사의 워크로드 조회
   */
  async getAllWorkloads(): Promise<WorkloadInfo[]> {
    const lawyerIds = this.db.prepare(`
      SELECT DISTINCT lawyer_id
      FROM consults
      WHERE lawyer_id IS NOT NULL
    `).all() as { lawyer_id: number }[];

    return this.getMultipleWorkloads(lawyerIds.map(l => l.lawyer_id));
  }

  /**
   * 변호사가 새 상담을 받을 수 있는지 확인
   */
  async canAcceptNewConsultation(lawyerId: number): Promise<boolean> {
    const workload = await this.getWorkload(lawyerId);
    return workload.isAvailable;
  }

  /**
   * 워크로드 통계 조회
   */
  async getWorkloadStats(): Promise<{
    totalLawyers: number;
    averageLoad: number;
    maxLoadLawyer: number | null;
    minLoadLawyer: number | null;
  }> {
    const stats = this.db.prepare(`
      SELECT
        COUNT(DISTINCT lawyer_id) as totalLawyers,
        AVG(consult_count) as averageLoad,
        MAX(consult_count) as maxLoad,
        MIN(consult_count) as minLoad
      FROM (
        SELECT
          lawyer_id,
          COUNT(*) as consult_count
        FROM consults
        WHERE lawyer_id IS NOT NULL
          AND status NOT IN (?, ?, ?)
        GROUP BY lawyer_id
      )
    `).get(
      CONSULT_STATUS.COMPLETED,
      CONSULT_STATUS.CANCELLED,
      CONSULT_STATUS.EXPIRED
    ) as any;

    // 최대/최소 워크로드를 가진 변호사 ID 찾기
    let maxLoadLawyer = null;
    let minLoadLawyer = null;

    if (stats.maxLoad) {
      const maxResult = this.db.prepare(`
        SELECT lawyer_id
        FROM (
          SELECT
            lawyer_id,
            COUNT(*) as consult_count
          FROM consults
          WHERE lawyer_id IS NOT NULL
            AND status NOT IN (?, ?, ?)
          GROUP BY lawyer_id
        )
        WHERE consult_count = ?
        LIMIT 1
      `).get(
        CONSULT_STATUS.COMPLETED,
        CONSULT_STATUS.CANCELLED,
        CONSULT_STATUS.EXPIRED,
        stats.maxLoad
      ) as any;
      maxLoadLawyer = maxResult?.lawyer_id || null;
    }

    if (stats.minLoad) {
      const minResult = this.db.prepare(`
        SELECT lawyer_id
        FROM (
          SELECT
            lawyer_id,
            COUNT(*) as consult_count
          FROM consults
          WHERE lawyer_id IS NOT NULL
            AND status NOT IN (?, ?, ?)
          GROUP BY lawyer_id
        )
        WHERE consult_count = ?
        LIMIT 1
      `).get(
        CONSULT_STATUS.COMPLETED,
        CONSULT_STATUS.CANCELLED,
        CONSULT_STATUS.EXPIRED,
        stats.minLoad
      ) as any;
      minLoadLawyer = minResult?.lawyer_id || null;
    }

    return {
      totalLawyers: stats.totalLawyers || 0,
      averageLoad: stats.averageLoad || 0,
      maxLoadLawyer,
      minLoadLawyer
    };
  }

  /**
   * 활성 변호사 목록 조회
   */
  async getActiveLawyers(): Promise<any[]> {
    const lawyers = this.db.prepare(`
      SELECT * FROM lawyers
      WHERE is_active = 1
    `).all() as any[];

    return lawyers;
  }

  /**
   * 데이터베이스 연결 종료
   */
  close(): void {
    this.db.close();
  }
}