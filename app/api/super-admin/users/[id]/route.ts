import { NextRequest, NextResponse } from 'next/server';
import { withSuperAdminAuth } from '../../../../../lib/auth/api-middleware';
import { UserRole, isValidUserRole } from '../../../../../lib/types';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data/kyokwon119.db');

// GET /api/super-admin/users/[id] - Get specific user
async function getUser(request: NextRequest, authResult: any, { params }: { params: { id: string } }) {
  try {
    const userId = parseInt(params.id);
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    const db = new Database(dbPath);

    const user = db.prepare(`
      SELECT
        u.id, u.email, u.name, u.nickname, u.role, u.association_id,
        u.school, u.position, u.phone, u.school_verified, u.isVerified,
        u.created_at, u.updated_at, u.last_login,
        a.name as association_name, a.code as association_code,
        ad.permissions as admin_permissions,
        l.license_number, l.specialties, l.experience_years
      FROM users u
      LEFT JOIN associations a ON u.association_id = a.id
      LEFT JOIN admins ad ON u.id = ad.user_id
      LEFT JOIN lawyers l ON u.id = l.user_id
      WHERE u.id = ?
    `).get(userId);

    db.close();

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

// PUT /api/super-admin/users/[id] - Update user
async function updateUser(request: NextRequest, authResult: any, { params }: { params: { id: string } }) {
  try {
    const userId = parseInt(params.id);
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { email, name, role, association_id, school, position, phone, password, isVerified } = body;

    const db = new Database(dbPath);

    // Check if user exists
    const existingUser = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!existingUser) {
      db.close();
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Prevent super admin from changing their own role
    if (userId === authResult.user?.id && role && role !== 'super_admin') {
      db.close();
      return NextResponse.json(
        { error: 'Cannot change your own role' },
        { status: 400 }
      );
    }

    // Begin transaction
    db.exec('BEGIN TRANSACTION');

    try {
      let updateFields: string[] = [];
      let updateValues: any[] = [];

      // Build dynamic update query
      if (email !== undefined) {
        // Check email uniqueness
        const emailCheck = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email, userId);
        if (emailCheck) {
          throw new Error('Email already exists');
        }
        updateFields.push('email = ?');
        updateValues.push(email);
      }

      if (name !== undefined) {
        updateFields.push('name = ?');
        updateValues.push(name);
      }

      if (role !== undefined && isValidUserRole(role)) {
        const oldRole = (existingUser as any).role;
        updateFields.push('role = ?');
        updateValues.push(role);

        // Handle role changes
        if (oldRole !== role) {
          // Remove old role-specific records
          if (oldRole === 'admin') {
            db.prepare('DELETE FROM admins WHERE user_id = ?').run(userId);
          }
          if (oldRole === 'lawyer') {
            db.prepare('DELETE FROM lawyers WHERE user_id = ?').run(userId);
          }

          // Add new role-specific records
          if (role === 'admin' && association_id) {
            const insertAdmin = db.prepare(`
              INSERT INTO admins (user_id, association_id, permissions)
              VALUES (?, ?, ?)
            `);
            insertAdmin.run(userId, association_id, JSON.stringify({
              can_approve_members: true,
              can_manage_boards: true,
              can_view_reports: true
            }));
          }

          if (role === 'lawyer') {
            const insertLawyer = db.prepare(`
              INSERT OR IGNORE INTO lawyers (user_id, specialties, experience_years)
              VALUES (?, ?, ?)
            `);
            insertLawyer.run(
              userId,
              JSON.stringify(['교육법', '민사법']),
              0
            );
          }
        }
      }

      if (association_id !== undefined) {
        if (association_id && association_id !== null) {
          const association = db.prepare('SELECT id FROM associations WHERE id = ?').get(association_id);
          if (!association) {
            throw new Error('Invalid association ID');
          }
        }
        updateFields.push('association_id = ?');
        updateValues.push(association_id);
      }

      if (school !== undefined) {
        updateFields.push('school = ?');
        updateValues.push(school);
      }

      if (position !== undefined) {
        updateFields.push('position = ?');
        updateValues.push(position);
      }

      if (phone !== undefined) {
        updateFields.push('phone = ?');
        updateValues.push(phone);
      }

      if (isVerified !== undefined) {
        updateFields.push('isVerified = ?');
        updateValues.push(isVerified ? 1 : 0);
      }

      // Update password if provided
      if (password) {
        const hashedPassword = await bcrypt.hash(password, 12);
        updateFields.push('password = ?');
        updateValues.push(hashedPassword);
      }

      if (updateFields.length > 0) {
        updateFields.push('updated_at = datetime(\'now\')');
        updateValues.push(userId);

        const updateQuery = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;
        db.prepare(updateQuery).run(...updateValues);
      }

      // Update admin permissions if provided and user is admin
      if (body.admin_permissions && (role === 'admin' || (existingUser as any).role === 'admin')) {
        const updateAdmin = db.prepare('UPDATE admins SET permissions = ? WHERE user_id = ?');
        updateAdmin.run(JSON.stringify(body.admin_permissions), userId);
      }

      // Update lawyer info if provided and user is lawyer
      if ((body.license_number || body.specialties || body.experience_years !== undefined) &&
          (role === 'lawyer' || (existingUser as any).role === 'lawyer')) {
        let lawyerUpdates: string[] = [];
        let lawyerValues: any[] = [];

        if (body.license_number) {
          lawyerUpdates.push('license_number = ?');
          lawyerValues.push(body.license_number);
        }
        if (body.specialties) {
          lawyerUpdates.push('specialties = ?');
          lawyerValues.push(JSON.stringify(body.specialties));
        }
        if (body.experience_years !== undefined) {
          lawyerUpdates.push('experience_years = ?');
          lawyerValues.push(body.experience_years);
        }

        if (lawyerUpdates.length > 0) {
          lawyerValues.push(userId);
          const updateLawyer = db.prepare(`UPDATE lawyers SET ${lawyerUpdates.join(', ')} WHERE user_id = ?`);
          updateLawyer.run(...lawyerValues);
        }
      }

      db.exec('COMMIT');

      // Get updated user
      const updatedUser = db.prepare(`
        SELECT
          u.id, u.email, u.name, u.role, u.association_id,
          u.school, u.position, u.phone, u.isVerified, u.updated_at,
          a.name as association_name, a.code as association_code
        FROM users u
        LEFT JOIN associations a ON u.association_id = a.id
        WHERE u.id = ?
      `).get(userId);

      db.close();

      return NextResponse.json({
        message: 'User updated successfully',
        user: updatedUser
      });

    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update user' },
      { status: 500 }
    );
  }
}

// DELETE /api/super-admin/users/[id] - Delete user
async function deleteUser(request: NextRequest, authResult: any, { params }: { params: { id: string } }) {
  try {
    const userId = parseInt(params.id);
    if (isNaN(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 400 }
      );
    }

    // Prevent super admin from deleting themselves
    if (userId === authResult.user?.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    const db = new Database(dbPath);

    // Check if user exists
    const user = db.prepare('SELECT id, role FROM users WHERE id = ?').get(userId);
    if (!user) {
      db.close();
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Begin transaction
    db.exec('BEGIN TRANSACTION');

    try {
      // Delete related records (foreign key constraints should handle this, but let's be explicit)
      db.prepare('DELETE FROM admins WHERE user_id = ?').run(userId);
      db.prepare('DELETE FROM lawyers WHERE user_id = ?').run(userId);
      db.prepare('DELETE FROM association_members WHERE user_id = ?').run(userId);
      db.prepare('DELETE FROM users WHERE id = ?').run(userId);

      db.exec('COMMIT');
      db.close();

      return NextResponse.json({
        message: 'User deleted successfully'
      });

    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}

export const GET = withSuperAdminAuth(getUser);
export const PUT = withSuperAdminAuth(updateUser);
export const DELETE = withSuperAdminAuth(deleteUser);