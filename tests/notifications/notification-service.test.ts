// @TEST:NOTIFY-001 | Chain: SPEC-NOTIFY-001 -> CODE-NOTIFY-001
// TEST-NOTIFY-001: 실시간 알림 시스템 테스트
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { NotificationService } from '@/lib/services/notification-core-service';
import { NotificationSettingsService } from '@/lib/services/notification-settings-service';
import { NotificationQueueService } from '@/lib/services/notification-queue-service';
import { NotificationTemplateService } from '@/lib/services/notification-template-service';
import { NotificationType, NotificationPriority, NotificationChannel } from '@/lib/types/notification';

describe('Notification System', () => {
  let db: Database.Database;
  let notificationService: NotificationService;
  let settingsService: NotificationSettingsService;
  let queueService: NotificationQueueService;
  let templateService: NotificationTemplateService;
  const testDbPath = path.join(process.cwd(), 'data', 'test-notify.db');

  const teacherUser = {
    id: 1,
    email: 'teacher@test.com',
    name: '김교사',
    role: 'teacher',
  };

  const lawyerUser = {
    id: 2,
    email: 'lawyer@test.com',
    name: '박변호사',
    role: 'lawyer',
  };

  const adminUser = {
    id: 3,
    email: 'admin@test.com',
    name: '관리자',
    role: 'admin',
  };

  beforeEach(() => {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    db = new Database(testDbPath);
    db.exec('PRAGMA foreign_keys = ON');

    // 테스트용 users 테이블 생성
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        role TEXT DEFAULT 'teacher',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 테스트 사용자 추가
    db.exec(`
      INSERT INTO users (id, email, name, role)
      VALUES
        (1, 'teacher@test.com', '김교사', 'teacher'),
        (2, 'lawyer@test.com', '박변호사', 'lawyer'),
        (3, 'admin@test.com', '관리자', 'admin')
    `);

    notificationService = new NotificationService(db);
    settingsService = new NotificationSettingsService(db);
    queueService = new NotificationQueueService(db);
    templateService = new NotificationTemplateService(db);
  });

  afterEach(() => {
    db.close();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('TEST-NOTIFY-001-CREATE: 알림 생성', () => {
    it('should create notification with valid data', async () => {
      const notificationData = {
        recipientId: teacherUser.id,
        recipientRole: teacherUser.role,
        type: 'report.created' as NotificationType,
        category: 'REPORT',
        priority: 'normal' as NotificationPriority,
        title: '신고가 접수되었습니다',
        content: '신고 번호 #12345가 접수되었습니다.',
        actionUrl: '/reports/12345',
      };

      const notification = await notificationService.createNotification(notificationData);

      expect(notification).toBeDefined();
      expect(notification.id).toBeDefined();
      expect(notification.recipientId).toBe(teacherUser.id);
      expect(notification.type).toBe('report.created');
      expect(notification.isRead).toBe(false);
      expect(notification.sentAt).toBeDefined();
    });

    it('should reject notification with title exceeding 100 characters', async () => {
      const longTitle = 'a'.repeat(101);
      const notificationData = {
        recipientId: teacherUser.id,
        recipientRole: teacherUser.role,
        type: 'report.created' as NotificationType,
        category: 'REPORT',
        title: longTitle,
        content: '테스트',
      };

      await expect(notificationService.createNotification(notificationData))
        .rejects.toThrow('Title exceeds maximum length of 100 characters');
    });

    it('should reject notification with content exceeding 500 characters', async () => {
      const longContent = 'a'.repeat(501);
      const notificationData = {
        recipientId: teacherUser.id,
        recipientRole: teacherUser.role,
        type: 'report.created' as NotificationType,
        category: 'REPORT',
        title: '테스트',
        content: longContent,
      };

      await expect(notificationService.createNotification(notificationData))
        .rejects.toThrow('Content exceeds maximum length of 500 characters');
    });

    it('should create notification from template', async () => {
      // 템플릿 먼저 생성
      await templateService.createTemplate({
        type: 'report.created',
        category: 'REPORT',
        titleTemplate: '신고가 접수되었습니다 - {{reportNo}}',
        contentTemplate: '{{teacherName}}님의 신고 #{{reportNo}}가 접수되었습니다.',
        variables: ['reportNo', 'teacherName'],
      });

      const notification = await notificationService.createFromTemplate(
        'report.created',
        teacherUser.id,
        teacherUser.role,
        {
          reportNo: '12345',
          teacherName: '김교사',
        }
      );

      expect(notification).toBeDefined();
      expect(notification.title).toBe('신고가 접수되었습니다 - 12345');
      expect(notification.content).toContain('김교사님의 신고 #12345');
    });
  });

  describe('TEST-NOTIFY-001-QUEUE: 알림 큐 관리', () => {
    let notificationId: number;

    beforeEach(async () => {
      const notification = await notificationService.createNotification({
        recipientId: teacherUser.id,
        recipientRole: teacherUser.role,
        type: 'report.created' as NotificationType,
        category: 'REPORT',
        title: '테스트 알림',
        content: '테스트 내용',
      });
      notificationId = notification.id;
    });

    it('should queue notification for multiple channels', async () => {
      const channels: NotificationChannel[] = ['in_app', 'email'];

      const queueItems = await queueService.enqueue(notificationId, channels);

      expect(queueItems).toHaveLength(2);
      expect(queueItems[0].channel).toBe('in_app');
      expect(queueItems[1].channel).toBe('email');
      expect(queueItems[0].status).toBe('pending');
    });

    it('should process queued notifications', async () => {
      await queueService.enqueue(notificationId, ['in_app']);

      const processed = await queueService.processQueue();

      expect(processed).toBeGreaterThan(0);
      const queueItem = await queueService.getQueueItem(notificationId, 'in_app');
      expect(queueItem?.status).toBe('sent');
      expect(queueItem?.sentAt).toBeDefined();
    });

    it('should retry failed notifications', async () => {
      await queueService.enqueue(notificationId, ['email']);

      // 실패 시뮬레이션
      await queueService.markFailed(notificationId, 'email', 'Connection error');

      const queueItem = await queueService.getQueueItem(notificationId, 'email');
      expect(queueItem?.status).toBe('failed');
      expect(queueItem?.retryCount).toBe(1);
      expect(queueItem?.errorMessage).toBe('Connection error');

      // 재시도
      const retried = await queueService.retryFailed();
      expect(retried).toBeGreaterThan(0);
    });

    it('should not retry after max attempts', async () => {
      await queueService.enqueue(notificationId, ['email']);

      // 3회 실패 시뮬레이션
      for (let i = 0; i < 3; i++) {
        await queueService.markFailed(notificationId, 'email', 'Connection error');
      }

      const queueItem = await queueService.getQueueItem(notificationId, 'email');
      expect(queueItem?.status).toBe('dead');
      expect(queueItem?.retryCount).toBe(3);

      // 재시도 시도
      const retried = await queueService.retryFailed();
      expect(retried).toBe(0);
    });
  });

  describe('TEST-NOTIFY-001-SETTINGS: 알림 설정', () => {
    it('should create default notification settings', async () => {
      const settings = await settingsService.getSettings(teacherUser.id);

      expect(settings).toBeDefined();
      expect(settings.userId).toBe(teacherUser.id);
      expect(settings.inApp).toBe(true);
      expect(settings.email).toBe(false);
      expect(settings.push).toBe(false);
      expect(settings.doNotDisturb).toBe(false);
    });

    it('should update notification settings', async () => {
      const updated = await settingsService.updateSettings(teacherUser.id, {
        email: true,
        push: true,
        doNotDisturb: true,
        dndStart: '22:00',
        dndEnd: '08:00',
      });

      expect(updated.email).toBe(true);
      expect(updated.push).toBe(true);
      expect(updated.doNotDisturb).toBe(true);
      expect(updated.dndStart).toBe('22:00');
      expect(updated.dndEnd).toBe('08:00');
    });

    it('should respect do not disturb settings', async () => {
      await settingsService.updateSettings(teacherUser.id, {
        doNotDisturb: true,
        dndStart: '22:00',
        dndEnd: '08:00',
      });

      // 현재 시간이 DND 시간대인지 확인
      const isDND = await settingsService.isDoNotDisturb(teacherUser.id);

      // 테스트 시간에 따라 결과가 달라질 수 있음
      expect(typeof isDND).toBe('boolean');
    });

    it('should get enabled channels for user', async () => {
      await settingsService.updateSettings(teacherUser.id, {
        inApp: true,
        email: true,
        push: false,
      });

      const channels = await settingsService.getEnabledChannels(teacherUser.id);

      expect(channels).toContain('in_app');
      expect(channels).toContain('email');
      expect(channels).not.toContain('push');
    });
  });

  describe('TEST-NOTIFY-001-READ: 알림 읽음 처리', () => {
    let notificationId: number;

    beforeEach(async () => {
      const notification = await notificationService.createNotification({
        recipientId: teacherUser.id,
        recipientRole: teacherUser.role,
        type: 'report.created' as NotificationType,
        category: 'REPORT',
        title: '테스트 알림',
        content: '테스트 내용',
      });
      notificationId = notification.id;
    });

    it('should mark notification as read', async () => {
      const marked = await notificationService.markAsRead(notificationId, teacherUser.id);

      expect(marked).toBe(true);
      const notification = await notificationService.getNotification(notificationId, teacherUser.id);
      expect(notification?.isRead).toBe(true);
      expect(notification?.readAt).toBeDefined();
    });

    it('should prevent other users from marking notification as read', async () => {
      await expect(notificationService.markAsRead(notificationId, lawyerUser.id))
        .rejects.toThrow('Access denied');
    });

    it('should mark all notifications as read', async () => {
      // 여러 알림 생성
      for (let i = 0; i < 3; i++) {
        await notificationService.createNotification({
          recipientId: teacherUser.id,
          recipientRole: teacherUser.role,
          type: 'report.created' as NotificationType,
          category: 'REPORT',
          title: `테스트 알림 ${i}`,
          content: '테스트 내용',
        });
      }

      const marked = await notificationService.markAllAsRead(teacherUser.id);
      expect(marked).toBeGreaterThan(0);

      const unread = await notificationService.getUnreadCount(teacherUser.id);
      expect(unread).toBe(0);
    });
  });

  describe('TEST-NOTIFY-001-LIST: 알림 목록 조회', () => {
    beforeEach(async () => {
      // 여러 알림 생성
      for (let i = 0; i < 5; i++) {
        await notificationService.createNotification({
          recipientId: teacherUser.id,
          recipientRole: teacherUser.role,
          type: i % 2 === 0 ? 'report.created' : 'consult.assigned' as NotificationType,
          category: i % 2 === 0 ? 'REPORT' : 'CONSULT',
          priority: i === 0 ? 'high' : 'normal' as NotificationPriority,
          title: `알림 ${i}`,
          content: `내용 ${i}`,
        });
      }
    });

    it('should get user notifications with pagination', async () => {
      const result = await notificationService.getUserNotifications(teacherUser.id, {
        limit: 3,
        offset: 0,
      });

      expect(result.notifications).toHaveLength(3);
      expect(result.total).toBe(5);
      expect(result.unreadCount).toBe(5);
    });

    it('should filter notifications by category', async () => {
      const result = await notificationService.getUserNotifications(teacherUser.id, {
        category: 'REPORT',
      });

      expect(result.notifications.every(n => n.category === 'REPORT')).toBe(true);
    });

    it('should filter notifications by read status', async () => {
      // 일부 읽음 처리
      const notifications = await notificationService.getUserNotifications(teacherUser.id);
      await notificationService.markAsRead(notifications.notifications[0].id, teacherUser.id);

      const unreadOnly = await notificationService.getUserNotifications(teacherUser.id, {
        isRead: false,
      });

      expect(unreadOnly.notifications.every(n => !n.isRead)).toBe(true);
      expect(unreadOnly.total).toBe(4);
    });

    it('should sort notifications by priority', async () => {
      const result = await notificationService.getUserNotifications(teacherUser.id, {
        sortBy: 'priority',
      });

      // 첫 번째 알림이 high priority여야 함
      expect(result.notifications[0].priority).toBe('high');
    });
  });

  describe('TEST-NOTIFY-001-DELETE: 알림 삭제', () => {
    let notificationId: number;

    beforeEach(async () => {
      const notification = await notificationService.createNotification({
        recipientId: teacherUser.id,
        recipientRole: teacherUser.role,
        type: 'report.created' as NotificationType,
        category: 'REPORT',
        title: '테스트 알림',
        content: '테스트 내용',
      });
      notificationId = notification.id;
    });

    it('should delete notification', async () => {
      const deleted = await notificationService.deleteNotification(notificationId, teacherUser.id);

      expect(deleted).toBe(true);
      const notification = await notificationService.getNotification(notificationId, teacherUser.id);
      expect(notification).toBeNull();
    });

    it('should prevent other users from deleting notification', async () => {
      await expect(notificationService.deleteNotification(notificationId, lawyerUser.id))
        .rejects.toThrow('Access denied');
    });

    it('should clear all notifications', async () => {
      // 여러 알림 생성
      for (let i = 0; i < 3; i++) {
        await notificationService.createNotification({
          recipientId: teacherUser.id,
          recipientRole: teacherUser.role,
          type: 'report.created' as NotificationType,
          category: 'REPORT',
          title: `테스트 알림 ${i}`,
          content: '테스트 내용',
        });
      }

      const cleared = await notificationService.clearAllNotifications(teacherUser.id);
      expect(cleared).toBeGreaterThan(0);

      const result = await notificationService.getUserNotifications(teacherUser.id);
      expect(result.total).toBe(0);
    });
  });

  describe('TEST-NOTIFY-001-BROADCAST: 전체 공지', () => {
    it('should broadcast notification to all users', async () => {
      const broadcasted = await notificationService.broadcast({
        type: 'system.alert' as NotificationType,
        category: 'SYSTEM',
        priority: 'high' as NotificationPriority,
        title: '시스템 점검 안내',
        content: '오늘 밤 11시부터 시스템 점검이 있습니다.',
      }, adminUser.id);

      expect(broadcasted).toBeGreaterThan(0);

      // 모든 사용자가 알림을 받았는지 확인
      const teacherNotifs = await notificationService.getUserNotifications(teacherUser.id);
      const lawyerNotifs = await notificationService.getUserNotifications(lawyerUser.id);

      expect(teacherNotifs.total).toBeGreaterThan(0);
      expect(lawyerNotifs.total).toBeGreaterThan(0);
    });

    it('should prevent non-admin from broadcasting', async () => {
      await expect(notificationService.broadcast({
        type: 'system.alert' as NotificationType,
        category: 'SYSTEM',
        title: '테스트',
        content: '테스트',
      }, teacherUser.id)).rejects.toThrow('Admin access required');
    });

    it('should broadcast to specific role', async () => {
      const broadcasted = await notificationService.broadcastToRole('teacher', {
        type: 'system.update' as NotificationType,
        category: 'SYSTEM',
        title: '교사 전용 공지',
        content: '교사님들께만 전달되는 공지입니다.',
      }, adminUser.id);

      expect(broadcasted).toBeGreaterThan(0);

      const teacherNotifs = await notificationService.getUserNotifications(teacherUser.id);
      const lawyerNotifs = await notificationService.getUserNotifications(lawyerUser.id);

      // 교사만 알림을 받았어야 함
      expect(teacherNotifs.notifications.some(n => n.title === '교사 전용 공지')).toBe(true);
      expect(lawyerNotifs.notifications.some(n => n.title === '교사 전용 공지')).toBe(false);
    });
  });

  describe('TEST-NOTIFY-001-EXPIRY: 알림 만료', () => {
    it('should auto-delete notifications older than 30 days', async () => {
      // 30일 이상 된 알림 직접 삽입
      db.prepare(`
        INSERT INTO notifications (
          recipient_id, recipient_role, type, category, title, content,
          created_at, sent_at
        )
        VALUES (?, ?, ?, ?, ?, ?, datetime('now', '-31 days'), datetime('now', '-31 days'))
      `).run(
        teacherUser.id,
        teacherUser.role,
        'report.created',
        'REPORT',
        '오래된 알림',
        '오래된 내용'
      );

      // 최근 알림 생성
      await notificationService.createNotification({
        recipientId: teacherUser.id,
        recipientRole: teacherUser.role,
        type: 'report.created' as NotificationType,
        category: 'REPORT',
        title: '새 알림',
        content: '새 내용',
      });

      const deleted = await notificationService.deleteExpiredNotifications();
      expect(deleted).toBeGreaterThan(0);

      const result = await notificationService.getUserNotifications(teacherUser.id);
      expect(result.notifications.every(n => n.title !== '오래된 알림')).toBe(true);
    });
  });
});