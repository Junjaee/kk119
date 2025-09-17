import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

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

// Create tables
export function initDatabase() {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      school TEXT,
      position TEXT,
      phone TEXT,
      association TEXT,
      is_verified BOOLEAN DEFAULT 0,
      is_admin BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME
    )
  `);

  // Sessions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token TEXT UNIQUE NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Email verification tokens
  db.exec(`
    CREATE TABLE IF NOT EXISTS verification_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token TEXT UNIQUE NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Password reset tokens
  db.exec(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token TEXT UNIQUE NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Resources table
  db.exec(`
    CREATE TABLE IF NOT EXISTS resources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      file_type TEXT NOT NULL,
      uploaded_by INTEGER NOT NULL,
      download_count INTEGER DEFAULT 0,
      is_approved BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Add association column if it doesn't exist (migration)
  try {
    db.exec(`ALTER TABLE users ADD COLUMN association TEXT`);
  } catch (error: any) {
    // Column already exists or other error - ignore
    if (!error.message.includes('duplicate column name')) {
      console.warn('Migration warning:', error.message);
    }
  }

  // Create indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
    CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_verification_tokens_token ON verification_tokens(token);
    CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
    CREATE INDEX IF NOT EXISTS idx_resources_category ON resources(category);
    CREATE INDEX IF NOT EXISTS idx_resources_uploaded_by ON resources(uploaded_by);
    CREATE INDEX IF NOT EXISTS idx_resources_created_at ON resources(created_at);
  `);

  console.log('Database initialized successfully');
}

// User operations
export const userDb = {
  create: async (userData: {
    email: string;
    password: string;
    name: string;
    school?: string;
    position?: string;
    phone?: string;
    associations?: string[];
  }) => {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const stmt = db.prepare(`
      INSERT INTO users (email, password, name, school, position, phone, association)
      VALUES (@email, @password, @name, @school, @position, @phone, @association)
    `);
    
    try {
      const result = stmt.run({
        email: userData.email,
        password: hashedPassword,
        name: userData.name,
        school: userData.school || null,
        position: userData.position || null,
        phone: userData.phone || null,
        association: userData.associations ? JSON.stringify(userData.associations) : null
      });
      
      return { id: result.lastInsertRowid, ...userData };
    } catch (error: any) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        throw new Error('이미 등록된 이메일입니다.');
      }
      throw error;
    }
  },

  findByEmail: (email: string) => {
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    return stmt.get(email);
  },

  findById: (id: number) => {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id);
  },

  updateLastLogin: (userId: number) => {
    const stmt = db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?');
    return stmt.run(userId);
  },

  updatePassword: async (userId: number, newPassword: string) => {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const stmt = db.prepare('UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    return stmt.run(hashedPassword, userId);
  },

  verifyEmail: (userId: number) => {
    const stmt = db.prepare('UPDATE users SET is_verified = 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?');
    return stmt.run(userId);
  },

  update: (userId: number, userData: {
    name?: string;
    school?: string;
    position?: string;
    phone?: string;
  }) => {
    const fields = [];
    const values = [];
    
    if (userData.name) {
      fields.push('name = ?');
      values.push(userData.name);
    }
    if (userData.school !== undefined) {
      fields.push('school = ?');
      values.push(userData.school);
    }
    if (userData.position !== undefined) {
      fields.push('position = ?');
      values.push(userData.position);
    }
    if (userData.phone !== undefined) {
      fields.push('phone = ?');
      values.push(userData.phone);
    }
    
    if (fields.length === 0) return null;
    
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(userId);
    
    const stmt = db.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`);
    return stmt.run(...values);
  }
};

// Session operations
export const sessionDb = {
  create: (userId: number, token: string, expiresIn: number = 7 * 24 * 60 * 60 * 1000) => {
    const expiresAt = new Date(Date.now() + expiresIn).toISOString();
    const stmt = db.prepare(`
      INSERT INTO sessions (user_id, token, expires_at)
      VALUES (?, ?, ?)
    `);
    return stmt.run(userId, token, expiresAt);
  },

  findByToken: (token: string) => {
    const stmt = db.prepare(`
      SELECT s.*, u.* 
      FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.token = ? AND s.expires_at > datetime('now')
    `);
    return stmt.get(token);
  },

  delete: (token: string) => {
    const stmt = db.prepare('DELETE FROM sessions WHERE token = ?');
    return stmt.run(token);
  },

  deleteExpired: () => {
    const stmt = db.prepare('DELETE FROM sessions WHERE expires_at <= datetime("now")');
    return stmt.run();
  },

  deleteAllUserSessions: (userId: number) => {
    const stmt = db.prepare('DELETE FROM sessions WHERE user_id = ?');
    return stmt.run(userId);
  }
};

// Token operations
export const tokenDb = {
  createVerificationToken: (userId: number, token: string) => {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours
    const stmt = db.prepare(`
      INSERT INTO verification_tokens (user_id, token, expires_at)
      VALUES (?, ?, ?)
    `);
    return stmt.run(userId, token, expiresAt);
  },

  createPasswordResetToken: (userId: number, token: string) => {
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour
    const stmt = db.prepare(`
      INSERT INTO password_reset_tokens (user_id, token, expires_at)
      VALUES (?, ?, ?)
    `);
    return stmt.run(userId, token, expiresAt);
  },

  findVerificationToken: (token: string) => {
    const stmt = db.prepare(`
      SELECT * FROM verification_tokens 
      WHERE token = ? AND expires_at > datetime('now')
    `);
    return stmt.get(token);
  },

  findPasswordResetToken: (token: string) => {
    const stmt = db.prepare(`
      SELECT * FROM password_reset_tokens 
      WHERE token = ? AND expires_at > datetime('now')
    `);
    return stmt.get(token);
  },

  deleteVerificationToken: (token: string) => {
    const stmt = db.prepare('DELETE FROM verification_tokens WHERE token = ?');
    return stmt.run(token);
  },

  deletePasswordResetToken: (token: string) => {
    const stmt = db.prepare('DELETE FROM password_reset_tokens WHERE token = ?');
    return stmt.run(token);
  }
};

// Resource operations
export const resourceDb = {
  create: (resourceData: {
    title: string;
    description?: string;
    category: string;
    fileName: string;
    filePath: string;
    fileSize: number;
    fileType: string;
    uploadedBy: number;
  }) => {
    const stmt = db.prepare(`
      INSERT INTO resources (title, description, category, file_name, file_path, file_size, file_type, uploaded_by)
      VALUES (@title, @description, @category, @fileName, @filePath, @fileSize, @fileType, @uploadedBy)
    `);

    const result = stmt.run({
      title: resourceData.title,
      description: resourceData.description || null,
      category: resourceData.category,
      fileName: resourceData.fileName,
      filePath: resourceData.filePath,
      fileSize: resourceData.fileSize,
      fileType: resourceData.fileType,
      uploadedBy: resourceData.uploadedBy
    });

    return { id: result.lastInsertRowid, ...resourceData };
  },

  findAll: (filters?: { category?: string; search?: string; limit?: number; offset?: number }) => {
    let query = `
      SELECT r.*, u.name as uploader_name
      FROM resources r
      JOIN users u ON r.uploaded_by = u.id
      WHERE r.is_approved = 1
    `;
    const params: any[] = [];

    if (filters?.category) {
      query += ' AND r.category = ?';
      params.push(filters.category);
    }

    if (filters?.search) {
      query += ' AND (r.title LIKE ? OR r.description LIKE ?)';
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }

    query += ' ORDER BY r.created_at DESC';

    if (filters?.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);

      if (filters?.offset) {
        query += ' OFFSET ?';
        params.push(filters.offset);
      }
    }

    const stmt = db.prepare(query);
    return stmt.all(...params);
  },

  findById: (id: number) => {
    const stmt = db.prepare(`
      SELECT r.*, u.name as uploader_name
      FROM resources r
      JOIN users u ON r.uploaded_by = u.id
      WHERE r.id = ? AND r.is_approved = 1
    `);
    return stmt.get(id);
  },

  incrementDownloadCount: (id: number) => {
    const stmt = db.prepare('UPDATE resources SET download_count = download_count + 1 WHERE id = ?');
    return stmt.run(id);
  },

  findByUser: (userId: number) => {
    const stmt = db.prepare(`
      SELECT r.*, u.name as uploader_name
      FROM resources r
      JOIN users u ON r.uploaded_by = u.id
      WHERE r.uploaded_by = ?
      ORDER BY r.created_at DESC
    `);
    return stmt.all(userId);
  },

  delete: (id: number, userId: number) => {
    const stmt = db.prepare('DELETE FROM resources WHERE id = ? AND uploaded_by = ?');
    return stmt.run(id, userId);
  },

  getCategories: () => {
    const stmt = db.prepare('SELECT DISTINCT category FROM resources WHERE is_approved = 1 ORDER BY category');
    return stmt.all();
  }
};

// Initialize database on import
initDatabase();

export default db;