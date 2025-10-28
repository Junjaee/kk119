import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '@/lib/db/supabase';

const JWT_SECRET = process.env.JWT_SECRET || 'kyokwon119-secret-key-2024-change-this-in-production';

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

    // Get user from Supabase
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, email, name, role, phone, grade, position, is_admin, is_approved, created_at')
      .eq('id', decoded.userId)
      .single();

    if (error || !user) {
      console.error('[AUTH/ME] User not found:', error);
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
        grade: user.grade,
        position: user.position,
        isAdmin: Boolean(user.is_admin),
        isApproved: Boolean(user.is_approved),
        createdAt: user.created_at
      }
    });
  } catch (error: any) {
    console.error('[AUTH/ME] Error:', error);

    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
