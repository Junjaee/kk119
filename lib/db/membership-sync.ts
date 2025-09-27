import Database from 'better-sqlite3';
import path from 'path';
import {
  notifyMembershipApproved,
  notifyMembershipRejected,
  notifyNewMembershipApplication
} from '@/lib/notifications/membership-notifications';

const dbPath = path.join(process.cwd(), 'data/kyokwon119.db');

/**
 * Create membership applications for users who have associations but no membership records
 */
export function createMembershipApplications() {
  const db = new Database(dbPath);

  try {
    console.log('🔄 [MEMBERSHIP-SYNC] Creating missing membership applications...');

    // Find users with associations but no membership records
    const usersWithAssociations = db.prepare(`
      SELECT u.id, u.email, u.name, u.association, u.association_id
      FROM users u
      LEFT JOIN association_members am ON u.id = am.user_id
      WHERE (u.association IS NOT NULL AND u.association != '[]' AND u.association != 'null')
         OR u.association_id IS NOT NULL
      AND am.id IS NULL
    `).all();

    console.log(`Found ${usersWithAssociations.length} users needing membership applications`);

    let created = 0;
    const insertStmt = db.prepare(`
      INSERT INTO association_members (user_id, association_id, status, created_at)
      VALUES (?, ?, 'pending', datetime('now'))
    `);

    usersWithAssociations.forEach((user: any) => {
      try {
        let associationIds: number[] = [];

        // Get association IDs from either association_id or association JSON
        if (user.association_id) {
          associationIds.push(user.association_id);
        } else if (user.association) {
          try {
            const associations = JSON.parse(user.association);
            if (Array.isArray(associations)) {
              associationIds = associations.filter(id => typeof id === 'number' && id > 0);
            }
          } catch (error) {
            console.warn(`Failed to parse associations for user ${user.id}:`, error);
          }
        }

        // Create membership applications
        associationIds.forEach(associationId => {
          try {
            insertStmt.run(user.id, associationId);
            console.log(`✅ Created membership application for user ${user.email} -> association ${associationId}`);
            created++;
          } catch (error: any) {
            if (error.code !== 'SQLITE_CONSTRAINT_UNIQUE') {
              console.error(`Failed to create membership for user ${user.id}, association ${associationId}:`, error);
            }
          }
        });

      } catch (error) {
        console.error(`Error processing user ${user.id}:`, error);
      }
    });

    console.log(`🎉 [MEMBERSHIP-SYNC] Created ${created} membership applications`);
    return { created, total: usersWithAssociations.length };

  } finally {
    db.close();
  }
}

/**
 * Create membership application for a specific user and association
 */
export function createMembershipApplication(userId: number, associationId: number): number {
  const db = new Database(dbPath);

  try {
    console.log(`🔄 [MEMBERSHIP-SYNC] Creating membership application for user ${userId} -> association ${associationId}`);

    // Check if membership application already exists
    const existing = db.prepare(`
      SELECT id FROM association_members
      WHERE user_id = ? AND association_id = ?
    `).get(userId, associationId);

    if (existing) {
      console.log(`⚠️ [MEMBERSHIP-SYNC] Membership application already exists: ${existing.id}`);
      return existing.id;
    }

    // Create the membership application
    const result = db.prepare(`
      INSERT INTO association_members (user_id, association_id, status, created_at)
      VALUES (?, ?, 'pending', datetime('now'))
    `).run(userId, associationId);

    console.log(`✅ [MEMBERSHIP-SYNC] Created membership application: ${result.lastInsertRowid}`);

    // Send notification to association admins
    try {
      notifyNewMembershipApplication(result.lastInsertRowid);
    } catch (notificationError) {
      console.error('Failed to send membership application notification:', notificationError);
      // Don't fail the membership creation if notification fails
    }

    return result.lastInsertRowid;

  } finally {
    db.close();
  }
}

/**
 * Get all pending membership applications for an association
 */
export function getPendingMemberships(associationId: number) {
  const db = new Database(dbPath);

  try {
    const memberships = db.prepare(`
      SELECT
        am.id, am.user_id, am.association_id, am.status, am.created_at,
        u.name as user_name, u.email as user_email, u.phone as user_phone,
        u.school as user_school, u.position as user_position,
        a.name as association_name, a.code as association_code
      FROM association_members am
      JOIN users u ON am.user_id = u.id
      JOIN associations a ON am.association_id = a.id
      WHERE am.association_id = ? AND am.status = 'pending'
      ORDER BY am.created_at DESC
    `).all(associationId);

    return memberships;

  } finally {
    db.close();
  }
}

/**
 * Approve membership application and update user's association
 */
export function approveMembership(membershipId: number, approvedBy: number) {
  const db = new Database(dbPath);

  try {
    db.exec('BEGIN TRANSACTION');

    // Get membership details
    const membership = db.prepare(`
      SELECT am.user_id, am.association_id
      FROM association_members am
      WHERE am.id = ? AND am.status = 'pending'
    `).get(membershipId);

    if (!membership) {
      throw new Error('Membership application not found or already processed');
    }

    // Update membership status
    db.prepare(`
      UPDATE association_members
      SET status = 'approved',
          approved_by = ?,
          approved_at = datetime('now')
      WHERE id = ?
    `).run(approvedBy, membershipId);

    // Update user's association_id if not already set
    const user = db.prepare('SELECT association_id FROM users WHERE id = ?').get(membership.user_id) as any;
    if (!user.association_id) {
      db.prepare('UPDATE users SET association_id = ? WHERE id = ?')
        .run(membership.association_id, membership.user_id);
    }

    db.exec('COMMIT');
    console.log(`✅ [MEMBERSHIP-SYNC] Approved membership ${membershipId}`);

    // Send approval notification
    try {
      notifyMembershipApproved(membershipId);
    } catch (notificationError) {
      console.error('Failed to send membership approval notification:', notificationError);
    }

    return { membershipId, userId: membership.user_id, associationId: membership.association_id };

  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  } finally {
    db.close();
  }
}

/**
 * Reject membership application
 */
export function rejectMembership(membershipId: number, rejectedBy: number, reason: string) {
  const db = new Database(dbPath);

  try {
    const result = db.prepare(`
      UPDATE association_members
      SET status = 'rejected',
          approved_by = ?,
          approved_at = datetime('now'),
          rejection_reason = ?
      WHERE id = ? AND status = 'pending'
    `).run(rejectedBy, reason, membershipId);

    if (result.changes === 0) {
      throw new Error('Membership application not found or already processed');
    }

    console.log(`✅ [MEMBERSHIP-SYNC] Rejected membership ${membershipId}`);

    // Send rejection notification
    try {
      notifyMembershipRejected(membershipId, reason);
    } catch (notificationError) {
      console.error('Failed to send membership rejection notification:', notificationError);
    }

    return { membershipId, reason };

  } finally {
    db.close();
  }
}