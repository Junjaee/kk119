import { NextRequest, NextResponse } from 'next/server';
import { resourceDb } from '@/lib/db/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || undefined;
    const search = searchParams.get('search') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined;

    const resources = await resourceDb.findAll({
      category,
      search,
      limit,
      offset
    });

    return NextResponse.json({
      resources,
      total: resources.length
    });

  } catch (error: any) {
    console.error('[API] Resources fetch error:', error);
    console.error('[API] Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return NextResponse.json(
      {
        error: '자료를 불러오는 중 오류가 발생했습니다.',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}