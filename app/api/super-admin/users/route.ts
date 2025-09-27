import { NextRequest, NextResponse } from 'next/server';
import { withSuperAdminAuth } from '../../../../lib/auth/api-middleware';
import { UserRole, isValidUserRole } from '../../../../lib/types/index';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data/kyokwon119.db');

// GET /api/super-admin/users - Get all users with filtering
async function getUsers(request: NextRequest) {
  try {
    const db = new Database(dbPath);
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const association_id = searchParams.get('association_id');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let query = `
      SELECT
        u.id, u.email, u.name, u.nickname, u.role, u.association_id,
        u.school, u.position, u.phone, u.school_verified, u.isVerified,
        u.created_at, u.updated_at, u.last_login,
        a.name as association_name, a.code as association_code
      FROM users u
      LEFT JOIN associations a ON u.association_id = a.id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (role && isValidUserRole(role)) {
      query += ' AND u.role = ?';
      params.push(role);
    }

    if (association_id) {
      query += ' AND u.association_id = ?';
      params.push(parseInt(association_id));
    }

    if (search) {
      query += ' AND (u.name LIKE ? OR u.email LIKE ? OR u.nickname LIKE ?)';
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }

    // Get total count for pagination
    const countQuery = query.replace(
      /SELECT[\s\S]*?FROM/i,
      'SELECT COUNT(*) as total FROM'
    );
    const totalResult = db.prepare(countQuery).get(...params) as { total: number };
    const total = totalResult.total;

    // Add ordering and pagination
    query += ' ORDER BY u.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const users = db.prepare(query).all(...params);
    db.close();

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// POST /api/super-admin/users - Create new user
async function createUser(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, role, association_id, school, position, phone } = body;

    // Validate required fields
    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { error: 'Missing required fields: email, password, name, role' },
        { status: 400 }
      );
    }

    // Validate role
    if (!isValidUserRole(role)) {
      return NextResponse.json(
        { error: 'Invalid role provided' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const db = new Database(dbPath);

    // Check if user with email already exists
    const existingUser = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existingUser) {
      db.close();
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Validate association exists if provided
    if (association_id) {
      const association = db.prepare('SELECT id FROM associations WHERE id = ?').get(association_id);
      if (!association) {
        db.close();
        return NextResponse.json(
          { error: 'Invalid association ID' },
          { status: 400 }
        );
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Insert user
    const insertUser = db.prepare(`
      INSERT INTO users (email, password, name, role, association_id, school, position, phone, isVerified, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))
    `);

    const result = insertUser.run(
      email,
      hashedPassword,
      name,
      role,
      association_id || null,
      school || null,
      position || null,
      phone || null
    );

    const userId = result.lastInsertRowid;

    // If creating admin or lawyer, create corresponding records
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
        INSERT INTO lawyers (user_id, specialties, experience_years)
        VALUES (?, ?, ?)
      `);
      insertLawyer.run(
        userId,
        JSON.stringify(['교육법', '민사법']), // Default specialties
        0 // Default experience
      );
    }

    // Get created user with association info
    const createdUser = db.prepare(`
      SELECT
        u.id, u.email, u.name, u.role, u.association_id,
        u.school, u.position, u.phone, u.created_at,
        a.name as association_name, a.code as association_code
      FROM users u
      LEFT JOIN associations a ON u.association_id = a.id
      WHERE u.id = ?
    `).get(userId);

    db.close();

    return NextResponse.json({
      message: 'User created successfully',
      user: createdUser
    }, { status: 201 });

  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

export const GET = withSuperAdminAuth(getUsers);
export const POST = withSuperAdminAuth(createUser);