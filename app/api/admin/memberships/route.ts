import { NextRequest, NextResponse } from 'next/server';
import { withAdminAuth } from '../../../../lib/auth/api-middleware';
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data/kyokwon119.db');

// GET /api/admin/memberships - Get membership applications for admin's association
async function getMemberships(request: NextRequest, authResult: any) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending'; // pending, approved, rejected, all
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const adminId = authResult.user?.id;
    const isSuperAdmin = authResult.user?.role === 'super_admin';

    const db = new Database(dbPath);

    let baseQuery = `
      SELECT
        am.id, am.user_id, am.association_id, am.status,
        am.approved_by, am.approved_at, am.rejection_reason, am.created_at,
        u.name as user_name, u.email as user_email, u.phone as user_phone,
        u.school as user_school, u.position as user_position,
        a.name as association_name, a.code as association_code,
        admin.name as approved_by_name
      FROM association_members am
      JOIN users u ON am.user_id = u.id
      JOIN associations a ON am.association_id = a.id
      LEFT JOIN users admin ON am.approved_by = admin.id
    `;

    let whereConditions = [];
    let queryParams = [];

    // Filter by association if not super admin
    if (!isSuperAdmin) {
      // Get admin's associations
      const adminAssociations = db.prepare(`
        SELECT DISTINCT association_id
        FROM admins
        WHERE user_id = ?
      `).all(adminId);

      if (adminAssociations.length === 0) {
        db.close();
        return NextResponse.json(
          { error: 'No associations found for this admin' },
          { status: 403 }
        );
      }

      const associationIds = adminAssociations.map((a: any) => a.association_id);
      whereConditions.push(`am.association_id IN (${associationIds.map(() => '?').join(',')})`);
      queryParams.push(...associationIds);
    }

    // Filter by status
    if (status !== 'all') {
      whereConditions.push('am.status = ?');
      queryParams.push(status);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM association_members am
      JOIN users u ON am.user_id = u.id
      JOIN associations a ON am.association_id = a.id
      ${whereClause}
    `;
    const totalResult = db.prepare(countQuery).get(...queryParams) as { total: number };
    const total = totalResult.total;

    // Get memberships with pagination
    const query = `
      ${baseQuery}
      ${whereClause}
      ORDER BY am.created_at DESC
      LIMIT ? OFFSET ?
    `;
    queryParams.push(limit, offset);

    const memberships = db.prepare(query).all(...queryParams);

    // Get summary stats
    const summaryQuery = `
      SELECT
        am.status,
        COUNT(*) as count
      FROM association_members am
      ${!isSuperAdmin ? `
        JOIN admins ad ON am.association_id = ad.association_id AND ad.user_id = ${adminId}
      ` : ''}
      GROUP BY am.status
    `;

    const summaryStats = db.prepare(summaryQuery).all();
    const summary = summaryStats.reduce((acc: any, stat: any) => {
      acc[stat.status] = stat.count;
      return acc;
    }, { pending: 0, approved: 0, rejected: 0 });

    db.close();

    return NextResponse.json({
      memberships,
      summary,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get memberships error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch memberships' },
      { status: 500 }
    );
  }
}

export const GET = withAdminAuth(getMemberships);