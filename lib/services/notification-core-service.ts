/**
 * @SPEC:NOTIFY-001
 * 알림 서비스
 */

import Database from 'better-sqlite3';
import {
  Notification,
  CreateNotificationDto,
  NotificationFilter,
  NotificationListResult,
  BroadcastNotificationDto,
  NotificationType,
} from '../types/notification';

export class NotificationService {
  private db: Database.Database;

  constructor(dbPathOrDb: string | Database.Database = './data/kyokwon119.db') {
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
      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        recipient_id INTEGER NOT NULL,
        recipient_role VARCHAR(20) NOT NULL,
        type VARCHAR(50) NOT NULL,
        category VARCHAR(30) NOT NULL,
        priority VARCHAR(20) DEFAULT 'normal',
        title VARCHAR(100) NOT NULL,
        content VARCHAR(500),
        action_url VARCHAR(255),
        is_read BOOLEAN DEFAULT FALSE,
        read_at TIMESTAMP,
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (recipient_id) REFERENCES users(id)
      );

      CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
      CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at);
    `);
  }

  /**
   * 알림 생성
   */
  async createNotification(data: CreateNotificationDto): Promise<Notification> {
    // 유효성 검사
    if (data.title && data.title.length > 100) {
      throw new Error('Title exceeds maximum length of 100 characters');
    }

    if (data.content && data.content.length > 500) {
      throw new Error('Content exceeds maximum length of 500 characters');
    }

    const now = new Date().toISOString();
    const result = this.db.prepare(`
      INSERT INTO notifications (
        recipient_id, recipient_role, type, category, priority,
        title, content, action_url, sent_at, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.recipientId,
      data.recipientRole,
      data.type,
      data.category,
      data.priority || 'normal',
      data.title,
      data.content || null,
      data.actionUrl || null,
      now,
      now
    );

    return this.getNotificationById(result.lastInsertRowid as number);
  }

  /**
   * 템플릿으로부터 알림 생성
   */
  async createFromTemplate(
    type: NotificationType,
    recipientId: number,
    recipientRole: string,
    variables: Record<string, string>
  ): Promise<Notification> {
    // 템플릿 조회
    const template = this.db.prepare(`
      SELECT * FROM notification_templates WHERE type = ? AND is_active = 1
    `).get(type) as any;

    if (!template) {
      throw new Error(`Template not found for type: ${type}`);
    }

    return this.createNotification({
      recipientId,
      recipientRole,
      type: type,
      category: template.category,
      title: this.substituteVariables(template.title_template, variables),
      content: template.content_template ? this.substituteVariables(template.content_template, variables) : undefined,
    });
  }

  /**
   * 알림 조회 (ID)
   */
  private getNotificationById(id: number): Notification {
    const notification = this.db.prepare(`
      SELECT * FROM notifications WHERE id = ?
    `).get(id) as any;

    return this.mapNotification(notification);
  }

  /**
   * 알림 조회 (접근 제어 포함)
   */
  async getNotification(id: number, userId: number): Promise<Notification | null> {
    const notification = this.db.prepare(`
      SELECT * FROM notifications WHERE id = ? AND recipient_id = ?
    `).get(id, userId) as any;

    if (!notification) {
      return null;
    }

    return this.mapNotification(notification);
  }

  /**
   * 사용자 알림 목록 조회
   */
  async getUserNotifications(
    userId: number,
    filter?: NotificationFilter
  ): Promise<NotificationListResult> {
    let query = 'SELECT * FROM notifications WHERE recipient_id = ?';
    let countQuery = 'SELECT COUNT(*) as total FROM notifications WHERE recipient_id = ?';
    let unreadQuery = 'SELECT COUNT(*) as unread FROM notifications WHERE recipient_id = ? AND is_read = 0';

    const params: any[] = [userId];
    const countParams: any[] = [userId];

    // 필터 적용
    if (filter?.category) {
      query += ' AND category = ?';
      countQuery += ' AND category = ?';
      params.push(filter.category);
      countParams.push(filter.category);
    }

    if (filter?.priority) {
      query += ' AND priority = ?';
      countQuery += ' AND priority = ?';
      params.push(filter.priority);
      countParams.push(filter.priority);
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
    const sortBy = filter?.sortBy || 'createdAt';

    // priority 정렬 시에는 ASC (작은 숫자가 먼저), 그 외에는 DESC
    const sortOrder = filter?.sortOrder || (sortBy === 'priority' ? 'ASC' : 'DESC');

    const sortColumn = sortBy === 'createdAt' ? 'created_at' :
                      sortBy === 'priority' ?
                        `CASE priority
                          WHEN 'critical' THEN 1
                          WHEN 'high' THEN 2
                          WHEN 'normal' THEN 3
                          WHEN 'low' THEN 4
                        END` :
                      'read_at';

    query += ` ORDER BY ${sortColumn} ${sortOrder}`;

    // 페이지네이션
    const limit = filter?.limit || 20;
    const offset = filter?.offset || 0;
    query += ` LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    // 실행
    const notifications = this.db.prepare(query).all(...params) as any[];
    const totalResult = this.db.prepare(countQuery).get(...countParams) as any;
    const unreadResult = this.db.prepare(unreadQuery).get(userId) as any;

    return {
      notifications: notifications.map(n => this.mapNotification(n)),
      total: totalResult.total || 0,
      unreadCount: unreadResult.unread || 0,
    };
  }

  /**
   * 읽지 않은 알림 개수
   */
  async getUnreadCount(userId: number): Promise<number> {
    const result = this.db.prepare(`
      SELECT COUNT(*) as count FROM notifications
      WHERE recipient_id = ? AND is_read = 0
    `).get(userId) as any;

    return result.count || 0;
  }

  /**
   * 알림 읽음 처리
   */
  async markAsRead(notificationId: number, userId: number): Promise<boolean> {
    // 소유권 확인
    const notification = await this.getNotification(notificationId, userId);
    if (!notification) {
      throw new Error('Access denied');
    }

    const result = this.db.prepare(`
      UPDATE notifications
      SET is_read = 1, read_at = CURRENT_TIMESTAMP
      WHERE id = ? AND recipient_id = ?
    `).run(notificationId, userId);

    return result.changes > 0;
  }

  /**
   * 모든 알림 읽음 처리
   */
  async markAllAsRead(userId: number): Promise<number> {
    const result = this.db.prepare(`
      UPDATE notifications
      SET is_read = 1, read_at = CURRENT_TIMESTAMP
      WHERE recipient_id = ? AND is_read = 0
    `).run(userId);

    return result.changes;
  }

  /**
   * 알림 삭제
   */
  async deleteNotification(notificationId: number, userId: number): Promise<boolean> {
    // 소유권 확인
    const notification = await this.getNotification(notificationId, userId);
    if (!notification) {
      throw new Error('Access denied');
    }

    const result = this.db.prepare(`
      DELETE FROM notifications WHERE id = ? AND recipient_id = ?
    `).run(notificationId, userId);

    return result.changes > 0;
  }

  /**
   * 모든 알림 삭제
   */
  async clearAllNotifications(userId: number): Promise<number> {
    const result = this.db.prepare(`
      DELETE FROM notifications WHERE recipient_id = ?
    `).run(userId);

    return result.changes;
  }

  /**
   * 전체 공지 발송
   */
  async broadcast(
    data: BroadcastNotificationDto,
    adminId: number
  ): Promise<number> {
    // 관리자 권한 확인
    const admin = this.db.prepare(`
      SELECT role FROM users WHERE id = ?
    `).get(adminId) as any;

    if (!admin || (admin.role !== 'admin' && admin.role !== 'admin')) {
      throw new Error('Admin access required');
    }

    // 모든 사용자 조회
    const users = this.db.prepare(`
      SELECT id, role FROM users
    `).all() as any[];

    let count = 0;
    for (const user of users) {
      await this.createNotification({
        recipientId: user.id,
        recipientRole: user.role,
        type: data.type,
        category: data.category,
        priority: data.priority,
        title: data.title,
        content: data.content,
        actionUrl: data.actionUrl,
      });
      count++;
    }

    return count;
  }

  /**
   * 특정 역할에게 공지 발송
   */
  async broadcastToRole(
    role: string,
    data: BroadcastNotificationDto,
    adminId: number
  ): Promise<number> {
    // 관리자 권한 확인
    const admin = this.db.prepare(`
      SELECT role FROM users WHERE id = ?
    `).get(adminId) as any;

    if (!admin || (admin.role !== 'admin' && admin.role !== 'admin')) {
      throw new Error('Admin access required');
    }

    // 특정 역할 사용자 조회
    const users = this.db.prepare(`
      SELECT id, role FROM users WHERE role = ?
    `).all(role) as any[];

    let count = 0;
    for (const user of users) {
      await this.createNotification({
        recipientId: user.id,
        recipientRole: user.role,
        type: data.type,
        category: data.category,
        priority: data.priority,
        title: data.title,
        content: data.content,
        actionUrl: data.actionUrl,
      });
      count++;
    }

    return count;
  }

  /**
   * 만료된 알림 삭제 (30일 이상)
   */
  async deleteExpiredNotifications(): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = this.db.prepare(`
      DELETE FROM notifications
      WHERE created_at < ?
    `).run(thirtyDaysAgo.toISOString());

    return result.changes;
  }

  /**
   * 템플릿에서 변수 치환
   */
  private substituteVariables(text: string, variables: Record<string, string>): string {
    return Object.entries(variables).reduce((result, [key, value]) => {
      return result.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }, text);
  }

  /**
   * 알림 매핑
   */
  private mapNotification(data: any): Notification {
    return {
      id: data.id,
      recipientId: data.recipient_id,
      recipientRole: data.recipient_role,
      type: data.type,
      category: data.category,
      priority: data.priority,
      title: data.title,
      content: data.content,
      actionUrl: data.action_url,
      isRead: data.is_read === 1,
      readAt: data.read_at ? new Date(data.read_at) : null,
      sentAt: new Date(data.sent_at),
      createdAt: new Date(data.created_at),
    };
  }

  /**
   * 데이터베이스 연결 종료
   */
  close(): void {
    this.db.close();
  }
}