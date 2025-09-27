import { NextRequest, NextResponse } from 'next/server';
import { consultDb } from '@/lib/db/consult-db';

// GET - 미담당 상담 목록 조회 (변호사용)
// 개인정보는 제외하고 반환
export async function GET(request: NextRequest) {
  try {
    // TODO: 변호사 권한 확인
    // const token = request.headers.get('authorization')?.replace('Bearer ', '');
    // if (!token || !isLawyer(token)) {
    //   return NextResponse.json(
    //     { success: false, error: '변호사 권한이 필요합니다' },
    //     { status: 403 }
    //   );
    // }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // 미담당 상담만 조회 (개인정보 제외)
    const unassignedConsults = consultDb.findAvailable(type, limit, offset);
    const totalCount = consultDb.countAvailable(type);

    return NextResponse.json({
      success: true,
      data: {
        consults: unassignedConsults.map(consult => ({
          id: consult.id,
          title: consult.title,
          report_type: consult.report_type,
          incident_date: consult.incident_date,
          report_content: consult.report_content, // 전체 내용 공개
          created_at: consult.created_at,
          days_ago: Math.floor((Date.now() - new Date(consult.created_at).getTime()) / (1000 * 60 * 60 * 24))
          // user_id, user_nickname 등 개인정보는 제외
        })),
        pagination: {
          page,
          limit,
          total: totalCount,
          hasNext: offset + limit < totalCount
        }
      }
    });

  } catch (error) {
    console.error('Available consults fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: '서버 오류가 발생했습니다'
      },
      { status: 500 }
    );
  }
}