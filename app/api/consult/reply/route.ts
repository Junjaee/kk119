import { NextRequest, NextResponse } from 'next/server';
import { consultReplyDb } from '@/lib/db/consult-db';
import { verifyToken } from '@/lib/auth/auth-utils';

// POST - 추가 질문/답변 등록
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');

    // 인증 필수
    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: '로그인이 필요합니다.'
        },
        { status: 401 }
      );
    }

    let userId: number;
    let isLawyer = false; // 실제로는 사용자 권한을 확인해야 함

    try {
      const decoded = verifyToken(token);
      userId = decoded.userId;
      // TODO: 실제 구현 시 사용자 권한 확인 필요
      // isLawyer = decoded.role === 'lawyer';
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: '유효하지 않은 토큰입니다.'
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { consult_id, content } = body;

    // 유효성 검사
    if (!consult_id || !content) {
      return NextResponse.json(
        {
          success: false,
          error: '상담 ID와 내용이 필요합니다.'
        },
        { status: 400 }
      );
    }

    // 답변/추가 질문 생성
    const replyId = consultReplyDb.create(
      consult_id,
      userId,
      content,
      isLawyer
    );

    return NextResponse.json({
      success: true,
      data: {
        id: replyId,
        consult_id,
        user_id: userId,
        content,
        is_lawyer: isLawyer
      },
      message: isLawyer ? '답변이 등록되었습니다.' : '추가 질문이 등록되었습니다.'
    });

  } catch (error) {
    console.error('Error creating reply:', error);
    return NextResponse.json(
      {
        success: false,
        error: '답변 등록에 실패했습니다.'
      },
      { status: 500 }
    );
  }
}