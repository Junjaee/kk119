import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data/kyokwon119.db');

export interface AdminRecord {
  id: number;
  user_id: number;
  association_id: number | null;
  permissions: any;
  created_at: string;
}

export interface AdminPermissions {
  can_approve_members: boolean;
  can_manage_boards: boolean;
  can_view_reports: boolean;
}

/**
 * Check if admin record exists for user
 */
export function getAdminRecord(userId: number): AdminRecord | null {
  const db = new Database(dbPath);
  try {
    const admin = db.prepare(`
      SELECT id, user_id, association_id, permissions, created_at
      FROM admins
      WHERE user_id = ?
    `).get(userId) as AdminRecord | undefined;

    return admin || null;
  } finally {
    db.close();
  }
}

/**
 * Create admin record for user
 */
export function createAdminRecord(
  userId: number,
  associationId: number | null = null,
  permissions: AdminPermissions = {
    can_approve_members: true,
    can_manage_boards: true,
    can_view_reports: true
  }
): AdminRecord {
  const db = new Database(dbPath);
  try {
    const result = db.prepare(`
      INSERT INTO admins (user_id, association_id, permissions, created_at)
      VALUES (?, ?, ?, datetime('now'))
    `).run(userId, associationId, JSON.stringify(permissions));

    // Return the created record
    return db.prepare(`
      SELECT id, user_id, association_id, permissions, created_at
      FROM admins
      WHERE id = ?
    `).get(result.lastInsertRowid) as AdminRecord;
  } finally {
    db.close();
  }
}

/**
 * Ensure admin record exists for user (create if missing)
 */
export function ensureAdminRecord(
  userId: number,
  associationId: number | null = null,
  permissions?: AdminPermissions
): AdminRecord {
  let admin = getAdminRecord(userId);

  if (!admin) {
    console.log(`🔧 [ADMIN-SYNC] Creating missing admin record for user ID: ${userId}`);
    admin = createAdminRecord(userId, associationId, permissions);
    console.log(`✅ [ADMIN-SYNC] Admin record created with ID: ${admin.id}`);
  } else {
    console.log(`✅ [ADMIN-SYNC] Admin record already exists for user ID: ${userId}`);
  }

  return admin;
}

/**
 * Get all admin users with their admin records
 */
export function getAllAdminUsers(): Array<{
  user_id: number;
  email: string;
  name: string;
  role: string;
  association_id: number | null;
  admin_record: AdminRecord | null;
}> {
  const db = new Database(dbPath);
  try {
    const users = db.prepare(`
      SELECT
        u.id as user_id,
        u.email,
        u.name,
        u.role,
        u.association_id,
        a.id as admin_id,
        a.permissions,
        a.created_at as admin_created_at
      FROM users u
      LEFT JOIN admins a ON u.id = a.user_id
      WHERE u.role IN ('admin', 'super_admin')
      ORDER BY u.id
    `).all();

    return users.map((row: any) => ({
      user_id: row.user_id,
      email: row.email,
      name: row.name,
      role: row.role,
      association_id: row.association_id,
      admin_record: row.admin_id ? {
        id: row.admin_id,
        user_id: row.user_id,
        association_id: row.association_id,
        permissions: JSON.parse(row.permissions || '{}'),
        created_at: row.admin_created_at
      } : null
    }));
  } finally {
    db.close();
  }
}

/**
 * Sync all admin users (create missing admin records)
 */
export function syncAllAdminUsers(): {
  total: number;
  synced: number;
  skipped: number;
  errors: Array<{ userId: number; email: string; error: string }>;
} {
  const adminUsers = getAllAdminUsers();
  const result = {
    total: adminUsers.length,
    synced: 0,
    skipped: 0,
    errors: [] as Array<{ userId: number; email: string; error: string }>
  };

  for (const user of adminUsers) {
    try {
      if (!user.admin_record) {
        ensureAdminRecord(user.user_id, user.association_id);
        result.synced++;
      } else {
        result.skipped++;
      }
    } catch (error) {
      result.errors.push({
        userId: user.user_id,
        email: user.email,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return result;
}