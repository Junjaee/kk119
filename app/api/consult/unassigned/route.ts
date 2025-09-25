import { NextRequest, NextResponse } from 'next/server';
import { consultDb } from '@/lib/db/consult-db';

export async function GET(request: NextRequest) {
  try {
    // TODO: 권한 검증 - lawyer_admin 권한 확인
    // const token = request.headers.get('authorization')?.replace('Bearer ', '');
    // if (!token) {
    //   return NextResponse.json(
    //     { success: false, error: '인증이 필요합니다' },
    //     { status: 401 }
    //   );
    // }

    // 배정되지 않은 상담 목록 조회
    const unassignedConsults = consultDb.findUnassigned();

    // 통계 정보도 함께 제공
    const stats = {
      total: unassignedConsults.length,
      pending: unassignedConsults.filter(c => c.status === 'pending').length,
      assigned: 0 // 미배정 API이므로 배정된 건수는 0
    };

    return NextResponse.json({
      success: true,
      data: {
        consults: unassignedConsults,
        stats: stats
      }
    });

  } catch (error) {
    console.error('Unassigned consults fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: '서버 오류가 발생했습니다'
      },
      { status: 500 }
    );
  }
}