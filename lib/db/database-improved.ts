import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import { DatabaseInitializationService } from './database-initialization-service';
import { idGenerationService, generateId, IdGenerationOptions } from './id-generation-service';
import { ERROR_MESSAGES, USER_ACTION } from './constants';

// Ensure data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize database
const dbPath = path.join(dataDir, 'kyokwon119.db');
const db = new Database(dbPath);

// Enable foreign keys
db.exec('PRAGMA foreign_keys = ON');

// Initialize database schema using service
const dbInitService = new DatabaseInitializationService(db);

// Re-export generateId for backward compatibility
export { generateId };

/**
 * Initialize database tables and schema
 * Following Single Responsibility Principle - delegates to specialized service
 */
export function initDatabase() {
  dbInitService.initializeDatabase();
}

// User operations with improved ID handling
export const userDb = {
  create: async (userData: {
    email: string;
    password: string;
    name: string;
    school?: string;
    schoolCode?: string;
    position?: string;
    subject?: string;
    teachingYears?: number;
    phone?: string;
    idStrategy?: 'uuid' | 'nano' | 'custom' | 'teacher';
  }) => {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    // ID 생성 전략 선택 - using service
    const userId = idGenerationService.generateId({
      strategy: userData.idStrategy || 'uuid',
      prefix: 'usr',
      schoolCode: userData.schoolCode
    });
    
    const stmt = db.prepare(`
      INSERT INTO users (
        id, email, password, name, school, school_code, 
        position, subject, teaching_years, phone
      )
      VALUES (
        @id, @email, @password, @name, @school, @schoolCode,
        @position, @subject, @teachingYears, @phone
      )
    `);
    
    try {
      const result = stmt.run({
        id: userId,
        email: userData.email,
        password: hashedPassword,
        name: userData.name,
        school: userData.school || null,
        schoolCode: userData.schoolCode || null,
        position: userData.position || null,
        subject: userData.subject || null,
        teachingYears: userData.teachingYears || null,
        phone: userData.phone || null
      });
      
      return { id: userId, ...userData };
    } catch (error: any) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        throw new Error(ERROR_MESSAGES.EMAIL_ALREADY_EXISTS);
      }
      throw error;
    }
  },

  // 다양한 방법으로 사용자 찾기
  findByEmail: (email: string) => {
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    return stmt.get(email);
  },

  findById: (id: string) => {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id);
  },

  findBySchool: (school: string) => {
    const stmt = db.prepare('SELECT * FROM users WHERE school = ?');
    return stmt.all(school);
  },

  // 활동 로그 기록 - improved with validation
  logActivity: (userId: string, action: USER_ACTION[keyof typeof USER_ACTION], metadata?: any) => {
    const stmt = db.prepare(`
      INSERT INTO user_activity_logs (user_id, action, metadata)
      VALUES (?, ?, ?)
    `);
    stmt.run(userId, action, JSON.stringify(metadata || {}));
  },

  // 통계 조회
  getStatistics: () => {
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get();
    const verifiedUsers = db.prepare('SELECT COUNT(*) as count FROM users WHERE is_verified = 1').get();
    const schoolStats = db.prepare('SELECT school, COUNT(*) as count FROM users GROUP BY school').all();
    
    return {
      totalUsers,
      verifiedUsers,
      schoolStats
    };
  }
};

// Initialize database on import
initDatabase();

export default db;