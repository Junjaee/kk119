/**
 * Database Initialization Service
 * Following Single Responsibility Principle - only handles database schema creation
 */

import Database from 'better-sqlite3';
import { USER_STATUS, VERIFICATION_METHOD, DOCUMENT_TYPE, USER_ACTION } from './constants';

/**
 * Service responsible for database schema initialization
 * Following Single Responsibility Principle
 */
export class DatabaseInitializationService {
  constructor(private db: Database.Database) {}

  /**
   * Initialize all database tables and indexes
   */
  initializeDatabase(): void {
    this.createUsersTable();
    this.createUsersIndexes();
    this.createTeacherVerificationTable();
    this.createUserActivityLogTable();
    console.log('Enhanced database initialized successfully');
  }

  /**
   * Create users table with enhanced schema
   */
  private createUsersTable(): void {
    this.db.exec(`
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
        verification_method TEXT CHECK (verification_method IN ('${VERIFICATION_METHOD.EMAIL}', '${VERIFICATION_METHOD.PHONE}', '${VERIFICATION_METHOD.DOCUMENT}')),
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
  }

  /**
   * Create indexes for users table
   */
  private createUsersIndexes(): void {
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_school ON users(school);
      CREATE INDEX IF NOT EXISTS idx_users_created ON users(created_year, created_month);
      CREATE INDEX IF NOT EXISTS idx_users_verified ON users(is_verified);
    `);
  }

  /**
   * Create teacher verification table
   */
  private createTeacherVerificationTable(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS teacher_verifications (
        id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
        user_id TEXT NOT NULL,

        -- 인증 서류
        document_type TEXT CHECK (document_type IN ('${DOCUMENT_TYPE.TEACHER_CERTIFICATE}', '${DOCUMENT_TYPE.SCHOOL_ID}', '${DOCUMENT_TYPE.EMPLOYMENT_LETTER}')),
        document_path TEXT,
        document_hash TEXT, -- 문서 무결성 검증용

        -- 인증 상태
        status TEXT DEFAULT '${USER_STATUS.PENDING}' CHECK (status IN ('${USER_STATUS.PENDING}', '${USER_STATUS.APPROVED}', '${USER_STATUS.REJECTED}')),
        verified_by TEXT, -- 관리자 ID
        verified_at DATETIME,
        rejection_reason TEXT,

        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
  }

  /**
   * Create user activity log table for audit trail
   */
  private createUserActivityLogTable(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS user_activity_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        action TEXT NOT NULL CHECK (action IN ('${USER_ACTION.LOGIN}', '${USER_ACTION.LOGOUT}', '${USER_ACTION.REPORT_CREATED}', '${USER_ACTION.PROFILE_UPDATED}')),
        ip_address TEXT,
        user_agent TEXT,
        metadata JSON,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
  }

  /**
   * Create additional table for future extensions
   */
  createTable(tableName: string, schema: string): void {
    this.db.exec(`CREATE TABLE IF NOT EXISTS ${tableName} (${schema})`);
  }

  /**
   * Create index for performance optimization
   */
  createIndex(indexName: string, tableName: string, columns: string[]): void {
    const columnList = columns.join(', ');
    this.db.exec(`CREATE INDEX IF NOT EXISTS ${indexName} ON ${tableName}(${columnList})`);
  }

  /**
   * Check if table exists
   */
  tableExists(tableName: string): boolean {
    const result = this.db.prepare(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name=?
    `).get(tableName);
    return !!result;
  }

  /**
   * Get table schema information
   */
  getTableInfo(tableName: string): any[] {
    return this.db.prepare(`PRAGMA table_info(${tableName})`).all();
  }
}