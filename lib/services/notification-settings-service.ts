/**
 * @SPEC:NOTIFY-001
 * 알림 설정 서비스
 */

import Database from 'better-sqlite3';
import {
  NotificationSettings,
  UpdateNotificationSettingsDto,
  NotificationChannel,
} from '../types/notification';

export class NotificationSettingsService {
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
      CREATE TABLE IF NOT EXISTS notification_settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL UNIQUE,
        in_app BOOLEAN DEFAULT TRUE,
        email BOOLEAN DEFAULT FALSE,
        push BOOLEAN DEFAULT FALSE,
        sms BOOLEAN DEFAULT FALSE,
        do_not_disturb BOOLEAN DEFAULT FALSE,
        dnd_start TIME,
        dnd_end TIME,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);
  }

  /**
   * 사용자 알림 설정 조회 (없으면 기본 설정 생성)
   */
  async getSettings(userId: number): Promise<NotificationSettings> {
    let settings = this.db.prepare(`
      SELECT * FROM notification_settings WHERE user_id = ?
    `).get(userId) as any;

    if (!settings) {
      // 기본 설정 생성
      const result = this.db.prepare(`
        INSERT INTO notification_settings (user_id) VALUES (?)
      `).run(userId);

      settings = this.db.prepare(`
        SELECT * FROM notification_settings WHERE id = ?
      `).get(result.lastInsertRowid) as any;
    }

    return this.mapSettings(settings);
  }

  /**
   * 알림 설정 업데이트
   */
  async updateSettings(
    userId: number,
    data: UpdateNotificationSettingsDto
  ): Promise<NotificationSettings> {
    // 기존 설정 확인 (없으면 생성)
    await this.getSettings(userId);

    const updates: string[] = ['updated_at = CURRENT_TIMESTAMP'];
    const params: any[] = [];

    if (data.inApp !== undefined) {
      updates.push('in_app = ?');
      params.push(data.inApp ? 1 : 0);
    }
    if (data.email !== undefined) {
      updates.push('email = ?');
      params.push(data.email ? 1 : 0);
    }
    if (data.push !== undefined) {
      updates.push('push = ?');
      params.push(data.push ? 1 : 0);
    }
    if (data.sms !== undefined) {
      updates.push('sms = ?');
      params.push(data.sms ? 1 : 0);
    }
    if (data.doNotDisturb !== undefined) {
      updates.push('do_not_disturb = ?');
      params.push(data.doNotDisturb ? 1 : 0);
    }
    if (data.dndStart !== undefined) {
      updates.push('dnd_start = ?');
      params.push(data.dndStart);
    }
    if (data.dndEnd !== undefined) {
      updates.push('dnd_end = ?');
      params.push(data.dndEnd);
    }

    params.push(userId);

    this.db.prepare(`
      UPDATE notification_settings
      SET ${updates.join(', ')}
      WHERE user_id = ?
    `).run(...params);

    return this.getSettings(userId);
  }

  /**
   * 방해 금지 모드 확인
   */
  async isDoNotDisturb(userId: number): Promise<boolean> {
    const settings = await this.getSettings(userId);
    return this.checkDoNotDisturb(settings);
  }

  /**
   * DND 설정 확인 (프라이빗 메서드)
   */
  private checkDoNotDisturb(settings: NotificationSettings): boolean {
    if (!settings.doNotDisturb) {
      return false;
    }

    // DND 시간대 확인 (설정되어 있는 경우)
    if (settings.dndStart && settings.dndEnd) {
      const now = new Date();
      const currentTime = this.getCurrentTimeString(now);
      return this.isTimeInRange(currentTime, settings.dndStart, settings.dndEnd);
    }

    return settings.doNotDisturb;
  }

  /**
   * 현재 시간을 HH:mm 형식으로 반환
   */
  private getCurrentTimeString(now: Date): string {
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  }

  /**
   * 시간이 범위에 포함되는지 확인
   */
  private isTimeInRange(currentTime: string, startTime: string, endTime: string): boolean {
    if (startTime <= endTime) {
      // 같은 날 범위 (예: 09:00 - 18:00)
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // 자정을 넘는 범위 (예: 22:00 - 08:00)
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  /**
   * 활성화된 채널 목록 조회
   */
  async getEnabledChannels(userId: number): Promise<NotificationChannel[]> {
    const settings = await this.getSettings(userId);
    const channels: NotificationChannel[] = [];

    if (settings.inApp) channels.push('in_app');
    if (settings.email) channels.push('email');
    if (settings.push) channels.push('push');
    if (settings.sms) channels.push('sms');

    return channels;
  }

  /**
   * 채널별 활성화 여부 확인
   */
  async isChannelEnabled(userId: number, channel: NotificationChannel): Promise<boolean> {
    const settings = await this.getSettings(userId);

    switch (channel) {
      case 'in_app':
        return settings.inApp;
      case 'email':
        return settings.email;
      case 'push':
        return settings.push;
      case 'sms':
        return settings.sms;
      default:
        return false;
    }
  }

  /**
   * 설정 매핑
   */
  private mapSettings(data: any): NotificationSettings {
    return {
      id: data.id,
      userId: data.user_id,
      inApp: data.in_app === 1,
      email: data.email === 1,
      push: data.push === 1,
      sms: data.sms === 1,
      doNotDisturb: data.do_not_disturb === 1,
      dndStart: data.dnd_start,
      dndEnd: data.dnd_end,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  }

  /**
   * 데이터베이스 연결 종료
   */
  close(): void {
    this.db.close();
  }
}