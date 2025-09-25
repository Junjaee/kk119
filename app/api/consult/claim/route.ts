import { NextRequest, NextResponse } from 'next/server';
import { consultDb } from '@/lib/db/consult-db';

// POST - 상담 담당 신청 (변호사용)
export async function POST(request: NextRequest) {
  try {
    // TODO: 변호사 권한 및 ID 확인
    // const token = request.headers.get('authorization')?.replace('Bearer ', '');
    // const lawyerInfo = verifyLawyerToken(token);
    // if (!lawyerInfo) {
    //   return NextResponse.json(
    //     { success: false, error: '변호사 권한이 필요합니다' },
    //     { status: 403 }
    //   );
    // }

    const body = await request.json();
    const { consultId } = body;

    // 임시로 변호사 ID 설정 (실제로는 토큰에서 추출)
    const lawyerId = 1; // TODO: lawyerInfo.id 사용

    if (!consultId) {
      return NextResponse.json(
        {
          success: false,
          error: '상담 ID가 필요합니다'
        },
        { status: 400 }
      );
    }

    // 상담 존재 여부 및 미담당 상태 확인
    const consult = consultDb.findById(consultId);

    if (!consult) {
      return NextResponse.json(
        {
          success: false,
          error: '존재하지 않는 상담입니다'
        },
        { status: 404 }
      );
    }

    if (consult.lawyer_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'ALREADY_CLAIMED',
          message: '이미 다른 변호사가 담당중입니다'
        },
        { status: 409 }
      );
    }

    // 담당 신청 (선착순 처리)
    const result = consultDb.claimConsult(consultId, lawyerId);

    if (result.changes === 0) {
      // 동시에 다른 변호사가 담당한 경우
      return NextResponse.json(
        {
          success: false,
          error: 'ALREADY_CLAIMED',
          message: '이미 다른 변호사가 담당중입니다'
        },
        { status: 409 }
      );
    }

    // 담당 성공
    const updatedConsult = consultDb.findById(consultId);

    return NextResponse.json({
      success: true,
      message: '상담 담당이 확정되었습니다',
      data: {
        consultId: consultId,
        redirectUrl: `/lawyer/case/${consultId}`
      }
    });

  } catch (error) {
    console.error('Claim consult error:', error);
    return NextResponse.json(
      {
        success: false,
        error: '서버 오류가 발생했습니다'
      },
      { status: 500 }
    );
  }
}