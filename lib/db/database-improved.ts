import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { nanoid } from 'nanoid';

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

// ID 생성 전략
export const generateId = {
  // UUID v4 - 가장 안전하고 표준적
  uuid: () => randomUUID(),
  
  // NanoID - 짧고 URL 안전
  nano: () => nanoid(),
  
  // 커스텀 ID - 접두사 + 타임스탬프 + 랜덤
  custom: (prefix: string = 'usr') => {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `${prefix}_${timestamp}_${random}`;
  },
  
  // 교사 전용 ID (학교 코드 포함)
  teacherId: (schoolCode?: string) => {
    const timestamp = Date.now().toString(36);
    const random = nanoid(8);
    return `tch_${schoolCode || 'unknown'}_${timestamp}_${random}`;
  }
};

// Create tables with improved schema
export function initDatabase() {
  // Users table with UUID as primary key
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      
      -- 교사 정보
      school TEXT,
      school_code TEXT,
      position TEXT,
      subject TEXT,
      teaching_years INTEGER,
      
      -- 연락처
      phone TEXT,
      emergency_contact TEXT,
      
      -- 인증 정보
      is_verified BOOLEAN DEFAULT 0,
      is_admin BOOLEAN DEFAULT 0,
      verification_method TEXT, -- 'email', 'phone', 'document'
      verification_date DATETIME,
      
      -- 프로필
      profile_image TEXT,
      bio TEXT,
      
      -- 메타데이터
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME,
      login_count INTEGER DEFAULT 0,
      
      -- 추가 보안
      failed_login_attempts INTEGER DEFAULT 0,
      account_locked BOOLEAN DEFAULT 0,
      locked_until DATETIME,
      
      -- 인덱스를 위한 추가 필드
      created_year INTEGER GENERATED ALWAYS AS (CAST(strftime('%Y', created_at) AS INTEGER)) STORED,
      created_month INTEGER GENERATED ALWAYS AS (CAST(strftime('%m', created_at) AS INTEGER)) STORED
    )
  `);

  // 복합 인덱스 생성
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_school ON users(school);
    CREATE INDEX IF NOT EXISTS idx_users_created ON users(created_year, created_month);
    CREATE INDEX IF NOT EXISTS idx_users_verified ON users(is_verified);
  `);

  // 교사 인증 테이블
  db.exec(`
    CREATE TABLE IF NOT EXISTS teacher_verifications (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      user_id TEXT NOT NULL,
      
      -- 인증 서류
      document_type TEXT, -- 'teacher_certificate', 'school_id', 'employment_letter'
      document_path TEXT,
      document_hash TEXT, -- 문서 무결성 검증용
      
      -- 인증 상태
      status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
      verified_by TEXT, -- 관리자 ID
      verified_at DATETIME,
      rejection_reason TEXT,
      
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // 사용자 활동 로그 (감사 추적)
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_activity_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      action TEXT NOT NULL, -- 'login', 'logout', 'report_created', 'profile_updated'
      ip_address TEXT,
      user_agent TEXT,
      metadata JSON,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  console.log('Enhanced database initialized successfully');
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
    
    // ID 생성 전략 선택
    let userId: string;
    switch (userData.idStrategy || 'uuid') {
      case 'nano':
        userId = generateId.nano();
        break;
      case 'custom':
        userId = generateId.custom('usr');
        break;
      case 'teacher':
        userId = generateId.teacherId(userData.schoolCode);
        break;
      default:
        userId = generateId.uuid();
    }
    
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
        throw new Error('이미 등록된 이메일입니다.');
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

  // 활동 로그 기록
  logActivity: (userId: string, action: string, metadata?: any) => {
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