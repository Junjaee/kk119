/**
 * @SPEC:NOTIFY-001
 * 알림 큐 서비스
 */

import Database from 'better-sqlite3';
import {
  NotificationQueueItem,
  NotificationChannel,
  QueueStatus,
} from '../types/notification';

export class NotificationQueueService {
  private db: Database.Database;
  private maxRetries = 3;

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
      CREATE TABLE IF NOT EXISTS notification_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        notification_id INTEGER NOT NULL,
        channel VARCHAR(20) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        retry_count INTEGER DEFAULT 0,
        error_message TEXT,
        scheduled_at TIMESTAMP,
        sent_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (notification_id) REFERENCES notifications(id)
      );

      CREATE INDEX IF NOT EXISTS idx_queue_status ON notification_queue(status);
      CREATE INDEX IF NOT EXISTS idx_queue_notification ON notification_queue(notification_id);
    `);
  }

  /**
   * 알림을 큐에 추가
   */
  async enqueue(
    notificationId: number,
    channels: NotificationChannel[],
    scheduledAt?: Date
  ): Promise<NotificationQueueItem[]> {
    const items: NotificationQueueItem[] = [];
    const scheduledAtValue = scheduledAt ? scheduledAt.toISOString() : null;

    // 배치 처리로 최적화
    const stmt = this.db.prepare(`
      INSERT INTO notification_queue (
        notification_id, channel, status, scheduled_at
      )
      VALUES (?, ?, ?, ?)
    `);

    const ids: number[] = [];
    for (const channel of channels) {
      const result = stmt.run(notificationId, channel, 'pending', scheduledAtValue);
      ids.push(result.lastInsertRowid as number);
    }

    // 한 번에 모든 항목 조회
    const placeholders = ids.map(() => '?').join(',');
    const queueItems = this.db.prepare(`
      SELECT * FROM notification_queue WHERE id IN (${placeholders})
    `).all(...ids) as any[];

    return queueItems.map(item => this.mapQueueItem(item));
  }

  /**
   * 큐 처리
   */
  async processQueue(): Promise<number> {
    // pending 상태이고 예약 시간이 지난 아이템 조회
    const now = new Date().toISOString();
    const items = this.db.prepare(`
      SELECT * FROM notification_queue
      WHERE status = 'pending'
        AND (scheduled_at IS NULL OR scheduled_at <= ?)
      ORDER BY created_at ASC
      LIMIT 100
    `).all(now) as any[];

    let processed = 0;

    for (const item of items) {
      try {
        // 처리 중 상태로 변경
        this.db.prepare(`
          UPDATE notification_queue
          SET status = 'processing'
          WHERE id = ?
        `).run(item.id);

        // 실제 전송 로직은 채널별로 구현 필요
        // 여기서는 시뮬레이션
        await this.simulateSend(item.channel);

        // 성공 처리
        this.db.prepare(`
          UPDATE notification_queue
          SET status = 'sent', sent_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(item.id);

        processed++;
      } catch (error) {
        // 실패 처리
        await this.markFailed(
          item.notification_id,
          item.channel,
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
    }

    return processed;
  }

  /**
   * 실패 처리
   */
  async markFailed(
    notificationId: number,
    channel: NotificationChannel,
    errorMessage: string
  ): Promise<void> {
    const item = await this.getQueueItem(notificationId, channel);
    if (!item) return;

    const newRetryCount = item.retryCount + 1;
    const newStatus = newRetryCount >= this.maxRetries ? 'dead' : 'failed';

    this.db.prepare(`
      UPDATE notification_queue
      SET status = ?, retry_count = ?, error_message = ?
      WHERE notification_id = ? AND channel = ?
    `).run(
      newStatus,
      newRetryCount,
      errorMessage,
      notificationId,
      channel
    );
  }

  /**
   * 실패한 알림 재시도
   */
  async retryFailed(): Promise<number> {
    // 재시도 가능한 실패 항목 조회
    const items = this.db.prepare(`
      SELECT * FROM notification_queue
      WHERE status = 'failed' AND retry_count < ?
      ORDER BY created_at ASC
      LIMIT 50
    `).all(this.maxRetries) as any[];

    let retried = 0;

    for (const item of items) {
      // pending으로 되돌림
      this.db.prepare(`
        UPDATE notification_queue
        SET status = 'pending'
        WHERE id = ?
      `).run(item.id);
      retried++;
    }

    return retried;
  }

  /**
   * 큐 아이템 조회
   */
  async getQueueItem(
    notificationId: number,
    channel: NotificationChannel
  ): Promise<NotificationQueueItem | null> {
    const item = this.db.prepare(`
      SELECT * FROM notification_queue
      WHERE notification_id = ? AND channel = ?
      ORDER BY created_at DESC
      LIMIT 1
    `).get(notificationId, channel) as any;

    if (!item) return null;

    return this.mapQueueItem(item);
  }

  /**
   * 알림의 모든 큐 아이템 조회
   */
  async getQueueItems(notificationId: number): Promise<NotificationQueueItem[]> {
    const items = this.db.prepare(`
      SELECT * FROM notification_queue
      WHERE notification_id = ?
      ORDER BY created_at DESC
    `).all(notificationId) as any[];

    return items.map(item => this.mapQueueItem(item));
  }

  /**
   * 큐 상태별 통계
   */
  async getQueueStats(): Promise<Record<QueueStatus, number>> {
    const stats = this.db.prepare(`
      SELECT status, COUNT(*) as count
      FROM notification_queue
      GROUP BY status
    `).all() as any[];

    const result: Record<QueueStatus, number> = {
      pending: 0,
      processing: 0,
      sent: 0,
      failed: 0,
      dead: 0,
    };

    stats.forEach(stat => {
      result[stat.status as QueueStatus] = stat.count;
    });

    return result;
  }

  /**
   * 오래된 큐 아이템 정리
   */
  async cleanOldQueueItems(daysOld: number = 7): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = this.db.prepare(`
      DELETE FROM notification_queue
      WHERE created_at < ? AND status IN ('sent', 'dead')
    `).run(cutoffDate.toISOString());

    return result.changes;
  }

  /**
   * 전송 시뮬레이션
   */
  private async simulateSend(channel: NotificationChannel): Promise<void> {
    // 채널별 전송 시간 시뮬레이션
    const delays = {
      in_app: 10,
      email: 100,
      push: 50,
      sms: 150,
    };

    await new Promise(resolve => setTimeout(resolve, delays[channel] || 10));

    // 10% 확률로 실패 시뮬레이션 (테스트용)
    if (Math.random() < 0.1) {
      throw new Error(`Simulated ${channel} send failure`);
    }
  }

  /**
   * 큐 아이템 매핑
   */
  private mapQueueItem(data: any): NotificationQueueItem {
    return {
      id: data.id,
      notificationId: data.notification_id,
      channel: data.channel,
      status: data.status,
      retryCount: data.retry_count,
      errorMessage: data.error_message,
      scheduledAt: data.scheduled_at ? new Date(data.scheduled_at) : undefined,
      sentAt: data.sent_at ? new Date(data.sent_at) : undefined,
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