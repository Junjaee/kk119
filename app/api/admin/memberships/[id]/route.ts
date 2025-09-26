import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '../../../../../lib/auth/api-middleware';
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data/kyokwon119.db');

// PUT /api/admin/memberships/[id] - Approve or reject membership
async function updateMembership(request: NextRequest, authResult: any, { params }: { params: { id: string } }) {
  try {
    const membershipId = parseInt(params.id);
    if (isNaN(membershipId)) {
      return NextResponse.json(
        { error: 'Invalid membership ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { action, rejection_reason } = body; // action: 'approve' | 'reject'
    const adminId = authResult.user?.id;

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      );
    }

    if (action === 'reject' && !rejection_reason) {
      return NextResponse.json(
        { error: 'Rejection reason is required when rejecting membership' },
        { status: 400 }
      );
    }

    const db = new Database(dbPath);

    // Get the membership application with association info
    const membership = db.prepare(`
      SELECT
        am.id, am.user_id, am.association_id, am.status,
        u.name as user_name, u.email as user_email,
        a.name as association_name, a.code as association_code
      FROM association_members am
      JOIN users u ON am.user_id = u.id
      JOIN associations a ON am.association_id = a.id
      WHERE am.id = ?
    `).get(membershipId);

    if (!membership) {
      db.close();
      return NextResponse.json(
        { error: 'Membership application not found' },
        { status: 404 }
      );
    }

    const membershipData = membership as any;

    // Check if membership is in pending status
    if (membershipData.status !== 'pending') {
      db.close();
      return NextResponse.json(
        { error: `Membership is already ${membershipData.status}` },
        { status: 400 }
      );
    }

    // Check if admin has permission to approve/reject this membership
    // Admin must be assigned to the same association
    const adminAssociation = db.prepare(`
      SELECT ad.association_id
      FROM admins ad
      WHERE ad.user_id = ? AND ad.association_id = ?
    `).get(adminId, membershipData.association_id);

    if (!adminAssociation) {
      // Check if user is super admin
      const isSuperAdmin = authResult.user?.role === 'super_admin';
      if (!isSuperAdmin) {
        db.close();
        return NextResponse.json(
          { error: 'You do not have permission to manage memberships for this association' },
          { status: 403 }
        );
      }
    }

    // Begin transaction
    db.exec('BEGIN TRANSACTION');

    try {
      let updateQuery: string;
      let updateParams: any[];

      if (action === 'approve') {
        updateQuery = `
          UPDATE association_members
          SET status = 'approved',
              approved_by = ?,
              approved_at = datetime('now'),
              rejection_reason = NULL
          WHERE id = ?
        `;
        updateParams = [adminId, membershipId];

        // Update user's association_id if not already set
        const user = db.prepare('SELECT association_id FROM users WHERE id = ?').get(membershipData.user_id) as any;
        if (!user.association_id) {
          db.prepare('UPDATE users SET association_id = ? WHERE id = ?')
            .run(membershipData.association_id, membershipData.user_id);
        }
      } else {
        updateQuery = `
          UPDATE association_members
          SET status = 'rejected',
              approved_by = ?,
              approved_at = datetime('now'),
              rejection_reason = ?
          WHERE id = ?
        `;
        updateParams = [adminId, rejection_reason, membershipId];
      }

      db.prepare(updateQuery).run(...updateParams);

      db.exec('COMMIT');

      // Get updated membership
      const updatedMembership = db.prepare(`
        SELECT
          am.id, am.user_id, am.association_id, am.status,
          am.approved_by, am.approved_at, am.rejection_reason, am.created_at,
          u.name as user_name, u.email as user_email,
          a.name as association_name, a.code as association_code,
          admin.name as approved_by_name
        FROM association_members am
        JOIN users u ON am.user_id = u.id
        JOIN associations a ON am.association_id = a.id
        LEFT JOIN users admin ON am.approved_by = admin.id
        WHERE am.id = ?
      `).get(membershipId);

      db.close();

      return NextResponse.json({
        message: `Membership ${action}d successfully`,
        membership: updatedMembership
      });

    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Update membership error:', error);
    return NextResponse.json(
      { error: 'Failed to update membership' },
      { status: 500 }
    );
  }
}

export const PUT = withAdminAuth(updateMembership);