import { NextRequest, NextResponse } from 'next/server';
import { lawyerDb } from '@/lib/db/consult-db';

export async function GET(request: NextRequest) {
  try {
    // TODO: 권한 검증 - lawyer_admin 또는 admin 권한 확인
    // const token = request.headers.get('authorization')?.replace('Bearer ', '');
    // if (!token) {
    //   return NextResponse.json(
    //     { success: false, error: '인증이 필요합니다' },
    //     { status: 401 }
    //   );
    // }

    // 모든 변호사 조회
    const lawyers = lawyerDb.findAll();

    return NextResponse.json({
      success: true,
      data: lawyers
    });

  } catch (error) {
    console.error('Lawyers fetch error:', error);
    return NextResponse.json(
      {
        success: false,
        error: '서버 오류가 발생했습니다'
      },
      { status: 500 }
    );
  }
}