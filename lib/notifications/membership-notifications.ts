import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data/kyokwon119.db');

/**
 * Send notification when membership is approved
 */
export function notifyMembershipApproved(membershipId: number) {
  const db = new Database(dbPath);

  try {
    // Get membership details
    const membership = db.prepare(`
      SELECT
        am.user_id, am.association_id,
        u.name as user_name, u.email as user_email,
        a.name as association_name,
        admin.name as approved_by_name
      FROM association_members am
      JOIN users u ON am.user_id = u.id
      JOIN associations a ON am.association_id = a.id
      LEFT JOIN users admin ON am.approved_by = admin.id
      WHERE am.id = ?
    `).get(membershipId);

    if (!membership) {
      console.warn('Membership not found for notification:', membershipId);
      return;
    }

    console.log(`📧 [NOTIFICATION] Membership approved: ${membership.user_name} -> ${membership.association_name}`);

    // Create notification record
    // Note: This would integrate with your notification system
    // For now, just log the notification

    return {
      type: 'membership_approved',
      recipientUserId: membership.user_id,
      title: '협회 가입 승인',
      message: `${membership.association_name} 협회 가입이 승인되었습니다.`,
      data: {
        membershipId,
        associationId: membership.association_id,
        associationName: membership.association_name,
        approvedBy: membership.approved_by_name
      }
    };

  } finally {
    db.close();
  }
}

/**
 * Send notification when membership is rejected
 */
export function notifyMembershipRejected(membershipId: number, reason: string) {
  const db = new Database(dbPath);

  try {
    // Get membership details
    const membership = db.prepare(`
      SELECT
        am.user_id, am.association_id,
        u.name as user_name, u.email as user_email,
        a.name as association_name,
        admin.name as rejected_by_name
      FROM association_members am
      JOIN users u ON am.user_id = u.id
      JOIN associations a ON am.association_id = a.id
      LEFT JOIN users admin ON am.approved_by = admin.id
      WHERE am.id = ?
    `).get(membershipId);

    if (!membership) {
      console.warn('Membership not found for notification:', membershipId);
      return;
    }

    console.log(`📧 [NOTIFICATION] Membership rejected: ${membership.user_name} -> ${membership.association_name}`);

    // Create notification record
    return {
      type: 'membership_rejected',
      recipientUserId: membership.user_id,
      title: '협회 가입 거부',
      message: `${membership.association_name} 협회 가입이 거부되었습니다. 사유: ${reason}`,
      data: {
        membershipId,
        associationId: membership.association_id,
        associationName: membership.association_name,
        rejectedBy: membership.rejected_by_name,
        reason
      }
    };

  } finally {
    db.close();
  }
}

/**
 * Notify association admins of new membership application
 */
export function notifyNewMembershipApplication(membershipId: number) {
  const db = new Database(dbPath);

  try {
    // Get membership and association admin details
    const membershipData = db.prepare(`
      SELECT
        am.user_id, am.association_id,
        u.name as user_name, u.email as user_email,
        u.school as user_school, u.position as user_position,
        a.name as association_name
      FROM association_members am
      JOIN users u ON am.user_id = u.id
      JOIN associations a ON am.association_id = a.id
      WHERE am.id = ?
    `).get(membershipId);

    if (!membershipData) {
      console.warn('Membership not found for notification:', membershipId);
      return;
    }

    // Get association admins
    const admins = db.prepare(`
      SELECT
        u.id as admin_id, u.email as admin_email, u.name as admin_name
      FROM admins ad
      JOIN users u ON ad.user_id = u.id
      WHERE ad.association_id = ?
    `).all(membershipData.association_id);

    console.log(`📧 [NOTIFICATION] New membership application: ${membershipData.user_name} -> ${membershipData.association_name}`);
    console.log(`📧 [NOTIFICATION] Notifying ${admins.length} association admins`);

    // Create notifications for all association admins
    const notifications = admins.map((admin: any) => ({
      type: 'new_membership_application',
      recipientUserId: admin.admin_id,
      title: '새로운 협회 가입 신청',
      message: `${membershipData.user_name}님이 ${membershipData.association_name} 협회 가입을 신청했습니다.`,
      data: {
        membershipId,
        applicantId: membershipData.user_id,
        applicantName: membershipData.user_name,
        applicantEmail: membershipData.user_email,
        applicantSchool: membershipData.user_school,
        applicantPosition: membershipData.user_position,
        associationId: membershipData.association_id,
        associationName: membershipData.association_name
      }
    }));

    return notifications;

  } finally {
    db.close();
  }
}