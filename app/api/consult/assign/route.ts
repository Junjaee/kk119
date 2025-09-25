import { NextRequest, NextResponse } from 'next/server';
import { consultDb } from '@/lib/db/consult-db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { consultId, lawyerId } = body;

    // 입력 데이터 검증
    if (!consultId || !lawyerId) {
      return NextResponse.json(
        {
          success: false,
          error: '상담 ID와 변호사 ID가 필요합니다'
        },
        { status: 400 }
      );
    }

    // TODO: 권한 검증 - lawyer_admin 권한 확인
    // const token = request.headers.get('authorization')?.replace('Bearer ', '');
    // if (!token) {
    //   return NextResponse.json(
    //     { success: false, error: '인증이 필요합니다' },
    //     { status: 401 }
    //   );
    // }

    // 변호사 배정
    const result = consultDb.assignLawyerOnly(
      parseInt(consultId),
      parseInt(lawyerId)
    );

    if (result.changes === 0) {
      return NextResponse.json(
        {
          success: false,
          error: '상담을 찾을 수 없거나 이미 배정되었습니다'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '변호사가 성공적으로 배정되었습니다',
      data: {
        consultId: parseInt(consultId),
        lawyerId: parseInt(lawyerId)
      }
    });

  } catch (error) {
    console.error('Consult assignment error:', error);
    return NextResponse.json(
      {
        success: false,
        error: '서버 오류가 발생했습니다'
      },
      { status: 500 }
    );
  }
}