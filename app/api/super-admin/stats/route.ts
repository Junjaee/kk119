import { NextRequest, NextResponse } from 'next/server';
import { withSuperAdminAuth } from '../../../../lib/auth/api-middleware';
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data/kyokwon119.db');

// GET /api/super-admin/stats - Get system statistics
async function getStats(request: NextRequest) {
  try {
    const db = new Database(dbPath);

    // Get basic counts
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
    const totalAssociations = db.prepare('SELECT COUNT(*) as count FROM associations WHERE status = "active"').get() as { count: number };

    // Get user counts by role
    const usersByRole = db.prepare(`
      SELECT role, COUNT(*) as count
      FROM users
      GROUP BY role
      ORDER BY count DESC
    `).all();

    // Get recent user registrations (last 7 days)
    const recentUsers = db.prepare(`
      SELECT COUNT(*) as count
      FROM users
      WHERE created_at >= datetime('now', '-7 days')
    `).get() as { count: number };

    // Get pending memberships
    const pendingMemberships = db.prepare(`
      SELECT COUNT(*) as count
      FROM association_members
      WHERE status = 'pending'
    `).get() as { count: number };

    // Get association membership stats
    const associationStats = db.prepare(`
      SELECT
        a.name as association_name,
        a.code as association_code,
        COUNT(CASE WHEN am.status = 'approved' THEN 1 END) as approved_members,
        COUNT(CASE WHEN am.status = 'pending' THEN 1 END) as pending_members,
        COUNT(CASE WHEN u.role = 'admin' THEN 1 END) as admin_count,
        COUNT(CASE WHEN u.role = 'lawyer' THEN 1 END) as lawyer_count
      FROM associations a
      LEFT JOIN association_members am ON a.id = am.association_id
      LEFT JOIN users u ON a.id = u.association_id
      WHERE a.status = 'active'
      GROUP BY a.id, a.name, a.code
      ORDER BY approved_members DESC
      LIMIT 10
    `).all();

    // Get user activity over time (last 30 days)
    const userGrowth = db.prepare(`
      SELECT
        DATE(created_at) as date,
        COUNT(*) as new_users
      FROM users
      WHERE created_at >= datetime('now', '-30 days')
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 30
    `).all();

    // Get most recent users
    const latestUsers = db.prepare(`
      SELECT
        u.id, u.name, u.email, u.role, u.created_at,
        a.name as association_name
      FROM users u
      LEFT JOIN associations a ON u.association_id = a.id
      ORDER BY u.created_at DESC
      LIMIT 10
    `).all();

    db.close();

    return NextResponse.json({
      overview: {
        total_users: totalUsers.count,
        total_associations: totalAssociations.count,
        recent_users: recentUsers.count,
        pending_memberships: pendingMemberships.count
      },
      users_by_role: usersByRole,
      association_stats: associationStats,
      user_growth: userGrowth,
      latest_users: latestUsers
    });
  } catch (error) {
    console.error('Get stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}

export const GET = withSuperAdminAuth(getStats);