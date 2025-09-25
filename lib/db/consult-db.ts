import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

// Ensure data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize separate database for consult (will be merged later)
const dbPath = path.join(dataDir, 'consult.db');
const db = new Database(dbPath);

// Enable foreign keys
db.exec('PRAGMA foreign_keys = ON');

// Initialize consult-related tables
export function initConsultDatabase() {
  // Lawyers table
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

  // Consults table
  db.exec(`
    CREATE TABLE IF NOT EXISTS consults (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_id INTEGER,
      user_id INTEGER NOT NULL,
      lawyer_id INTEGER,
      title TEXT NOT NULL,
      report_type TEXT NOT NULL,
      report_status TEXT DEFAULT 'pending',
      incident_date DATE NOT NULL,
      report_content TEXT NOT NULL,
      consult_content TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      answered_at DATETIME,
      FOREIGN KEY (lawyer_id) REFERENCES lawyers(id) ON DELETE SET NULL
    )
  `);

  // Consult replies table for follow-up questions
  db.exec(`
    CREATE TABLE IF NOT EXISTS consult_replies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      consult_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      is_lawyer BOOLEAN DEFAULT 0,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (consult_id) REFERENCES consults(id) ON DELETE CASCADE
    )
  `);

  // Consult attachments table
  db.exec(`
    CREATE TABLE IF NOT EXISTS consult_attachments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      consult_id INTEGER NOT NULL,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_type TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (consult_id) REFERENCES consults(id) ON DELETE CASCADE
    )
  `);

  // Create indexes for better performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_consults_user_id ON consults(user_id);
    CREATE INDEX IF NOT EXISTS idx_consults_lawyer_id ON consults(lawyer_id);
    CREATE INDEX IF NOT EXISTS idx_consults_status ON consults(status);
    CREATE INDEX IF NOT EXISTS idx_consult_replies_consult_id ON consult_replies(consult_id);
  `);

  console.log('Consult database initialized successfully');
}

// Consult operations
export const consultDb = {
  // Create new consult
  create: (data: {
    report_id?: number;
    user_id: number;
    title: string;
    report_type: string;
    incident_date: string;
    report_content: string;
    report_status?: string;
  }) => {
    const stmt = db.prepare(`
      INSERT INTO consults (
        report_id, user_id, title, report_type,
        incident_date, report_content, report_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      data.report_id || null,
      data.user_id,
      data.title,
      data.report_type,
      data.incident_date,
      data.report_content,
      data.report_status || 'pending'
    );

    return result.lastInsertRowid;
  },

  // Get all consults with lawyer info
  findAll: (userId?: number, status?: string) => {
    let query = `
      SELECT
        c.*,
        l.name as lawyer_name,
        l.specialty as lawyer_specialty,
        (SELECT COUNT(*) FROM consult_replies WHERE consult_id = c.id) as reply_count
      FROM consults c
      LEFT JOIN lawyers l ON c.lawyer_id = l.id
      WHERE 1=1
    `;

    const params = [];
    if (userId) {
      query += ' AND c.user_id = ?';
      params.push(userId);
    }
    if (status) {
      query += ' AND c.status = ?';
      params.push(status);
    }

    query += ' ORDER BY c.created_at DESC';

    const stmt = db.prepare(query);
    return stmt.all(...params);
  },

  // Get single consult
  findById: (id: number) => {
    const stmt = db.prepare(`
      SELECT
        c.*,
        l.name as lawyer_name,
        l.specialty as lawyer_specialty,
        l.bio as lawyer_bio
      FROM consults c
      LEFT JOIN lawyers l ON c.lawyer_id = l.id
      WHERE c.id = ?
    `);

    return stmt.get(id);
  },

  // Get single consult by UUID
  findByUuid: (uuid: string) => {
    const stmt = db.prepare(`
      SELECT
        c.*,
        l.name as lawyer_name,
        l.specialty as lawyer_specialty,
        l.bio as lawyer_bio
      FROM consults c
      LEFT JOIN lawyers l ON c.lawyer_id = l.id
      WHERE c.uuid = ?
    `);

    return stmt.get(uuid);
  },

  // Update consult
  update: (id: number, data: any) => {
    const fields = [];
    const values = [];

    for (const [key, value] of Object.entries(data)) {
      if (key !== 'id') {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }

    values.push(id);

    const stmt = db.prepare(`
      UPDATE consults
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    return stmt.run(...values);
  },

  // Assign lawyer to consult
  assignLawyer: (consultId: number, lawyerId: number, consultContent: string) => {
    const stmt = db.prepare(`
      UPDATE consults
      SET lawyer_id = ?,
          consult_content = ?,
          status = 'answered',
          answered_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    return stmt.run(lawyerId, consultContent, consultId);
  },

  // Get statistics
  getStats: (userId?: number) => {
    let baseCondition = userId ? 'WHERE user_id = ?' : '';
    const params = userId ? [userId] : [];

    const total = db.prepare(`SELECT COUNT(*) as count FROM consults ${baseCondition}`).get(...params);
    const answered = db.prepare(`SELECT COUNT(*) as count FROM consults ${baseCondition} ${userId ? 'AND' : 'WHERE'} status = 'answered'`).get(...params);
    const pending = db.prepare(`SELECT COUNT(*) as count FROM consults ${baseCondition} ${userId ? 'AND' : 'WHERE'} status IN ('pending', 'reviewing')`).get(...params);

    return {
      total: total.count,
      answered: answered.count,
      pending: pending.count
    };
  },

  // Assign lawyer to consult (admin function)
  assignLawyerOnly: (consultId: number, lawyerId: number) => {
    const stmt = db.prepare(`
      UPDATE consults
      SET lawyer_id = ?,
          status = 'reviewing',
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    return stmt.run(lawyerId, consultId);
  },

  // Get unassigned consults
  findUnassigned: () => {
    const stmt = db.prepare(`
      SELECT c.*,
        'teacher' || c.user_id as user_nickname
      FROM consults c
      WHERE c.lawyer_id IS NULL
      ORDER BY c.created_at DESC
    `);

    return stmt.all();
  },

  // Get consults by lawyer
  findByLawyer: (lawyerId: number) => {
    const stmt = db.prepare(`
      SELECT c.*,
        'teacher' || c.user_id as user_nickname
      FROM consults c
      WHERE c.lawyer_id = ?
      ORDER BY c.created_at DESC
    `);

    return stmt.all(lawyerId);
  },

  // Get available consults for lawyers (without personal info)
  findAvailable: (type?: string, limit: number = 20, offset: number = 0) => {
    let query = `
      SELECT
        id, title, report_type, incident_date,
        report_content, created_at, status
      FROM consults
      WHERE lawyer_id IS NULL
    `;

    const params = [];
    if (type) {
      query += ' AND report_type = ?';
      params.push(type);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const stmt = db.prepare(query);
    return stmt.all(...params);
  },

  // Count available consults
  countAvailable: (type?: string) => {
    let query = 'SELECT COUNT(*) as count FROM consults WHERE lawyer_id IS NULL';
    const params = [];

    if (type) {
      query += ' AND report_type = ?';
      params.push(type);
    }

    const stmt = db.prepare(query);
    const result = stmt.get(...params) as { count: number };
    return result.count;
  },

  // Claim consult (lawyer selects)
  claimConsult: (consultId: number, lawyerId: number) => {
    const stmt = db.prepare(`
      UPDATE consults
      SET
        lawyer_id = ?,
        claimed_at = CURRENT_TIMESTAMP,
        status = 'reviewing',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND lawyer_id IS NULL
    `);

    return stmt.run(lawyerId, consultId);
  }
};

// Consult reply operations
export const consultReplyDb = {
  // Add reply
  create: (consultId: number, userId: number, content: string, isLawyer: boolean = false) => {
    const stmt = db.prepare(`
      INSERT INTO consult_replies (consult_id, user_id, content, is_lawyer)
      VALUES (?, ?, ?, ?)
    `);

    const result = stmt.run(consultId, userId, content, isLawyer ? 1 : 0);

    // Update consult status based on who replied
    if (isLawyer) {
      // 변호사가 답변하면 answered로 변경
      db.prepare(`
        UPDATE consults
        SET status = 'answered',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(consultId);
    } else {
      // 교사가 추가 질문하면 follow_up으로 변경
      db.prepare(`
        UPDATE consults
        SET status = 'follow_up',
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND status = 'answered'
      `).run(consultId);
    }

    return result.lastInsertRowid;
  },

  // Get replies for a consult
  findByConsultId: (consultId: number) => {
    const stmt = db.prepare(`
      SELECT * FROM consult_replies
      WHERE consult_id = ?
      ORDER BY created_at ASC
    `);

    return stmt.all(consultId);
  }
};

// Lawyer operations
export const lawyerDb = {
  // Create lawyer profile
  create: (data: {
    user_id?: number;
    name: string;
    specialty: string;
    license_number?: string;
    bio?: string;
    years_of_experience?: number;
  }) => {
    const stmt = db.prepare(`
      INSERT INTO lawyers (user_id, name, specialty, license_number, bio, years_of_experience)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      data.user_id || null,
      data.name,
      data.specialty,
      data.license_number || null,
      data.bio || null,
      data.years_of_experience || null
    );

    return result.lastInsertRowid;
  },

  // Get all lawyers
  findAll: () => {
    const stmt = db.prepare(`
      SELECT * FROM lawyers
      ORDER BY name ASC
    `);

    return stmt.all();
  },

  // Find by ID
  findById: (id: number) => {
    const stmt = db.prepare('SELECT * FROM lawyers WHERE id = ?');
    return stmt.get(id);
  }
};

// Consult attachment operations
export const consultAttachmentDb = {
  // Get attachments for a consult
  findByConsultId: (consultId: number) => {
    const stmt = db.prepare(`
      SELECT * FROM consult_attachments
      WHERE consult_id = ?
      ORDER BY created_at ASC
    `);

    return stmt.all(consultId);
  },

  // Get single attachment by ID
  findById: (id: number) => {
    const stmt = db.prepare('SELECT * FROM consult_attachments WHERE id = ?');
    return stmt.get(id);
  },

  // Add attachment
  create: (data: {
    consult_id: number;
    file_name: string;
    file_path: string;
    file_type: string;
    file_size: number;
  }) => {
    const stmt = db.prepare(`
      INSERT INTO consult_attachments (
        consult_id, file_name, file_path, file_type, file_size
      ) VALUES (?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      data.consult_id,
      data.file_name,
      data.file_path,
      data.file_type,
      data.file_size
    );

    return result.lastInsertRowid;
  },

  // Delete attachment
  delete: (id: number) => {
    const stmt = db.prepare('DELETE FROM consult_attachments WHERE id = ?');
    return stmt.run(id);
  }
};

// Initialize database on import
initConsultDatabase();

export default db;