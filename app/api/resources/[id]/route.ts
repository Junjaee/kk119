import { NextRequest, NextResponse } from 'next/server';
import { resourceDb } from '@/lib/db/database';
import { enhancedAuth } from '@/lib/auth/enhanced-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: '잘못된 자료 ID입니다.' },
        { status: 400 }
      );
    }

    const resource = await resourceDb.findById(id);

    if (!resource) {
      return NextResponse.json(
        { error: '자료를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ resource });

  } catch (error: any) {
    console.error('[API] Resource fetch error:', error);
    return NextResponse.json(
      {
        error: '자료를 불러오는 중 오류가 발생했습니다.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get JWT token from Authorization header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // Verify token
    const decoded = await enhancedAuth.verifyAccessToken(token);
    if (!decoded) {
      return NextResponse.json(
        { error: '유효하지 않은 토큰입니다.' },
        { status: 401 }
      );
    }

    const userId = decoded.userId;
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: '잘못된 자료 ID입니다.' },
        { status: 400 }
      );
    }

    // Delete resource (will also delete Storage file)
    const result = await resourceDb.delete(id, userId);

    if (result.changes === 0) {
      return NextResponse.json(
        { error: '자료를 삭제할 수 없습니다. 권한이 없거나 자료가 존재하지 않습니다.' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      message: '자료가 삭제되었습니다.',
      deleted: true
    });

  } catch (error: any) {
    console.error('[API] Resource delete error:', error);
    return NextResponse.json(
      {
        error: '자료를 삭제하는 중 오류가 발생했습니다.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
