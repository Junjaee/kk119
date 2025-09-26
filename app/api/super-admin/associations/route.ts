import { NextRequest, NextResponse } from 'next/server';
import { withSuperAdminAuth } from '../../../../lib/auth/api-middleware';
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data/kyokwon119.db');

// GET /api/super-admin/associations - Get all associations with stats
async function getAssociations(request: NextRequest) {
  try {
    const db = new Database(dbPath);

    const associations = db.prepare(`
      SELECT
        a.id,
        a.name,
        a.code,
        a.description,
        a.address,
        a.phone,
        a.email,
        a.website,
        a.established_date,
        a.status,
        a.created_at,
        (SELECT COUNT(*) FROM users WHERE association_id = a.id AND role = 'admin') as admin_count,
        (SELECT COUNT(*) FROM users WHERE association_id = a.id AND role = 'lawyer') as lawyer_count,
        (SELECT COUNT(*) FROM users WHERE association_id = a.id AND role = 'teacher') as teacher_count,
        (SELECT COUNT(*) FROM association_members WHERE association_id = a.id AND status = 'pending') as pending_members,
        (SELECT COUNT(*) FROM association_members WHERE association_id = a.id AND status = 'approved') as approved_members
      FROM associations a
      ORDER BY a.created_at DESC
    `).all();

    db.close();

    return NextResponse.json({ associations });
  } catch (error) {
    console.error('Get associations error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch associations' },
      { status: 500 }
    );
  }
}

// POST /api/super-admin/associations - Create new association
async function createAssociation(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, code, description, address, phone, email, website, established_date } = body;

    // Validate required fields
    if (!name || !code) {
      return NextResponse.json(
        { error: 'Missing required fields: name, code' },
        { status: 400 }
      );
    }

    const db = new Database(dbPath);

    // Check if association with code already exists
    const existingAssociation = db.prepare('SELECT id FROM associations WHERE code = ?').get(code);
    if (existingAssociation) {
      db.close();
      return NextResponse.json(
        { error: 'Association with this code already exists' },
        { status: 409 }
      );
    }

    // Insert association
    const insertAssociation = db.prepare(`
      INSERT INTO associations (name, code, description, address, phone, email, website, established_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insertAssociation.run(
      name,
      code,
      description || null,
      address || null,
      phone || null,
      email || null,
      website || null,
      established_date || null
    );

    const associationId = result.lastInsertRowid;

    // Create default board permissions for the new association
    const restrictedBoards = db.prepare('SELECT id FROM board_categories WHERE is_association_restricted = 1').all();

    if (restrictedBoards.length > 0) {
      const insertPermission = db.prepare(`
        INSERT INTO association_board_permissions (association_id, board_category_id, is_accessible)
        VALUES (?, ?, 1)
      `);

      for (const board of restrictedBoards) {
        insertPermission.run(associationId, (board as any).id);
      }
    }

    // Get created association
    const createdAssociation = db.prepare(`
      SELECT * FROM associations WHERE id = ?
    `).get(associationId);

    db.close();

    return NextResponse.json({
      message: 'Association created successfully',
      association: createdAssociation
    }, { status: 201 });

  } catch (error) {
    console.error('Create association error:', error);
    return NextResponse.json(
      { error: 'Failed to create association' },
      { status: 500 }
    );
  }
}

export const GET = withSuperAdminAuth(getAssociations);
export const POST = withSuperAdminAuth(createAssociation);