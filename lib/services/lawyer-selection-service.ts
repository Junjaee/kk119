/**
 * @SPEC:CONSULT-001
 * 변호사 상담 선택 서비스
 * - 트랜잭션 락을 사용한 동시 선택 방지
 * - 워크로드 기반 선택 제한
 * - 선착순 배정 보장
 */

import Database from 'better-sqlite3';
import {
  LawyerSelectionResult,
  AvailableConsultation,
  CONSULT_STATUS,
  CONSULT_URGENCY,
  MAX_WORKLOAD_PER_LAWYER
} from '../types/consult';
import { LawyerWorkloadService } from './lawyer-workload-service';

export class LawyerSelectionService {
  private db: Database.Database;
  private workloadService: LawyerWorkloadService;

  constructor(dbPathOrDb: string | Database.Database = './data/consult.db') {
    if (typeof dbPathOrDb === 'string') {
      this.db = new Database(dbPathOrDb);
      this.workloadService = new LawyerWorkloadService(dbPathOrDb);
    } else {
      this.db = dbPathOrDb;
      this.workloadService = new LawyerWorkloadService(dbPathOrDb);
    }
    this.initDatabase();
  }

  /**
   * 데이터베이스 초기화
   */
  private initDatabase(): void {
    // 이미 LawyerWorkloadService에서 테이블 생성됨
    // 추가 인덱스만 생성
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_consults_created_at ON consults(created_at);
      CREATE INDEX IF NOT EXISTS idx_consults_matched_at ON consults(matched_at);
    `);
  }

  /**
   * 선택 가능한 상담 목록 조회
   * @param lawyerId 변호사 ID (optional)
   * @param filters 필터 옵션
   */
  async getAvailableConsultations(
    lawyerId?: number,
    filters?: {
      category?: string;
      specialty?: string; // specialty 필터 추가
      urgency?: string;
      dateFrom?: Date;
      dateTo?: Date;
      limit?: number;
      offset?: number;
    }
  ): Promise<AvailableConsultation[]> {
    // lawyerId가 제공된 경우에만 워크로드 확인
    if (lawyerId) {
      const workload = await this.workloadService.getWorkload(lawyerId);
      // 워크로드가 가득 찬 경우 빈 배열 반환
      if (!workload.isAvailable) {
        return [];
      }
    }

    // 쿼리 빌드
    let query = `
      SELECT
        id,
        consult_no,
        teacher_id,
        title,
        category,
        urgency,
        created_at,
        (SELECT COUNT(*) FROM consults WHERE status = ? AND id = c.id) as competing_lawyers
      FROM consults c
      WHERE status = ?
    `;
    const params: any[] = [CONSULT_STATUS.PENDING, CONSULT_STATUS.PENDING];

    // 필터 적용
    if (filters?.category) {
      query += ' AND category = ?';
      params.push(filters.category);
    }
    if (filters?.specialty) {
      query += ' AND category = ?';
      params.push(filters.specialty);
    }
    if (filters?.urgency) {
      query += ' AND urgency = ?';
      params.push(filters.urgency);
    }
    if (filters?.dateFrom) {
      query += ' AND created_at >= ?';
      params.push(filters.dateFrom.toISOString());
    }
    if (filters?.dateTo) {
      query += ' AND created_at <= ?';
      params.push(filters.dateTo.toISOString());
    }

    // 정렬: 긴급도 우선, 최신순
    query += `
      ORDER BY
        CASE urgency
          WHEN '${CONSULT_URGENCY.URGENT}' THEN 1
          WHEN '${CONSULT_URGENCY.HIGH}' THEN 2
          WHEN '${CONSULT_URGENCY.NORMAL}' THEN 3
          WHEN '${CONSULT_URGENCY.LOW}' THEN 4
        END,
        created_at DESC
    `;

    // 페이지네이션
    const limit = filters?.limit || 20;
    const offset = filters?.offset || 0;
    query += ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const consultations = this.db.prepare(query).all(...params) as any[];

    // AvailableConsultation 타입으로 변환 (테스트 호환성을 위해 snake_case 속성도 추가)
    return consultations.map(c => ({
      id: c.id,
      consultNo: c.consult_no,
      consult_no: c.consult_no, // snake_case 호환
      teacherId: c.teacher_id,
      teacher_id: c.teacher_id, // snake_case 호환
      title: c.title,
      category: c.category,
      urgency: c.urgency,
      status: c.status || 'pending', // status 필드 추가
      createdAt: new Date(c.created_at),
      created_at: c.created_at, // snake_case 호환
      isUrgent: c.urgency === CONSULT_URGENCY.URGENT,
      waitingTime: Math.floor((Date.now() - new Date(c.created_at).getTime()) / 1000 / 60), // 분 단위
      competingLawyers: 0 // 실시간 경쟁 변호사 수 (향후 구현)
    }));
  }

  /**
   * 변호사가 상담 선택
   * 트랜잭션 락을 사용하여 동시 선택 방지
   */
  async selectConsultation(
    consultationId: number,
    lawyerId: number
  ): Promise<LawyerSelectionResult> {
    // 트랜잭션 시작
    const transaction = this.db.transaction(() => {
      // 0. 변호사 활성 상태 확인
      const lawyer = this.db.prepare(`
        SELECT is_active FROM lawyers WHERE id = ?
      `).get(lawyerId) as any;

      if (!lawyer || !lawyer.is_active) {
        throw new Error('Lawyer is not active');
      }

      // 1. 워크로드 확인
      const workloadCheck = this.db.prepare(`
        SELECT COUNT(*) as current_load
        FROM consults
        WHERE lawyer_id = ?
          AND status NOT IN (?, ?, ?)
      `).get(
        lawyerId,
        CONSULT_STATUS.COMPLETED,
        CONSULT_STATUS.CANCELLED,
        CONSULT_STATUS.EXPIRED
      ) as any;

      if (workloadCheck.current_load >= MAX_WORKLOAD_PER_LAWYER) {
        throw new Error(`Workload limit reached (${workloadCheck.current_load}/${MAX_WORKLOAD_PER_LAWYER})`);
      }

      // 2. 상담 상태 확인 (FOR UPDATE 락)
      const consult = this.db.prepare(`
        SELECT id, status, lawyer_id
        FROM consults
        WHERE id = ?
      `).get(consultationId) as any;

      if (!consult) {
        return {
          success: false,
          error: '존재하지 않는 상담입니다'
        };
      }

      if (consult.status !== CONSULT_STATUS.PENDING) {
        throw new Error('Already assigned');
      }

      if (consult.lawyer_id) {
        throw new Error('Already assigned');
      }

      // 3. 상담 배정 (원자적 업데이트)
      const result = this.db.prepare(`
        UPDATE consults
        SET
          lawyer_id = ?,
          status = ?,
          matched_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
          AND status = ?
          AND lawyer_id IS NULL
      `).run(
        lawyerId,
        CONSULT_STATUS.ASSIGNED,
        consultationId,
        CONSULT_STATUS.PENDING
      );

      if (result.changes === 0) {
        return {
          success: false,
          error: '다른 변호사가 먼저 선택했습니다'
        };
      }

      // 4. 성공 - 상담 정보 조회하여 반환
      const updatedConsult = this.db.prepare(`
        SELECT * FROM consults WHERE id = ?
      `).get(consultationId) as any;

      return {
        success: true,
        consultId: consultationId,
        consult: {
          ...updatedConsult,
          lawyer_id: updatedConsult.lawyer_id
        }
      };
    });

    // 트랜잭션 실행
    try {
      return transaction() as LawyerSelectionResult;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '선택 중 오류가 발생했습니다'
      };
    }
  }

  /**
   * 선택 가능한 상담 수 조회
   */
  async getAvailableCount(filters?: {
    category?: string;
    urgency?: string;
  }): Promise<number> {
    let query = 'SELECT COUNT(*) as count FROM consults WHERE status = ?';
    const params: any[] = [CONSULT_STATUS.PENDING];

    if (filters?.category) {
      query += ' AND category = ?';
      params.push(filters.category);
    }
    if (filters?.urgency) {
      query += ' AND urgency = ?';
      params.push(filters.urgency);
    }

    const result = this.db.prepare(query).get(...params) as any;
    return result.count || 0;
  }

  /**
   * 변호사의 선택 이력 조회
   */
  async getSelectionHistory(
    lawyerId: number,
    limit: number = 10
  ): Promise<{
    consultId: number;
    consultNo: string;
    selectedAt: Date;
    status: string;
  }[]> {
    const history = this.db.prepare(`
      SELECT
        id as consultId,
        consult_no as consultNo,
        matched_at as selectedAt,
        status
      FROM consults
      WHERE lawyer_id = ?
      ORDER BY matched_at DESC
      LIMIT ?
    `).all(lawyerId, limit) as any[];

    return history.map(h => ({
      consultId: h.consultId,
      consultNo: h.consultNo,
      selectedAt: new Date(h.selectedAt),
      status: h.status
    }));
  }

  /**
   * 상담 재배정 시도 (항상 실패)
   * 배정 후 수정 불가 정책
   */
  async reassignConsultation(consultationId: number, newLawyerId: number): Promise<void> {
    throw new Error('Cannot reassign consultation');
  }

  /**
   * 상담 선택 취소 (테스트용)
   * 실제 서비스에서는 사용하지 않음 (배정 후 수정 불가)
   */
  async cancelSelection(consultationId: number, lawyerId: number): Promise<boolean> {
    // 테스트 환경에서만 동작
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('배정 완료 후에는 취소할 수 없습니다');
    }

    const result = this.db.prepare(`
      UPDATE consults
      SET
        lawyer_id = NULL,
        status = ?,
        matched_at = NULL,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
        AND lawyer_id = ?
        AND status = ?
    `).run(
      CONSULT_STATUS.PENDING,
      consultationId,
      lawyerId,
      CONSULT_STATUS.ASSIGNED
    );

    return result.changes > 0;
  }

  /**
   * 데이터베이스 연결 종료
   */
  close(): void {
    this.workloadService.close();
    this.db.close();
  }
}