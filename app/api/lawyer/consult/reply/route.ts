import { NextRequest, NextResponse } from 'next/server';
import { consultDb, consultReplyDb } from '@/lib/db/consult-db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { consultId, content, isLawyer } = body;

    // TODO: 실제 인증 구현 필요
    // 현재는 테스트용으로 변호사 ID 하드코딩
    const lawyerId = 1;

    // 상담 조회 및 권한 검증
    const consult = consultDb.findById(consultId);

    if (!consult) {
      return NextResponse.json(
        {
          success: false,
          error: '상담을 찾을 수 없습니다'
        },
        { status: 404 }
      );
    }

    // 담당 변호사만 답변 가능
    if (consult.lawyer_id !== lawyerId) {
      return NextResponse.json(
        {
          success: false,
          error: '이 상담에 답변할 권한이 없습니다'
        },
        { status: 403 }
      );
    }

    // 첫 답변인 경우 consult_content 업데이트
    if (consult.status === 'reviewing' && !consult.consult_content) {
      consultDb.update(consultId, {
        consult_content: content,
        status: 'answered',
        answered_at: new Date().toISOString()
      });
    } else {
      // 추가 답변인 경우 replies 테이블에 저장
      consultReplyDb.create(consultId, lawyerId, content, true);
    }

    return NextResponse.json({
      success: true,
      message: '답변이 등록되었습니다'
    });

  } catch (error) {
    console.error('Reply submission error:', error);
    return NextResponse.json(
      {
        success: false,
        error: '서버 오류가 발생했습니다'
      },
      { status: 500 }
    );
  }
}