import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import Database from 'better-sqlite3';
import path from 'path';

const JWT_SECRET = process.env.JWT_SECRET || 'kyokwon119-secret-key-2024-change-this-in-production';
const dbPath = path.join(process.cwd(), 'data', 'kyokwon119.db');

export async function GET(request: Request) {
  try {
    // Get token from Authorization header or cookies
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || cookies().get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get user from database
    const db = new Database(dbPath);

    try {
      const user = db.prepare(`
        SELECT id, email, name, role, phone, association_name, grade, position, is_admin, is_approved, created_at
        FROM users
        WHERE id = ?
      `).get(decoded.userId) as any;

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      // Return user data
      return NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          phone: user.phone,
          associationName: user.association_name,
          grade: user.grade,
          position: user.position,
          isAdmin: Boolean(user.is_admin),
          isApproved: Boolean(user.is_approved),
          createdAt: user.created_at
        }
      });
    } finally {
      db.close();
    }
  } catch (error: any) {
    console.error('[AUTH/ME] Error:', error);

    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
