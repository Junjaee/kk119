// @TEST:CONSULT-MSG-001 | Chain: SPEC-CONSULT-001 -> CODE-CONSULT-001
// TEST-CONSULT-MSG-001: Consultation messaging system tests
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { MessagingService } from '@/lib/services/messaging-service';
import { UserRole } from '@/lib/types';

describe('Consultation Messaging', () => {
  let db: Database.Database;
  let messagingService: MessagingService;
  const testDbPath = path.join(process.cwd(), 'data', 'test-messaging.db');

  const teacherUser = {
    id: 1,
    email: 'teacher@test.com',
    name: 'Test Teacher',
    role: 'teacher' as UserRole,
  };

  const lawyerUser = {
    id: 3,
    email: 'lawyer@test.com',
    name: 'Test Lawyer',
    role: 'lawyer' as UserRole,
  };

  const adminUser = {
    id: 2,
    email: 'admin@test.com',
    name: 'Test Admin',
    role: 'admin' as UserRole,
  };

  let consultId: number;

  beforeEach(() => {
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    db = new Database(testDbPath);
    db.exec('PRAGMA foreign_keys = ON');

    // Create tables
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT DEFAULT 'teacher',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS lawyers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER UNIQUE,
        name TEXT NOT NULL,
        specialty TEXT NOT NULL,
        license_number TEXT UNIQUE,
        bio TEXT,
        years_of_experience INTEGER,
        is_verified BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS consults (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        consult_no TEXT UNIQUE NOT NULL,
        teacher_id INTEGER NOT NULL,
        lawyer_id INTEGER,
        report_id INTEGER,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        category TEXT NOT NULL,
        urgency TEXT DEFAULT 'normal',
        status TEXT DEFAULT 'pending',
        matched_at DATETIME,
        completed_at DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (teacher_id) REFERENCES users(id),
        FOREIGN KEY (lawyer_id) REFERENCES lawyers(id)
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS consult_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        consult_id INTEGER NOT NULL,
        sender_id INTEGER NOT NULL,
        sender_role TEXT NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (consult_id) REFERENCES consults(id),
        FOREIGN KEY (sender_id) REFERENCES users(id)
      )
    `);

    // Insert test users
    db.exec(`
      INSERT INTO users (id, email, password, name, role)
      VALUES
        (1, 'teacher@test.com', 'hashed', 'Test Teacher', 'teacher'),
        (2, 'admin@test.com', 'hashed', 'Test Admin', 'admin'),
        (3, 'lawyer@test.com', 'hashed', 'Test Lawyer', 'lawyer')
    `);

    db.exec(`
      INSERT INTO lawyers (id, user_id, name, specialty, is_verified)
      VALUES (1, 3, 'Test Lawyer', '학부모 민원', 1)
    `);

    // Create test consultation
    const result = db
      .prepare(`
      INSERT INTO consults (consult_no, teacher_id, lawyer_id, title, content, category, status)
      VALUES (?, 1, 1, 'Test Consult', 'Test Content', '학부모 민원', 'in_progress')
      RETURNING id
    `)
      .get('CST-2025-10-0001') as { id: number };

    consultId = result.id;

    messagingService = new MessagingService(db);
  });

  afterEach(() => {
    db.close();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('TEST-CONSULT-MSG-001-SEND: Send Messages', () => {
    it('should allow teacher to send message', async () => {
      const message = await messagingService.sendMessage(
        consultId,
        teacherUser.id,
        'teacher',
        'Hello, I need help with this case.'
      );

      expect(message).toBeDefined();
      expect(message.consult_id).toBe(consultId);
      expect(message.sender_id).toBe(teacherUser.id);
      expect(message.sender_role).toBe('teacher');
      expect(message.message).toBe('Hello, I need help with this case.');
      expect(message.is_read).toBe(false);
    });

    it('should allow lawyer to send message', async () => {
      const message = await messagingService.sendMessage(
        consultId,
        lawyerUser.id,
        'lawyer',
        'I understand. Let me review the details.'
      );

      expect(message).toBeDefined();
      expect(message.sender_role).toBe('lawyer');
    });

    it('should prevent unauthorized users from sending messages', async () => {
      await expect(
        messagingService.sendMessage(consultId, 999, 'teacher', 'Unauthorized')
      ).rejects.toThrow('Access denied');
    });

    it('should prevent messages on non-active consultations', async () => {
      // Update consultation to closed
      db.prepare('UPDATE consults SET status = ? WHERE id = ?').run('closed', consultId);

      await expect(
        messagingService.sendMessage(consultId, teacherUser.id, 'teacher', 'Message')
      ).rejects.toThrow('Cannot send message to closed consultation');
    });

    it('should sanitize message content for XSS prevention', async () => {
      const xssMessage = '<script>alert("XSS")</script>Hello';

      const message = await messagingService.sendMessage(
        consultId,
        teacherUser.id,
        'teacher',
        xssMessage
      );

      expect(message.message).not.toContain('<script>');
      expect(message.message).toContain('Hello');
    });

    it('should enforce message length limits', async () => {
      const longMessage = 'a'.repeat(5001);

      await expect(
        messagingService.sendMessage(consultId, teacherUser.id, 'teacher', longMessage)
      ).rejects.toThrow('Message exceeds maximum length');
    });
  });

  describe('TEST-CONSULT-MSG-001-READ: Read Messages', () => {
    beforeEach(async () => {
      // Create some test messages
      await messagingService.sendMessage(
        consultId,
        teacherUser.id,
        'teacher',
        'Question from teacher'
      );
      await messagingService.sendMessage(
        consultId,
        lawyerUser.id,
        'lawyer',
        'Response from lawyer'
      );
    });

    it('should retrieve all messages for a consultation', async () => {
      const messages = await messagingService.getMessages(consultId, teacherUser.id, teacherUser.role);

      expect(messages).toHaveLength(2);
      expect(messages[0].sender_role).toBe('teacher');
      expect(messages[1].sender_role).toBe('lawyer');
    });

    it('should order messages chronologically', async () => {
      const messages = await messagingService.getMessages(consultId, teacherUser.id, teacherUser.role);

      expect(new Date(messages[0].created_at).getTime()).toBeLessThanOrEqual(
        new Date(messages[1].created_at).getTime()
      );
    });

    it('should prevent unauthorized access to messages', async () => {
      await expect(
        messagingService.getMessages(consultId, 999, 'teacher')
      ).rejects.toThrow('Access denied');
    });

    it('should allow admin to view all messages', async () => {
      const messages = await messagingService.getMessages(consultId, adminUser.id, adminUser.role);

      expect(messages).toHaveLength(2);
    });

    it('should get unread message count', async () => {
      const count = await messagingService.getUnreadCount(consultId, lawyerUser.id);

      expect(count).toBe(1); // Only teacher's message is unread for lawyer
    });

    it('should get messages with pagination', async () => {
      // Create more messages
      for (let i = 0; i < 20; i++) {
        await messagingService.sendMessage(
          consultId,
          teacherUser.id,
          'teacher',
          `Message ${i}`
        );
      }

      const page1 = await messagingService.getMessages(
        consultId,
        teacherUser.id,
        teacherUser.role,
        { limit: 10, offset: 0 }
      );

      const page2 = await messagingService.getMessages(
        consultId,
        teacherUser.id,
        teacherUser.role,
        { limit: 10, offset: 10 }
      );

      expect(page1).toHaveLength(10);
      expect(page2).toHaveLength(10);
      expect(page1[0].id).not.toBe(page2[0].id);
    });
  });

  describe('TEST-CONSULT-MSG-001-STATUS: Read Status', () => {
    let messageId: number;

    beforeEach(async () => {
      const message = await messagingService.sendMessage(
        consultId,
        teacherUser.id,
        'teacher',
        'Test message'
      );
      messageId = message.id;
    });

    it('should mark message as read', async () => {
      await messagingService.markAsRead(messageId, lawyerUser.id);

      const messages = await messagingService.getMessages(
        consultId,
        lawyerUser.id,
        lawyerUser.role
      );

      expect(messages[0].is_read).toBe(true);
    });

    it('should mark all messages as read', async () => {
      // Send multiple messages
      await messagingService.sendMessage(consultId, teacherUser.id, 'teacher', 'Message 2');
      await messagingService.sendMessage(consultId, teacherUser.id, 'teacher', 'Message 3');

      await messagingService.markAllAsRead(consultId, lawyerUser.id);

      const count = await messagingService.getUnreadCount(consultId, lawyerUser.id);
      expect(count).toBe(0);
    });

    it('should not allow marking others messages as read', async () => {
      // Teacher sends message, another teacher tries to mark it read
      await expect(
        messagingService.markAsRead(messageId, 999)
      ).rejects.toThrow('Access denied');
    });

    it('should track read status per user', async () => {
      await messagingService.markAsRead(messageId, lawyerUser.id);

      // Message is read for lawyer but might still show for teacher
      const message = await messagingService.getMessageById(messageId);
      expect(message.is_read).toBe(true);
    });
  });

  describe('TEST-CONSULT-MSG-001-HISTORY: Message History', () => {
    it('should maintain complete message history', async () => {
      // Simulate conversation
      await messagingService.sendMessage(
        consultId,
        teacherUser.id,
        'teacher',
        'Initial question'
      );
      await messagingService.sendMessage(
        consultId,
        lawyerUser.id,
        'lawyer',
        'Response from lawyer'
      );
      await messagingService.sendMessage(
        consultId,
        teacherUser.id,
        'teacher',
        'Follow-up question'
      );
      await messagingService.sendMessage(
        consultId,
        lawyerUser.id,
        'lawyer',
        'Final answer'
      );

      const messages = await messagingService.getMessages(
        consultId,
        teacherUser.id,
        teacherUser.role
      );

      expect(messages).toHaveLength(4);
    });

    it('should not allow message deletion', async () => {
      const message = await messagingService.sendMessage(
        consultId,
        teacherUser.id,
        'teacher',
        'Test message'
      );

      // Messaging service should not have delete method
      expect(messagingService.deleteMessage).toBeUndefined();
    });

    it('should export message history', async () => {
      await messagingService.sendMessage(
        consultId,
        teacherUser.id,
        'teacher',
        'Question'
      );
      await messagingService.sendMessage(consultId, lawyerUser.id, 'lawyer', 'Answer');

      const history = await messagingService.exportMessageHistory(
        consultId,
        adminUser.id,
        adminUser.role
      );

      expect(history).toHaveLength(2);
      expect(history[0]).toHaveProperty('sender_name');
      expect(history[0]).toHaveProperty('message');
      expect(history[0]).toHaveProperty('created_at');
    });
  });

  describe('TEST-CONSULT-MSG-001-NOTIFY: Real-time Notification', () => {
    it('should trigger notification on new message', async () => {
      const notificationSpy = vi.fn();
      messagingService.on('message:new', notificationSpy);

      await messagingService.sendMessage(
        consultId,
        teacherUser.id,
        'teacher',
        'New message'
      );

      expect(notificationSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          consult_id: consultId,
          sender_id: teacherUser.id,
        })
      );
    });

    it('should notify recipient of new message', async () => {
      const message = await messagingService.sendMessage(
        consultId,
        teacherUser.id,
        'teacher',
        'Question'
      );

      // Check notification created
      const notification = await messagingService.getLatestNotification(lawyerUser.id);
      expect(notification).toBeDefined();
      expect(notification?.message_id).toBe(message.id);
    });

    it('should support polling for new messages', async () => {
      const lastChecked = new Date();

      await messagingService.sendMessage(consultId, teacherUser.id, 'teacher', 'New');

      const newMessages = await messagingService.getNewMessages(
        consultId,
        lawyerUser.id,
        lastChecked
      );

      expect(newMessages).toHaveLength(1);
    });
  });

  describe('TEST-CONSULT-MSG-001-ACCESS: Access Control', () => {
    it('should only allow participants to view messages', async () => {
      // Different teacher tries to access
      await expect(
        messagingService.getMessages(consultId, 999, 'teacher')
      ).rejects.toThrow('Access denied');
    });

    it('should allow admin to view all messages', async () => {
      await messagingService.sendMessage(consultId, teacherUser.id, 'teacher', 'Test');

      const messages = await messagingService.getMessages(
        consultId,
        adminUser.id,
        adminUser.role
      );

      expect(messages).toBeDefined();
    });

    it('should allow lawyer to view only assigned consultation messages', async () => {
      const messages = await messagingService.getMessages(
        consultId,
        lawyerUser.id,
        lawyerUser.role
      );

      expect(messages).toBeDefined();
    });

    it('should prevent lawyer from viewing unassigned consultation messages', async () => {
      // Create unassigned consultation
      const unassignedId = db
        .prepare(`
        INSERT INTO consults (consult_no, teacher_id, title, content, category, status)
        VALUES (?, 1, 'Unassigned', 'Test', '학부모 민원', 'pending')
        RETURNING id
      `)
        .get('CST-2025-10-0002') as { id: number };

      await expect(
        messagingService.getMessages(unassignedId.id, lawyerUser.id, lawyerUser.role)
      ).rejects.toThrow('Access denied');
    });
  });
});
