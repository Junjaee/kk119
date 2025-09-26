import { NextRequest, NextResponse } from 'next/server';
import { withUserAuth } from '../../../../lib/auth/api-middleware';
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data/kyokwon119.db');

// POST /api/memberships/apply - Apply for association membership
async function applyMembership(request: NextRequest, authResult: any) {
  try {
    const body = await request.json();
    const { association_id } = body;
    const userId = authResult.user?.id;

    if (!association_id || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: association_id' },
        { status: 400 }
      );
    }

    const db = new Database(dbPath);

    // Check if association exists and is active
    const association = db.prepare('SELECT id, name, status FROM associations WHERE id = ? AND status = "active"').get(association_id);
    if (!association) {
      db.close();
      return NextResponse.json(
        { error: 'Association not found or inactive' },
        { status: 404 }
      );
    }

    // Check if user already has a membership application for this association
    const existingApplication = db.prepare(
      'SELECT id, status FROM association_members WHERE user_id = ? AND association_id = ?'
    ).get(userId, association_id);

    if (existingApplication) {
      db.close();
      const status = (existingApplication as any).status;
      const statusMessage = {
        'pending': '이미 가입 신청이 진행 중입니다',
        'approved': '이미 이 협회의 회원입니다',
        'rejected': '이전 가입 신청이 거절되었습니다. 관리자에게 문의하세요'
      }[status] || '이미 가입 신청 기록이 있습니다';

      return NextResponse.json(
        { error: statusMessage },
        { status: 409 }
      );
    }

    // Create membership application
    const insertMembership = db.prepare(`
      INSERT INTO association_members (user_id, association_id, status, created_at)
      VALUES (?, ?, 'pending', datetime('now'))
    `);

    const result = insertMembership.run(userId, association_id);

    // Get the created application with user and association details
    const membershipApplication = db.prepare(`
      SELECT
        am.id, am.user_id, am.association_id, am.status, am.created_at,
        u.name as user_name, u.email as user_email,
        a.name as association_name, a.code as association_code
      FROM association_members am
      JOIN users u ON am.user_id = u.id
      JOIN associations a ON am.association_id = a.id
      WHERE am.id = ?
    `).get(result.lastInsertRowid);

    db.close();

    return NextResponse.json({
      message: 'Membership application submitted successfully',
      application: membershipApplication
    }, { status: 201 });

  } catch (error) {
    console.error('Apply membership error:', error);
    return NextResponse.json(
      { error: 'Failed to submit membership application' },
      { status: 500 }
    );
  }
}

export const POST = withUserAuth(applyMembership);