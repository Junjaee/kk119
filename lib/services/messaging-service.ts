/**
 * @SPEC:CONSULT-001
 * 상담 메시징 서비스
 * - 실시간 메시지 전송/수신
 * - 읽음 상태 관리
 * - 메시지 히스토리
 */

import Database from 'better-sqlite3';
import {
  Message,
  CreateMessageDto,
  MessageFilter,
  CONSULT_STATUS
} from '../types/consult';

export class MessagingService {
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
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS consult_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        consult_id INTEGER NOT NULL,
        sender_id INTEGER NOT NULL,
        sender_role VARCHAR(20) NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (consult_id) REFERENCES consults(id)
      );

      CREATE INDEX IF NOT EXISTS idx_messages_consult ON consult_messages(consult_id);
      CREATE INDEX IF NOT EXISTS idx_messages_sender ON consult_messages(sender_id);
      CREATE INDEX IF NOT EXISTS idx_messages_created ON consult_messages(created_at);
    `);
  }

  /**
   * 메시지 전송
   */
  async sendMessage(data: CreateMessageDto): Promise<Message> {
    // 상담 상태 확인
    const consult = this.db.prepare(`
      SELECT status, teacher_id, lawyer_id
      FROM consults
      WHERE id = ?
    `).get(data.consultId) as any;

    if (!consult) {
      throw new Error('존재하지 않는 상담입니다');
    }

    // 메시징 가능 상태 확인
    if (![CONSULT_STATUS.IN_PROGRESS, CONSULT_STATUS.COMPLETED].includes(consult.status)) {
      throw new Error(`${consult.status} 상태에서는 메시지를 전송할 수 없습니다`);
    }

    // 권한 확인
    const isTeacher = consult.teacher_id === data.senderId;
    const isLawyer = consult.lawyer_id === data.senderId;

    if (!isTeacher && !isLawyer) {
      throw new Error('해당 상담에 대한 메시지 전송 권한이 없습니다');
    }

    const senderRole = isTeacher ? 'teacher' : 'lawyer';

    // 메시지 저장
    const result = this.db.prepare(`
      INSERT INTO consult_messages (
        consult_id,
        sender_id,
        sender_role,
        message
      ) VALUES (?, ?, ?, ?)
    `).run(
      data.consultId,
      data.senderId,
      senderRole,
      data.message
    );

    return this.getMessage(result.lastInsertRowid as number) as Message;
  }

  /**
   * 메시지 조회
   */
  async getMessage(id: number): Promise<Message | null> {
    const message = this.db.prepare(`
      SELECT * FROM consult_messages WHERE id = ?
    `).get(id) as any;

    if (!message) {
      return null;
    }

    return {
      id: message.id,
      consultId: message.consult_id,
      senderId: message.sender_id,
      senderRole: message.sender_role,
      message: message.message,
      isRead: Boolean(message.is_read),
      createdAt: new Date(message.created_at)
    };
  }

  /**
   * 상담 메시지 목록 조회
   */
  async getConsultationMessages(
    consultId: number,
    userId: number,
    filter?: MessageFilter
  ): Promise<{
    messages: Message[];
    total: number;
    unreadCount: number;
  }> {
    // 상담 권한 확인
    const consult = this.db.prepare(`
      SELECT teacher_id, lawyer_id
      FROM consults
      WHERE id = ?
    `).get(consultId) as any;

    if (!consult) {
      throw new Error('존재하지 않는 상담입니다');
    }

    const hasAccess = consult.teacher_id === userId || consult.lawyer_id === userId;
    if (!hasAccess) {
      throw new Error('해당 상담의 메시지를 조회할 권한이 없습니다');
    }

    // 쿼리 빌드
    let query = 'SELECT * FROM consult_messages WHERE consult_id = ?';
    let countQuery = 'SELECT COUNT(*) as total FROM consult_messages WHERE consult_id = ?';
    const params: any[] = [consultId];
    const countParams: any[] = [consultId];

    // 필터 적용
    if (filter?.senderId) {
      query += ' AND sender_id = ?';
      countQuery += ' AND sender_id = ?';
      params.push(filter.senderId);
      countParams.push(filter.senderId);
    }
    if (filter?.senderRole) {
      query += ' AND sender_role = ?';
      countQuery += ' AND sender_role = ?';
      params.push(filter.senderRole);
      countParams.push(filter.senderRole);
    }
    if (filter?.isRead !== undefined) {
      query += ' AND is_read = ?';
      countQuery += ' AND is_read = ?';
      params.push(filter.isRead ? 1 : 0);
      countParams.push(filter.isRead ? 1 : 0);
    }
    if (filter?.dateFrom) {
      query += ' AND created_at >= ?';
      countQuery += ' AND created_at >= ?';
      params.push(filter.dateFrom.toISOString());
      countParams.push(filter.dateFrom.toISOString());
    }
    if (filter?.dateTo) {
      query += ' AND created_at <= ?';
      countQuery += ' AND created_at <= ?';
      params.push(filter.dateTo.toISOString());
      countParams.push(filter.dateTo.toISOString());
    }

    // 정렬
    const sortOrder = filter?.sortOrder || 'ASC';
    query += ` ORDER BY created_at ${sortOrder}`;

    // 페이지네이션
    const limit = filter?.limit || 50;
    const offset = filter?.offset || 0;
    query += ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    // 실행
    const messages = this.db.prepare(query).all(...params) as any[];
    const totalResult = this.db.prepare(countQuery).get(...countParams) as any;

    // 읽지 않은 메시지 수 (상대방이 보낸 메시지 중)
    const unreadResult = this.db.prepare(`
      SELECT COUNT(*) as count
      FROM consult_messages
      WHERE consult_id = ?
        AND sender_id != ?
        AND is_read = 0
    `).get(consultId, userId) as any;

    return {
      messages: messages.map(m => ({
        id: m.id,
        consultId: m.consult_id,
        senderId: m.sender_id,
        senderRole: m.sender_role,
        message: m.message,
        isRead: Boolean(m.is_read),
        createdAt: new Date(m.created_at)
      })),
      total: totalResult.total || 0,
      unreadCount: unreadResult.count || 0
    };
  }

  /**
   * 메시지 읽음 처리
   */
  async markAsRead(
    messageId: number,
    userId: number
  ): Promise<boolean> {
    // 메시지 조회
    const message = this.db.prepare(`
      SELECT m.*, c.teacher_id, c.lawyer_id
      FROM consult_messages m
      JOIN consults c ON m.consult_id = c.id
      WHERE m.id = ?
    `).get(messageId) as any;

    if (!message) {
      throw new Error('존재하지 않는 메시지입니다');
    }

    // 권한 확인 (수신자만 읽음 처리 가능)
    const isRecipient =
      (message.sender_id !== userId) &&
      (message.teacher_id === userId || message.lawyer_id === userId);

    if (!isRecipient) {
      return false; // 본인 메시지거나 권한 없음
    }

    const result = this.db.prepare(`
      UPDATE consult_messages
      SET is_read = 1
      WHERE id = ?
    `).run(messageId);

    return result.changes > 0;
  }

  /**
   * 상담의 모든 메시지 읽음 처리
   */
  async markAllAsRead(
    consultId: number,
    userId: number
  ): Promise<number> {
    // 상담 권한 확인
    const consult = this.db.prepare(`
      SELECT teacher_id, lawyer_id
      FROM consults
      WHERE id = ?
    `).get(consultId) as any;

    if (!consult) {
      throw new Error('존재하지 않는 상담입니다');
    }

    const hasAccess = consult.teacher_id === userId || consult.lawyer_id === userId;
    if (!hasAccess) {
      throw new Error('권한이 없습니다');
    }

    // 상대방이 보낸 읽지 않은 메시지만 읽음 처리
    const result = this.db.prepare(`
      UPDATE consult_messages
      SET is_read = 1
      WHERE consult_id = ?
        AND sender_id != ?
        AND is_read = 0
    `).run(consultId, userId);

    return result.changes;
  }

  /**
   * 최근 메시지 조회
   */
  async getRecentMessages(
    userId: number,
    role: 'teacher' | 'lawyer',
    limit: number = 10
  ): Promise<{
    consultId: number;
    lastMessage: string;
    lastMessageTime: Date;
    unreadCount: number;
  }[]> {
    const roleColumn = role === 'teacher' ? 'teacher_id' : 'lawyer_id';

    const results = this.db.prepare(`
      SELECT
        m.consult_id,
        m.message as last_message,
        m.created_at as last_message_time,
        (
          SELECT COUNT(*)
          FROM consult_messages
          WHERE consult_id = m.consult_id
            AND sender_id != ?
            AND is_read = 0
        ) as unread_count
      FROM consult_messages m
      JOIN consults c ON m.consult_id = c.id
      WHERE c.${roleColumn} = ?
        AND m.created_at = (
          SELECT MAX(created_at)
          FROM consult_messages
          WHERE consult_id = m.consult_id
        )
      ORDER BY m.created_at DESC
      LIMIT ?
    `).all(userId, userId, limit) as any[];

    return results.map(r => ({
      consultId: r.consult_id,
      lastMessage: r.last_message,
      lastMessageTime: new Date(r.last_message_time),
      unreadCount: r.unread_count || 0
    }));
  }

  /**
   * 메시지 통계 조회
   */
  async getMessageStatistics(consultId: number): Promise<{
    totalMessages: number;
    teacherMessages: number;
    lawyerMessages: number;
    avgResponseTime: number | null;
    firstMessageTime: Date | null;
    lastMessageTime: Date | null;
  }> {
    const stats = this.db.prepare(`
      SELECT
        COUNT(*) as total_messages,
        SUM(CASE WHEN sender_role = 'teacher' THEN 1 ELSE 0 END) as teacher_messages,
        SUM(CASE WHEN sender_role = 'lawyer' THEN 1 ELSE 0 END) as lawyer_messages,
        MIN(created_at) as first_message_time,
        MAX(created_at) as last_message_time
      FROM consult_messages
      WHERE consult_id = ?
    `).get(consultId) as any;

    // 평균 응답 시간 계산 (분 단위)
    const responseTimeQuery = this.db.prepare(`
      WITH message_pairs AS (
        SELECT
          m1.created_at as sent_time,
          (
            SELECT MIN(m2.created_at)
            FROM consult_messages m2
            WHERE m2.consult_id = m1.consult_id
              AND m2.sender_role != m1.sender_role
              AND m2.created_at > m1.created_at
          ) as response_time
        FROM consult_messages m1
        WHERE m1.consult_id = ?
      )
      SELECT AVG(
        (julianday(response_time) - julianday(sent_time)) * 24 * 60
      ) as avg_response_minutes
      FROM message_pairs
      WHERE response_time IS NOT NULL
    `).get(consultId) as any;

    return {
      totalMessages: stats.total_messages || 0,
      teacherMessages: stats.teacher_messages || 0,
      lawyerMessages: stats.lawyer_messages || 0,
      avgResponseTime: responseTimeQuery?.avg_response_minutes || null,
      firstMessageTime: stats.first_message_time ? new Date(stats.first_message_time) : null,
      lastMessageTime: stats.last_message_time ? new Date(stats.last_message_time) : null
    };
  }

  /**
   * 메시지 삭제 (테스트용)
   */
  async deleteMessage(messageId: number): Promise<boolean> {
    // 테스트 환경에서만 동작
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('메시지는 삭제할 수 없습니다');
    }

    const result = this.db.prepare(`
      DELETE FROM consult_messages WHERE id = ?
    `).run(messageId);

    return result.changes > 0;
  }

  /**
   * 데이터베이스 연결 종료
   */
  close(): void {
    this.db.close();
  }
}