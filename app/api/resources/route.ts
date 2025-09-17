import { NextRequest, NextResponse } from 'next/server';
import { resourceDb } from '@/lib/db/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || undefined;
    const search = searchParams.get('search') || undefined;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined;

    const resources = resourceDb.findAll({
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
    console.error('Resources fetch error:', error);
    return NextResponse.json(
      { error: '자료를 불러오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}