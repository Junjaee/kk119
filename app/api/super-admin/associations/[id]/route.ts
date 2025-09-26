import { NextRequest, NextResponse } from 'next/server';
import { withSuperAdminAuth } from '../../../../../lib/auth/api-middleware';
import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data/kyokwon119.db');

// GET /api/super-admin/associations/[id] - Get specific association with details
async function getAssociation(request: NextRequest, authResult: any, { params }: { params: { id: string } }) {
  try {
    const associationId = parseInt(params.id);
    if (isNaN(associationId)) {
      return NextResponse.json(
        { error: 'Invalid association ID' },
        { status: 400 }
      );
    }

    const db = new Database(dbPath);

    // Get association with member counts
    const association = db.prepare(`
      SELECT
        a.*,
        (SELECT COUNT(*) FROM users WHERE association_id = a.id AND role = 'admin') as admin_count,
        (SELECT COUNT(*) FROM users WHERE association_id = a.id AND role = 'lawyer') as lawyer_count,
        (SELECT COUNT(*) FROM users WHERE association_id = a.id AND role = 'teacher') as teacher_count,
        (SELECT COUNT(*) FROM association_members WHERE association_id = a.id AND status = 'pending') as pending_members,
        (SELECT COUNT(*) FROM association_members WHERE association_id = a.id AND status = 'approved') as approved_members,
        (SELECT COUNT(*) FROM association_members WHERE association_id = a.id AND status = 'rejected') as rejected_members
      FROM associations a
      WHERE a.id = ?
    `).get(associationId);

    if (!association) {
      db.close();
      return NextResponse.json(
        { error: 'Association not found' },
        { status: 404 }
      );
    }

    // Get members list
    const members = db.prepare(`
      SELECT
        u.id, u.name, u.email, u.role, u.created_at,
        am.status as membership_status, am.approved_at, am.created_at as applied_at
      FROM association_members am
      JOIN users u ON am.user_id = u.id
      WHERE am.association_id = ?
      ORDER BY am.created_at DESC
      LIMIT 50
    `).all(associationId);

    // Get admins
    const admins = db.prepare(`
      SELECT
        u.id, u.name, u.email, u.created_at,
        ad.permissions
      FROM users u
      JOIN admins ad ON u.id = ad.user_id
      WHERE ad.association_id = ?
      ORDER BY u.created_at DESC
    `).all(associationId);

    // Get lawyers in association
    const lawyers = db.prepare(`
      SELECT
        u.id, u.name, u.email, u.created_at,
        l.license_number, l.specialties, l.experience_years
      FROM users u
      JOIN lawyers l ON u.id = l.user_id
      WHERE u.association_id = ?
      ORDER BY u.created_at DESC
    `).all(associationId);

    // Get board permissions
    const boardPermissions = db.prepare(`
      SELECT
        bc.id, bc.name, bc.description, bc.is_association_restricted,
        abp.is_accessible
      FROM board_categories bc
      LEFT JOIN association_board_permissions abp ON bc.id = abp.board_category_id AND abp.association_id = ?
      ORDER BY bc.name
    `).all(associationId);

    db.close();

    return NextResponse.json({
      association,
      members,
      admins,
      lawyers,
      board_permissions: boardPermissions
    });
  } catch (error) {
    console.error('Get association error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch association' },
      { status: 500 }
    );
  }
}

// PUT /api/super-admin/associations/[id] - Update association
async function updateAssociation(request: NextRequest, authResult: any, { params }: { params: { id: string } }) {
  try {
    const associationId = parseInt(params.id);
    if (isNaN(associationId)) {
      return NextResponse.json(
        { error: 'Invalid association ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, code, description, address, phone, email, website, established_date, status } = body;

    const db = new Database(dbPath);

    // Check if association exists
    const existingAssociation = db.prepare('SELECT * FROM associations WHERE id = ?').get(associationId);
    if (!existingAssociation) {
      db.close();
      return NextResponse.json(
        { error: 'Association not found' },
        { status: 404 }
      );
    }

    // Begin transaction
    db.exec('BEGIN TRANSACTION');

    try {
      let updateFields: string[] = [];
      let updateValues: any[] = [];

      // Build dynamic update query
      if (name !== undefined) {
        updateFields.push('name = ?');
        updateValues.push(name);
      }

      if (code !== undefined) {
        // Check code uniqueness
        const codeCheck = db.prepare('SELECT id FROM associations WHERE code = ? AND id != ?').get(code, associationId);
        if (codeCheck) {
          throw new Error('Association code already exists');
        }
        updateFields.push('code = ?');
        updateValues.push(code);
      }

      if (description !== undefined) {
        updateFields.push('description = ?');
        updateValues.push(description);
      }

      if (address !== undefined) {
        updateFields.push('address = ?');
        updateValues.push(address);
      }

      if (phone !== undefined) {
        updateFields.push('phone = ?');
        updateValues.push(phone);
      }

      if (email !== undefined) {
        updateFields.push('email = ?');
        updateValues.push(email);
      }

      if (website !== undefined) {
        updateFields.push('website = ?');
        updateValues.push(website);
      }

      if (established_date !== undefined) {
        updateFields.push('established_date = ?');
        updateValues.push(established_date);
      }

      if (status !== undefined && (status === 'active' || status === 'inactive')) {
        updateFields.push('status = ?');
        updateValues.push(status);
      }

      if (updateFields.length > 0) {
        updateFields.push('updated_at = datetime(\'now\')');
        updateValues.push(associationId);

        const updateQuery = `UPDATE associations SET ${updateFields.join(', ')} WHERE id = ?`;
        db.prepare(updateQuery).run(...updateValues);
      }

      db.exec('COMMIT');

      // Get updated association
      const updatedAssociation = db.prepare('SELECT * FROM associations WHERE id = ?').get(associationId);
      db.close();

      return NextResponse.json({
        message: 'Association updated successfully',
        association: updatedAssociation
      });

    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Update association error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update association' },
      { status: 500 }
    );
  }
}

// DELETE /api/super-admin/associations/[id] - Delete association
async function deleteAssociation(request: NextRequest, authResult: any, { params }: { params: { id: string } }) {
  try {
    const associationId = parseInt(params.id);
    if (isNaN(associationId)) {
      return NextResponse.json(
        { error: 'Invalid association ID' },
        { status: 400 }
      );
    }

    const db = new Database(dbPath);

    // Check if association exists
    const association = db.prepare('SELECT id, name FROM associations WHERE id = ?').get(associationId);
    if (!association) {
      db.close();
      return NextResponse.json(
        { error: 'Association not found' },
        { status: 404 }
      );
    }

    // Check if association has users
    const userCount = db.prepare('SELECT COUNT(*) as count FROM users WHERE association_id = ?').get(associationId) as { count: number };
    if (userCount.count > 0) {
      db.close();
      return NextResponse.json(
        { error: 'Cannot delete association with existing users' },
        { status: 400 }
      );
    }

    // Begin transaction
    db.exec('BEGIN TRANSACTION');

    try {
      // Delete related records
      db.prepare('DELETE FROM association_board_permissions WHERE association_id = ?').run(associationId);
      db.prepare('DELETE FROM association_members WHERE association_id = ?').run(associationId);
      db.prepare('DELETE FROM admins WHERE association_id = ?').run(associationId);
      db.prepare('DELETE FROM associations WHERE id = ?').run(associationId);

      db.exec('COMMIT');
      db.close();

      return NextResponse.json({
        message: 'Association deleted successfully'
      });

    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Delete association error:', error);
    return NextResponse.json(
      { error: 'Failed to delete association' },
      { status: 500 }
    );
  }
}

export const GET = withSuperAdminAuth(getAssociation);
export const PUT = withSuperAdminAuth(updateAssociation);
export const DELETE = withSuperAdminAuth(deleteAssociation);